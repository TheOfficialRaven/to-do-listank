// Calendar Management
import {
  db,
  ref,
  push,
  onValue,
  remove,
  set,
  get,
  query,
  orderByChild,
  update
} from './firebase.js';
import { getCurrentUser } from './auth.js';

// Initialize calendar
export function initializeCalendar() {
  renderCalendar();
  loadEvents();
}

// Render calendar
export function renderCalendar() {
  const calendar = document.querySelector('.calendar');
  if (!calendar) return;
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get first day of month
  const firstDay = new Date(currentYear, currentMonth, 1);
  // Get last day of month
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // Clear calendar
  calendar.innerHTML = '';
  
  // Add month header
  const monthHeader = document.createElement('div');
  monthHeader.className = 'calendar-header';
  monthHeader.innerHTML = `
    <button class="btn-icon prev-month" title="Előző hónap">
      <span class="material-icons">chevron_left</span>
    </button>
    <h2>${firstDay.toLocaleString('hu', { month: 'long', year: 'numeric' })}</h2>
    <button class="btn-icon next-month" title="Következő hónap">
      <span class="material-icons">chevron_right</span>
    </button>
  `;
  calendar.appendChild(monthHeader);
  
  // Add weekday headers
  const weekdays = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];
  const weekdayHeader = document.createElement('div');
  weekdayHeader.className = 'calendar-weekdays';
  weekdays.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'weekday';
    dayElement.textContent = day;
    weekdayHeader.appendChild(dayElement);
  });
  calendar.appendChild(weekdayHeader);
  
  // Add days
  const daysGrid = document.createElement('div');
  daysGrid.className = 'calendar-days';
  
  // Add empty cells for days before first day of month
  for (let i = 0; i < firstDay.getDay(); i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendar-day empty';
    daysGrid.appendChild(emptyCell);
  }
  
  // Add days of month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.dataset.date = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isToday(new Date(currentYear, currentMonth, day))) {
      dayElement.classList.add('today');
    }
    
    dayElement.innerHTML = `
      <span class="day-number">${day}</span>
      <div class="day-events"></div>
    `;
    
    // Add click event
    dayElement.addEventListener('click', () => {
      openEventModal(dayElement.dataset.date);
    });
    
    daysGrid.appendChild(dayElement);
  }
  
  calendar.appendChild(daysGrid);
  
  // Add event listeners for month navigation
  const prevMonthBtn = calendar.querySelector('.prev-month');
  const nextMonthBtn = calendar.querySelector('.next-month');
  
  prevMonthBtn?.addEventListener('click', () => {
    today.setMonth(today.getMonth() - 1);
    renderCalendar();
  });
  
  nextMonthBtn?.addEventListener('click', () => {
    today.setMonth(today.getMonth() + 1);
    renderCalendar();
  });
}

// Check if date is today
function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

// Format date to string
function formatDateToString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Open event modal
export function openEventModal(selectedDate = null, showExistingEvents = false) {
  const modal = document.getElementById('event-modal');
  if (!modal) return;
  
  modal.style.display = 'block';
  
  if (selectedDate) {
    document.getElementById('event-date').value = selectedDate;
  }
  
  if (showExistingEvents) {
    const date = selectedDate || document.getElementById('event-date').value;
    const eventsRef = ref(db, `users/${getCurrentUser().uid}/events`);
    const eventsQuery = query(eventsRef, orderByChild('date'));
    
    get(eventsQuery).then((snapshot) => {
      const events = [];
      snapshot.forEach((childSnapshot) => {
        const event = childSnapshot.val();
        if (event.date === date) {
          events.push({
            id: childSnapshot.key,
            ...event
          });
        }
      });
      
      if (events.length > 0) {
        showDayEventsModal(events, date);
      }
    });
  }
}

// Show day events modal
export function showDayEventsModal(events, dateStr) {
  const modal = document.getElementById('day-events-modal');
  if (!modal) return;
  
  const eventsList = modal.querySelector('.day-events-list');
  eventsList.innerHTML = '';
  
  events.forEach(event => {
    const eventElement = document.createElement('div');
    eventElement.className = 'day-event';
    eventElement.innerHTML = `
      <div class="event-time">${event.time}</div>
      <div class="event-title">${event.title}</div>
      <div class="event-actions">
        <button class="btn-icon edit-event" title="Szerkesztés">
          <span class="material-icons">edit</span>
        </button>
        <button class="btn-icon delete-event" title="Törlés">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;
    
    // Add event listeners
    const editButton = eventElement.querySelector('.edit-event');
    const deleteButton = eventElement.querySelector('.delete-event');
    
    editButton?.addEventListener('click', () => {
      closeEventModal();
      openEventModal(dateStr);
      // TODO: Load event data into form
    });
    
    deleteButton?.addEventListener('click', () => {
      deleteEvent(event.id);
    });
    
    eventsList.appendChild(eventElement);
  });
  
  modal.style.display = 'block';
}

// Delete event
export async function deleteEvent(eventId) {
  const user = getCurrentUser();
  if (!user) return;
  
  try {
    await remove(ref(db, `users/${user.uid}/events/${eventId}`));
    showNotification('✅ Esemény sikeresen törölve!');
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    showNotification('❌ Hiba történt a törlés során!');
  }
}

// Close event modal
export function closeEventModal() {
  const modal = document.getElementById('event-modal');
  if (!modal) return;
  
  modal.style.display = 'none';
  clearEventModal();
}

// Clear event modal
export function clearEventModal() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-time').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-type').value = 'personal';
}

// Save event
export async function saveEvent() {
  const user = getCurrentUser();
  if (!user) return;
  
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const description = document.getElementById('event-description').value.trim();
  const type = document.getElementById('event-type').value;
  
  if (!title || !date || !time) {
    showNotification('❌ A cím, dátum és idő megadása kötelező!');
    return;
  }
  
  try {
    const eventData = {
      title,
      date,
      time,
      description,
      type,
      createdAt: Date.now()
    };
    
    await push(ref(db, `users/${user.uid}/events`), eventData);
    
    closeEventModal();
    showNotification('✅ Esemény sikeresen mentve!');
  } catch (error) {
    console.error('❌ Error saving event:', error);
    showNotification('❌ Hiba történt a mentés során!');
  }
}

// Load events
export function loadEvents() {
  const user = getCurrentUser();
  if (!user) return;
  
  const eventsRef = ref(db, `users/${user.uid}/events`);
  const eventsQuery = query(eventsRef, orderByChild('date'));
  
  onValue(eventsQuery, (snapshot) => {
    const events = [];
    snapshot.forEach((childSnapshot) => {
      events.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    updateCalendarWithEvents(events);
  });
}

// Update calendar with events
function updateCalendarWithEvents(events) {
  const days = document.querySelectorAll('.calendar-day:not(.empty)');
  
  days.forEach(day => {
    const date = day.dataset.date;
    const dayEvents = events.filter(event => event.date === date);
    
    const eventsContainer = day.querySelector('.day-events');
    eventsContainer.innerHTML = '';
    
    dayEvents.forEach(event => {
      const eventDot = document.createElement('div');
      eventDot.className = `event-dot ${event.type}`;
      eventDot.title = event.title;
      eventsContainer.appendChild(eventDot);
    });
  });
}

// Update today events
export function updateTodayEvents() {
  const user = getCurrentUser();
  if (!user) return;
  
  const today = formatDateToString(new Date());
  const eventsRef = ref(db, `users/${user.uid}/events`);
  const eventsQuery = query(eventsRef, orderByChild('date'));
  
  get(eventsQuery).then((snapshot) => {
    const events = [];
    snapshot.forEach((childSnapshot) => {
      const event = childSnapshot.val();
      if (event.date === today) {
        events.push({
          id: childSnapshot.key,
          ...event
        });
      }
    });
    
    // Sort events by time
    events.sort((a, b) => a.time.localeCompare(b.time));
    
    // Update today events container
    const container = document.querySelector('.today-events');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (events.length === 0) {
      container.innerHTML = '<p class="no-events">Nincsenek események ma</p>';
      return;
    }
    
    events.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'today-event';
      eventElement.innerHTML = `
        <div class="event-time">${event.time}</div>
        <div class="event-title">${event.title}</div>
        <div class="event-type">${event.type}</div>
      `;
      container.appendChild(eventElement);
    });
  });
}

// Make calendar functions globally available
window.initializeCalendar = initializeCalendar;
window.renderCalendar = renderCalendar;
window.openEventModal = openEventModal;
window.showDayEventsModal = showDayEventsModal;
window.deleteEvent = deleteEvent;
window.closeEventModal = closeEventModal;
window.clearEventModal = clearEventModal;
window.saveEvent = saveEvent;
window.loadEvents = loadEvents;
window.updateTodayEvents = updateTodayEvents; 