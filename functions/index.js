const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.database();

/**
 * Scheduled function that runs daily at 6:00 AM UTC
 * Generates daily quests for all users based on their goalTarget
 */
exports.generateDailyQuests = functions.pubsub
  .schedule('0 6 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🎯 Starting daily quest generation...');
    
    try {
      // Step 1: Get all users with goalTarget set
      const users = await getUsersWithGoalTarget();
      console.log(`📊 Found ${users.length} users with goalTarget set`);
      
      // Step 2: Cleanup old quests (older than 48 hours)
      await cleanupOldQuests();
      
      // Step 3: Generate quests for each user
      const questGenerationPromises = users.map(user => generateQuestsForUser(user));
      const results = await Promise.allSettled(questGenerationPromises);
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Quest generation completed: ${successful} successful, ${failed} failed`);
      
      return { success: true, processed: users.length, successful, failed };
    } catch (error) {
      console.error('❌ Error in daily quest generation:', error);
      throw error;
    }
  });

/**
 * Get all users who have a goalTarget set
 */
async function getUsersWithGoalTarget() {
  try {
    const usersSnapshot = await db.ref('users').once('value');
    const usersData = usersSnapshot.val() || {};
    
    const usersWithGoalTarget = [];
    
    for (const [uid, userData] of Object.entries(usersData)) {
      if (userData.goalTarget && userData.goalTarget !== 'none') {
        usersWithGoalTarget.push({
          uid,
          goalTarget: userData.goalTarget,
          username: userData.username || userData.email || 'User',
          lastQuestDate: userData.lastQuestDate || null,
          previousQuestTemplates: userData.previousQuestTemplates || []
        });
      }
    }
    
    return usersWithGoalTarget;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
}

/**
 * Generate daily quests for a specific user
 */
async function generateQuestsForUser(user) {
  console.log(`🎯 Generating quests for user: ${user.uid} (${user.goalTarget})`);
  
  try {
    // Check if user already has quests for today
    const today = new Date().toISOString().split('T')[0];
    if (user.lastQuestDate === today) {
      console.log(`⏭️ User ${user.uid} already has quests for today`);
      return;
    }
    
    // Get templates for user's goal target
    let templates = await getTemplatesForGoalTarget(user.goalTarget);
    
    // If no templates found for user's goal target, use fallback
    if (!templates || templates.length === 0) {
      console.log(`⚠️ No templates found for ${user.goalTarget}, using fallback`);
      templates = await getFallbackTemplates();
    }
    
    // Filter out recently used templates (prevent consecutive day duplicates)
    const availableTemplates = filterRecentlyUsedTemplates(templates, user.previousQuestTemplates);
    
    if (availableTemplates.length === 0) {
      console.log(`⚠️ No available templates for user ${user.uid}, skipping`);
      return;
    }
    
    // Select 1-3 random templates based on day of week and user activity
    const selectedTemplates = selectQuestTemplates(availableTemplates, user);
    
    // Generate quests from selected templates
    const quests = [];
    for (const template of selectedTemplates) {
      const quest = await createQuestFromTemplate(template, user);
      quests.push(quest);
    }
    
    // Save quests to user's daily_quests collection
    await saveQuestsToUser(user.uid, quests);
    
    // Update user's last quest date and previous templates
    await updateUserQuestHistory(user.uid, today, selectedTemplates.map(t => t.id));
    
    console.log(`✅ Generated ${quests.length} quests for user ${user.uid}`);
    
  } catch (error) {
    console.error(`❌ Error generating quests for user ${user.uid}:`, error);
    throw error;
  }
}

/**
 * Get templates for a specific goal target
 */
async function getTemplatesForGoalTarget(goalTarget) {
  try {
    const templatesSnapshot = await db.ref(`templates/${goalTarget}`).once('value');
    const templatesData = templatesSnapshot.val() || {};
    
    // Convert to array and filter active templates
    const templates = Object.entries(templatesData)
      .map(([id, template]) => ({ id, ...template }))
      .filter(template => template.active !== false);
    
    return templates;
  } catch (error) {
    console.error(`❌ Error fetching templates for ${goalTarget}:`, error);
    return [];
  }
}

/**
 * Get fallback templates for users without specific goal target templates
 */
async function getFallbackTemplates() {
  try {
    // Try to get from 'general' category first
    let templates = await getTemplatesForGoalTarget('general');
    
    // If no general templates, try from 'selfImprover' as default
    if (!templates || templates.length === 0) {
      templates = await getTemplatesForGoalTarget('selfImprover');
    }
    
    return templates || [];
  } catch (error) {
    console.error('❌ Error fetching fallback templates:', error);
    return [];
  }
}

/**
 * Filter out templates that were used in the last 2 days
 */
function filterRecentlyUsedTemplates(templates, previousTemplates) {
  if (!previousTemplates || previousTemplates.length === 0) {
    return templates;
  }
  
  // Remove templates used in the last quest generation
  return templates.filter(template => !previousTemplates.includes(template.id));
}

/**
 * Select 1-3 quest templates based on various criteria
 */
function selectQuestTemplates(templates, user) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Determine number of quests (1-3)
  let questCount = 2; // Default
  
  // Weekend: fewer quests
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    questCount = Math.random() > 0.7 ? 2 : 1;
  }
  // Monday: more quests (week start motivation)
  else if (dayOfWeek === 1) {
    questCount = Math.random() > 0.3 ? 3 : 2;
  }
  // Friday: mix of quests
  else if (dayOfWeek === 5) {
    questCount = Math.random() > 0.5 ? 2 : 3;
  }
  
  // Filter templates by day-specific tags if available
  const dayFilteredTemplates = filterTemplatesByDay(templates, dayOfWeek);
  const finalTemplates = dayFilteredTemplates.length > 0 ? dayFilteredTemplates : templates;
  
  // Shuffle and select
  const shuffled = [...finalTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(questCount, shuffled.length));
}

/**
 * Filter templates by day-specific tags
 */
function filterTemplatesByDay(templates, dayOfWeek) {
  const dayTags = {
    0: ['sunday', 'weekend', 'rest'],
    1: ['monday', 'week-start', 'motivation'],
    2: ['tuesday', 'productivity'],
    3: ['wednesday', 'mid-week'],
    4: ['thursday', 'focus'],
    5: ['friday', 'week-end', 'social'],
    6: ['saturday', 'weekend', 'personal']
  };
  
  const todayTags = dayTags[dayOfWeek] || [];
  
  return templates.filter(template => {
    if (!template.tags) return false;
    
    const templateTags = Array.isArray(template.tags) ? template.tags : [template.tags];
    return templateTags.some(tag => todayTags.includes(tag.toLowerCase()));
  });
}

/**
 * Create a quest from a template with dynamic field replacement
 */
async function createQuestFromTemplate(template, user) {
  const questId = generateQuestId();
  const today = new Date();
  
  // Replace dynamic fields in title and description
  const processedTitle = replaceDynamicFields(template.title, user, today);
  const processedDescription = replaceDynamicFields(template.description, user, today);
  
  return {
    id: questId,
    templateId: template.id,
    title: processedTitle,
    description: processedDescription,
    xp: template.xp || 10,
    estimatedDuration: template.estimatedDuration || '15 min',
    tag: template.tag || 'general',
    assignedAt: admin.database.ServerValue.TIMESTAMP,
    assignedDate: today.toISOString().split('T')[0],
    completed: false,
    completedAt: null
  };
}

/**
 * Replace dynamic fields in text
 */
function replaceDynamicFields(text, user, date) {
  if (!text) return text;
  
  const replacements = {
    '[today]': date.toLocaleDateString('hu-HU'),
    '[username]': user.username,
    '[dayname]': getDayName(date.getDay()),
    '[week]': getWeekNumber(date),
    '[month]': getMonthName(date.getMonth())
  };
  
  let processedText = text;
  for (const [placeholder, value] of Object.entries(replacements)) {
    processedText = processedText.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  }
  
  return processedText;
}

/**
 * Get Hungarian day name
 */
function getDayName(dayIndex) {
  const days = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  return days[dayIndex];
}

/**
 * Get Hungarian month name
 */
function getMonthName(monthIndex) {
  const months = ['január', 'február', 'március', 'április', 'május', 'június',
                 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  return months[monthIndex];
}

/**
 * Get week number of the year
 */
function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
  return Math.ceil(days / 7);
}

/**
 * Generate unique quest ID
 */
function generateQuestId() {
  return 'quest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Save quests to user's daily_quests collection
 */
async function saveQuestsToUser(uid, quests) {
  try {
    const updates = {};
    
    for (const quest of quests) {
      updates[`users/${uid}/daily_quests/${quest.id}`] = quest;
    }
    
    await db.ref().update(updates);
    
  } catch (error) {
    console.error(`❌ Error saving quests for user ${uid}:`, error);
    throw error;
  }
}

/**
 * Update user's quest history
 */
async function updateUserQuestHistory(uid, date, templateIds) {
  try {
    const updates = {
      [`users/${uid}/lastQuestDate`]: date,
      [`users/${uid}/previousQuestTemplates`]: templateIds
    };
    
    await db.ref().update(updates);
    
  } catch (error) {
    console.error(`❌ Error updating quest history for user ${uid}:`, error);
    throw error;
  }
}

/**
 * Cleanup old quests (older than 48 hours)
 */
async function cleanupOldQuests() {
  console.log('🧹 Starting cleanup of old quests...');
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);
    const cutoffTimestamp = cutoffDate.getTime();
    
    const usersSnapshot = await db.ref('users').once('value');
    const usersData = usersSnapshot.val() || {};
    
    const deletionPromises = [];
    
    for (const [uid, userData] of Object.entries(usersData)) {
      if (userData.daily_quests) {
        for (const [questId, quest] of Object.entries(userData.daily_quests)) {
          if (quest.assignedAt && quest.assignedAt < cutoffTimestamp) {
            deletionPromises.push(
              db.ref(`users/${uid}/daily_quests/${questId}`).remove()
            );
          }
        }
      }
    }
    
    await Promise.all(deletionPromises);
    console.log(`🧹 Cleaned up ${deletionPromises.length} old quests`);
    
  } catch (error) {
    console.error('❌ Error during quest cleanup:', error);
    throw error;
  }
}

/**
 * Manual trigger function for testing
 */
exports.triggerDailyQuestGeneration = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Optional: Check if user has admin privileges
  // You can implement your own admin check logic here
  
  console.log('🔧 Manual daily quest generation triggered');
  
  try {
    const result = await generateDailyQuests();
    return { success: true, result };
  } catch (error) {
    console.error('❌ Manual trigger error:', error);
    throw new functions.https.HttpsError('internal', 'Quest generation failed');
  }
});

/**
 * Function to complete a quest and award XP
 */
exports.completeQuest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { questId } = data;
  const uid = context.auth.uid;
  
  if (!questId) {
    throw new functions.https.HttpsError('invalid-argument', 'Quest ID is required');
  }
  
  try {
    // Get the quest
    const questSnapshot = await db.ref(`users/${uid}/daily_quests/${questId}`).once('value');
    const quest = questSnapshot.val();
    
    if (!quest) {
      throw new functions.https.HttpsError('not-found', 'Quest not found');
    }
    
    if (quest.completed) {
      throw new functions.https.HttpsError('already-exists', 'Quest already completed');
    }
    
    // Get current user XP
    const userSnapshot = await db.ref(`users/${uid}`).once('value');
    const userData = userSnapshot.val() || {};
    const currentXP = userData.xp || 0;
    
    // Update quest and user XP
    const updates = {
      [`users/${uid}/daily_quests/${questId}/completed`]: true,
      [`users/${uid}/daily_quests/${questId}/completedAt`]: admin.database.ServerValue.TIMESTAMP,
      [`users/${uid}/xp`]: currentXP + (quest.xp || 10)
    };
    
    await db.ref().update(updates);
    
    console.log(`✅ Quest ${questId} completed by user ${uid}, awarded ${quest.xp || 10} XP`);
    
    return { 
      success: true, 
      xpAwarded: quest.xp || 10,
      totalXP: currentXP + (quest.xp || 10)
    };
    
  } catch (error) {
    console.error(`❌ Error completing quest ${questId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to complete quest');
  }
});

// Helper function for the manual trigger
async function generateDailyQuests() {
  const users = await getUsersWithGoalTarget();
  await cleanupOldQuests();
  
  const questGenerationPromises = users.map(user => generateQuestsForUser(user));
  const results = await Promise.allSettled(questGenerationPromises);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { processed: users.length, successful, failed };
} 