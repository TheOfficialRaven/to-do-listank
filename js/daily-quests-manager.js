/**
 * Daily Quests Manager
 * Client-side integration for Firebase Cloud Functions daily quest system
 * Target Group Specific Quest Generation
 */

import { 
  getDatabase, 
  ref, 
  onValue, 
  off,
  update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

// Use existing Firebase app instance (wait for it to be available)
function waitForFirebase() {
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (window.db && window.auth) {
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Get Firebase instances from global scope (initialized in index.js)
let db, auth, functions;

class DailyQuestsManager {
  constructor() {
    this.currentUser = null;
    this.dailyQuests = [];
    this.questListeners = [];
    this.isInitialized = false;
    
    // Cloud Function references (will be initialized in init())
    this.completeQuestFunction = null;
    this.triggerQuestGenerationFunction = null;
    
    // Target group specific quest templates
    this.targetGroupQuests = {
      student: {
        study_focus: {
          title: "45 perces mély koncentráció",
          description: "Tanulj 45 percig teljes koncentrációval, használd a Pomodoro technikát. Kapcsold ki minden zavaró faktort.",
          xp: 25,
          estimatedDuration: "45 perc",
          tag: "study",
          questType: "task",
          priority: "high",
          icon: "📚"
        },
        homework_complete: {
          title: "Házi feladat befejezése",
          description: "Fejezd be a legfontosabb házi feladatodat ma. Ellenőrizd a megoldásokat és készíts jegyzeteket.",
          xp: 30,
          estimatedDuration: "60 perc",
          tag: "homework",
          questType: "task",
          priority: "high",
          icon: "✏️"
        },
        notes_review: {
          title: "Jegyzetek átismétlése",
          description: "Ismételd át a tegnapi előadás jegyzeteit, készíts összefoglalót a kulcspontokról.",
          xp: 20,
          estimatedDuration: "30 perc",
          tag: "review",
          questType: "task",
          priority: "medium",
          icon: "🔄"
        },
        research_topic: {
          title: "Kutatási téma mélyítése",
          description: "Találj 3 új forrást az aktuális projektedhez. Készíts rövid kivonatot mindegyikből.",
          xp: 35,
          estimatedDuration: "50 perc",
          tag: "research",
          questType: "task",
          priority: "medium",
          icon: "🔍"
        },
        study_plan: {
          title: "Holnapi tanulási terv",
          description: "Tervezd meg a holnapi tanulási ütemezést. Állíts be prioritásokat és időbeosztást.",
          xp: 15,
          estimatedDuration: "15 perc",
          tag: "organization",
          questType: "task",
          priority: "low",
          icon: "📋"
        }
      },
      
      youngProfessional: {
        network_linkedin: {
          title: "LinkedIn kapcsolat építés",
          description: "Küldj 3 személyes üzenetet új szakmai kapcsolatoknak. Mutatkozz be és építs kapcsolatot.",
          xp: 25,
          estimatedDuration: "20 perc",
          tag: "networking",
          questType: "task",
          priority: "high",
          icon: "🤝"
        },
        skill_learning: {
          title: "Új készség fejlesztése",
          description: "Töltsd 30 percet egy karrierrel kapcsolatos online kurzussal vagy szakmai tartalommal.",
          xp: 30,
          estimatedDuration: "30 perc",
          tag: "learning",
          questType: "event",
          scheduledTime: "19:00",
          priority: "high",
          icon: "📖"
        },
        project_progress: {
          title: "Projekt előrelépés",
          description: "Dolgozz 45 percet a legfontosabb projekteden. Dokumentáld az előrehaladást.",
          xp: 35,
          estimatedDuration: "45 perc",
          tag: "project",
          questType: "task",
          priority: "high",
          icon: "🎯"
        },
        industry_news: {
          title: "Szakmai hírek olvasása",
          description: "Olvass el 2-3 cikket az iparággal kapcsolatos legfrissebb trendekről és fejlesztésekről.",
          xp: 20,
          estimatedDuration: "25 perc",
          tag: "learning",
          questType: "task",
          priority: "medium",
          icon: "📰"
        },
        professional_email: {
          title: "Szakmai email írása",
          description: "Írj egy fontos szakmai emailt vagy vegyél fel kapcsolatot egy mentorral/kollégával.",
          xp: 18,
          estimatedDuration: "15 perc",
          tag: "communication",
          questType: "task",
          priority: "medium",
          icon: "💬"
        }
      },
      
      selfImprover: {
        morning_meditation: {
          title: "Reggeli meditáció",
          description: "Gyakorolj 10 perces tudatos légzést vagy meditációt. Állíts be pozitív szándékokat a napra.",
          xp: 20,
          estimatedDuration: "10 perc",
          tag: "mindfulness",
          questType: "event",
          scheduledTime: "07:00",
          priority: "high",
          icon: "🧘"
        },
        gratitude_journal: {
          title: "Hálás szív naplózás",
          description: "Írj fel 3 dolgot, amiért hálás vagy ma, és gondolkodj el azon, miért fontosak ezek neked.",
          xp: 15,
          estimatedDuration: "10 perc",
          tag: "reflection",
          questType: "task",
          priority: "high",
          icon: "🤔"
        },
        physical_activity: {
          title: "20 perc mozgás",
          description: "Csinálj 20 perc bármilyen mozgást: séta, jóga, edzés vagy tánc. Figyelj a tested jelzéseire.",
          xp: 25,
          estimatedDuration: "20 perc",
          tag: "health",
          questType: "task",
          priority: "high",
          icon: "💚"
        },
        creative_time: {
          title: "Kreatív idő",
          description: "Töltsd 20 percet egy kreatív tevékenységgel: rajzolás, írás, zenélés vagy bármilyen művészi kifejezés.",
          xp: 22,
          estimatedDuration: "20 perc",
          tag: "creativity",
          questType: "task",
          priority: "medium",
          icon: "🎨"
        },
        digital_detox: {
          title: "Digitális detox",
          description: "Kapcsold ki minden digitális eszközt 30 percre. Olvasás, séta vagy beszélgetés helyette.",
          xp: 30,
          estimatedDuration: "30 perc",
          tag: "wellness",
          questType: "task",
          priority: "medium",
          icon: "🌿"
        },
        self_reflection: {
          title: "Önreflektív írás",
          description: "Írj 10 percet arról, hogyan érzed magad ma, milyen kihívásokkal találkoztál és mit tanultál.",
          xp: 18,
          estimatedDuration: "10 perc",
          tag: "reflection",
          questType: "task",
          priority: "medium",
          icon: "📝"
        }
      },
      
      organizer: {
        daily_planning: {
          title: "Napi tervezés",
          description: "Tervezd meg a holnapi napot részletesen. Állíts prioritásokat és időkereteket minden feladathoz.",
          xp: 20,
          estimatedDuration: "15 perc",
          tag: "planning",
          questType: "task",
          priority: "high",
          icon: "📅"
        },
        inbox_zero: {
          title: "Inbox zéró kihívás",
          description: "Dolgozd fel az összes emailt az inboxodban. Válaszolj, rendszerezd vagy töröld mindegyiket.",
          xp: 25,
          estimatedDuration: "30 perc",
          tag: "coordination",
          questType: "task",
          priority: "high",
          icon: "📧"
        },
        team_coordination: {
          title: "Csapat koordináció",
          description: "Vegyél fel kapcsolatot a csapattagokkal, ellenőrizd a projektek státuszát és oszd ki a feladatokat.",
          xp: 30,
          estimatedDuration: "25 perc",
          tag: "coordination",
          questType: "task",
          priority: "high",
          icon: "🎪"
        },
        document_organization: {
          title: "Dokumentumok rendszerezése",
          description: "Rendszerezd a digitális fájljaidat. Hozz létre logikus mappákat és töröld a duplikátumokat.",
          xp: 22,
          estimatedDuration: "35 perc",
          tag: "documentation",
          questType: "task",
          priority: "medium",
          icon: "📄"
        },
        process_optimization: {
          title: "Folyamat optimalizálás",
          description: "Elemezz egy munkafolyamatot és találj 2-3 módot a hatékonyság növelésére.",
          xp: 35,
          estimatedDuration: "40 perc",
          tag: "optimization",
          questType: "task",
          priority: "medium",
          icon: "🔧"
        },
        calendar_update: {
          title: "Naptár karbantartás",
          description: "Frissítsd a naptáradat a következő hétre. Add hozzá a fontos határidőket és blokkolj időt a fókuszált munkára.",
          xp: 18,
          estimatedDuration: "20 perc",
          tag: "planning",
          questType: "task",
          priority: "low",
          icon: "🗓️"
        }
      }
    };
    
    this.init();
  }
  
  /**
   * Initialize the daily quests manager
   */
  async init() {
    try {
      // Wait for Firebase to be available
      await waitForFirebase();
      
      // Get Firebase instances from global scope
      db = window.db;
      auth = window.auth;
      
      // Try to get functions, but don't fail if not available
      try {
        // Use the same app instance as the global db and auth
        const app = window.app || window.firebaseApp;
        if (app) {
          functions = getFunctions(app);
        } else {
          functions = getFunctions();
        }
        this.completeQuestFunction = httpsCallable(functions, 'completeQuest');
        this.triggerQuestGenerationFunction = httpsCallable(functions, 'triggerDailyQuestGeneration');
        console.log('✅ Firebase Functions initialized successfully');
      } catch (functionsError) {
        console.warn('⚠️ Firebase Functions not available:', functionsError);
        // Functions will work without Cloud Functions (using fallback behavior)
      }
      
      console.log('🔧 Daily Quests Manager: Firebase instances ready');
      
      // Wait for authentication state
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.currentUser = user;
          this.setupQuestListeners();
          this.isInitialized = true;
          console.log('✅ Daily Quests Manager initialized for user:', user.uid);
          
          // Generate initial quests if none exist
          setTimeout(() => this.ensureDailyQuestsExist(), 2000);
        } else {
          this.currentUser = null;
          this.cleanupListeners();
          this.isInitialized = false;
          console.log('📤 User logged out, cleaning up quest listeners');
        }
      });
      
    } catch (error) {
      console.error('❌ Error initializing Daily Quests Manager:', error);
    }
  }
  
  /**
   * Ensure daily quests exist for current user and target group
   */
  async ensureDailyQuestsExist() {
    if (!this.currentUser) return;
    
    // Check if user has quests for today and current target group
    const today = new Date().toISOString().split('T')[0];
    const currentTargetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup()?.id || 'selfImprover';
    
    const hasQuestsForToday = this.dailyQuests.some(quest => 
      quest.assignedDate === today && 
      quest.targetGroup === currentTargetGroup
    );
    
    if (!hasQuestsForToday) {
      console.log(`🎯 No daily quests found for ${currentTargetGroup}, generating...`);
      await this.generateTargetGroupQuests(currentTargetGroup);
    }
  }
  
  /**
   * Generate quests specific to the current target group
   */
  async generateTargetGroupQuests(targetGroupId = null) {
    if (!this.currentUser) {
      console.warn('❌ No current user for quest generation');
      return;
    }
    
    try {
      // Get target group from advanced system or parameter
      const currentTargetGroup = targetGroupId || 
        (window.advancedTargetGroupSystem?.currentTargetGroup) || 
        'selfImprover'; // fallback
      
      console.log(`🎯 Generating quests for target group: ${currentTargetGroup}`);
      
      // Get quests for the target group
      const questTemplates = this.targetGroupQuests[currentTargetGroup] || this.targetGroupQuests.selfImprover;
      
      // Select 2-3 random quests based on priority and day of week
      const selectedQuests = this.selectDailyQuests(questTemplates);
      
      // Create quest objects with current timestamp and unique IDs
      const today = new Date().toISOString().split('T')[0];
      const questsToSave = selectedQuests.map(template => ({
        id: this.generateQuestId(),
        ...template,
        assignedDate: today,
        assignedAt: Date.now(),
        completed: false,
        accepted: false,
        targetGroup: currentTargetGroup
      }));
      
      // Save quests to Firebase
      await this.saveQuestsToFirebase(questsToSave);
      
      console.log(`✅ Generated ${questsToSave.length} target group specific quests`);
      
    } catch (error) {
      console.error('❌ Error generating target group quests:', error);
    }
  }
  
  /**
   * Select 2-3 quests based on priority, day of week, and variety
   */
  selectDailyQuests(questTemplates) {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Convert templates object to array
    const templatesArray = Object.values(questTemplates);
    
    // Separate by priority
    const highPriority = templatesArray.filter(q => q.priority === 'high');
    const mediumPriority = templatesArray.filter(q => q.priority === 'medium');
    const lowPriority = templatesArray.filter(q => q.priority === 'low');
    
    const selectedQuests = [];
    
    // Always include 1-2 high priority quests
    if (highPriority.length > 0) {
      selectedQuests.push(this.getRandomFromArray(highPriority));
      
      // Add second high priority quest on weekdays
      if (!isWeekend && highPriority.length > 1) {
        const secondHigh = this.getRandomFromArray(
          highPriority.filter(q => q !== selectedQuests[0])
        );
        if (secondHigh) selectedQuests.push(secondHigh);
      }
    }
    
    // Add 1 medium priority quest if we have space
    if (selectedQuests.length < 3 && mediumPriority.length > 0) {
      selectedQuests.push(this.getRandomFromArray(mediumPriority));
    }
    
    // Add a low priority quest on weekends or if we need more variety
    if (selectedQuests.length < 2 || (isWeekend && selectedQuests.length < 3 && lowPriority.length > 0)) {
      const lowQuest = this.getRandomFromArray(lowPriority);
      if (lowQuest) selectedQuests.push(lowQuest);
    }
    
    // Ensure we have at least 2 quests
    if (selectedQuests.length < 2 && templatesArray.length >= 2) {
      const remaining = templatesArray.filter(q => !selectedQuests.includes(q));
      if (remaining.length > 0) {
        selectedQuests.push(this.getRandomFromArray(remaining));
      }
    }
    
    return selectedQuests.slice(0, 3); // Max 3 quests
  }
  
  /**
   * Get random element from array
   */
  getRandomFromArray(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }
  
  /**
   * Generate unique quest ID
   */
  generateQuestId() {
    return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save generated quests to Firebase
   */
  async saveQuestsToFirebase(quests) {
    try {
      const updates = {};
      
      // Clear existing quests for today first
      const today = new Date().toISOString().split('T')[0];
      this.dailyQuests
        .filter(quest => quest.assignedDate === today)
        .forEach(quest => {
          updates[`users/${this.currentUser.uid}/daily_quests/${quest.id}`] = null;
        });
      
      // Add new quests
      quests.forEach(quest => {
        updates[`users/${this.currentUser.uid}/daily_quests/${quest.id}`] = quest;
      });
      
      await update(ref(db), updates);
      console.log(`💾 Saved ${quests.length} quests to Firebase`);
      
    } catch (error) {
      console.error('❌ Error saving quests to Firebase:', error);
      throw error;
    }
  }
  
  /**
   * Setup real-time listeners for user's daily quests
   */
  setupQuestListeners() {
    if (!this.currentUser) return;
    
    const questsRef = ref(db, `users/${this.currentUser.uid}/daily_quests`);
    
    const questListener = onValue(questsRef, (snapshot) => {
      const questsData = snapshot.val() || {};
      this.dailyQuests = Object.values(questsData);
      
      // Sort by assigned date (newest first)
      this.dailyQuests.sort((a, b) => (b.assignedAt || 0) - (a.assignedAt || 0));
      
      console.log(`📋 Loaded ${this.dailyQuests.length} daily quests`);
      this.updateQuestUI();
    });
    
    this.questListeners.push({ ref: questsRef, listener: questListener });
  }

  /**
   * Clean up all listeners
   */
  cleanupListeners() {
    this.questListeners.forEach(({ ref: questRef, listener }) => {
      off(questRef, 'value', listener);
    });
    this.questListeners = [];
    this.dailyQuests = [];
  }

  /**
   * Get current daily quests (filtered by target group)
   */
  getDailyQuests() {
    const today = new Date().toISOString().split('T')[0];
    const currentTargetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup()?.id || 'selfImprover';
    
    // Filter quests by date and target group
    const todayQuests = this.dailyQuests.filter(quest => 
      quest.assignedDate === today && 
      quest.targetGroup === currentTargetGroup
    );
    
    console.log(`🎯 Loaded ${todayQuests.length} quests for target group: ${currentTargetGroup}`);
    return todayQuests;
  }

  /**
   * Accept a quest and create associated tasks/events
   */
  async acceptQuest(questData) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      console.log(`🎯 Accepting quest: ${questData.title}`);
      
      // Use the advanced target group system's quest acceptance if available
      if (window.advancedTargetGroupSystem?.questAcceptanceSystem) {
        await window.advancedTargetGroupSystem.questAcceptanceSystem.acceptQuest(questData);
      } else {
        // Fallback to basic acceptance
        await this.basicAcceptQuest(questData);
      }
      
      // Refresh the UI
      this.updateQuestUI();
      
    } catch (error) {
      console.error('❌ Error accepting quest:', error);
      this.showErrorNotification('Hiba történt a küldetés elfogadásakor');
      throw error;
    }
  }

  /**
   * Basic quest acceptance without advanced target group system
   */
  async basicAcceptQuest(questData) {
    const questRef = ref(db, `users/${this.currentUser.uid}/daily_quests/${questData.id}`);
    await update(questRef, {
      accepted: true,
      acceptedAt: Date.now()
    });
    
    this.showSuccessNotification(`✅ Küldetés elfogadva: ${questData.title}`);
  }

  /**
   * Complete a quest and award XP
   */
  async completeQuest(questId) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log(`🎯 Completing quest: ${questId}`);
      
      // Try Cloud Function first, fallback to direct database update
      if (this.completeQuestFunction) {
        try {
          const result = await this.completeQuestFunction({ questId });
          
          if (result.data.success) {
            console.log(`✅ Quest completed! Awarded ${result.data.xpAwarded} XP`);
            this.showQuestCompletionNotification(result.data);
            return result.data;
          }
        } catch (cloudError) {
          console.warn('⚠️ Cloud Function failed, using fallback:', cloudError);
        }
      }
      
      // Fallback: Direct database update
      return await this.completeQuestFallback(questId);
      
    } catch (error) {
      console.error('❌ Error completing quest:', error);
      this.showErrorNotification('Failed to complete quest');
      throw error;
    }
  }
  
  /**
   * Fallback quest completion using direct database updates
   */
  async completeQuestFallback(questId) {
    const questRef = ref(db, `users/${this.currentUser.uid}/daily_quests/${questId}`);
    const userRef = ref(db, `users/${this.currentUser.uid}`);
    
    // Get quest data
    const questSnapshot = await new Promise((resolve, reject) => {
      onValue(questRef, resolve, reject, { once: true });
    });
    
    const quest = questSnapshot.val();
    if (!quest) {
      throw new Error('Quest not found');
    }
    
    if (quest.completed) {
      throw new Error('Quest already completed');
    }
    
    // Get current user XP
    const userSnapshot = await new Promise((resolve, reject) => {
      onValue(userRef, resolve, reject, { once: true });
    });
    
    const userData = userSnapshot.val() || {};
    const currentXP = userData.xp || 0;
    const xpAwarded = quest.xp || 10;
    
    // Update quest and user XP
    const updates = {};
    updates[`users/${this.currentUser.uid}/daily_quests/${questId}/completed`] = true;
    updates[`users/${this.currentUser.uid}/daily_quests/${questId}/completedAt`] = Date.now();
    updates[`users/${this.currentUser.uid}/xp`] = currentXP + xpAwarded;
    
    await update(ref(db), updates);
    
    const result = {
      success: true,
      xpAwarded: xpAwarded,
      totalXP: currentXP + xpAwarded
    };
    
    console.log(`✅ Quest completed (fallback)! Awarded ${xpAwarded} XP`);
    this.showQuestCompletionNotification(result);
    
    return result;
  }

  /**
   * Manually trigger daily quest generation (for testing/admin)
   */
  async triggerQuestGeneration() {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      console.log('🔧 Manually triggering quest generation...');
      
      // Use target group specific generation
      await this.generateTargetGroupQuests();
      this.showSuccessNotification('Célcsoport-specifikus küldetések generálva!');
      return { processed: 1, successful: 1, failed: 0 };
      
    } catch (error) {
      console.error('❌ Error triggering quest generation:', error);
      this.showErrorNotification('Failed to generate quests');
      throw error;
    }
  }

  /**
   * Update the quest UI with current quests
   */
  updateQuestUI() {
    const questContainer = document.getElementById('daily-quests-container');
    if (!questContainer) return;
    
    const todayQuests = this.getDailyQuests();
    
    if (todayQuests.length === 0) {
      questContainer.innerHTML = `
        <div class="no-quests-message">
          <div class="no-quests-icon">🎯</div>
          <h3>Nincsenek mai küldetések</h3>
          <p>Kattints az alábbi gombra új küldetések generálásához!</p>
          <button class="generate-quests-btn" onclick="window.dailyQuestsManager.triggerQuestGeneration()">
            ✨ Küldetések Generálása
          </button>
        </div>
      `;
      return;
    }
    
    const questsHTML = todayQuests.map(quest => this.createQuestHTML(quest)).join('');
    const progressHTML = this.createProgressHTML(todayQuests);
    
    questContainer.innerHTML = `
      ${progressHTML}
      <div class="quests-grid">
        ${questsHTML}
      </div>
    `;
    
    this.attachQuestEventListeners(todayQuests);
  }

  /**
   * Create HTML for a single quest
   */
  createQuestHTML(quest) {
    const isCompleted = quest.completed;
    const isAccepted = quest.accepted;
    const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
    const questTypeInfo = targetGroup?.questTypes[quest.tag] || { icon: quest.icon, name: quest.tag };
    
    return `
      <div class="quest-card ${isCompleted ? 'completed' : ''} ${isAccepted ? 'accepted' : ''}" 
           data-quest-id="${quest.id}">
        <div class="quest-header">
          <div class="quest-icon">
            ${questTypeInfo.icon}
          </div>
          <div class="quest-meta">
            <span class="quest-tag">
              ${questTypeInfo.name || quest.tag}
            </span>
            <span class="quest-xp">+${quest.xp} XP</span>
          </div>
        </div>
        
        <div class="quest-content">
          <h3 class="quest-title">${quest.title}</h3>
          <p class="quest-description">${quest.description}</p>
          <div class="quest-details">
            <span class="quest-duration">⏱️ ${quest.estimatedDuration}</span>
            ${quest.scheduledTime ? `<span class="quest-time">🕐 ${quest.scheduledTime}</span>` : ''}
          </div>
        </div>
        
        <div class="quest-actions">
          ${isCompleted ? 
            `<span class="quest-completed-badge">✅ Teljesítve</span>` :
            isAccepted ?
              `<button class="quest-complete-btn" onclick="window.dailyQuestsManager.completeQuest('${quest.id}')">
                🎯 Teljesítés
              </button>` :
              `<button class="quest-accept-btn" onclick="window.dailyQuestsManager.acceptQuest(${JSON.stringify(quest).replace(/"/g, '&quot;')})">
                ✨ Elfogadás
              </button>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Create progress HTML for quests
   */
  createProgressHTML(quests) {
    const completed = quests.filter(q => q.completed).length;
    const total = quests.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Get target group specific info
    const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
    const targetGroupName = targetGroup?.name || 'Küldetések';
    const motivationalMessage = targetGroup?.theme.completionMessage || 'Nagyszerű munka!';
    
    return `
      <div class="quests-progress">
        <div class="progress-header">
          <h3>${targetGroup?.icon || '🎯'} Mai ${targetGroupName} Küldetések</h3>
          <span class="progress-text">${completed}/${total} teljesítve</span>
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        
        <div class="progress-motivation">
          ${percentage === 100 ? 
            `<span class="completion-message">🎉 ${motivationalMessage}</span>` :
            `<span class="motivation-message">${targetGroup?.theme.motivationalQuote || 'Minden lépés számít!'}</span>`
          }
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to quest elements
   */
  attachQuestEventListeners(quests) {
    // Event listeners are already attached via onclick attributes
    // This method is kept for potential future enhancements
  }

  /**
   * Show quest completion notification
   */
  showQuestCompletionNotification(data) {
    const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
    const message = `🎉 Küldetés teljesítve! +${data.xpAwarded} XP\n${targetGroup?.theme.completionMessage || 'Nagyszerű munka!'}`;
    
    this.showNotification(message, 'success');
    
    // Show celebration animation if available
    if (window.showCelebrationAnimation) {
      window.showCelebrationAnimation();
    }
  }

  /**
   * Show success notification
   */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error notification
   */
  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification using existing system
   */
  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Get quest statistics for analytics
   */
  getQuestStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayQuests = this.dailyQuests.filter(quest => quest.assignedDate === today);
    
    return {
      total: todayQuests.length,
      completed: todayQuests.filter(q => q.completed).length,
      accepted: todayQuests.filter(q => q.accepted).length,
      pending: todayQuests.filter(q => !q.accepted && !q.completed).length,
      totalXP: todayQuests.filter(q => q.completed).reduce((sum, q) => sum + (q.xp || 0), 0)
    };
  }
}

// Initialize the Daily Quests Manager
window.dailyQuestsManager = new DailyQuestsManager();

// Debug function for console access
window.generateTargetGroupQuests = (targetGroup) => {
  if (window.dailyQuestsManager) {
    return window.dailyQuestsManager.generateTargetGroupQuests(targetGroup);
  }
  console.error('Daily Quests Manager not initialized');
};

// ... rest of the QuestAcceptanceSystem remains the same 