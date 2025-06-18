/* ===================================
   DASHBOARD-MANAGER.JS - Dashboard Management
   =================================== */

import { db, ref, get, onValue } from './firebase-config.js';
import { getCurrentUser } from './app-core.js';

// Dashboard state
let activityData = {};
let dashboardUpdateInterval = null;

/**
 * Initialize dashboard manager
 */
export function initializeDashboardManager() {
  console.log('📊 Initializing Dashboard Manager...');
  
  // Update dashboard immediately
  updateDashboard();
  
  // Set up periodic updates
  startPeriodicUpdates();
  
  // Update current time
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);
  
  console.log('✅ Dashboard Manager initialized');
}

/**
 * Start periodic dashboard updates
 */
function startPeriodicUpdates() {
  // Update dashboard every 30 seconds
  dashboardUpdateInterval = setInterval(() => {
    updateDashboard();
  }, 30000);
}

/**
 * Stop periodic updates
 */
export function stopPeriodicUpdates() {
  if (dashboardUpdateInterval) {
    clearInterval(dashboardUpdateInterval);
    dashboardUpdateInterval = null;
  }
}

/**
 * Update dashboard with latest data
 */
export async function updateDashboard() {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    // Update various dashboard sections
    await Promise.all([
      updateOverview(),
      updatePinnedItems(),
      updatePinnedNotes(),
      updatePinnedTasks(),
      updateUrgentTasks(),
      generateActivityCalendar(),
      updateProductivityInsights()
    ]);
    
    console.log('📊 Dashboard updated successfully');
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

/**
 * Force refresh all dashboard data
 */
export async function forceRefreshAllData() {
  const user = getCurrentUser();
  if (!user) return;
  
  // Clear cached data
  activityData = {};
  
  // Reload everything
  await updateDashboard();
  
  console.log('🔄 All dashboard data refreshed');
}

/**
 * Update current time display
 */
function updateCurrentTime() {
  const timeElements = document.querySelectorAll('.current-time');
  const dateElements = document.querySelectorAll('.current-date');
  
  const now = new Date();
  const timeString = now.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const dateString = now.toLocaleDateString('hu-HU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  timeElements.forEach(el => {
    el.textContent = timeString;
  });
  
  dateElements.forEach(el => {
    el.textContent = dateString;
  });
  
  // Update greeting based on time
  updateGreeting(now);
}

/**
 * Update greeting message
 */
function updateGreeting(now) {
  const greetingElement = document.getElementById('greeting-message');
  if (!greetingElement) return;
  
  const hour = now.getHours();
  const user = getCurrentUser();
  const userName = user?.email?.split('@')[0] || 'User';
  
  let greeting;
  if (hour < 12) {
    greeting = `Good morning, ${userName}! ☀️`;
  } else if (hour < 18) {
    greeting = `Good afternoon, ${userName}! 🌤️`;
  } else {
    greeting = `Good evening, ${userName}! 🌙`;
  }
  
  greetingElement.textContent = greeting;
}

/**
 * Update pinned items section
 */
function updatePinnedItems() {
  updatePinnedNotes();
  updatePinnedTasks();
}

/**
 * Update pinned notes display
 */
function updatePinnedNotes() {
  const user = getCurrentUser();
  if (!user) return;
  
  const notesRef = ref(db, `users/${user.uid}/notes`);
  
  get(notesRef).then((snapshot) => {
    const pinnedNotesContainer = document.getElementById('pinned-notes');
    if (!pinnedNotesContainer) return;
    
    pinnedNotesContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const notes = snapshot.val();
      const pinnedNotes = Object.entries(notes)
        .filter(([_, note]) => note.isPinned)
        .slice(0, 3); // Show max 3 pinned notes
      
      if (pinnedNotes.length > 0) {
        pinnedNotes.forEach(([id, note]) => {
          const noteElement = createDashboardNoteElement(id, note);
          pinnedNotesContainer.appendChild(noteElement);
        });
      } else {
        pinnedNotesContainer.innerHTML = '<p class="empty-state">No pinned notes</p>';
      }
    } else {
      pinnedNotesContainer.innerHTML = '<p class="empty-state">No notes yet</p>';
    }
  });
}

/**
 * Create dashboard note element
 */
function createDashboardNoteElement(id, note) {
  const noteDiv = document.createElement('div');
  noteDiv.className = 'dashboard-note-item';
  
  const content = note.isPrivate ? 
    '🔒 Private note' : 
    (note.content.length > 80 ? note.content.substring(0, 80) + '...' : note.content);
  
  noteDiv.innerHTML = `
    <div class="note-header">
      <h4>${note.title}</h4>
      <span class="note-category">${note.category}</span>
    </div>
    <p class="note-preview">${content}</p>
    <div class="note-actions">
      <button onclick="openNoteForEdit('${id}')" class="btn-small">View</button>
    </div>
  `;
  
  return noteDiv;
}

/**
 * Update pinned tasks display
 */
function updatePinnedTasks() {
  const user = getCurrentUser();
  if (!user) return;
  
  const listsRef = ref(db, `users/${user.uid}/lists`);
  
  get(listsRef).then((snapshot) => {
    const pinnedTasksContainer = document.getElementById('pinned-tasks');
    if (!pinnedTasksContainer) return;
    
    pinnedTasksContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const lists = snapshot.val();
      const pinnedLists = Object.entries(lists)
        .filter(([_, list]) => list.isPinned)
        .slice(0, 2); // Show max 2 pinned lists
      
      if (pinnedLists.length > 0) {
        pinnedLists.forEach(([listId, list]) => {
          const listElement = createDashboardListElement(listId, list);
          pinnedTasksContainer.appendChild(listElement);
        });
      } else {
        pinnedTasksContainer.innerHTML = '<p class="empty-state">No pinned lists</p>';
      }
    } else {
      pinnedTasksContainer.innerHTML = '<p class="empty-state">No lists yet</p>';
    }
  });
}

/**
 * Create dashboard list element
 */
function createDashboardListElement(listId, list) {
  const listDiv = document.createElement('div');
  listDiv.className = 'dashboard-list-item';
  
  listDiv.innerHTML = `
    <div class="list-header">
      <h4>${list.name}</h4>
      <span class="list-category">${list.category}</span>
    </div>
    <div class="list-stats">
      <span class="item-count">${list.itemCount || 0} items</span>
    </div>
    <div class="list-actions">
      <button onclick="switchToListsTab('${listId}')" class="btn-small">View</button>
    </div>
  `;
  
  return listDiv;
}

/**
 * Switch to lists tab and highlight specific list
 */
export function switchToListsTab(listId) {
  // Switch to lists tab
  const listsTab = document.querySelector('[data-tab="lists"]');
  if (listsTab) {
    listsTab.click();
  }
  
  // Highlight the specific list after a short delay
  setTimeout(() => {
    const listElement = document.querySelector(`[data-list-id="${listId}"]`);
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      listElement.classList.add('highlight');
      
      // Remove highlight after 2 seconds
      setTimeout(() => {
        listElement.classList.remove('highlight');
      }, 2000);
    }
  }, 300);
}

/**
 * Update urgent tasks section
 */
function updateUrgentTasks() {
  const user = getCurrentUser();
  if (!user) return;
  
  const urgentTasksContainer = document.getElementById('urgent-tasks');
  if (!urgentTasksContainer) return;
  
  // Get all lists and their items
  const listsRef = ref(db, `users/${user.uid}/lists`);
  
  get(listsRef).then((snapshot) => {
    urgentTasksContainer.innerHTML = '';
    
    if (!snapshot.exists()) {
      urgentTasksContainer.innerHTML = '<p class="empty-state">No tasks yet</p>';
      return;
    }
    
    const lists = snapshot.val();
    const allTasks = [];
    
    // Collect all incomplete tasks
    Object.entries(lists).forEach(([listId, list]) => {
      if (list.items) {
        Object.entries(list.items).forEach(([taskId, task]) => {
          if (!task.done) {
            allTasks.push({
              id: taskId,
              listId,
              listName: list.name,
              text: task.text,
              createdAt: task.createdAt,
              isPinned: task.isPinned || false
            });
          }
        });
      }
    });
    
    // Sort by creation date (oldest first) and pinned status
    allTasks.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.createdAt - b.createdAt;
    });
    
    // Show max 5 urgent tasks
    const urgentTasks = allTasks.slice(0, 5);
    
    if (urgentTasks.length === 0) {
      urgentTasksContainer.innerHTML = '<p class="empty-state">No pending tasks! 🎉</p>';
      return;
    }
    
    urgentTasks.forEach(task => {
      const taskElement = createUrgentTaskElement(task);
      urgentTasksContainer.appendChild(taskElement);
    });
  });
}

/**
 * Create urgent task element
 */
function createUrgentTaskElement(task) {
  const taskDiv = document.createElement('div');
  taskDiv.className = `urgent-task-item ${task.isPinned ? 'pinned' : ''}`;
  
  const daysOld = Math.floor((Date.now() - task.createdAt) / (1000 * 60 * 60 * 24));
  
  taskDiv.innerHTML = `
    <div class="task-content">
      <div class="task-text">${task.text}</div>
      <div class="task-meta">
        <span class="task-list">${task.listName}</span>
        <span class="task-age">${daysOld} days old</span>
      </div>
    </div>
    <div class="task-actions">
      <button onclick="togglePinUrgentTask('${task.listId}', '${task.id}')" 
              class="pin-btn ${task.isPinned ? 'pinned' : ''}" 
              title="${task.isPinned ? 'Unpin' : 'Pin'}">
        📌
      </button>
      <button onclick="markUrgentTaskDone('${task.listId}', '${task.id}')" 
              class="complete-btn" 
              title="Mark as done">
        ✓
      </button>
    </div>
  `;
  
  return taskDiv;
}

/**
 * Toggle pin status of urgent task
 */
export function togglePinUrgentTask(listId, taskId) {
  const user = getCurrentUser();
  if (!user) return;
  
  const taskRef = ref(db, `users/${user.uid}/lists/${listId}/items/${taskId}`);
  
  get(taskRef).then((snapshot) => {
    if (snapshot.exists()) {
      const task = snapshot.val();
      const newPinnedStatus = !task.isPinned;
      
      update(taskRef, {
        isPinned: newPinnedStatus,
        updatedAt: Date.now()
      }).then(() => {
        updateUrgentTasks(); // Refresh the display
      });
    }
  });
}

/**
 * Mark urgent task as done
 */
export function markUrgentTaskDone(listId, taskId) {
  const user = getCurrentUser();
  if (!user) return;
  
  const taskRef = ref(db, `users/${user.uid}/lists/${listId}/items/${taskId}`);
  
  update(taskRef, {
    done: true,
    completedAt: Date.now(),
    updatedAt: Date.now()
  }).then(() => {
    updateUrgentTasks(); // Refresh the display
    
    // Award XP if gamification is available
    if (typeof awardTaskCompletionXP === 'function') {
      awardTaskCompletionXP();
    }
  });
}

/**
 * Update overview section
 */
export async function updateOverview() {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    // Get all data
    const [listsSnapshot, notesSnapshot, eventsSnapshot, progressSnapshot] = await Promise.all([
      get(ref(db, `users/${user.uid}/lists`)),
      get(ref(db, `users/${user.uid}/notes`)),
      get(ref(db, `users/${user.uid}/events`)),
      get(ref(db, `users/${user.uid}/progress`))
    ]);
    
    // Calculate stats
    let totalLists = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    
    if (listsSnapshot.exists()) {
      const lists = listsSnapshot.val();
      totalLists = Object.keys(lists).length;
      
      Object.values(lists).forEach(list => {
        if (list.items) {
          const items = Object.values(list.items);
          totalTasks += items.length;
          completedTasks += items.filter(item => item.done).length;
        }
      });
    }
    
    const totalNotes = notesSnapshot.exists() ? Object.keys(notesSnapshot.val()).length : 0;
    const totalEvents = eventsSnapshot.exists() ? Object.keys(eventsSnapshot.val()).length : 0;
    
    const progress = progressSnapshot.exists() ? progressSnapshot.val() : {};
    const userLevel = progress.level || 1;
    const userXP = progress.xp || 0;
    const currentStreak = progress.streak || 0;
    
    // Update overview cards
    updateOverviewCard('total-lists', totalLists);
    updateOverviewCard('total-tasks', totalTasks);
    updateOverviewCard('completed-tasks', completedTasks);
    updateOverviewCard('total-notes', totalNotes);
    updateOverviewCard('total-events', totalEvents);
    updateOverviewCard('user-level-overview', userLevel);
    updateOverviewCard('user-xp-overview', userXP);
    updateOverviewCard('current-streak-overview', currentStreak);
    
    // Update completion percentage
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    updateOverviewCard('completion-percentage', completionPercentage + '%');
    
    // Update progress bar
    const progressBar = document.getElementById('overview-progress-bar');
    if (progressBar) {
      progressBar.style.width = completionPercentage + '%';
    }
    
  } catch (error) {
    console.error('Error updating overview:', error);
  }
}

/**
 * Update overview card
 */
function updateOverviewCard(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    if (typeof value === 'number' && value !== parseInt(element.textContent)) {
      // Animate number change
      animateNumberChange(element, value);
    } else {
      element.textContent = value;
    }
  }
}

/**
 * Animate number change in element
 */
function animateNumberChange(element, targetValue) {
  const startValue = parseInt(element.textContent) || 0;
  const duration = 800;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Generate activity calendar
 */
export async function generateActivityCalendar() {
  const user = getCurrentUser();
  if (!user) return;
  
  const calendarContainer = document.getElementById('activity-calendar');
  if (!calendarContainer) return;
  
  try {
    const activityData = await getUserActivityData();
    
    // Generate calendar for last 365 days
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    
    calendarContainer.innerHTML = '';
    
    // Create calendar grid
    const calendarGrid = document.createElement('div');
    calendarGrid.className = 'activity-calendar-grid';
    
    for (let i = 0; i < 365; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayElement = document.createElement('div');
      dayElement.className = 'activity-day';
      dayElement.title = `${dateStr}: ${getActivityDescription(getActivityLevelForDate(dateStr, activityData))}`;
      
      const activityLevel = getActivityLevelForDate(dateStr, activityData);
      dayElement.classList.add(`activity-level-${activityLevel}`);
      
      calendarGrid.appendChild(dayElement);
    }
    
    calendarContainer.appendChild(calendarGrid);
    
    // Update activity stats
    const totalDays = Object.keys(activityData).length;
    const maxStreak = calculateMaxStreak(activityData);
    const avgActivity = calculateAverageActivity(activityData);
    
    updateActivityStats(totalDays, maxStreak, avgActivity);
    
  } catch (error) {
    console.error('Error generating activity calendar:', error);
  }
}

/**
 * Get user activity data
 */
export async function getUserActivityData() {
  const user = getCurrentUser();
  if (!user) return {};
  
  try {
    const [listsSnapshot, notesSnapshot, eventsSnapshot] = await Promise.all([
      get(ref(db, `users/${user.uid}/lists`)),
      get(ref(db, `users/${user.uid}/notes`)),
      get(ref(db, `users/${user.uid}/events`))
    ]);
    
    const activityData = {};
    
    // Process completed tasks
    if (listsSnapshot.exists()) {
      const lists = listsSnapshot.val();
      Object.values(lists).forEach(list => {
        if (list.items) {
          Object.values(list.items).forEach(item => {
            if (item.done && item.completedAt) {
              const date = new Date(item.completedAt).toISOString().split('T')[0];
              activityData[date] = (activityData[date] || 0) + 1;
            }
          });
        }
      });
    }
    
    // Process created notes
    if (notesSnapshot.exists()) {
      const notes = notesSnapshot.val();
      Object.values(notes).forEach(note => {
        if (note.createdAt) {
          const date = new Date(note.createdAt).toISOString().split('T')[0];
          activityData[date] = (activityData[date] || 0) + 0.5; // Notes count less than tasks
        }
      });
    }
    
    // Process created events
    if (eventsSnapshot.exists()) {
      const events = eventsSnapshot.val();
      Object.values(events).forEach(event => {
        if (event.createdAt) {
          const date = new Date(event.createdAt).toISOString().split('T')[0];
          activityData[date] = (activityData[date] || 0) + 0.5; // Events count less than tasks
        }
      });
    }
    
    return activityData;
    
  } catch (error) {
    console.error('Error getting user activity data:', error);
    return {};
  }
}

/**
 * Get activity level for specific date
 */
function getActivityLevelForDate(dateStr, activityData) {
  const activity = activityData[dateStr] || 0;
  
  if (activity === 0) return 0;
  if (activity < 2) return 1;
  if (activity < 4) return 2;
  if (activity < 6) return 3;
  return 4;
}

/**
 * Get activity description
 */
function getActivityDescription(level) {
  const descriptions = [
    'No activity',
    'Low activity',
    'Moderate activity',
    'High activity',
    'Very high activity'
  ];
  return descriptions[level] || descriptions[0];
}

/**
 * Update activity stats
 */
function updateActivityStats(totalDays, maxStreak, avgActivity) {
  const totalDaysEl = document.getElementById('activity-total-days');
  const maxStreakEl = document.getElementById('activity-max-streak');
  const avgActivityEl = document.getElementById('activity-average');
  
  if (totalDaysEl) totalDaysEl.textContent = totalDays;
  if (maxStreakEl) maxStreakEl.textContent = maxStreak + ' days';
  if (avgActivityEl) avgActivityEl.textContent = avgActivity.toFixed(1) + ' per day';
}

/**
 * Calculate maximum activity streak
 */
function calculateMaxStreak(activityData) {
  const dates = Object.keys(activityData).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || isConsecutiveDay(dates[i-1], dates[i])) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(maxStreak, currentStreak);
}

/**
 * Calculate average activity
 */
function calculateAverageActivity(activityData) {
  const activities = Object.values(activityData);
  if (activities.length === 0) return 0;
  
  const total = activities.reduce((sum, activity) => sum + activity, 0);
  return total / activities.length;
}

/**
 * Check if two dates are consecutive
 */
function isConsecutiveDay(date1Str, date2Str) {
  const date1 = new Date(date1Str);
  const date2 = new Date(date2Str);
  const timeDiff = date2.getTime() - date1.getTime();
  const dayDiff = timeDiff / (1000 * 3600 * 24);
  return dayDiff === 1;
}

/**
 * Update productivity insights
 */
function updateProductivityInsights() {
  const user = getCurrentUser();
  if (!user) return;
  
  const insightsContainer = document.getElementById('productivity-insights');
  if (!insightsContainer) return;
  
  // Get progress data
  const progressRef = ref(db, `users/${user.uid}/progress`);
  
  get(progressRef).then((snapshot) => {
    const insights = [];
    
    if (snapshot.exists()) {
      const progress = snapshot.val();
      const currentStreak = progress.streak || 0;
      const totalTasks = progress.totalTasksCompleted || 0;
      const level = progress.level || 1;
      
      // Generate insights based on data
      if (currentStreak >= 7) {
        insights.push({
          type: 'success',
          message: `🔥 Amazing! You're on a ${currentStreak}-day streak!`
        });
      } else if (currentStreak >= 3) {
        insights.push({
          type: 'good',
          message: `📈 Keep it up! ${currentStreak} days in a row.`
        });
      } else {
        insights.push({
          type: 'tip',
          message: '💡 Try to complete tasks daily to build a streak!'
        });
      }
      
      if (totalTasks >= 100) {
        insights.push({
          type: 'achievement',
          message: `🏆 You've completed ${totalTasks} tasks! Impressive!`
        });
      } else if (totalTasks >= 50) {
        insights.push({
          type: 'progress',
          message: `⭐ ${totalTasks} tasks completed. You're doing great!`
        });
      }
      
      if (level >= 10) {
        insights.push({
          type: 'expert',
          message: `👑 Level ${level} - You're a productivity expert!`
        });
      } else if (level >= 5) {
        insights.push({
          type: 'intermediate',
          message: `🌟 Level ${level} - You're making excellent progress!`
        });
      }
    }
    
    // Default insights if no data
    if (insights.length === 0) {
      insights.push({
        type: 'welcome',
        message: '🎯 Welcome! Start completing tasks to see your productivity insights.'
      });
    }
    
    // Display insights
    insightsContainer.innerHTML = insights.map(insight => `
      <div class="insight-item ${insight.type}">
        <p>${insight.message}</p>
      </div>
    `).join('');
  });
}

/**
 * Open note for editing from dashboard
 */
export function openNoteForEdit(noteId) {
  // Switch to notes tab
  const notesTab = document.querySelector('[data-tab="notes"]');
  if (notesTab) {
    notesTab.click();
  }
  
  // Open the note for editing after a short delay
  setTimeout(() => {
    if (typeof editNote === 'function') {
      editNote(noteId);
    }
  }, 300);
}

// Make functions globally available
window.switchToListsTab = switchToListsTab;
window.togglePinUrgentTask = togglePinUrgentTask;
window.markUrgentTaskDone = markUrgentTaskDone;
window.openNoteForEdit = openNoteForEdit;

// Export main functions
export {
  updateDashboard,
  forceRefreshAllData,
  generateActivityCalendar,
  updateOverview,
  switchToListsTab,
  openNoteForEdit
}; 