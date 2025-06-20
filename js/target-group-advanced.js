/**
 * Advanced Target Group System
 * Complete UI customization, quest system, and content personalization
 * Each target group gets a unique, tailored experience
 */

class AdvancedTargetGroupSystem {
  constructor() {
    this.currentTargetGroup = null;
    this.isInitialized = false;
    this.questAcceptanceSystem = null;
    
    // Target group configurations with complete experience customization
    this.targetGroups = {
      student: {
        id: 'student',
        name: 'Diák',
        icon: '🎓',
        
        theme: {
          heroTitle: 'Tanulj Hatékonyan! 📚',
          heroSubtitle: 'Szervezd meg a tanulmányaidat és érj el kiváló eredményeket minden vizsgán',
          dashboardTitle: '🎓 Tanulási Áttekintés',
          questsTitle: '📖 Napi Tanulási Küldetések',
          motivationalQuote: 'A tudás az egyetlen kincs, amit soha nem vehetnek el tőled.',
          welcomeMessage: 'Üdvözöl a StudyMaster! 🌟',
          completionMessage: 'Nagyszerű munka! Újabb lépés a siker felé! 🎯'
        },
        layout: {
          headerStyle: 'academic',
          cardLayout: 'study-focused',
          navigationStyle: 'minimal-clean',
          accentElements: ['study-timer', 'progress-tracker', 'grade-calculator']
        },
        questTypes: {
          study: { icon: '📚', name: 'Tanulás', priority: 'high' },
          homework: { icon: '✏️', name: 'Házi feladat', priority: 'high' },
          research: { icon: '🔍', name: 'Kutatás', priority: 'medium' },
          practice: { icon: '💪', name: 'Gyakorlás', priority: 'high' },
          review: { icon: '🔄', name: 'Ismétlés', priority: 'medium' },
          organization: { icon: '📋', name: 'Szervezés', priority: 'low' }
        },

        dailyQuestCategories: ['study', 'homework', 'research', 'practice', 'review']
      },
      
      youngProfessional: {
        id: 'youngProfessional',
        name: 'Fiatal Szakember',
        icon: '💼',

        theme: {
          heroTitle: 'Építsd a Karriered! 💼',
          heroSubtitle: 'Fejleszd készségeidet, bővítsd kapcsolataidat és érj el szakmai sikereket',
          dashboardTitle: '💼 Karrier Áttekintés',
          questsTitle: '🚀 Napi Szakmai Küldetések',
          motivationalQuote: 'A siker nem véletlenszerű. Ez kemény munka, kitartás, tanulás és legfőképpen az általad végzett munka szeretete.',
          welcomeMessage: 'Üdvözöl a CareerBoost! 🚀',
          completionMessage: 'Kiváló! Újabb lépés a karrier csúcs felé! 📈'
        },
        layout: {
          headerStyle: 'professional',
          cardLayout: 'business-focused',
          navigationStyle: 'corporate-clean',
          accentElements: ['skill-tracker', 'network-counter', 'achievement-board']
        },
        questTypes: {
          networking: { icon: '🤝', name: 'Kapcsolatépítés', priority: 'high' },
          learning: { icon: '📖', name: 'Készségfejlesztés', priority: 'high' },
          project: { icon: '🎯', name: 'Projekt munka', priority: 'high' },
          leadership: { icon: '👑', name: 'Vezetői készségek', priority: 'medium' },
          communication: { icon: '💬', name: 'Kommunikáció', priority: 'medium' },
          productivity: { icon: '⚡', name: 'Produktivitás', priority: 'medium' }
        },

        dailyQuestCategories: ['networking', 'learning', 'project', 'leadership', 'communication']
      },
      
      selfImprover: {
        id: 'selfImprover',
        name: 'Önfejlesztő',
        icon: '🌱',

        theme: {
          heroTitle: 'Fejleszd Önmagad! 🌱',
          heroSubtitle: 'Napi szokások, tudatos gyakorlatok és személyiségfejlesztés a jobb életért',
          dashboardTitle: '🌱 Önfejlesztési Útmutató',
          questsTitle: '✨ Napi Növekedési Küldetések',
          motivationalQuote: 'Az egyetlen személy, aki vagy, az a személy, aki lehetsz.',
          welcomeMessage: 'Üdvözöl a GrowthPath! 🌟',
          completionMessage: 'Csodálatos! Újabb lépés a jobb énod felé! 🌈'
        },
        layout: {
          headerStyle: 'mindful',
          cardLayout: 'wellness-focused',
          navigationStyle: 'zen-minimal',
          accentElements: ['habit-tracker', 'mood-journal', 'progress-mandala']
        },
        questTypes: {
          mindfulness: { icon: '🧘', name: 'Tudatosság', priority: 'high' },
          health: { icon: '💚', name: 'Egészség', priority: 'high' },
          learning: { icon: '📚', name: 'Tanulás', priority: 'medium' },
          creativity: { icon: '🎨', name: 'Kreativitás', priority: 'medium' },
          reflection: { icon: '🤔', name: 'Önreflexió', priority: 'high' },
          wellness: { icon: '🌿', name: 'Jóllét', priority: 'medium' }
        },

        dailyQuestCategories: ['mindfulness', 'health', 'reflection', 'creativity', 'wellness']
      },
      
      organizer: {
        id: 'organizer',
        name: 'Szervező',
        icon: '📋',

        theme: {
          heroTitle: 'Szervezz Profin! 📋',
          heroSubtitle: 'Tervezd és koordináld eseményeidet, projektjeidet a maximális hatékonyságért',
          dashboardTitle: '📋 Szervezési Főhadiszállás',
          questsTitle: '⚡ Napi Szervezési Küldetések',
          motivationalQuote: 'A szervezettség nem perfekcionizmus, hanem hatékonyság.',
          welcomeMessage: 'Üdvözöl az OrganizerPro! 🎯',
          completionMessage: 'Fantasztikus! Minden a helyén! 📌'
        },
        layout: {
          headerStyle: 'organized',
          cardLayout: 'grid-focused',
          navigationStyle: 'structured-clean',
          accentElements: ['timeline-view', 'priority-matrix', 'progress-gantt']
        },
        questTypes: {
          planning: { icon: '📅', name: 'Tervezés', priority: 'high' },
          coordination: { icon: '🎪', name: 'Koordinálás', priority: 'high' },
          communication: { icon: '📞', name: 'Kommunikáció', priority: 'medium' },
          execution: { icon: '⚡', name: 'Végrehajtás', priority: 'high' },
          optimization: { icon: '🔧', name: 'Optimalizálás', priority: 'medium' },
          documentation: { icon: '📄', name: 'Dokumentálás', priority: 'low' }
        },

        dailyQuestCategories: ['planning', 'coordination', 'execution', 'optimization', 'communication']
      }
    };
    
    this.init();
  }
  
  async init() {
    try {
      // Wait for Firebase to be available
      await this.waitForFirebase();
      
      console.log('🎯 Advanced Target Group System initialized');
      this.isInitialized = true;
      
      // Set up authentication listener
      if (window.auth) {
        window.auth.onAuthStateChanged((user) => {
          if (user) {
            this.loadUserTargetGroup(user.uid);
          } else {
            this.currentTargetGroup = null;
            this.resetToDefault();
          }
        });
      }
      
      this.setupUI();
      
    } catch (error) {
      console.error('❌ Error initializing Advanced Target Group System:', error);
    }
  }
  
  waitForFirebase() {
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
  
  async loadUserTargetGroup(userId) {
    try {
      const { get, ref } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
      
      const targetGroupRef = ref(window.db, `users/${userId}/targetGroup`);
      const snapshot = await get(targetGroupRef);
      
      if (snapshot.exists()) {
        const targetGroupId = snapshot.val();
        this.setTargetGroup(targetGroupId, false); // Don't save again
        
        // Ensure event is dispatched for loaded target group after a delay to allow other systems to initialize
        setTimeout(() => {
          const targetGroupChangedEvent = new CustomEvent('targetGroupChanged', {
            detail: {
              groupId: targetGroupId,
              group: this.targetGroups[targetGroupId],
              isInitialLoad: true
            }
          });
          document.dispatchEvent(targetGroupChangedEvent);
          console.log(`📢 Initial target group event dispatched for: ${targetGroupId}`);
        }, 500);
      } else {
        // Show target group selection modal for new users
        setTimeout(() => this.showTargetGroupModal(), 1000);
      }
    } catch (error) {
      console.error('❌ Error loading user target group:', error);
    }
  }
  
  setupUI() {
    this.addTargetGroupToProfile();
    this.setupQuestAcceptanceSystem();
  }
  
  addTargetGroupToProfile() {
    const profileDropdown = document.getElementById('profile-dropdown');
    if (!profileDropdown) return;
    
    // Remove existing target group item
    const existingItem = document.getElementById('advanced-target-group-item');
    if (existingItem) {
      existingItem.remove();
    }
    
    const targetGroupItem = document.createElement('div');
    targetGroupItem.id = 'advanced-target-group-item';
    targetGroupItem.className = 'privacy-menu-btn';
    targetGroupItem.style.cursor = 'pointer';
    targetGroupItem.innerHTML = '🎯 Célcsoport váltás';
    
    targetGroupItem.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
      this.showTargetGroupModal();
    });
    
    const privacyBtn = document.getElementById('privacy-btn');
    if (privacyBtn && privacyBtn.parentNode) {
      privacyBtn.parentNode.insertBefore(targetGroupItem, privacyBtn);
    } else {
      profileDropdown.appendChild(targetGroupItem);
    }
  }
  
  showTargetGroupModal() {
    // Remove existing modal
    const existingModal = document.getElementById('target-group-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'target-group-modal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: white;
      border-radius: 20px;
      padding: 2rem;
      max-width: 800px;
      width: 90%;
      max-height: 90%;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: modalSlideIn 0.3s ease-out;
    `;
    
    modalContent.innerHTML = `
      <style>
        @keyframes modalSlideIn {
          from { opacity: 0; transform: translateY(-50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .target-group-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .target-group-card {
          padding: 2rem;
          border: 3px solid transparent;
          border-radius: 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .target-group-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
          border-radius: 16px;
          transition: opacity 0.3s ease;
        }
        .target-group-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }
        .target-group-card.selected {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
        }
        .target-group-card.selected::before {
          opacity: 0.2;
        }
        .target-group-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          display: block;
        }
        .target-group-name {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #2c3e50;
        }
        .target-group-description {
          font-size: 1rem;
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .target-group-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
        .feature-tag {
          background: rgba(52, 73, 94, 0.1);
          color: #2c3e50;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .modal-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .modal-title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }
        .modal-subtitle {
          font-size: 1.2rem;
          color: #7f8c8d;
          line-height: 1.6;
        }
        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }
        .btn-primary, .btn-secondary {
          padding: 1rem 2rem;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #2980b9, #1f4e79);
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: #ecf0f1;
          color: #2c3e50;
        }
        .btn-secondary:hover {
          background: #d5dbdb;
          transform: translateY(-2px);
        }
      </style>
      
      <div class="modal-header">
        <h2 class="modal-title">🎯 Válassz Célcsoportot</h2>
        <p class="modal-subtitle">
          Válaszd ki, hogy melyik célcsoport írja le legjobban téged.<br>
          Ez határozza meg az oldal teljes megjelenését és funkcióit.
        </p>
      </div>
      
      <div class="target-group-grid">
        ${Object.values(this.targetGroups).map(group => `
          <div class="target-group-card" data-group="${group.id}">
            <span class="target-group-icon">${group.icon}</span>
            <h3 class="target-group-name">${group.name}</h3>
            <p class="target-group-description">${group.theme.heroSubtitle}</p>
            <div class="target-group-features">
              ${group.dailyQuestCategories.slice(0, 3).map(cat => 
                `<span class="feature-tag">
                  ${group.questTypes[cat].icon} ${group.questTypes[cat].name}
                </span>`
              ).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="modal-actions">
        <button class="btn-secondary" onclick="window.advancedTargetGroupSystem.closeModal()">
          Mégse
        </button>
        <button class="btn-primary" id="confirm-target-group" onclick="window.advancedTargetGroupSystem.confirmSelection()">
          Kiválasztás
        </button>
      </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Add card selection logic
    let selectedGroup = this.currentTargetGroup;
    const cards = modalContent.querySelectorAll('.target-group-card');
    
    cards.forEach(card => {
      if (card.dataset.group === selectedGroup) {
        card.classList.add('selected');
      }
      
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedGroup = card.dataset.group;
      });
    });
    
    // Store selected group for confirmation
    this.tempSelectedGroup = selectedGroup;
    
    // Close modal on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  async confirmSelection() {
    const selectedCards = document.querySelectorAll('.target-group-card.selected');
    if (selectedCards.length === 0) {
      this.showNotification('Kérjük, válassz egy célcsoportot!', 'warning');
      return;
    }
    
    const selectedGroup = selectedCards[0].dataset.group;
    await this.selectTargetGroup(selectedGroup);
    this.closeModal();
  }

  async selectTargetGroup(groupId) {
    try {
      const { set, ref } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
      
      // Save to Firebase
      if (window.auth.currentUser) {
        const targetGroupRef = ref(window.db, `users/${window.auth.currentUser.uid}/targetGroup`);
        await set(targetGroupRef, groupId);
      }
      
      // Apply the target group
      this.setTargetGroup(groupId, false);
      
      this.showNotification(`✅ Célcsoport beállítva: ${this.targetGroups[groupId].name}`, 'success');
      
      // Regenerate daily quests for the new target group
      if (window.dailyQuestsManager?.generateTargetGroupQuests) {
        setTimeout(() => {
          window.dailyQuestsManager.generateTargetGroupQuests(groupId);
        }, 1000);
      }
      
    } catch (error) {
      console.error('❌ Error selecting target group:', error);
      this.showNotification('Hiba történt a célcsoport beállításakor', 'error');
    }
  }

  setTargetGroup(groupId, save = true) {
    if (!this.targetGroups[groupId]) {
      console.warn(`❌ Unknown target group: ${groupId}`);
      return;
    }

    this.currentTargetGroup = groupId;
    console.log(`🎯 Target group ${groupId} applied without creating lists`);
    
    // Apply complete UI transformation
    this.applyTargetGroupTheme(groupId);
    this.updateUIContent(groupId);
    this.updateNavigationTexts(groupId);
    this.updateDashboardLayout(groupId);
    
    // Force complete language system refresh to use new target group context
    if (window.updateUITexts) {
      setTimeout(() => {
        window.updateUITexts();
        // Also specifically update dashboard texts
        if (window.updateDashboardTexts) {
          window.updateDashboardTexts();
        }
      }, 150);
    }
    
    // Dispatch target group changed event for other systems
    const targetGroupChangedEvent = new CustomEvent('targetGroupChanged', {
      detail: {
        groupId: groupId,
        group: this.targetGroups[groupId]
      }
    });
    document.dispatchEvent(targetGroupChangedEvent);
    console.log(`📢 Target group changed event dispatched for: ${groupId}`);
    
    // Save to Firebase if requested
    if (save && window.auth?.currentUser) {
      this.saveTargetGroupToFirebase(groupId);
    }
  }

  async saveTargetGroupToFirebase(groupId) {
    try {
      const { set, ref } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
      const targetGroupRef = ref(window.db, `users/${window.auth.currentUser.uid}/targetGroup`);
      await set(targetGroupRef, groupId);
    } catch (error) {
      console.error('❌ Error saving target group to Firebase:', error);
    }
  }

  applyTargetGroupTheme(groupId) {
    const group = this.targetGroups[groupId];
    
    // DON'T apply CSS color changes - let existing theme system handle colors
    // Only apply target group specific content and layout changes
    
    // Add target group specific CSS class to body for layout purposes only
    document.body.className = document.body.className.replace(/target-group-\w+/g, '');
    document.body.classList.add(`target-group-${groupId}`);
    
    console.log(`🎨 Applied target group layout for ${group.name} (colors managed by theme system)`);
  }

  updateUIContent(groupId) {
    const group = this.targetGroups[groupId];
    
    // Update main dashboard welcome text
    const welcomeElement = document.querySelector('[data-text="dashboard.welcome"]');
    if (welcomeElement) {
      welcomeElement.textContent = group.theme.welcomeMessage;
    }
    
    // Update hero section if exists
    const heroTitle = document.querySelector('.hero-title, .dashboard-title h1');
    if (heroTitle) {
      heroTitle.textContent = group.theme.heroTitle;
    }
    
    const heroSubtitle = document.querySelector('.hero-subtitle, .dashboard-subtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = group.theme.heroSubtitle;
    }
    
    // Update daily quotes/motivation
    const motivationElement = document.querySelector('.daily-quote, .motivation-text');
    if (motivationElement) {
      motivationElement.textContent = group.theme.motivationalQuote;
    }
    
    console.log(`📝 Updated UI content for ${group.name}`);
  }
  
  updateNavigationTexts(groupId) {
    // Trigger language system update which will now consider target groups
    if (window.updateNavigationTabTexts) {
      window.updateNavigationTabTexts();
    }
    
    console.log(`🎯 Navigation texts updated for target group: ${groupId}`);
  }
  
  updateDashboardLayout(groupId) {
    const group = this.targetGroups[groupId];
    
    // Only update content-related elements, NOT colors
    // The target group class is already applied in applyTargetGroupTheme
    
    console.log(`📱 Dashboard layout updated for ${group.name} (visual styling managed by theme system)`);
  }
  
  // Get current target group for other systems to use
  getCurrentTargetGroup() {
    return this.currentTargetGroup ? this.targetGroups[this.currentTargetGroup] : null;
  }
  
  // Get target group specific quest types
  getTargetGroupQuestTypes() {
    return this.currentTargetGroup ? this.targetGroups[this.currentTargetGroup].questTypes : {};
  }
  
  // Get daily quest categories for current target group
  getDailyQuestCategories() {
    return this.currentTargetGroup ? this.targetGroups[this.currentTargetGroup].dailyQuestCategories : [];
  }

  setupQuestAcceptanceSystem() {
    this.questAcceptanceSystem = new QuestAcceptanceSystem(this);
  }

  resetToDefault() {
    // Reset only target group classes, NOT theme colors
    document.body.className = document.body.className.replace(/target-group-\w+/g, '');
    console.log('🔄 Reset to default target group (theme colors unchanged)');
  }

  closeModal() {
    const modal = document.getElementById('target-group-modal');
    if (modal) {
      modal.remove();
    }
  }

  showNotification(message, type = 'info') {
    // Use existing notification system
    if (window.showNotification) {
      window.showNotification(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
}

/**
 * Quest Acceptance System
 * Handles quest acceptance and automatic task/event creation
 */
class QuestAcceptanceSystem {
  constructor(targetGroupSystem) {
    this.targetGroupSystem = targetGroupSystem;
    this.acceptedQuests = new Map();
  }
  
  async acceptQuest(questData) {
    try {
      console.log('🎯 Accepting quest:', questData.title);
      
      // Mark quest as accepted
      questData.accepted = true;
      questData.acceptedAt = Date.now();
      
      // Save acceptance to Firebase
      await this.saveQuestAcceptance(questData);
      
      // Create appropriate tasks/events based on quest type
      await this.createQuestActions(questData);
      
      // Update quest UI
      this.updateQuestUI(questData);
      
      this.targetGroupSystem.showNotification(`✅ Küldetés elfogadva: ${questData.title}`, 'success');
      
    } catch (error) {
      console.error('❌ Error accepting quest:', error);
      this.targetGroupSystem.showNotification('❌ Hiba történt a küldetés elfogadásakor', 'error');
    }
  }
  
  async saveQuestAcceptance(questData) {
    const { update, ref } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
    
    const questRef = ref(window.db, `users/${window.auth.currentUser.uid}/daily_quests/${questData.id}`);
    await update(questRef, {
      accepted: true,
      acceptedAt: Date.now()
    });
  }
  
  async createQuestActions(questData) {
    // Determine if this should be an event or task based on quest metadata
    if (questData.questType === 'event' || questData.scheduledTime) {
      await this.createCalendarEvent(questData);
    } else {
      await this.createTaskInList(questData);
    }
  }
  
  async createCalendarEvent(questData) {
    try {
      const { push, ref, set } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
      
      const eventsRef = ref(window.db, `users/${window.auth.currentUser.uid}/events`);
      const newEventRef = push(eventsRef);
      
      const today = new Date();
      const eventTime = questData.scheduledTime || '14:00'; // Default to 2 PM
      const eventDate = today.toISOString().split('T')[0];
      
      const eventData = {
        title: questData.title,
        description: `Küldetésből létrehozott esemény: ${questData.description}`,
        date: eventDate,
        time: eventTime,
        type: 'quest',
        questId: questData.id,
        reminder: true,
        reminderMinutes: 15,
        created: Date.now()
      };
      
      await set(newEventRef, eventData);
      
      console.log(`📅 Calendar event created for quest: ${questData.title}`);
      
      // Refresh calendar if visible
      if (typeof window.loadEvents === 'function') {
        window.loadEvents();
      }
      
    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
    }
  }
  
  async createTaskInList(questData) {
    try {
      const { push, ref, set, get } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js");
      
      // Get user's lists
      const listsRef = ref(window.db, `users/${window.auth.currentUser.uid}/lists`);
      const listsSnapshot = await get(listsRef);
      
      let targetListId = null;
      
      if (listsSnapshot.exists()) {
        const lists = listsSnapshot.val();
        
        // Try to find a suitable list based on quest category
        const questCategory = questData.tag || 'general';
        
        // Look for a list that matches the quest category
        for (const [listId, listData] of Object.entries(lists)) {
          if (listData.category === questCategory || 
              listData.name.toLowerCase().includes(questCategory) ||
              listData.name.toLowerCase().includes('küldetés') ||
              listData.name.toLowerCase().includes('quest')) {
            targetListId = listId;
            break;
          }
        }
        
        // If no suitable list found, use the first list
        if (!targetListId) {
          targetListId = Object.keys(lists)[0];
        }
      }
      
      // If no lists exist, create a quest list
      if (!targetListId) {
        const newListRef = push(listsRef);
        await set(newListRef, {
          name: '🎯 Küldetés Feladatok',
          category: 'quests',
          order: Date.now(),
          items: {}
        });
        targetListId = newListRef.key;
      }
      
      // Add task to the selected list
      const itemsRef = ref(window.db, `users/${window.auth.currentUser.uid}/lists/${targetListId}/items`);
      const newItemRef = push(itemsRef);
      
      await set(newItemRef, {
        text: `🎯 ${questData.title}`,
        done: false,
        created: Date.now(),
        questId: questData.id,
        questDescription: questData.description
      });
      
      console.log(`📝 Task created for quest: ${questData.title}`);
      
      // Refresh lists if visible
      if (typeof window.loadUserLists === 'function' && window.auth.currentUser) {
        window.loadUserLists(window.auth.currentUser.uid);
      }
      
    } catch (error) {
      console.error('❌ Error creating task:', error);
    }
  }
  
  updateQuestUI(questData) {
    const questElement = document.querySelector(`[data-quest-id="${questData.id}"]`);
    if (questElement) {
      questElement.classList.add('quest-accepted');
      
      const acceptButton = questElement.querySelector('.quest-accept-btn');
      if (acceptButton) {
        acceptButton.innerHTML = `
          <span class="material-icons">check_circle</span>
          Elfogadva
        `;
        acceptButton.disabled = true;
        acceptButton.classList.add('accepted');
      }
    }
  }
}

// Initialize the system
const advancedTargetGroupSystem = new AdvancedTargetGroupSystem();

// Make it globally available
window.advancedTargetGroupSystem = advancedTargetGroupSystem;

// Debug functions for console access
window.debugTargetGroup = () => {
  const system = window.advancedTargetGroupSystem;
  console.log('🎯 Advanced Target Group System Debug:');
  console.log('  Current target group:', system.currentTargetGroup);
  console.log('  Available groups:', Object.keys(system.targetGroups));
  console.log('  System initialized:', system.isInitialized);
  
  if (system.currentTargetGroup) {
    const group = system.targetGroups[system.currentTargetGroup];
    console.log('  Active group details:', group);
    console.log('  Quest categories:', group.dailyQuestCategories);
    console.log('  Theme colors:', group.colors);
  }
};

window.switchTargetGroup = (groupId) => {
  if (window.advancedTargetGroupSystem) {
    window.advancedTargetGroupSystem.setTargetGroup(groupId);
    console.log(`✅ Switched to target group: ${groupId}`);
  }
};

window.showTargetGroupModal = () => {
  if (window.advancedTargetGroupSystem) {
    window.advancedTargetGroupSystem.showTargetGroupModal();
  }
};

window.generateQuestsForGroup = (groupId) => {
  if (window.dailyQuestsManager) {
    window.dailyQuestsManager.generateTargetGroupQuests(groupId);
    console.log(`✅ Generated quests for target group: ${groupId}`);
  }
};

console.log('✅ Advanced Target Group System loaded');
console.log('🔧 Debug commands:');
console.log('  - debugTargetGroup() - Show system status');
console.log('  - switchTargetGroup(groupId) - Switch to a target group');
console.log('  - showTargetGroupModal() - Show selection modal');
console.log('  - generateQuestsForGroup(groupId) - Generate quests');

export default advancedTargetGroupSystem; 