/* ===================================
   GAMIFICATION-MANAGER.JS - Gamification System
   =================================== */

import { db, ref, set, get, update } from './firebase-config.js';
import { showNotification, getCurrentUser } from './app-core.js';

// Gamification state
let userLevel = 1;
let userXP = 0;
let currentStreak = 0;
let totalTasksCompleted = 0;
let achievements = {};
let dailyQuotes = [];

// XP values for different actions
const XP_VALUES = {
  TASK_COMPLETED: 10,
  NOTE_CREATED: 5,
  EVENT_CREATED: 5,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 20,
  LIST_CREATED: 15
};

// Level requirements
const LEVEL_REQUIREMENTS = [
  0, 100, 250, 500, 1000, 1750, 2500, 3500, 5000, 7000, 10000,
  13500, 17500, 22000, 27000, 32500, 38500, 45000, 52000, 60000, 100000
];

/**
 * Initialize gamification manager
 */
export function initializeGamificationManager() {
  console.log('🎮 Initializing Gamification Manager...');
  
  // Load user progress
  loadUserProgress();
  
  // Update daily quote
  updateDailyQuote();
  
  // Update achievements
  updateAchievements();
  
  // Update statistics
  updateStatistics();
  
  // Update streak display
  updateStreakDisplay();
  
  console.log('✅ Gamification Manager initialized');
}

/**
 * Add XP to user
 */
export function addXP(amount, reason = '') {
  const user = getCurrentUser();
  if (!user) return;
  
  userXP += amount;
  
  // Check for level up
  const newLevel = calculateLevel(userXP);
  if (newLevel > userLevel) {
    userLevel = newLevel;
    showLevelUpNotification(newLevel);
  }
  
  // Update display
  updateLevelDisplay();
  
  // Save progress
  saveUserProgress();
  
  // Show XP notification
  if (reason) {
    showNotification(`+${amount} XP - ${reason}`, 'success');
  }
  
  console.log(`Added ${amount} XP. Total: ${userXP}, Level: ${userLevel}`);
}

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
  for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_REQUIREMENTS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP required for next level
 */
function getXPForNextLevel(level) {
  if (level >= LEVEL_REQUIREMENTS.length) {
    return LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1];
  }
  return LEVEL_REQUIREMENTS[level];
}

/**
 * Update level display
 */
export function updateLevelDisplay() {
  const levelElement = document.getElementById('user-level');
  const xpElement = document.getElementById('user-xp');
  const progressBar = document.getElementById('xp-progress-bar');
  const progressText = document.getElementById('xp-progress-text');
  
  if (levelElement) {
    levelElement.textContent = userLevel;
  }
  
  if (xpElement) {
    xpElement.textContent = userXP;
  }
  
  // Update progress bar
  const currentLevelXP = LEVEL_REQUIREMENTS[userLevel - 1] || 0;
  const nextLevelXP = getXPForNextLevel(userLevel);
  const progressXP = userXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min((progressXP / requiredXP) * 100, 100);
  
  if (progressBar) {
    updateProgressBar('xp-progress-bar', progressXP, requiredXP);
  }
  
  if (progressText) {
    progressText.textContent = `${progressXP}/${requiredXP} XP`;
  }
  
  // Update circular progress
  updateCircularProgress(progressPercentage);
}

/**
 * Show level up notification
 */
function showLevelUpNotification(level) {
  const modal = document.createElement('div');
  modal.className = 'modal level-up-modal';
  modal.innerHTML = `
    <div class="modal-content celebration">
      <div class="level-up-animation">
        <h2>🎉 Level Up! 🎉</h2>
        <div class="new-level">Level ${level}</div>
        <p>Congratulations! You've reached a new level!</p>
        <div class="celebration-effects">
          <div class="confetti"></div>
          <div class="sparkles"></div>
        </div>
      </div>
      <button class="level-up-close">Continue</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Auto close after 5 seconds or when clicked
  const closeBtn = modal.querySelector('.level-up-close');
  const closeModal = () => {
    document.body.removeChild(modal);
  };
  
  closeBtn.addEventListener('click', closeModal);
  setTimeout(closeModal, 5000);
  
  // Play celebration sound if available
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAR...');
    audio.play().catch(() => {});
  } catch (e) {}
}

/**
 * Save user progress to Firebase
 */
export function saveUserProgress() {
  const user = getCurrentUser();
  if (!user) return;
  
  const progressData = {
    level: userLevel,
    xp: userXP,
    streak: currentStreak,
    totalTasksCompleted,
    lastLoginDate: new Date().toDateString(),
    achievements,
    updatedAt: Date.now()
  };
  
  const progressRef = ref(db, `users/${user.uid}/progress`);
  set(progressRef, progressData).catch((error) => {
    console.error('Error saving progress:', error);
  });
}

/**
 * Load user progress from Firebase
 */
export function loadUserProgress() {
  const user = getCurrentUser();
  if (!user) return;
  
  const progressRef = ref(db, `users/${user.uid}/progress`);
  
  get(progressRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      userLevel = data.level || 1;
      userXP = data.xp || 0;
      currentStreak = data.streak || 0;
      totalTasksCompleted = data.totalTasksCompleted || 0;
      achievements = data.achievements || {};
      
      // Check for daily login bonus
      const lastLoginDate = data.lastLoginDate;
      const today = new Date().toDateString();
      
      if (lastLoginDate !== today) {
        // Award daily login bonus
        addXP(XP_VALUES.DAILY_LOGIN, 'Daily login bonus');
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLoginDate === yesterday.toDateString()) {
          currentStreak++;
          if (currentStreak % 7 === 0) {
            addXP(XP_VALUES.STREAK_BONUS, `${currentStreak}-day streak bonus!`);
          }
        } else if (lastLoginDate !== today) {
          currentStreak = 1; // Reset streak if more than a day gap
        }
      }
      
      // Update displays
      updateLevelDisplay();
      updateStreakDisplay();
      updateAchievements();
      updateStatistics();
    } else {
      // Initialize new user progress
      saveUserProgress();
    }
  });
}

/**
 * Update streak display
 */
export async function updateStreakDisplay() {
  const streakElement = document.getElementById('current-streak');
  const streakDaysElement = document.getElementById('streak-days');
  
  if (streakElement) {
    streakElement.textContent = currentStreak;
  }
  
  if (streakDaysElement) {
    streakDaysElement.textContent = `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}`;
  }
  
  // Update streak visualization
  const streakVisualization = document.getElementById('streak-visualization');
  if (streakVisualization) {
    const days = Math.min(currentStreak, 30); // Show max 30 days
    streakVisualization.innerHTML = '';
    
    for (let i = 0; i < days; i++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'streak-day active';
      dayElement.title = `Day ${i + 1}`;
      streakVisualization.appendChild(dayElement);
    }
  }
}

/**
 * Update daily quote
 */
export function updateDailyQuote() {
  // Motivational quotes array
  const quotes = [
    "The only way to do great work is to love what you do. - Steve Jobs",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    "It is during our darkest moments that we must focus to see the light. - Aristotle",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Don't let yesterday take up too much of today. - Will Rogers",
    "You learn more from failure than from success. Don't let it stop you. Failure builds character. - Unknown",
    "It's not whether you get knocked down, it's whether you get up. - Vince Lombardi",
    "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you. - Steve Jobs",
    "People who are crazy enough to think they can change the world, are the ones who do. - Rob Siltanen"
  ];
  
  const today = new Date().toDateString();
  const savedQuote = localStorage.getItem('dailyQuote');
  const savedDate = localStorage.getItem('dailyQuoteDate');
  
  let quote;
  
  if (savedDate === today && savedQuote) {
    quote = savedQuote;
  } else {
    // Get new quote for today
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    quote = quotes[dayOfYear % quotes.length];
    
    // Save for today
    localStorage.setItem('dailyQuote', quote);
    localStorage.setItem('dailyQuoteDate', today);
  }
  
  const quoteElement = document.getElementById('daily-quote');
  if (quoteElement) {
    quoteElement.textContent = quote;
  }
}

/**
 * Update achievements
 */
export function updateAchievements() {
  const achievementDefinitions = [
    {
      id: 'first_task',
      name: 'First Steps',
      description: 'Complete your first task',
      icon: '🎯',
      condition: () => totalTasksCompleted >= 1,
      xp: 25
    },
    {
      id: 'task_10',
      name: 'Getting Started',
      description: 'Complete 10 tasks',
      icon: '📝',
      condition: () => totalTasksCompleted >= 10,
      xp: 50
    },
    {
      id: 'task_50',
      name: 'Productive',
      description: 'Complete 50 tasks',
      icon: '⚡',
      condition: () => totalTasksCompleted >= 50,
      xp: 100
    },
    {
      id: 'task_100',
      name: 'Task Master',
      description: 'Complete 100 tasks',
      icon: '👑',
      condition: () => totalTasksCompleted >= 100,
      xp: 200
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach Level 5',
      icon: '⭐',
      condition: () => userLevel >= 5,
      xp: 100
    },
    {
      id: 'level_10',
      name: 'Expert',
      description: 'Reach Level 10',
      icon: '🏆',
      condition: () => userLevel >= 10,
      xp: 200
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      condition: () => currentStreak >= 7,
      xp: 150
    },
    {
      id: 'streak_30',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      icon: '💎',
      condition: () => currentStreak >= 30,
      xp: 500
    }
  ];
  
  let newAchievements = 0;
  
  achievementDefinitions.forEach(achievement => {
    if (!achievements[achievement.id] && achievement.condition()) {
      // Award achievement
      achievements[achievement.id] = {
        unlockedAt: Date.now(),
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp: achievement.xp
      };
      
      newAchievements++;
      
      // Award XP
      addXP(achievement.xp, `Achievement: ${achievement.name}`);
      
      // Show achievement notification
      showAchievementNotification(achievement);
    }
  });
  
  if (newAchievements > 0) {
    saveUserProgress();
  }
  
  // Update achievements display
  updateAchievementsDisplay();
}

/**
 * Show achievement notification
 */
function showAchievementNotification(achievement) {
  const notification = document.createElement('div');
  notification.className = 'achievement-notification';
  notification.innerHTML = `
    <div class="achievement-content">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-text">
        <h4>Achievement Unlocked!</h4>
        <p><strong>${achievement.name}</strong></p>
        <p>${achievement.description}</p>
        <p class="achievement-xp">+${achievement.xp} XP</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Show animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

/**
 * Update achievements display
 */
function updateAchievementsDisplay() {
  const achievementsContainer = document.getElementById('achievements-container');
  if (!achievementsContainer) return;
  
  const unlockedCount = Object.keys(achievements).length;
  const totalCount = 8; // Total number of achievements
  
  const achievementsHTML = Object.values(achievements)
    .sort((a, b) => b.unlockedAt - a.unlockedAt)
    .slice(0, 3) // Show only latest 3
    .map(achievement => `
      <div class="achievement-item unlocked">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-info">
          <h4>${achievement.name}</h4>
          <p>${achievement.description}</p>
          <span class="achievement-date">${new Date(achievement.unlockedAt).toLocaleDateString()}</span>
        </div>
      </div>
    `).join('');
  
  achievementsContainer.innerHTML = `
    <div class="achievements-header">
      <h3>Recent Achievements</h3>
      <span class="achievements-count">${unlockedCount}/${totalCount}</span>
    </div>
    <div class="achievements-list">
      ${achievementsHTML || '<p class="empty-state">No achievements yet. Complete tasks to unlock them!</p>'}
    </div>
  `;
}

/**
 * Update statistics
 */
export function updateStatistics() {
  // Update various statistics elements
  animateNumber('total-tasks-completed', totalTasksCompleted);
  animateNumber('user-level-stat', userLevel);
  animateNumber('user-xp-stat', userXP);
  animateNumber('current-streak-stat', currentStreak);
  
  // Update progress indicators
  const levelProgress = ((userLevel - 1) / 20) * 100; // Assuming max level 20
  updateProgressBar('level-progress', userLevel - 1, 20);
  
  const xpProgress = (userXP / getXPForNextLevel(userLevel)) * 100;
  updateProgressBar('xp-progress', userXP, getXPForNextLevel(userLevel));
}

/**
 * Animate number counter
 */
function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startValue = parseInt(element.textContent) || 0;
  const duration = 1000; // 1 second
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
    
    element.textContent = currentValue.toLocaleString();
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

/**
 * Update progress bar
 */
function updateProgressBar(elementId, value, maxValue) {
  const progressBar = document.getElementById(elementId);
  if (!progressBar) return;
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  // Find progress fill element
  const progressFill = progressBar.querySelector('.progress-fill') || progressBar;
  progressFill.style.width = percentage + '%';
  
  // Update text if exists
  const progressText = progressBar.querySelector('.progress-text');
  if (progressText) {
    progressText.textContent = `${value}/${maxValue}`;
  }
}

/**
 * Update circular progress indicator
 */
function updateCircularProgress(percentage) {
  const circularProgress = document.getElementById('circular-progress');
  if (!circularProgress) return;
  
  const circle = circularProgress.querySelector('.progress-circle');
  if (!circle) return;
  
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;
  
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
  
  // Update percentage text
  const percentageText = circularProgress.querySelector('.progress-percentage');
  if (percentageText) {
    percentageText.textContent = Math.round(percentage) + '%';
  }
}

/**
 * Award XP for specific actions
 */
export function awardTaskCompletionXP() {
  totalTasksCompleted++;
  addXP(XP_VALUES.TASK_COMPLETED, 'Task completed');
  updateAchievements();
  saveUserProgress();
}

export function awardNoteCreationXP() {
  addXP(XP_VALUES.NOTE_CREATED, 'Note created');
  saveUserProgress();
}

export function awardEventCreationXP() {
  addXP(XP_VALUES.EVENT_CREATED, 'Event created');
  saveUserProgress();
}

export function awardListCreationXP() {
  addXP(XP_VALUES.LIST_CREATED, 'List created');
  saveUserProgress();
}

// Make functions globally available
window.addXP = addXP;
window.awardTaskCompletionXP = awardTaskCompletionXP;
window.awardNoteCreationXP = awardNoteCreationXP;
window.awardEventCreationXP = awardEventCreationXP;
window.awardListCreationXP = awardListCreationXP;

// Export user state for other modules
export { userLevel, userXP, currentStreak, totalTasksCompleted }; 