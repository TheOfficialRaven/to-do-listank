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
  update,
  get
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
      if (window.db && window.auth && window.functions) {
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
      console.log('🚀 Initializing Daily Quests Manager...');
      
      // Wait for Firebase to be available
      await waitForFirebase();
      
      // Get Firebase instances from global scope
      db = window.db;
      auth = window.auth;
      functions = window.functions; // Use global functions instance
      
      if (!db || !auth || !functions) {
        throw new Error('Firebase instances not available');
      }
      
      // Set up auth state listener
      this.authUnsubscribe = onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
        if (user) {
          console.log('✅ User authenticated for Daily Quests Manager');
          this.setupQuestListeners();
          this.ensureDailyQuestsExist();
        } else {
          console.log('❌ User signed out from Daily Quests Manager');
          this.cleanupListeners();
        }
      });
      
      // Initialize Cloud Functions
      this.completeQuestFunction = httpsCallable(functions, 'completeQuest');
      this.triggerQuestGenerationFunction = httpsCallable(functions, 'triggerQuestGeneration');
      
      this.isInitialized = true;
      console.log('✅ Daily Quests Manager initialized successfully');
      
    } catch (error) {
      console.error('❌ Error initializing Daily Quests Manager:', error);
      this.isInitialized = false;
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
      console.log('🔍 Debug: completeQuestFunction exists:', !!this.completeQuestFunction);
      console.log('🔍 Debug: functions instance:', !!functions);
      
      // Try Cloud Function first, fallback to direct database update
      if (this.completeQuestFunction) {
        try {
          console.log('🚀 Attempting Cloud Function call...');
          const result = await this.completeQuestFunction({ questId });
          
          if (result.data.success) {
            console.log(`✅ Quest completed! Awarded ${result.data.xpAwarded} XP`);
            
            // Update global XP display
            if (typeof window.addXP === 'function') {
              window.addXP(result.data.xpAwarded);
            }
            
            // Update level display
            if (typeof window.updateLevelDisplay === 'function') {
              window.updateLevelDisplay();
            }
            
            this.showQuestCompletionNotification(result.data);
            return result.data;
          }
        } catch (cloudError) {
          console.warn('⚠️ Cloud Function failed, using fallback:', cloudError);
          console.warn('⚠️ Cloud Function error details:', {
            code: cloudError.code,
            message: cloudError.message,
            details: cloudError.details
          });
        }
      } else {
        console.warn('⚠️ completeQuestFunction not initialized, using fallback directly');
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
    const newTotalXP = currentXP + xpAwarded;
    
    // Update quest and user XP
    const updates = {};
    updates[`users/${this.currentUser.uid}/daily_quests/${questId}/completed`] = true;
    updates[`users/${this.currentUser.uid}/daily_quests/${questId}/completedAt`] = Date.now();
    updates[`users/${this.currentUser.uid}/xp`] = newTotalXP;
    
    await update(ref(db), updates);
    
    // Update global XP display if the function exists
    if (typeof window.addXP === 'function') {
      window.addXP(xpAwarded);
    }
    
    // Update level display if the function exists
    if (typeof window.updateLevelDisplay === 'function') {
      window.updateLevelDisplay();
    }
    
    // Save user progress if the function exists
    if (typeof window.saveUserProgress === 'function') {
      window.saveUserProgress();
    }
    
    const result = {
      success: true,
      xpAwarded: xpAwarded,
      totalXP: newTotalXP
    };
    
    console.log(`✅ Quest completed (fallback)! Awarded ${xpAwarded} XP (Total: ${newTotalXP})`);
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

  // ===============================================
  // 🧠 INTELLIGENT MISSION GENERATION FOR STUDENTS
  // ===============================================
  
  // Smart mission templates for students
  getStudentMissionTemplates() {
    return {
      study_preparation: [
        "{subject} órára készülj fel ma legalább 15 percet!",
        "Ismételd át a {subject} témakört a holnapi dolgozatra!",
        "Készíts jegyzeteket a {subject} anyagból!",
        "Gyakorolj 5 példát a {subject} háziból!",
        "Olvasd el a {subject} következő fejezetét!",
        "Készíts összefoglalót a {subject} témakörből!"
      ],
      exam_preparation: [
        "Készülj fel a {subject} dolgozatra 30 percet!",
        "Ismételd át a {subject} képleteket!",
        "Oldj meg 3 feladatot a {subject} dolgozatból!",
        "Készíts jegyzeteket a {subject} fontos pontjairól!",
        "Gyakorolj a {subject} nehéz részein!"
      ],
      homework_focus: [
        "Fejezd be a {subject} házi feladatot!",
        "Ellenőrizd a {subject} megoldásaidat!",
        "Kérdezd meg a tanárodat a {subject} bizonytalan részeiről!",
        "Készíts prezentációt a {subject} témáról!",
        "Írj esszét a {subject} témakörből!"
      ],
      review_and_practice: [
        "Ismételd át a tegnapi {subject} anyagot!",
        "Gyakorolj a {subject} gyakorlati feladataival!",
        "Készíts kvízt a {subject} témakörből!",
        "Olvasd el a {subject} jegyzeteidet!",
        "Beszélj meg egy {subject} feladatot egy osztálytárssal!"
      ]
    };
  }
  
  // Generate smart missions for students based on timetable and events
  async generateSmartMissionsForStudent(useAI = false) {
    console.log('🧠 Generating smart missions for student...');
    
    try {
      if (useAI) {
        // Use AI-based generation
        return await this.generateMissionsWithAI();
      }
      
      // Original template-based generation
      const subjects = await this.getStudentSubjects();
      const events = await this.getStudentEvents();
      const existingTasks = await this.getExistingTasks();
      
      // Generate 2-4 missions
      const missionCount = Math.min(4, Math.max(2, subjects.length));
      const missions = [];
      
      // Get mission templates
      const templates = this.getStudentMissionTemplates();
      const allTemplates = [
        ...templates.study_preparation,
        ...templates.exam_preparation,
        ...templates.homework_focus,
        ...templates.review_and_practice
      ];
      
      // Track used subjects and mission types to avoid duplicates
      const usedSubjects = new Set();
      const usedMissionTypes = new Set();
      
      for (let i = 0; i < missionCount; i++) {
        const mission = await this.createSmartMission(
          subjects, 
          events, 
          existingTasks, 
          allTemplates, 
          usedSubjects, 
          usedMissionTypes
        );
        
        if (mission) {
          missions.push(mission);
        }
      }
      
      console.log(`✅ Generated ${missions.length} smart missions`);
      return missions;
      
    } catch (error) {
      console.error('❌ Error generating smart missions:', error);
      return [];
    }
  }
  
  // Get student subjects from timetable
  async getStudentSubjects() {
    try {
      if (!this.currentUser) return [];
      
      const timetableRef = ref(db, `users/${this.currentUser.uid}/timetable`);
      const snapshot = await get(timetableRef);
      
      if (!snapshot.exists()) return [];
      
      const timetable = snapshot.val();
      const subjects = new Set();
      
      // Extract subjects from timetable
      Object.values(timetable).forEach(day => {
        if (day && Array.isArray(day)) {
          day.forEach(lesson => {
            if (lesson && lesson.subject) {
              subjects.add(lesson.subject);
            }
          });
        }
      });
      
      return Array.from(subjects);
    } catch (error) {
      console.error('❌ Error getting student subjects:', error);
      return [];
    }
  }
  
  // Get student events from calendar
  async getStudentEvents() {
    try {
      if (!this.currentUser) return [];
      
      const eventsRef = ref(db, `users/${this.currentUser.uid}/events`);
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) return [];
      
      const events = snapshot.val();
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Filter events for today and tomorrow
      return Object.values(events).filter(event => {
        const eventDate = event.date || event.startDate;
        return eventDate === today || eventDate === tomorrow;
      });
    } catch (error) {
      console.error('❌ Error getting student events:', error);
      return [];
    }
  }
  
  // Get existing tasks to avoid duplicates
  async getExistingTasks() {
    try {
      if (!this.currentUser) return [];
      
      const listsRef = ref(db, `users/${this.currentUser.uid}/lists`);
      const snapshot = await get(listsRef);
      
      if (!snapshot.exists()) return [];
      
      const lists = snapshot.val();
      const tasks = [];
      
      Object.values(lists).forEach(list => {
        if (list.items) {
          Object.values(list.items).forEach(item => {
            if (item.text) {
              tasks.push(item.text.toLowerCase());
            }
          });
        }
      });
      
      return tasks;
    } catch (error) {
      console.error('❌ Error getting existing tasks:', error);
      return [];
    }
  }
  
  // Create a single smart mission
  async createSmartMission(subjects, events, existingTasks, templates, usedSubjects, usedMissionTypes) {
    try {
      // Select a subject (prioritize subjects with upcoming events)
      const subject = this.selectSubjectForMission(subjects, events, usedSubjects);
      if (!subject) return null;
      
      // Select mission type and template
      const missionType = this.selectMissionType(events, usedMissionTypes);
      const template = this.selectTemplate(templates, missionType, subject);
      if (!template) return null;
      
      // Generate mission text
      const missionText = template.replace('{subject}', subject);
      
      // Check for duplicates
      if (this.isDuplicateMission(missionText, existingTasks)) {
        return null;
      }
      
      // Create mission object
      const mission = {
        id: this.generateQuestId(),
        title: `🎯 ${subject} - ${this.getMissionTypeTitle(missionType)}`,
        description: missionText,
        xp: this.calculateMissionXP(missionType),
        estimatedDuration: this.getMissionDuration(missionType),
        tag: missionType,
        questType: "task",
        priority: this.getMissionPriority(missionType),
        icon: this.getMissionIcon(missionType),
        subject: subject,
        missionType: missionType,
        isSmartMission: true,
        generatedAt: Date.now(),
        dueDate: this.getMissionDueDate(missionType)
      };
      
      // Update tracking sets
      usedSubjects.add(subject);
      usedMissionTypes.add(missionType);
      
      return mission;
      
    } catch (error) {
      console.error('❌ Error creating smart mission:', error);
      return null;
    }
  }
  
  // Select subject for mission (prioritize subjects with events)
  selectSubjectForMission(subjects, events, usedSubjects) {
    // First, try to find subjects with upcoming events
    const subjectsWithEvents = new Set();
    events.forEach(event => {
      if (event.title) {
        const eventText = event.title.toLowerCase();
        subjects.forEach(subject => {
          if (eventText.includes(subject.toLowerCase())) {
            subjectsWithEvents.add(subject);
          }
        });
      }
    });
    
    // Prioritize subjects with events that haven't been used
    const availableSubjectsWithEvents = Array.from(subjectsWithEvents)
      .filter(subject => !usedSubjects.has(subject));
    
    if (availableSubjectsWithEvents.length > 0) {
      return this.getRandomFromArray(availableSubjectsWithEvents);
    }
    
    // Fallback to any available subject
    const availableSubjects = subjects.filter(subject => !usedSubjects.has(subject));
    return this.getRandomFromArray(availableSubjects);
  }
  
  // Select mission type based on events and used types
  selectMissionType(events, usedMissionTypes) {
    const missionTypes = ['study_preparation', 'exam_preparation', 'homework_focus', 'review_and_practice'];
    const availableTypes = missionTypes.filter(type => !usedMissionTypes.has(type));
    
    // If we have exam events, prioritize exam preparation
    const hasExamEvents = events.some(event => 
      event.title && event.title.toLowerCase().includes('dolgozat')
    );
    
    if (hasExamEvents && availableTypes.includes('exam_preparation')) {
      return 'exam_preparation';
    }
    
    return this.getRandomFromArray(availableTypes);
  }
  
  // Select template based on mission type and subject
  selectTemplate(templates, missionType, subject) {
    const templateGroups = this.getStudentMissionTemplates();
    const availableTemplates = templateGroups[missionType] || templates;
    
    return this.getRandomFromArray(availableTemplates);
  }
  
  // Check if mission is duplicate
  isDuplicateMission(missionText, existingTasks) {
    const missionWords = missionText.toLowerCase().split(' ');
    
    return existingTasks.some(task => {
      const taskWords = task.toLowerCase().split(' ');
      const commonWords = missionWords.filter(word => taskWords.includes(word));
      return commonWords.length >= 3; // If 3+ words match, consider it duplicate
    });
  }
  
  // Get mission type title
  getMissionTypeTitle(missionType) {
    const titles = {
      study_preparation: 'Tanulási felkészülés',
      exam_preparation: 'Vizsga felkészülés',
      homework_focus: 'Házi feladat',
      review_and_practice: 'Átismétlés és gyakorlás'
    };
    return titles[missionType] || 'Küldetés';
  }
  
  // Calculate mission XP
  calculateMissionXP(missionType) {
    const xpValues = {
      study_preparation: 15,
      exam_preparation: 25,
      homework_focus: 20,
      review_and_practice: 18
    };
    return xpValues[missionType] || 15;
  }
  
  // Get mission duration
  getMissionDuration(missionType) {
    const durations = {
      study_preparation: '15-20 perc',
      exam_preparation: '30-45 perc',
      homework_focus: '25-40 perc',
      review_and_practice: '20-30 perc'
    };
    return durations[missionType] || '20 perc';
  }
  
  // Get mission priority
  getMissionPriority(missionType) {
    const priorities = {
      study_preparation: 'medium',
      exam_preparation: 'high',
      homework_focus: 'high',
      review_and_practice: 'medium'
    };
    return priorities[missionType] || 'medium';
  }
  
  // Get mission icon
  getMissionIcon(missionType) {
    const icons = {
      study_preparation: '📚',
      exam_preparation: '📝',
      homework_focus: '✏️',
      review_and_practice: '🔄'
    };
    return icons[missionType] || '🎯';
  }
  
  // Get mission due date
  getMissionDueDate(missionType) {
    const today = new Date();
    
    if (missionType === 'exam_preparation') {
      // Exam preparation due tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    
    // Other missions due today
    return today.toISOString().split('T')[0];
  }
  
  // Prepare mission prompt for AI integration (future use)
  prepareMissionPrompt(subjects, events) {
    const prompt = {
      subjects: subjects,
      events: events.map(event => ({
        title: event.title,
        date: event.date,
        description: event.description
      })),
      context: `Generate personalized daily missions for a student based on their subjects: ${subjects.join(', ')} and upcoming events.`,
      requirements: [
        '2-4 missions per day',
        'Relevant to current subjects',
        'Appropriate difficulty level',
        'Varied mission types',
        'No duplicates with existing tasks'
      ],
      format: 'JSON array with mission objects'
    };
    
    return prompt;
  }
  
  // ===============================================
  // 🤖 AI-BASED MISSION GENERATION
  // ===============================================
  
  // Global variable to store AI mission prompt
  aiMissionPrompt = null;
  
  // Prepare comprehensive AI prompt for mission generation
  async prepareMissionPromptForAI() {
    try {
      console.log('🤖 Preparing AI mission prompt...');
      
      // Get today's schedule
      const todaySchedule = await this.getTodaySchedule();
      
      // Get calendar events
      const calendarEvents = await this.getCalendarEvents();
      
      // Get previous missions
      const previousMissions = await this.getPreviousMissions();
      
      // Build the AI prompt
      const prompt = this.buildAIPrompt(todaySchedule, calendarEvents, previousMissions);
      
      // Store the prompt globally
      this.aiMissionPrompt = prompt;
      
      console.log('✅ AI mission prompt prepared:', prompt);
      return prompt;
      
    } catch (error) {
      console.error('❌ Error preparing AI mission prompt:', error);
      return null;
    }
  }
  
  // Get today's schedule from timetable
  async getTodaySchedule() {
    try {
      if (!this.currentUser) return [];
      const timetableRef = ref(db, `users/${this.currentUser.uid}/timetable`);
      const snapshot = await get(timetableRef);
      if (!snapshot.exists()) return [];
      const timetable = snapshot.val();
      // Use 'long' and convert to lowercase
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaySchedule = timetable[today] || [];
      // Extract subjects and times
      return todaySchedule.map(lesson => ({
        subject: lesson.subject,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        teacher: lesson.teacher,
        classroom: lesson.classroom
      }));
    } catch (error) {
      console.error('❌ Error getting today schedule:', error);
      return [];
    }
  }
  
  // Get calendar events for today and upcoming days
  async getCalendarEvents() {
    try {
      if (!this.currentUser) return [];
      
      const eventsRef = ref(db, `users/${this.currentUser.uid}/events`);
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) return [];
      
      const events = snapshot.val();
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Filter events for today and next week
      return Object.values(events).filter(event => {
        const eventDate = event.date || event.startDate;
        return eventDate >= today && eventDate <= nextWeek;
      }).map(event => ({
        title: event.title,
        date: event.date || event.startDate,
        description: event.description,
        type: event.type
      }));
      
    } catch (error) {
      console.error('❌ Error getting calendar events:', error);
      return [];
    }
  }
  
  // Get previous missions from last few days
  async getPreviousMissions() {
    try {
      if (!this.currentUser) return [];
      
      const smartMissionsRef = ref(db, `users/${this.currentUser.uid}/smartMissions`);
      const snapshot = await get(smartMissionsRef);
      
      if (!snapshot.exists()) return [];
      
      const allMissions = snapshot.val();
      const previousMissions = [];
      
      // Get missions from last 3 days
      for (let i = 1; i <= 3; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const dayMissions = allMissions[date];
        if (dayMissions && dayMissions.missions) {
          previousMissions.push(...dayMissions.missions.map(m => m.description));
        }
      }
      
      return previousMissions;
      
    } catch (error) {
      console.error('❌ Error getting previous missions:', error);
      return [];
    }
  }
  
  // Build comprehensive AI prompt
  buildAIPrompt(todaySchedule, calendarEvents, previousMissions) {
    const subjects = todaySchedule.map(lesson => lesson.subject);
    const uniqueSubjects = [...new Set(subjects)];
    
    const events = calendarEvents.map(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      const daysDiff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) return `ma: ${event.title}`;
      if (daysDiff === 1) return `holnap: ${event.title}`;
      return `${daysDiff} nap múlva: ${event.title}`;
    });
    
    const prompt = `
Kérlek, készíts 3 rövid, motiváló, napi küldetést egy diák számára a mai feladataihoz.

📚 A mai órái: ${uniqueSubjects.length > 0 ? `["${uniqueSubjects.join('", "')}"]` : "nincs óra ma"}.
📅 Közelgő események: ${events.length > 0 ? `["${events.join('", "')}"]` : "nincs közelgő esemény"}.
🔄 A tegnapi küldetései: ${previousMissions.length > 0 ? `["${previousMissions.slice(0, 3).join('", "')}"]` : "nincs előző küldetés"}.

🎯 A cél, hogy:
- Ne ismétlődjenek a tegnapi küldetésekkel
- Legyenek hasznosak és relevánsak a mai órákhoz
- Adják érzetet, hogy 'küldetést' teljesít a felhasználó
- Motiválóak és rövidek legyenek (max 2-3 mondat)
- Különböző nehézségi szintűek legyenek

📝 Válasz formátum:
Válaszolj csak a 3 küldetéssel, mindegyik új sorban, magyar nyelven, motiváló stílusban. Ne használj számozást vagy bullet pointokat.

Példa formátum:
"Készülj fel a matematika órára 15 percet, ismételd át a tegnapi képleteket!"
"Készíts egy rövid összefoglalót a történelem témakörből a holnapi dolgozatra!"
"Gyakorolj 5 feladatot a fizika háziból, és kérdezd meg a tanárodat a bizonytalan részekről!"
`;

    return prompt;
  }
  
  // Generate sample AI response (dummy function for testing)
  getSampleMissionResponse(prompt) {
    console.log('🤖 Generating sample AI response...');
    
    // Extract subjects from prompt
    const subjectMatch = prompt.match(/A mai órái: \[(.*?)\]/);
    const subjects = subjectMatch ? subjectMatch[1].replace(/"/g, '').split(', ') : ['matematika', 'történelem', 'fizika'];
    
    // Extract events from prompt
    const eventMatch = prompt.match(/Közelgő események: \[(.*?)\]/);
    const events = eventMatch ? eventMatch[1].replace(/"/g, '').split(', ') : [];
    
    // Generate contextual missions based on subjects and events
    const missions = [];
    
    // Mission 1: Study preparation
    if (subjects.length > 0) {
      const subject = subjects[0];
      missions.push(`Készülj fel a ${subject} órára 15 percet, ismételd át a tegnapi anyagot és készíts jegyzeteket a fontos pontokról!`);
    }
    
    // Mission 2: Exam preparation (if there are events)
    if (events.length > 0) {
      const examEvent = events.find(event => event.includes('dolgozat') || event.includes('vizsga'));
      if (examEvent) {
        const subject = subjects.length > 1 ? subjects[1] : subjects[0];
        missions.push(`Készülj fel a ${subject} dolgozatra 30 percet, gyakorolj a nehéz részeken és készíts egy rövid összefoglalót!`);
      } else {
        const subject = subjects.length > 1 ? subjects[1] : subjects[0];
        missions.push(`Gyakorolj 5 feladatot a ${subject} háziból, és kérdezd meg a tanárodat a bizonytalan részekről!`);
      }
    }
    
    // Mission 3: Review and practice
    if (subjects.length > 2) {
      const subject = subjects[2];
      missions.push(`Ismételd át a ${subject} témakört, készíts egy kvízt magadnak és teszteld a tudásodat!`);
    } else if (subjects.length > 0) {
      const subject = subjects[0];
      missions.push(`Készíts egy kreatív összefoglalót a ${subject} anyagból, használj rajzokat vagy diagramokat a jobb megértéshez!`);
    }
    
    // Ensure we have exactly 3 missions
    while (missions.length < 3) {
      const subject = subjects[missions.length % subjects.length] || 'tanulás';
      missions.push(`Töltsd el 20 percet a ${subject} anyag mélyebb megértésével, keress fel további forrásokat!`);
    }
    
    return missions.slice(0, 3);
  }
  
  // Generate missions using AI (placeholder for future API integration)
  async generateMissionsWithAI() {
    try {
      console.log('🤖 Generating missions with AI...');
      
      // Prepare the AI prompt
      const prompt = await this.prepareMissionPromptForAI();
      if (!prompt) {
        throw new Error('Failed to prepare AI prompt');
      }
      
      // For now, use sample response (replace with actual API call later)
      const aiResponse = this.getSampleMissionResponse(prompt);
      
      // Convert AI response to mission objects
      const missions = this.convertAIResponseToMissions(aiResponse);
      
      console.log('✅ AI missions generated:', missions);
      return missions;
      
    } catch (error) {
      console.error('❌ Error generating AI missions:', error);
      return [];
    }
  }
  
  // Convert AI response to mission objects
  convertAIResponseToMissions(aiResponse) {
    return aiResponse.map((description, index) => {
      // Extract subject from description
      const subjectMatch = description.match(/(matematika|történelem|fizika|kémia|biológia|angol|magyar|informatika|földrajz|filozófia|szociológia|pszichológia|művészettörténet|irodalom|nyelvtan|irodalomtörténet|társadalomismeret|természettudomány|technika|ének|rajz|testnevelés|vallás|etika)/i);
      const subject = subjectMatch ? subjectMatch[1] : 'Általános';
      
      // Determine mission type based on content
      let missionType = 'study_preparation';
      if (description.includes('dolgozat') || description.includes('vizsga')) {
        missionType = 'exam_preparation';
      } else if (description.includes('házi') || description.includes('feladat')) {
        missionType = 'homework_focus';
      } else if (description.includes('ismételd') || description.includes('átismétlés')) {
        missionType = 'review_and_practice';
      }
      
      return {
        id: this.generateQuestId(),
        title: `🎯 ${subject} - ${this.getMissionTypeTitle(missionType)}`,
        description: description,
        xp: this.calculateMissionXP(missionType),
        estimatedDuration: this.getMissionDuration(missionType),
        tag: missionType,
        questType: "task",
        priority: this.getMissionPriority(missionType),
        icon: this.getMissionIcon(missionType),
        subject: subject,
        missionType: missionType,
        isSmartMission: true,
        isAIGenerated: true,
        generatedAt: Date.now(),
        dueDate: this.getMissionDueDate(missionType)
      };
    });
  }
  
  // Future: Actual AI API integration
  async callAIMissionAPI(prompt) {
    // This is a placeholder for future OpenAI/Gemini API integration
    console.log('🚀 Future: Calling AI API with prompt:', prompt);
    
    // Example OpenAI API call structure:
    /*
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates personalized daily missions for students."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
    */
    
    // For now, return sample response
    return this.getSampleMissionResponse(prompt);
  }
  
  // Generate and display smart missions (with AI option)
  async generateAndDisplaySmartMissions(useAI = false) {
    try {
      console.log(`🎯 Generating smart missions... ${useAI ? 'with AI' : 'with templates'}`);
      
      let missions = [];
      
      if (useAI) {
        // Use AI-based generation
        missions = await this.generateMissionsWithAI();
      } else {
        // Use template-based generation (fallback)
        missions = await this.generateSmartMissionsForStudent();
      }
      
      if (missions.length > 0) {
        await this.saveSmartMissionsToFirebase(missions);
        this.updateSmartMissionsUI();
        this.showSuccessNotification(`✅ ${missions.length} ${useAI ? 'AI-generált' : 'intelligens'} küldetés generálva!`);
        
        // Store the AI prompt for debugging
        if (useAI && this.aiMissionPrompt) {
          console.log('🤖 AI Prompt used:', this.aiMissionPrompt);
        }
      } else {
        this.showErrorNotification('❌ Nem sikerült küldetéseket generálni. Próbáld újra!');
      }
      
      return missions;
      
    } catch (error) {
      console.error('❌ Error generating and displaying missions:', error);
      this.showErrorNotification('❌ Hiba történt a küldetések generálásakor!');
      return [];
    }
  }

  // Update smart missions UI
  updateSmartMissionsUI() {
    const container = document.getElementById('smart-missions-container');
    if (!container) return;
    
    this.loadSmartMissionsFromFirebase().then(missions => {
      if (missions.length === 0) {
        container.innerHTML = `
          <div class="smart-missions-empty">
            <h3>🎯 Személyre szabott napi kihívások</h3>
            <p>Generálj intelligens küldetéseket az órarended alapján!</p>
            <button class="generate-smart-missions-btn" onclick="window.dailyQuestsManager.generateAndDisplaySmartMissions()">
              🧠 Küldetések generálása (sablon)
            </button>
            <button class="generate-smart-missions-btn ai" onclick="window.dailyQuestsManager.generateAndDisplaySmartMissions(true)">
              🤖 AI Küldetések generálása
            </button>
          </div>
        `;
      } else {
        const missionsHTML = missions.map(mission => this.createSmartMissionHTML(mission)).join('');
        container.innerHTML = `
          <div class="smart-missions-header">
            <h3>🎯 Személyre szabott napi kihívások az órarended alapján</h3>
            <p>${missions.filter(m => m.completed).length}/${missions.length} teljesítve</p>
          </div>
          <div class="smart-missions-list">
            ${missionsHTML}
          </div>
        `;
        this.attachSmartMissionEventListeners();
      }
    });
  }

  // Load smart missions from Firebase
  async loadSmartMissionsFromFirebase() {
    try {
      if (!this.currentUser) return [];
      const smartMissionsRef = ref(db, `users/${this.currentUser.uid}/smartMissions`);
      const snapshot = await get(smartMissionsRef);
      if (!snapshot.exists()) return [];
      const today = new Date().toISOString().split('T')[0];
      const todayMissions = snapshot.val()[today];
      return todayMissions ? todayMissions.missions : [];
    } catch (error) {
      console.error('❌ Error loading smart missions:', error);
      return [];
    }
  }

  // Save smart missions to Firebase
  async saveSmartMissionsToFirebase(missions) {
    try {
      if (!this.currentUser) return;
      
      const smartMissionsRef = ref(db, `users/${this.currentUser.uid}/smartMissions`);
      const today = new Date().toISOString().split('T')[0];
      
      // Get existing missions for today
      const existingSnapshot = await get(smartMissionsRef);
      const existingData = existingSnapshot.exists() ? existingSnapshot.val() : {};
      const existingMissions = existingData[today]?.missions || [];
      
      // Merge existing and new missions (update existing ones, add new ones)
      const missionMap = new Map();
      
      // Add existing missions to map
      existingMissions.forEach(mission => {
        missionMap.set(mission.id, mission);
      });
      
      // Update/add new missions
      missions.forEach(mission => {
        missionMap.set(mission.id, mission);
      });
      
      // Convert back to array
      const updatedMissions = Array.from(missionMap.values());
      
      const missionsData = {
        [today]: {
          missions: updatedMissions,
          generatedAt: Date.now(),
          completed: updatedMissions.filter(m => m.completed).length,
          total: updatedMissions.length
        }
      };
      
      await update(smartMissionsRef, missionsData);
      console.log(`✅ Saved ${updatedMissions.length} smart missions to Firebase`);
      
    } catch (error) {
      console.error('❌ Error saving smart missions:', error);
    }
  }

  // Create smart mission HTML
  createSmartMissionHTML(mission) {
    const completedClass = mission.completed ? 'completed' : '';
    const completedIcon = mission.completed ? '✅' : '⭕';
    return `
      <div class="smart-mission-card ${completedClass}" data-mission-id="${mission.id}">
        <div class="smart-mission-header">
          <span class="smart-mission-icon">${mission.icon || '🎯'}</span>
          <span class="smart-mission-title">${mission.title}</span>
          <span class="smart-mission-xp">+${mission.xp} XP</span>
        </div>
        <div class="smart-mission-description">${mission.description}</div>
        <div class="smart-mission-footer">
          <span class="smart-mission-duration">⏱️ ${mission.estimatedDuration}</span>
          <span class="smart-mission-subject">📚 ${mission.subject}</span>
          <button class="smart-mission-complete-btn" ${mission.completed ? 'disabled' : ''}>
            ${completedIcon} ${mission.completed ? 'Teljesítve' : 'Teljesítés'}
          </button>
        </div>
      </div>
    `;
  }

  // Attach event listeners to smart mission cards
  attachSmartMissionEventListeners() {
    const missionCards = document.querySelectorAll('.smart-mission-card');
    
    missionCards.forEach(card => {
      const completeBtn = card.querySelector('.smart-mission-complete-btn');
      const missionId = card.dataset.missionId;
      
      if (completeBtn && !completeBtn.disabled) {
        completeBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          try {
            console.log(`🎯 Completing smart mission: ${missionId}`);
            
            // Update mission as completed
            await this.completeSmartMission(missionId);
            
            // Update UI
            this.updateSmartMissionsUI();
            
            this.showSuccessNotification('✅ Intelligens küldetés teljesítve!');
            
          } catch (error) {
            console.error('❌ Error completing smart mission:', error);
            this.showErrorNotification('❌ Hiba történt a küldetés teljesítésekor!');
          }
        });
      }
    });
  }

  // Complete a smart mission
  async completeSmartMission(missionId) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      // Get current smart missions
      const missions = await this.loadSmartMissionsFromFirebase();
      const mission = missions.find(m => m.id === missionId);
      
      if (!mission) {
        throw new Error('Smart mission not found');
      }
      
      if (mission.completed) {
        throw new Error('Smart mission already completed');
      }
      
      // Update mission as completed
      mission.completed = true;
      mission.completedAt = Date.now();
      
      // Save updated missions
      await this.saveSmartMissionsToFirebase(missions);
      
      // Award XP (optional - you can integrate with your XP system)
      if (mission.xp) {
        // Add XP to user (integrate with your existing XP system)
        console.log(`🎉 Awarded ${mission.xp} XP for smart mission completion`);
        // You can call your existing XP system here
        // window.addXP?.(mission.xp);
      }
      
      console.log(`✅ Smart mission ${missionId} completed successfully`);
      
    } catch (error) {
      console.error('❌ Error completing smart mission:', error);
      throw error;
    }
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

// Export the DailyQuestsManager class
export { DailyQuestsManager };

// ... rest of the QuestAcceptanceSystem remains the same 