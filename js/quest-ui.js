// =================================
// QUEST UI SYSTEM
// =================================

import templateManager, { GOAL_TARGETS } from './goal-templates.js';

console.log('🎮 Loading Quest UI System...');

// =================================
// UI BUILDERS
// =================================

class QuestUI {
  constructor() {
    this.questContainer = null;
    this.dailyQuestContainer = null;
    this.suggestedQuestContainer = null;
    this.goalTargetSelectorModal = null;
  }

  initialize() {
    console.log('🎮 Initializing Quest UI...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  setupUI() {
    // Create quest containers in dashboard
    this.createQuestContainers();
    
    // Add goal target selector to profile
    this.addGoalTargetToProfile();
    
    // Setup auto-refresh
    this.setupAutoRefresh();
    
    console.log('✅ Quest UI initialized successfully');
  }

  createQuestContainers() {
    const dashboardContent = document.querySelector('#dashboard .dashboard-content');
    if (!dashboardContent) {
      console.warn('❌ Dashboard content not found');
      return;
    }

    // Remove existing quest containers if they exist
    const existingContainer = document.getElementById('quest-system-container');
    if (existingContainer) {
      existingContainer.remove();
    }

    // Create main quest container
    const questContainer = document.createElement('div');
    questContainer.id = 'quest-system-container';
    questContainer.className = 'quest-system-container';
    questContainer.style.cssText = `
      margin: 20px 0;
      background: linear-gradient(145deg, #f8f9fa, #e9ecef);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      border: 1px solid var(--goal-accent, #ddd);
    `;

    questContainer.innerHTML = `
      <div class="quest-header">
        <h3 style="margin: 0 0 15px 0; color: var(--goal-primary, #333); display: flex; align-items: center; gap: 10px;">
          <span id="quest-icon">🎯</span>
          <span id="quest-title">Küldetési Rendszer</span>
          <button id="change-goal-target-btn" class="secondary-btn" style="margin-left: auto; font-size: 12px; padding: 5px 10px;">
            Célcsoport váltása
          </button>
        </h3>
        <div id="goal-target-status" class="goal-target-status" style="
          background: var(--goal-accent, #e9ecef);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 15px;
          display: none;
        ">
          <strong>Jelenlegi célcsoport:</strong> <span id="current-goal-name">Nincs beállítva</span>
        </div>
      </div>

      <!-- Daily Quests Section -->
      <div class="daily-quests-section" style="margin-bottom: 25px;">
        <h4 style="color: var(--goal-secondary, #555); margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
          🌅 <span>Napi Küldetések</span>
          <span class="quest-count-badge" id="daily-count" style="
            background: var(--goal-primary, #007bff);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          ">0</span>
        </h4>
        <div id="daily-quests-container" class="quest-grid">
          <div class="no-quests-message" style="text-align: center; color: #666; padding: 20px;">
            🎯 Válassz célcsoportot a napi küldetések megtekintéséhez
          </div>
        </div>
      </div>

      <!-- Suggested Quests Section -->
      <div class="suggested-quests-section">
        <h4 style="color: var(--goal-secondary, #555); margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
          ✨ <span>Javasolt Küldetések</span>
          <span class="quest-count-badge" id="suggested-count" style="
            background: var(--goal-secondary, #6c757d);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: bold;
          ">0</span>
          <button id="refresh-suggested-btn" class="icon-btn" style="margin-left: auto;" title="Javaslatok frissítése">
            🔄
          </button>
        </h4>
        <div id="suggested-quests-container" class="quest-grid">
          <div class="no-quests-message" style="text-align: center; color: #666; padding: 20px;">
            📋 Válassz célcsoportot a javasolt küldetések megtekintéséhez
          </div>
        </div>
      </div>
    `;

    // Insert before the first dashboard widget
    const firstWidget = dashboardContent.querySelector('.dashboard-widget');
    if (firstWidget) {
      dashboardContent.insertBefore(questContainer, firstWidget);
    } else {
      dashboardContent.appendChild(questContainer);
    }

    // Store references
    this.questContainer = questContainer;
    this.dailyQuestContainer = document.getElementById('daily-quests-container');
    this.suggestedQuestContainer = document.getElementById('suggested-quests-container');

    // Add event listeners
    this.setupEventListeners();

    // Add quest grid styles
    this.addQuestStyles();
  }

  addQuestStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .quest-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 12px;
        margin-top: 10px;
      }

      .quest-card {
        background: white;
        border-radius: 8px;
        padding: 15px;
        border-left: 4px solid var(--goal-primary, #007bff);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        position: relative;
      }

      .quest-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      }

      .quest-card.daily-quest {
        border-left-color: var(--goal-primary, #007bff);
        background: linear-gradient(135deg, #fff 0%, var(--goal-accent, #f8f9fa) 100%);
      }

      .quest-card.suggested-quest {
        border-left-color: var(--goal-secondary, #6c757d);
      }

      .quest-title {
        font-weight: bold;
        font-size: 14px;
        color: #333;
        margin-bottom: 8px;
        line-height: 1.3;
      }

      .quest-description {
        font-size: 12px;
        color: #666;
        margin-bottom: 10px;
        line-height: 1.4;
      }

      .quest-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        color: #777;
        margin-bottom: 10px;
      }

      .quest-xp {
        background: linear-gradient(45deg, #ffd700, #ffed4e);
        color: #333;
        padding: 2px 6px;
        border-radius: 6px;
        font-weight: bold;
      }

      .quest-duration {
        background: #e9ecef;
        padding: 2px 6px;
        border-radius: 6px;
      }

      .quest-tag {
        background: var(--goal-accent, #e9ecef);
        color: var(--goal-primary, #007bff);
        padding: 2px 6px;
        border-radius: 6px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 10px;
      }

      .quest-actions {
        display: flex;
        gap: 8px;
      }

      .import-quest-btn {
        background: var(--goal-primary, #007bff);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        flex: 1;
      }

      .import-quest-btn:hover {
        background: var(--goal-secondary, #0056b3);
        transform: scale(1.02);
      }

      .import-quest-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
      }

      .quest-type-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: var(--goal-primary, #007bff);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
      }

      .daily-quest .quest-type-badge {
        background: linear-gradient(45deg, #ff6b6b, #ffa500);
      }

      .suggested-quest .quest-type-badge {
        background: var(--goal-secondary, #6c757d);
      }

      .no-quests-message {
        grid-column: 1 / -1;
      }

      .icon-btn {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: background-color 0.2s ease;
      }

      .icon-btn:hover {
        background: rgba(0,0,0,0.1);
      }

      @media (max-width: 768px) {
        .quest-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    // Change goal target button
    const changeGoalBtn = document.getElementById('change-goal-target-btn');
    if (changeGoalBtn) {
      changeGoalBtn.addEventListener('click', () => this.showGoalTargetSelector());
    }

    // Refresh suggested quests button
    const refreshBtn = document.getElementById('refresh-suggested-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshSuggestedQuests());
    }
  }

  addGoalTargetToProfile() {
    const profileDropdown = document.getElementById('profile-dropdown');
    if (!profileDropdown) {
      console.warn('❌ Profile dropdown not found');
      return;
    }
    
    // Remove existing item if present
    const existingItem = document.getElementById('goal-target-profile-item');
    if (existingItem) {
      existingItem.remove();
    }
    
    // Create new item
    const goalTargetItem = document.createElement('div');
    goalTargetItem.id = 'goal-target-profile-item';
    goalTargetItem.className = 'privacy-menu-btn';
    goalTargetItem.style.cursor = 'pointer';
    goalTargetItem.innerHTML = '🎯 Célcsoport';
    
    // Event listener
    goalTargetItem.addEventListener('click', () => {
      profileDropdown.classList.remove('show');
      this.showGoalTargetSelector();
    });
    
    // Add to profile dropdown
    const privacyBtn = document.getElementById('privacy-btn');
    if (privacyBtn && privacyBtn.parentNode) {
      privacyBtn.parentNode.insertBefore(goalTargetItem, privacyBtn);
    } else {
      profileDropdown.appendChild(goalTargetItem);
    }
    
    console.log('✅ Goal target added to profile menu');
  }

  showGoalTargetSelector() {
    // Remove existing modal
    const existingModal = document.getElementById('goal-target-selector-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'goal-target-selector-modal';
    modal.className = 'modal';
    modal.style.display = 'flex';

    const goalTargets = templateManager.getGoalTargets();
    const currentTarget = templateManager.getCurrentGoalTarget();

    const cardsHtml = Object.values(goalTargets).map(target => `
      <div class="goal-target-card ${currentTarget === target.id ? 'selected' : ''}" 
           data-target="${target.id}"
           style="
             border: 2px solid ${target.color};
             border-radius: 12px;
             padding: 20px;
             text-align: center;
             cursor: pointer;
             transition: all 0.3s ease;
             background: ${currentTarget === target.id ? target.color + '20' : 'white'};
             position: relative;
           ">
        ${currentTarget === target.id ? '<div style="position: absolute; top: 5px; right: 5px; font-size: 16px;">✅</div>' : ''}
        <div style="font-size: 3rem; margin-bottom: 10px;">${target.icon}</div>
        <div style="font-weight: bold; color: ${target.color}; font-size: 16px; margin-bottom: 5px;">${target.name}</div>
        <div style="font-size: 12px; color: #666; line-height: 1.3;">${target.description}</div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3>🎯 Célcsoport választása</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <p style="margin-bottom: 20px; text-align: center; color: #666;">
            Válaszd ki a célcsoportodat a személyre szabott küldetések és sablonok eléréséhez:
          </p>
          <div class="goal-target-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          ">
            ${cardsHtml}
          </div>
          ${currentTarget ? `
            <div style="text-align: center; margin-top: 15px;">
              <button id="clear-goal-target-btn" class="secondary-btn">
                🗑️ Célcsoport eltávolítása
              </button>
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button onclick="this.closest('.modal').remove()" class="secondary-btn">Bezárás</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelectorAll('.goal-target-card').forEach(card => {
      card.addEventListener('click', () => {
        const targetId = card.dataset.target;
        this.selectGoalTarget(targetId);
      });

      card.addEventListener('mouseenter', () => {
        if (!card.classList.contains('selected')) {
          card.style.transform = 'scale(1.05)';
          card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('selected')) {
          card.style.transform = 'scale(1)';
          card.style.boxShadow = 'none';
        }
      });
    });

    // Clear goal target button
    const clearBtn = modal.querySelector('#clear-goal-target-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearGoalTarget());
    }

    this.goalTargetSelectorModal = modal;
  }

  async selectGoalTarget(targetId) {
    try {
      await templateManager.setGoalTarget(targetId);
      
      // Close modal
      if (this.goalTargetSelectorModal) {
        this.goalTargetSelectorModal.remove();
        this.goalTargetSelectorModal = null;
      }

      // Show success notification
      this.showNotificationSafe(`✅ Célcsoport beállítva: ${GOAL_TARGETS[targetId].name}`);

      // Refresh UI
      await this.refreshUI();
      
    } catch (error) {
      console.error('❌ Error selecting goal target:', error);
      this.showNotificationSafe('❌ Hiba történt a célcsoport beállításakor');
    }
  }

  async clearGoalTarget() {
    try {
      await templateManager.setGoalTarget(null);
      
      // Close modal
      if (this.goalTargetSelectorModal) {
        this.goalTargetSelectorModal.remove();
        this.goalTargetSelectorModal = null;
      }

      // Show notification
      this.showNotificationSafe('🗑️ Célcsoport eltávolítva');

      // Refresh UI
      await this.refreshUI();
      
    } catch (error) {
      console.error('❌ Error clearing goal target:', error);
      this.showNotificationSafe('❌ Hiba történt a célcsoport törlésekor');
    }
  }

  async refreshSuggestedQuests() {
    try {
      await templateManager.generateSuggestedQuests();
      this.renderSuggestedQuests();
      this.showNotificationSafe('🔄 Javasolt küldetések frissítve');
    } catch (error) {
      console.error('❌ Error refreshing suggested quests:', error);
      this.showNotificationSafe('❌ Hiba történt a javaslatok frissítésekor');
    }
  }

  async refreshUI() {
    const currentTarget = templateManager.getCurrentGoalTarget();
    
    // Update header
    this.updateQuestHeader(currentTarget);
    
    // Render quests
    this.renderDailyQuests();
    this.renderSuggestedQuests();
  }

  updateQuestHeader(targetId) {
    const questIcon = document.getElementById('quest-icon');
    const questTitle = document.getElementById('quest-title');
    const goalStatus = document.getElementById('goal-target-status');
    const currentGoalName = document.getElementById('current-goal-name');

    if (targetId && GOAL_TARGETS[targetId]) {
      const target = GOAL_TARGETS[targetId];
      
      if (questIcon) questIcon.textContent = target.icon;
      if (questTitle) questTitle.textContent = `${target.name} Küldetések`;
      if (goalStatus) goalStatus.style.display = 'block';
      if (currentGoalName) currentGoalName.textContent = target.name;
      
      // Apply theme
      templateManager.applyGoalTargetTheme(targetId);
    } else {
      if (questIcon) questIcon.textContent = '🎯';
      if (questTitle) questTitle.textContent = 'Küldetési Rendszer';
      if (goalStatus) goalStatus.style.display = 'none';
    }
  }

  renderDailyQuests() {
    if (!this.dailyQuestContainer) return;

    // Mindig a goal-templates.js-ből származó magyar napi küldetéseket használjuk
    const dailyQuests = templateManager.getDailyQuests();
    const countBadge = document.getElementById('daily-count');
    
    if (countBadge) {
      countBadge.textContent = dailyQuests.length;
    }

    if (dailyQuests.length === 0) {
      this.dailyQuestContainer.innerHTML = `
        <div class="no-quests-message" style="text-align: center; color: #666; padding: 20px;">
          🌅 Még nincsenek napi küldetések. Válassz célcsoportot a generáláshoz!
        </div>
      `;
      return;
    }

    this.dailyQuestContainer.innerHTML = dailyQuests.map(quest => 
      this.createQuestCard(quest, 'daily')
    ).join('');

    // Add event listeners for import buttons
    this.addQuestEventListeners(this.dailyQuestContainer);
  }

  renderSuggestedQuests() {
    if (!this.suggestedQuestContainer) return;

    const suggestedQuests = templateManager.getSuggestedQuests();
    const countBadge = document.getElementById('suggested-count');
    
    if (countBadge) {
      countBadge.textContent = suggestedQuests.length;
    }

    if (suggestedQuests.length === 0) {
      this.suggestedQuestContainer.innerHTML = `
        <div class="no-quests-message" style="text-align: center; color: #666; padding: 20px;">
          ✨ Még nincsenek javasolt küldetések. Válassz célcsoportot a generáláshoz!
        </div>
      `;
      return;
    }

    this.suggestedQuestContainer.innerHTML = suggestedQuests.map(quest => 
      this.createQuestCard(quest, 'suggested')
    ).join('');

    // Add event listeners for import buttons
    this.addQuestEventListeners(this.suggestedQuestContainer);
  }

  createQuestCard(quest, type) {
    // Normalize duration for display
    let duration = quest.duration;
    if (!duration && quest.estimatedDuration) {
      // Try to extract number from string like "45 perc"
      const match = String(quest.estimatedDuration).match(/\d+/);
      if (match) duration = parseInt(match[0], 10);
    }
    // Fallback if still not found
    if (!duration) duration = '';

    // Normalize description
    const description = quest.description || '';

    const tagText = {
      'daily': 'NAPI',
      'weekly': 'HETI',
      'event-based': 'ESEMÉNY'
    }[quest.tag] || (quest.tag ? quest.tag.toUpperCase() : '');

    return `
      <div class="quest-card ${type}-quest">
        <div class="quest-type-badge">${type === 'daily' ? 'NAPI' : 'JAVASOLT'}</div>
        <div class="quest-title">${quest.title}</div>
        <div class="quest-description">${description}</div>
        <div class="quest-meta">
          <span class="quest-xp">⭐ ${quest.xp} XP</span>
          <span class="quest-duration">⏱️ ${duration}p</span>
          <span class="quest-tag">${tagText}</span>
        </div>
        <div class="quest-actions">
          <button class="import-quest-btn" data-quest-id="${quest.id}" data-quest-type="${type}">
            📥 Importálás listába
          </button>
        </div>
      </div>
    `;
  }

  addQuestEventListeners(container) {
    const importButtons = container.querySelectorAll('.import-quest-btn');
    
    importButtons.forEach(button => {
      button.addEventListener('click', () => {
        const questId = button.dataset.questId;
        const questType = button.dataset.questType;
        this.importQuest(questId, questType, button);
      });
    });
  }

  async importQuest(questId, questType, buttonElement) {
    try {
      // Disable button
      buttonElement.disabled = true;
      buttonElement.textContent = '⏳ Importálás...';

      // Find the quest from the correct source
      let quests;
      if (questType === 'daily') {
        if (window.dailyQuestsManager && typeof window.dailyQuestsManager.getDailyQuests === 'function') {
          quests = window.dailyQuestsManager.getDailyQuests();
        } else {
          quests = templateManager.getDailyQuests();
        }
      } else {
        quests = templateManager.getSuggestedQuests();
      }
      const quest = quests.find(q => q.id === questId);
      if (!quest) {
        throw new Error('Quest not found');
      }

      // Import quest
      const result = await templateManager.importQuestToList(quest);
      
      // Show success
      buttonElement.textContent = '✅ Importálva!';
      this.showNotificationSafe(`✅ "${quest.title}" küldetés importálva!`);

      // Reset button after delay
      setTimeout(() => {
        buttonElement.disabled = false;
        buttonElement.textContent = '📥 Importálás listába';
      }, 2000);

      // Refresh lists if function is available
      if (typeof window.loadUserLists === 'function') {
        setTimeout(() => {
          const auth = window.auth || (window.firebase && window.firebase.auth());
          if (auth && auth.currentUser) {
            window.loadUserLists(auth.currentUser.uid);
          }
        }, 500);
      }

    } catch (error) {
      console.error('❌ Error importing quest:', error);
      this.showNotificationSafe('❌ Hiba történt a küldetés importálásakor');
      
      // Reset button
      buttonElement.disabled = false;
      buttonElement.textContent = '📥 Importálás listába';
    }
  }

  setupAutoRefresh() {
    // Auto-refresh daily quests at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.refreshDailyQuests();
      
      // Set up daily interval
      setInterval(() => {
        this.refreshDailyQuests();
      }, 24 * 60 * 60 * 1000); // 24 hours
    }, msUntilMidnight);
  }

  async refreshDailyQuests() {
    try {
      await templateManager.setupDailyQuests();
      this.renderDailyQuests();
      console.log('🌅 Daily quests auto-refreshed');
    } catch (error) {
      console.error('❌ Error auto-refreshing daily quests:', error);
    }
  }

  showNotificationSafe(message) {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message);
    } else if (typeof showNotification === 'function') {
      showNotification(message);
    } else {
      console.log('Notification:', message);
    }
  }
}

// =================================
// INITIALIZATION
// =================================

const questUI = new QuestUI();

// Initialize when template manager is ready
async function initializeQuestUI() {
  try {
    await templateManager.initialize();
    questUI.initialize();
    console.log('✅ Quest UI System fully initialized');
  } catch (error) {
    console.error('❌ Error initializing Quest UI:', error);
  }
}

// Auto-initialize when DOM is ready and user is authenticated
document.addEventListener('DOMContentLoaded', () => {
  // Wait for authentication
  const checkAuth = () => {
    if (window.auth && window.auth.currentUser) {
      initializeQuestUI();
    } else {
      setTimeout(checkAuth, 1000);
    }
  };
  
  setTimeout(checkAuth, 2000); // Start checking after 2 seconds
});

// Export for global access
window.questUI = questUI;
export default questUI;

console.log('✅ Quest UI module loaded successfully');