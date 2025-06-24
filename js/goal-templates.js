// =================================
// GOAL-TARGETED TEMPLATE SYSTEM
// =================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, remove, update, query, orderByChild, equalTo
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log('🎯 Loading Goal-Targeted Template System...');

// Firebase konfiguráció - ugyanaz mint az index.js-ben
const firebaseConfig = {
  apiKey: "AIzaSyBLrDOTSC_bA1mxQpaIfyAz-Eyan26TVT0",
  authDomain: "leads-tracker-app-78b83.firebaseapp.com",
  databaseURL: "https://leads-tracker-app-78b83-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "leads-tracker-app-78b83",
  storageBucket: "leads-tracker-app-78b83.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "1:907489703312:web:c4138807d8a7aa96512f15"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// =================================
// GOAL TARGET DEFINITIONS
// =================================

const GOAL_TARGETS = {
  student: {
    id: 'student',
    icon: '🎓',
    color: '#3498db',
    name: 'Diák',
    description: 'Akadémiai sikerekhez optimalizált feladatok',
    theme: {
      primary: '#3498db',
      secondary: '#2980b9',
      accent: '#85c1e9'
    }
  },
  young_professional: {
    id: 'young_professional',
    icon: '💼',
    color: '#e74c3c',
    name: 'Fiatal Szakember',
    description: 'Karrierfejlődésre fókuszáló feladatok',
    theme: {
      primary: '#e74c3c',
      secondary: '#c0392b',
      accent: '#f1948a'
    }
  },
  self_improver: {
    id: 'self_improver',
    icon: '🌱',
    color: '#27ae60',
    name: 'Önfejlesztő',
    description: 'Személyes növekedést támogató feladatok',
    theme: {
      primary: '#27ae60',
      secondary: '#229954',
      accent: '#82e0aa'
    }
  },
  organizer: {
    id: 'organizer',
    icon: '📋',
    color: '#f39c12',
    name: 'Szervező',
    description: 'Strukturált tervezésre és szervezésre fókuszáló feladatok',
    theme: {
      primary: '#f39c12',
      secondary: '#d68910',
      accent: '#f8c471'
    }
  }
};

// =================================
// DEFAULT TEMPLATE DATA
// =================================

const DEFAULT_TEMPLATES = {
  student: [
    {
      title: 'Heti tanulási terv készítése',
      duration: 30,
      xp: 50,
      tag: 'weekly',
      category: 'planning',
      description: 'Készíts áttekinthető heti ütemtervet az összes tantárgyra'
    },
    {
      title: 'Tanulási blokk - 2 óra fókuszált munka',
      duration: 120,
      xp: 100,
      tag: 'daily',
      category: 'study',
      description: 'Koncentrált tanulás telefon nélkül'
    },
    {
      title: 'Vizsgára készülés - anyag áttekintése',
      duration: 90,
      xp: 80,
      tag: 'event-based',
      category: 'exam',
      description: 'Rendszerezett anyagismétlés és gyakorlás'
    },
    {
      title: 'Jegyzetek átszervezése és digitalizálása',
      duration: 45,
      xp: 60,
      tag: 'weekly',
      category: 'organization',
      description: 'Jegyzeteid rendezése és visszakereshetővé tétele'
    },
    {
      title: 'Könyvtári kutatás projekthez',
      duration: 120,
      xp: 90,
      tag: 'event-based',
      category: 'research',
      description: 'Releváns források keresése és gyűjtése'
    },
    {
      title: 'Tanulmányi célok havi értékelése',
      duration: 60,
      xp: 70,
      tag: 'weekly',
      category: 'review',
      description: 'Haladás értékelése és következő havi tervek'
    }
  ],
  young_professional: [
    {
      title: 'Networking eseményre készülés',
      duration: 45,
      xp: 80,
      tag: 'event-based',
      category: 'networking',
      description: 'Bemutatkozó beszéd és kapcsolatépítési stratégia'
    },
    {
      title: 'LinkedIn profil frissítése',
      duration: 30,
      xp: 50,
      tag: 'weekly',
      category: 'online-presence',
      description: 'Szakmai profil karbantartása és tartalommegosztás'
    },
    {
      title: 'Prezentáció készítése projektkezdéshez',
      duration: 90,
      xp: 100,
      tag: 'event-based',
      category: 'presentation',
      description: 'Professzionális bemutatás összeállítása'
    },
    {
      title: 'Mentor találkozó előkészítése',
      duration: 30,
      xp: 60,
      tag: 'weekly',
      category: 'mentoring',
      description: 'Kérdések és célok összegyűjtése mentorral való beszélgetéshez'
    },
    {
      title: 'Iparági trendek kutatása',
      duration: 60,
      xp: 70,
      tag: 'daily',
      category: 'research',
      description: 'Aktuális fejlemények követése a szakmában'
    },
    {
      title: 'Heti teljesítmény áttekintése',
      duration: 45,
      xp: 65,
      tag: 'weekly',
      category: 'review',
      description: 'Munkám eredményeinek elemzése és tervezés'
    }
  ],
  self_improver: [
    {
      title: 'Reggeli meditáció és önreflexió',
      duration: 20,
      xp: 40,
      tag: 'daily',
      category: 'mindfulness',
      description: '20 perces tudatos jelenlét gyakorlása'
    },
    {
      title: 'Új készség tanulása - napi lekce',
      duration: 45,
      xp: 60,
      tag: 'daily',
      category: 'skill-building',
      description: 'Választott készség fejlesztése strukturált módon'
    },
    {
      title: 'Gratitude journal - hálás vagyok érte',
      duration: 15,
      xp: 30,
      tag: 'daily',
      category: 'journaling',
      description: '3 dolog felírása, amiért hálás vagy ma'
    },
    {
      title: 'Heti célok kiértékelése',
      duration: 30,
      xp: 50,
      tag: 'weekly',
      category: 'goal-setting',
      description: 'Haladás mérése és következő hét tervezése'
    },
    {
      title: 'Kreatív alkotás ideje',
      duration: 60,
      xp: 80,
      tag: 'weekly',
      category: 'creativity',
      description: 'Szabad alkotás - rajzolás, írás, zene'
    },
    {
      title: 'Komfortzóna kihívás',
      duration: 30,
      xp: 90,
      tag: 'event-based',
      category: 'challenge',
      description: 'Valami új kipróbálása, ami kihívást jelent'
    }
  ],
  organizer: [
    {
      title: 'Heti eseménytervezés koordinálása',
      duration: 60,
      xp: 80,
      tag: 'weekly',
      category: 'event-planning',
      description: 'Részletes eseményterv kidolgozása minden elemmel'
    },
    {
      title: 'Csapat meeting szervezése',
      duration: 45,
      xp: 70,
      tag: 'event-based',
      category: 'team-management',
      description: 'Napirend, résztvevők és logisztika koordinálása'
    },
    {
      title: 'Projekt timeline és mérföldkövek',
      duration: 90,
      xp: 100,
      tag: 'event-based',
      category: 'project-management',
      description: 'Részletes ütemterv készítése deadlineokkal'
    },
    {
      title: 'Vendégmeghívások koordinálása',
      duration: 30,
      xp: 50,
      tag: 'event-based',
      category: 'guest-management',
      description: 'Meghívók, RSVP kezelése és követés'
    },
    {
      title: 'Költségvetés tervezése és kontrollja',
      duration: 75,
      xp: 85,
      tag: 'weekly',
      category: 'budget-planning',
      description: 'Pénzügyi tervezés és kiadások nyomon követése'
    },
    {
      title: 'Hosszú távú stratégiai tervezés',
      duration: 120,
      xp: 120,
      tag: 'weekly',
      category: 'strategic-planning',
      description: '3-6 hónapos tervek kidolgozása és felülvizsgálata'
    }
  ]
};

// =================================
// TEMPLATE MANAGEMENT CLASS
// =================================

class TemplateManager {
  constructor() {
    this.currentGoalTarget = null;
    this.templates = {};
    this.suggestedQuests = [];
    this.dailyQuests = [];
    this.lastDailyQuestUpdate = null;
  }

  async initialize() {
    console.log('🎯 Initializing Template Manager...');
    
    // Load user's current goal target
    await this.loadUserGoalTarget();
    
    // Initialize default templates in Firebase if they don't exist
    await this.initializeDefaultTemplates();
    
    // Load current templates
    await this.loadTemplates();
    
    // Setup daily quest rotation
    await this.setupDailyQuests();
    
    console.log('✅ Template Manager initialized successfully');
  }

  async loadUserGoalTarget() {
    if (!auth.currentUser) return;
    
    try {
      const snapshot = await get(ref(db, `users/${auth.currentUser.uid}/goalTarget`));
      this.currentGoalTarget = snapshot.val() || null;
      console.log('🎯 Current goal target:', this.currentGoalTarget);
    } catch (error) {
      console.error('❌ Error loading goal target:', error);
    }
  }

  async setGoalTarget(targetId) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Save to Firebase
      await set(ref(db, `users/${auth.currentUser.uid}/goalTarget`), targetId);
      
      // Update local state
      this.currentGoalTarget = targetId;
      
      // Load templates for new target
      await this.loadTemplates();
      
      // Regenerate suggested quests
      await this.generateSuggestedQuests();
      
      // Setup new daily quests
      await this.setupDailyQuests();
      
      // Apply theme
      this.applyGoalTargetTheme(targetId);
      
      console.log('✅ Goal target set to:', targetId);
      return true;
    } catch (error) {
      console.error('❌ Error setting goal target:', error);
      throw error;
    }
  }

  async initializeDefaultTemplates() {
    if (!auth.currentUser) return;

    try {
      // Check if templates already exist in Firebase
      const templatesSnapshot = await get(ref(db, 'templates'));
      
      if (!templatesSnapshot.exists()) {
        console.log('📝 Initializing default templates in Firebase...');
        
        // Save default templates to Firebase
        for (const [goalTarget, templates] of Object.entries(DEFAULT_TEMPLATES)) {
          await set(ref(db, `templates/${goalTarget}`), templates);
        }
        
        console.log('✅ Default templates initialized in Firebase');
      }
    } catch (error) {
      console.error('❌ Error initializing default templates:', error);
    }
  }

  async loadTemplates() {
    if (!this.currentGoalTarget) return;

    try {
      const snapshot = await get(ref(db, `templates/${this.currentGoalTarget}`));
      this.templates = snapshot.val() || [];
      console.log(`📋 Loaded ${this.templates.length} templates for ${this.currentGoalTarget}`);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      this.templates = [];
    }
  }

  async generateSuggestedQuests() {
    if (!this.currentGoalTarget || !this.templates.length) return;

    // Generate 8-12 suggested quests from templates
    const questCount = Math.min(Math.max(8, this.templates.length), 12);
    this.suggestedQuests = [...this.templates]
      .sort(() => Math.random() - 0.5)
      .slice(0, questCount)
      .map((template, index) => ({
        ...template,
        id: `suggested_${this.currentGoalTarget}_${index}`,
        type: 'suggested',
        createdAt: Date.now()
      }));

    console.log(`✨ Generated ${this.suggestedQuests.length} suggested quests`);
  }

  async setupDailyQuests() {
    const today = new Date().toDateString();
    // Check if daily quests need to be rotated
    if (this.lastDailyQuestUpdate === today && this.dailyQuests.length > 0) {
      console.log('📅 Daily quests already current for today');
      return;
    }
    if (!this.currentGoalTarget || !this.templates.length) return;
    // Generate 2-3 daily quests
    const dailyQuestCount = Math.min(3, this.templates.length);
    // Csak magyar szöveget tartalmazó példányokat készítünk
    this.dailyQuests = [...this.templates]
      .filter(template => template.tag === 'daily' || Math.random() > 0.6)
      .sort(() => Math.random() - 0.5)
      .slice(0, dailyQuestCount)
      .map((template, index) => {
        // duration prioritás: template.duration (szám) > template.estimatedDuration (szöveg, számot keresünk benne)
        let duration = template.duration;
        if (!duration && template.estimatedDuration) {
          // Próbáljuk kinyerni a számot a szövegből (pl. "45 perc")
          const match = String(template.estimatedDuration).match(/\d+/);
          if (match) duration = parseInt(match[0], 10);
        }
        return {
          ...template,
          id: `daily_${this.currentGoalTarget}_${Date.now()}_${index}`,
          type: 'daily',
          createdAt: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000),
          // Magyar szövegek biztosítása
          title: template.title,
          description: template.description,
          duration: duration,
          estimatedDuration: template.estimatedDuration || (duration ? `${duration} perc` : ''),
        };
      });
    this.lastDailyQuestUpdate = today;
    // Save to user's Firebase data
    if (auth.currentUser) {
      try {
        await set(ref(db, `users/${auth.currentUser.uid}/dailyQuests`), {
          quests: this.dailyQuests,
          lastUpdate: today,
          goalTarget: this.currentGoalTarget
        });
      } catch (error) {
        console.error('❌ Error saving daily quests:', error);
      }
    }
    console.log(`🌅 Generated ${this.dailyQuests.length} daily quests for today`);
  }

  async importQuestToList(quest, targetListId = null) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      let listId = targetListId;
      
      // If no target list specified, create or use default import list
      if (!listId) {
        const importListRef = ref(db, `users/${auth.currentUser.uid}/lists`);
        const newListRef = push(importListRef);
        
        await set(newListRef, {
          name: `${GOAL_TARGETS[this.currentGoalTarget].name} - Importált küldetések`,
          category: 'imported-quests',
          order: Date.now(),
          items: {}
        });
        
        listId = newListRef.key;
      }

      // Add quest as task to the list
      const tasksRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items`);
      const newTaskRef = push(tasksRef);
      
      const taskData = {
        text: quest.title,
        done: false,
        created: Date.now(),
        imported: true,
        originalQuest: quest,
        xp: quest.xp,
        duration: quest.duration,
        category: quest.category || 'general'
      };

      // Add deadline if specified
      if (quest.deadline) {
        taskData.deadline = quest.deadline;
      }

      await set(newTaskRef, taskData);

      console.log(`✅ Quest "${quest.title}" imported to list`);
      return { listId, taskId: newTaskRef.key };
    } catch (error) {
      console.error('❌ Error importing quest:', error);
      throw error;
    }
  }

  applyGoalTargetTheme(targetId) {
    const target = GOAL_TARGETS[targetId];
    if (!target) return;

    // Apply CSS custom properties for theming
    const root = document.documentElement;
    root.style.setProperty('--goal-primary', target.theme.primary);
    root.style.setProperty('--goal-secondary', target.theme.secondary);
    root.style.setProperty('--goal-accent', target.theme.accent);

    console.log(`🎨 Applied theme for ${target.name}`);
  }

  // Admin functions for template management
  async addTemplate(goalTarget, template) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const templatesRef = ref(db, `templates/${goalTarget}`);
      const snapshot = await get(templatesRef);
      const currentTemplates = snapshot.val() || [];
      
      currentTemplates.push({
        ...template,
        id: `template_${Date.now()}`,
        createdAt: Date.now(),
        createdBy: auth.currentUser.uid
      });

      await set(templatesRef, currentTemplates);
      
      // Reload if this is the current goal target
      if (goalTarget === this.currentGoalTarget) {
        await this.loadTemplates();
        await this.generateSuggestedQuests();
      }

      console.log('✅ Template added successfully');
      return true;
    } catch (error) {
      console.error('❌ Error adding template:', error);
      throw error;
    }
  }

  async removeTemplate(goalTarget, templateId) {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const templatesRef = ref(db, `templates/${goalTarget}`);
      const snapshot = await get(templatesRef);
      const currentTemplates = snapshot.val() || [];
      
      const updatedTemplates = currentTemplates.filter(t => t.id !== templateId);
      await set(templatesRef, updatedTemplates);
      
      // Reload if this is the current goal target
      if (goalTarget === this.currentGoalTarget) {
        await this.loadTemplates();
        await this.generateSuggestedQuests();
      }

      console.log('✅ Template removed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error removing template:', error);
      throw error;
    }
  }

  // Getters
  getCurrentGoalTarget() {
    return this.currentGoalTarget;
  }

  getSuggestedQuests() {
    return this.suggestedQuests;
  }

  getDailyQuests() {
    return this.dailyQuests;
  }

  getGoalTargets() {
    return GOAL_TARGETS;
  }

  getTemplates() {
    return this.templates;
  }
}

// =================================
// EXPORT AND GLOBAL ACCESS
// =================================

// Create global instance
const templateManager = new TemplateManager();

// Make available globally
window.templateManager = templateManager;
window.GOAL_TARGETS = GOAL_TARGETS;

// Export for module imports
export { TemplateManager, GOAL_TARGETS, DEFAULT_TEMPLATES };
export default templateManager;

console.log('✅ Goal Templates module loaded successfully');