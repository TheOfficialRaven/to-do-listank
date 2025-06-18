/* ===================================
   CALENDAR-MANAGER.JS - Calendar & Events Management
   =================================== */

import { db, ref, push, onValue, remove, set, get, update } from './firebase-config.js';
import { showNotification, getCurrentUser } from './app-core.js';

// Calendar state
let currentDate = new Date();
let selectedDate = null;
let events = {};

// DOM elements
let calendarContainer = null;
let eventModal = null;
let saveEventBtn = null;
let cancelEventBtn = null;

/**
 * Initialize calendar manager
 */
export function initializeCalendarManager() {
  console.log('📅 Initializing Calendar Manager...');
  
  // Get DOM elements
  calendarContainer = document.getElementById('calendar-container');
  eventModal = document.getElementById('event-modal');
  saveEventBtn = document.getElementById('save-event');
  cancelEventBtn = document.getElementById('cancel-event');
  
  // Set up event listeners
  setupCalendarEventListeners();
  
  // Initialize calendar
  initializeCalendar();
  
  // Load events
  loadEvents();
  
  console.log('✅ Calendar Manager initialized');
}

/**
 * Set up calendar event listeners
 */
function setupCalendarEventListeners() {
  const newEventBtn = document.getElementById('new-event-btn');
  const eventModalClose = document.getElementById('event-modal-close');
  
  if (newEventBtn) {
    newEventBtn.addEventListener('click', () => openEventModal());
  }
  
  if (saveEventBtn) {
    saveEventBtn.addEventListener('click', saveEvent);
  }
  
  if (cancelEventBtn) {
    cancelEventBtn.addEventListener('click', closeEventModal);
  }
  
  if (eventModalClose) {
    eventModalClose.addEventListener('click', closeEventModal);
  }
}

/**
 * Initialize calendar
 */
export function initializeCalendar() {
  if (calendarContainer) {
    renderCalendar();
  }
}

/**
 * Render calendar for current month
 */
export function renderCalendar() {
  if (!calendarContainer) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Create calendar header
  const header = document.createElement('div');
  header.className = 'calendar-header';
  header.innerHTML = `
    <button id="prev-month" class="calendar-nav-btn">‹</button>
    <h3 id="calendar-title">${new Date(year, month).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}</h3>
    <button id="next-month" class="calendar-nav-btn">›</button>
  `;
  
  // Create calendar grid
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  
  // Days of week header
  const daysOfWeek = ['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'];
  daysOfWeek.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day empty';
    grid.appendChild(emptyDay);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = day;
    
    const dateString = formatDateToString(new Date(year, month, day));
    dayElement.dataset.date = dateString;
    
    // Check if it's today
    if (isToday(new Date(year, month, day))) {
      dayElement.classList.add('today');
    }
    
    // Check if there are events on this day
    if (events[dateString] && events[dateString].length > 0) {
      dayElement.classList.add('has-events');
      
      // Add event indicators
      const eventIndicator = document.createElement('div');
      eventIndicator.className = 'event-indicator';
      eventIndicator.textContent = events[dateString].length;
      dayElement.appendChild(eventIndicator);
    }
    
    // Add click event
    dayElement.addEventListener('click', () => {
      // Remove previous selection
      document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected'));
      
      // Select this day
      dayElement.classList.add('selected');
      selectedDate = new Date(year, month, day);
      
      // Show events for this day or allow creating new event
      if (events[dateString] && events[dateString].length > 0) {
        showDayEventsModal(events[dateString], dateString);
      } else {
        openEventModal(selectedDate);
      }
    });
    
    grid.appendChild(dayElement);
  }
  
  // Clear container and add new calendar
  calendarContainer.innerHTML = '';
  calendarContainer.appendChild(header);
  calendarContainer.appendChild(grid);
  
  // Add navigation event listeners
  document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

/**
 * Check if date is today
 */
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Format date to string (YYYY-MM-DD)
 */
function formatDateToString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Open event modal
 */
export function openEventModal(selectedDate = null, showExistingEvents = false) {
  if (!eventModal) return;
  
  clearEventModal();
  
  if (selectedDate) {
    const dateInput = document.getElementById('event-date');
    if (dateInput) {
      dateInput.value = formatDateToString(selectedDate);
    }
  }
  
  eventModal.style.display = 'flex';
  
  // Focus on title input
  const titleInput = document.getElementById('event-title');
  if (titleInput) {
    titleInput.focus();
  }
}

/**
 * Show events for a specific day
 */
function showDayEventsModal(dayEvents, dateStr) {
  const modal = document.createElement('div');
  modal.className = 'modal day-events-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Events for ${new Date(dateStr).toLocaleDateString('hu-HU')}</h3>
        <button class="close-btn" id="close-day-events">×</button>
      </div>
      <div class="events-list">
        ${dayEvents.map(event => `
          <div class="event-item">
            <div class="event-info">
              <h4>${event.title}</h4>
              <p>${event.description || ''}</p>
              <div class="event-meta">
                <span class="event-time">${event.time}</span>
                <span class="event-type">${event.type}</span>
              </div>
            </div>
            <div class="event-actions">
              <button onclick="editEvent('${event.id}')" title="Edit">✏️</button>
              <button onclick="deleteEvent('${event.id}')" title="Delete">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button id="add-new-event">Add New Event</button>
        <button id="close-events-modal">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Event listeners
  modal.querySelector('#close-day-events').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#close-events-modal').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  modal.querySelector('#add-new-event').addEventListener('click', () => {
    document.body.removeChild(modal);
    openEventModal(new Date(dateStr));
  });
}

/**
 * Delete event
 */
export function deleteEvent(eventId) {
  const user = getCurrentUser();
  if (!user) return;

  // Show confirmation modal
  const modal = document.createElement('div');
  modal.className = 'modal confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Delete Event</h3>
      <p>Are you sure you want to delete this event?</p>
      <div class="modal-actions">
        <button id="confirm-delete-event" class="danger-btn">Delete</button>
        <button id="cancel-delete-event">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  modal.querySelector('#confirm-delete-event').addEventListener('click', async () => {
    try {
      const eventRef = ref(db, `users/${user.uid}/events/${eventId}`);
      await remove(eventRef);
      
      showNotification('✅ Event deleted successfully', 'success');
      document.body.removeChild(modal);
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('❌ Failed to delete event', 'error');
    }
  });
  
  modal.querySelector('#cancel-delete-event').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

/**
 * Close event modal
 */
export function closeEventModal() {
  if (eventModal) {
    eventModal.style.display = 'none';
  }
  clearEventModal();
}

/**
 * Clear event modal inputs
 */
function clearEventModal() {
  const titleInput = document.getElementById('event-title');
  const descriptionInput = document.getElementById('event-description');
  const dateInput = document.getElementById('event-date');
  const timeInput = document.getElementById('event-time');
  const typeSelect = document.getElementById('event-type');
  const notificationCheckbox = document.getElementById('event-notification');
  
  if (titleInput) titleInput.value = '';
  if (descriptionInput) descriptionInput.value = '';
  if (dateInput) dateInput.value = '';
  if (timeInput) timeInput.value = '';
  if (typeSelect) typeSelect.value = 'meeting';
  if (notificationCheckbox) notificationCheckbox.checked = false;
}

/**
 * Save event to Firebase
 */
export function saveEvent() {
  const user = getCurrentUser();
  if (!user) {
    showNotification('❌ You must be logged in to save events', 'error');
    return;
  }
  
  const titleInput = document.getElementById('event-title');
  const descriptionInput = document.getElementById('event-description');
  const dateInput = document.getElementById('event-date');
  const timeInput = document.getElementById('event-time');
  const typeSelect = document.getElementById('event-type');
  const notificationCheckbox = document.getElementById('event-notification');
  
  const title = titleInput?.value?.trim();
  const description = descriptionInput?.value?.trim();
  const date = dateInput?.value;
  const time = timeInput?.value;
  const type = typeSelect?.value || 'meeting';
  const hasNotification = notificationCheckbox?.checked || false;
  
  if (!title) {
    showNotification('❌ Please enter a title', 'error');
    return;
  }
  
  if (!date) {
    showNotification('❌ Please select a date', 'error');
    return;
  }
  
  if (!time) {
    showNotification('❌ Please select a time', 'error');
    return;
  }
  
  try {
    const eventData = {
      title,
      description,
      date,
      time,
      type,
      hasNotification,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const eventsRef = ref(db, `users/${user.uid}/events`);
    push(eventsRef, eventData).then(() => {
      showNotification('✅ Event saved successfully!', 'success');
      closeEventModal();
      
      // Schedule notification if requested
      if (hasNotification) {
        scheduleNotification(eventData);
      }
    });
    
  } catch (error) {
    console.error('Error saving event:', error);
    showNotification('❌ Failed to save event', 'error');
  }
}

/**
 * Load events from Firebase
 */
export function loadEvents() {
  const user = getCurrentUser();
  if (!user) return;
  
  const eventsRef = ref(db, `users/${user.uid}/events`);
  
  onValue(eventsRef, (snapshot) => {
    events = {};
    
    if (snapshot.exists()) {
      const eventsData = snapshot.val();
      
      // Group events by date
      Object.entries(eventsData).forEach(([id, eventData]) => {
        const date = eventData.date;
        if (!events[date]) {
          events[date] = [];
        }
        events[date].push({
          id,
          ...eventData
        });
      });
      
      // Sort events by time within each date
      Object.keys(events).forEach(date => {
        events[date].sort((a, b) => a.time.localeCompare(b.time));
      });
    }
    
    // Update calendar display
    updateCalendarWithEvents(events);
    
    // Update today's events
    updateTodayEvents();
    
    // Update upcoming events
    loadUpcomingEvents();
  });
}

/**
 * Update calendar with events
 */
function updateCalendarWithEvents(events) {
  // Re-render calendar to show event indicators
  renderCalendar();
}

/**
 * Update today's events display
 */
function updateTodayEvents() {
  const todayStr = formatDateToString(new Date());
  const todayEvents = events[todayStr] || [];
  
  const todayEventsContainer = document.getElementById('today-events');
  if (!todayEventsContainer) return;
  
  if (todayEvents.length === 0) {
    todayEventsContainer.innerHTML = '<p class="empty-state">No events today</p>';
    return;
  }
  
  todayEventsContainer.innerHTML = todayEvents.map(event => `
    <div class="today-event-item">
      <div class="event-time">${event.time}</div>
      <div class="event-details">
        <h4>${event.title}</h4>
        <p>${event.description || ''}</p>
        <span class="event-type-badge ${event.type}">${event.type}</span>
      </div>
    </div>
  `).join('');
}

/**
 * Load upcoming events (next 7 days)
 */
function loadUpcomingEvents() {
  const upcomingEventsContainer = document.getElementById('upcoming-events');
  if (!upcomingEventsContainer) return;
  
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingEvents = [];
  
  // Collect events from next 7 days
  for (let d = new Date(now); d <= nextWeek; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToString(d);
    if (events[dateStr]) {
      events[dateStr].forEach(event => {
        upcomingEvents.push({
          ...event,
          dateStr,
          dateObj: new Date(d)
        });
      });
    }
  }
  
  // Sort by date and time
  upcomingEvents.sort((a, b) => {
    const dateCompare = a.dateObj - b.dateObj;
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });
  
  if (upcomingEvents.length === 0) {
    upcomingEventsContainer.innerHTML = '<p class="empty-state">No upcoming events</p>';
    return;
  }
  
  upcomingEventsContainer.innerHTML = upcomingEvents.slice(0, 5).map(event => `
    <div class="upcoming-event-item">
      <div class="event-date">
        ${event.dateObj.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })}
      </div>
      <div class="event-details">
        <h4>${event.title}</h4>
        <div class="event-meta">
          <span class="event-time">${event.time}</span>
          <span class="event-type-badge ${event.type}">${event.type}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Schedule notification for event
 */
function scheduleNotification(eventData) {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }
  
  // Request permission if not already granted
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        scheduleNotificationInternal(eventData);
      }
    });
  } else if (Notification.permission === 'granted') {
    scheduleNotificationInternal(eventData);
  }
}

/**
 * Internal function to schedule notification
 */
function scheduleNotificationInternal(eventData) {
  const eventDateTime = new Date(`${eventData.date}T${eventData.time}`);
  const now = new Date();
  const timeDiff = eventDateTime.getTime() - now.getTime();
  
  // Schedule for 10 minutes before the event
  const notificationTime = timeDiff - (10 * 60 * 1000); // 10 minutes before
  
  if (notificationTime > 0) {
    setTimeout(() => {
      showEventNotification(eventData);
    }, notificationTime);
    
    console.log(`Notification scheduled for ${eventData.title} at ${new Date(now.getTime() + notificationTime)}`);
  }
}

/**
 * Show event notification
 */
function showEventNotification(eventData) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(`Upcoming: ${eventData.title}`, {
      body: `Starting in 10 minutes at ${eventData.time}`,
      icon: '/android-chrome-192x192.png',
      badge: '/android-chrome-192x192.png',
      tag: `event-${eventData.id}`,
      requireInteraction: true
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
      
      // Switch to calendar tab
      const calendarTab = document.querySelector('[data-tab="calendar"]');
      if (calendarTab) {
        calendarTab.click();
      }
    };
    
    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  }
}

/**
 * Get event type icon
 */
export function getEventTypeIcon(type) {
  const icons = {
    meeting: '👥',
    appointment: '📅',
    reminder: '⏰',
    task: '✅',
    birthday: '🎂',
    holiday: '🎉',
    other: '📝'
  };
  return icons[type] || icons.other;
}

// Make global functions available
window.deleteEvent = deleteEvent;
window.openEventModal = openEventModal; 