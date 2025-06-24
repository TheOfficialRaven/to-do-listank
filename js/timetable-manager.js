/**
 * Timetable Manager - Student Weekly Schedule Management
 * Only visible and functional for users with "student" target group
 * 
 * Features:
 * - Add/Edit/Delete class entries
 * - Weekly table view and list view
 * - Firebase Realtime Database integration
 * - Responsive design
 * - Input validation
 * - Context-aware quest integration ready
 */

class TimetableManager {
  constructor() {
    this.timetableEntries = [];
    this.currentEditId = null;
    this.currentView = 'table'; // 'table' or 'list'
    this.isStudentUser = false;
    
    // Day mappings
    this.dayNames = {
      monday: 'Hétfő',
      tuesday: 'Kedd', 
      wednesday: 'Szerda',
      thursday: 'Csütörtök',
      friday: 'Péntek',
      saturday: 'Szombat',
      sunday: 'Vasárnap'
    };
    
    this.timeSlots = [
      '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
      '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
      '19:00', '19:30', '20:00', '20:30', '21:00'
    ];
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  async init() {
    try {
      // Wait for Firebase and auth
      await this.waitForAuth();
      
      console.log('🗓️ Timetable Manager initialized');
      
      // Check if user is student
      this.checkStudentStatus();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load existing timetable data
      if (this.isStudentUser) {
        await this.loadTimetableData();
        this.renderTimetable();
      }
      
      // Manager globálisan elérhető
      window.timetableManager = this;
      console.log('✅ Timetable manager globálisan hozzáférhető');
      
    } catch (error) {
      console.error('❌ Error initializing Timetable Manager:', error);
    }
  }
  
  async waitForAuth() {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.firebase && firebase.auth && firebase.database) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }
  
  checkStudentStatus() {
    // Check if current target group is student
    const targetGroup = window.advancedTargetGroupSystem?.getCurrentTargetGroup();
    const bodyHasStudentClass = document.body.classList.contains('target-group-student');
    this.isStudentUser = targetGroup?.id === 'student' || bodyHasStudentClass;
    
    console.log(`👨‍🎓 Student status: ${this.isStudentUser} (targetGroup: ${targetGroup?.id}, bodyClass: ${bodyHasStudentClass})`);
    
    // Show/hide timetable elements based on student status
    this.updateVisibility();
  }
  
  updateVisibility() {
    const studentElements = document.querySelectorAll('.student-only');
    
    studentElements.forEach(element => {
      if (this.isStudentUser) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });
  }
  
  setupEventListeners() {
    // New timetable entry button
    const newEntryBtn = document.getElementById('new-timetable-entry-btn');
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', () => this.showTimetableForm());
    }
    
    // Form buttons
    const cancelFormBtn = document.getElementById('cancel-timetable-form');
    if (cancelFormBtn) {
      cancelFormBtn.addEventListener('click', () => this.hideTimetableForm());
    }
    
    const saveEntryBtn = document.getElementById('save-timetable-entry');
    if (saveEntryBtn) {
      saveEntryBtn.addEventListener('click', () => this.saveTimetableEntry());
    }
    
    const cancelEntryBtn = document.getElementById('cancel-timetable-entry');
    if (cancelEntryBtn) {
      cancelEntryBtn.addEventListener('click', () => this.hideTimetableForm());
    }
    
    // View toggle
    const viewToggleBtn = document.getElementById('timetable-view-toggle');
    if (viewToggleBtn) {
      viewToggleBtn.addEventListener('click', () => this.toggleView());
    }
    
    // Edit modal buttons
    const updateEntryBtn = document.getElementById('update-timetable-entry');
    if (updateEntryBtn) {
      updateEntryBtn.addEventListener('click', () => this.updateTimetableEntry());
    }
    
    const deleteEntryBtn = document.getElementById('delete-timetable-entry');
    if (deleteEntryBtn) {
      deleteEntryBtn.addEventListener('click', () => this.deleteTimetableEntry());
    }
    
    const cancelEditBtn = document.getElementById('cancel-timetable-edit');
    if (cancelEditBtn) {
      cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    }
    
    const editModalClose = document.getElementById('timetable-edit-modal-close');
    if (editModalClose) {
      editModalClose.addEventListener('click', () => this.closeEditModal());
    }
    
    // Time validation
    const startTimeInput = document.getElementById('timetable-start-time');
    const endTimeInput = document.getElementById('timetable-end-time');
    
    if (startTimeInput && endTimeInput) {
      startTimeInput.addEventListener('change', () => this.validateTimes());
      endTimeInput.addEventListener('change', () => this.validateTimes());
    }
    
    // Listen for target group changes
    document.addEventListener('targetGroupChanged', (event) => {
      this.checkStudentStatus();
      if (this.isStudentUser) {
        this.loadTimetableData();
      }
    });
  }
  
  showTimetableForm(skipClear = false) {
    const form = document.getElementById('timetable-form');
    if (form) {
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth' });
      if (!skipClear) {
        // Clear form only if not skipping
        this.clearForm();
      }
    }
  }
  
  hideTimetableForm() {
    const form = document.getElementById('timetable-form');
    if (form) {
      form.style.display = 'none';
      this.clearForm();
    }
  }
  
  clearForm() {
    const inputs = [
      'timetable-subject',
      'timetable-day', 
      'timetable-start-time',
      'timetable-end-time',
      'timetable-teacher',
      'timetable-classroom',
      'timetable-online-link'
    ];
    
    inputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = '';
      }
    });
  }
  
  validateTimes() {
    const startTime = document.getElementById('timetable-start-time')?.value;
    const endTime = document.getElementById('timetable-end-time')?.value;
    
    if (startTime && endTime) {
      if (startTime >= endTime) {
        document.getElementById('timetable-end-time').setCustomValidity('A befejezés időpontja a kezdés után kell legyen');
        return false;
      } else {
        document.getElementById('timetable-end-time').setCustomValidity('');
        return true;
      }
    }
    return true;
  }
  
  async saveTimetableEntry() {
    if (!this.isStudentUser || !firebase.auth().currentUser) {
      console.error('❌ Not authorized to save timetable');
      return;
    }
    
    // Get form data
    const subject = document.getElementById('timetable-subject')?.value.trim();
    const day = document.getElementById('timetable-day')?.value;
    const startTime = document.getElementById('timetable-start-time')?.value;
    const endTime = document.getElementById('timetable-end-time')?.value;
    const teacher = document.getElementById('timetable-teacher')?.value.trim();
    const classroom = document.getElementById('timetable-classroom')?.value.trim();
    const onlineLink = document.getElementById('timetable-online-link')?.value.trim();
    
    // Validation
    if (!subject || !day || !startTime || !endTime) {
      this.showNotification('Kérjük, töltse ki a kötelező mezőket!', 'error');
      return;
    }
    
    if (!this.validateTimes()) {
      this.showNotification('Hibás időpont beállítás!', 'error');
      return;
    }
    
    // Check for conflicts
    if (this.checkTimeConflict(day, startTime, endTime)) {
      this.showNotification('Ütközés: már van óra ebben az időpontban!', 'error');
      return;
    }
    
    try {
      const entryData = {
        subject,
        day,
        startTime,
        endTime,
        teacher: teacher || null,
        classroom: classroom || null,
        onlineLink: onlineLink || null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const timetableRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}/timetable`);
      const snapshot = await timetableRef.push(entryData);
      
      this.showNotification('✅ Óra sikeresen hozzáadva!', 'success');
      this.hideTimetableForm();
      await this.loadTimetableData();
      this.renderTimetable();
      
    } catch (error) {
      console.error('❌ Error saving timetable entry:', error);
      this.showNotification('Hiba történt az óra mentésekor', 'error');
    }
  }
  
  checkTimeConflict(day, startTime, endTime, excludeId = null) {
    return this.timetableEntries.some(entry => {
      if (excludeId && entry.id === excludeId) return false;
      if (entry.day !== day) return false;
      
      // Check for time overlap
      const newStart = this.timeToMinutes(startTime);
      const newEnd = this.timeToMinutes(endTime);
      const existingStart = this.timeToMinutes(entry.startTime);
      const existingEnd = this.timeToMinutes(entry.endTime);
      
      return (newStart < existingEnd && newEnd > existingStart);
    });
  }
  
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  async loadTimetableData() {
    if (!this.isStudentUser || !firebase.auth().currentUser) return;
    
    try {
      const timetableRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}/timetable`);
      const snapshot = await timetableRef.once('value');
      
      this.timetableEntries = [];
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          this.timetableEntries.push({
            id: key,
            ...data[key]
          });
        });
        
        // Sort by day and time
        this.timetableEntries.sort((a, b) => {
          const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
          if (dayDiff !== 0) return dayDiff;
          
          return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
        });
      }
      
      console.log(`📅 Loaded ${this.timetableEntries.length} timetable entries`);
      
      // FONTOS: Rendereljük az órarendet a betöltés után
      this.renderTimetable();
      
    } catch (error) {
      console.error('❌ Error loading timetable data:', error);
    }
  }
  
  renderTimetable() {
    if (!this.isStudentUser) return;
    
    console.log(`📅 Rendering timetable with ${this.timetableEntries.length} entries in ${this.currentView} view`);
    
    const isEmpty = this.timetableEntries.length === 0;
    const emptyState = document.getElementById('timetable-empty-state');
    const tableView = document.getElementById('timetable-table-view');
    const listView = document.getElementById('timetable-list-view');
    
    if (isEmpty) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableView) tableView.style.display = 'none';
      if (listView) listView.style.display = 'none';
      return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    if (this.currentView === 'table') {
      this.renderTableView();
      if (tableView) tableView.style.display = 'block';
      if (listView) listView.style.display = 'none';
    } else {
      this.renderListView();
      if (tableView) tableView.style.display = 'none';
      if (listView) listView.style.display = 'block';
    }
  }
  
  renderTableView() {
    const tableBody = document.getElementById('timetable-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Generate time slots
    const minTime = Math.min(...this.timetableEntries.map(e => this.timeToMinutes(e.startTime)));
    const maxTime = Math.max(...this.timetableEntries.map(e => this.timeToMinutes(e.endTime)));
    
    const startHour = Math.floor(minTime / 60) || 7;
    const endHour = Math.ceil(maxTime / 60) || 21;
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      const row = document.createElement('tr');
      
      // Time column
      const timeCell = document.createElement('td');
      timeCell.className = 'time-slot';
      timeCell.textContent = timeSlot;
      row.appendChild(timeCell);
      
      // Day columns
      Object.keys(this.dayNames).forEach(day => {
        const dayCell = document.createElement('td');
        dayCell.className = 'class-cell';
        
        // Find classes for this time slot and day
        const classesInSlot = this.timetableEntries.filter(entry => {
          const entryStart = this.timeToMinutes(entry.startTime);
          const entryEnd = this.timeToMinutes(entry.endTime);
          const slotTime = hour * 60;
          
          return entry.day === day && entryStart <= slotTime && entryEnd > slotTime;
        });
        
        if (classesInSlot.length > 0) {
          // Existing classes - make them clickable for editing
          classesInSlot.forEach(classEntry => {
            const classDiv = document.createElement('div');
            classDiv.className = 'class-entry';
            classDiv.onclick = (e) => {
              e.stopPropagation();
              this.openEditModal(classEntry);
            };
            
            classDiv.innerHTML = `
              <div class="class-subject">${classEntry.subject}</div>
              <div class="class-details">
                ${classEntry.teacher ? `<span class="class-teacher">${classEntry.teacher}</span>` : ''}
                ${classEntry.classroom ? `<span class="class-classroom">${classEntry.classroom}</span>` : ''}
              </div>
            `;
            
            dayCell.appendChild(classDiv);
          });
        } else {
          // Empty cell - make it clickable for adding new class
          dayCell.className = 'class-cell empty-cell';
          dayCell.onclick = () => this.addClassToCell(day, timeSlot);
          dayCell.innerHTML = '<div class="add-class-hint">+</div>';
        }
        
        row.appendChild(dayCell);
      });
      
      tableBody.appendChild(row);
    }
  }
  
  // Add new class by clicking on empty cell
  addClassToCell(day, timeSlot) {
    console.log(`➕ Adding class for ${day} at ${timeSlot}`);
    // Calculate end time (45 minutes later by default)
    const startTime = timeSlot;
    const endTime = this.calculateEndTime(timeSlot, 45);
    // Fill the form with pre-selected values
    document.getElementById('timetable-day').value = day;
    document.getElementById('timetable-start-time').value = startTime;
    document.getElementById('timetable-end-time').value = endTime;
    document.getElementById('timetable-subject').value = '';
    document.getElementById('timetable-teacher').value = '';
    document.getElementById('timetable-classroom').value = '';
    document.getElementById('timetable-online-link').value = '';
    // Show the form, do not clear
    this.showTimetableForm(true);
    // Focus on subject field
    setTimeout(() => {
      document.getElementById('timetable-subject').focus();
    }, 100);
  }
  
  // Calculate end time based on start time and duration in minutes
  calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  
  renderListView() {
    Object.keys(this.dayNames).forEach(day => {
      const dayContainer = document.getElementById(`${day}-classes`);
      if (!dayContainer) return;
      
      dayContainer.innerHTML = '';
      
      const dayClasses = this.timetableEntries.filter(entry => entry.day === day);
      
      if (dayClasses.length === 0) {
        dayContainer.innerHTML = '<div class="no-classes-message">Nincs óra ezen a napon</div>';
        return;
      }
      
      dayClasses.forEach(classEntry => {
        const classDiv = document.createElement('div');
        classDiv.className = 'class-item';
        classDiv.onclick = () => this.openEditModal(classEntry);
        
        classDiv.innerHTML = `
          <div class="class-item-header">
            <div class="class-item-subject">${classEntry.subject}</div>
            <div class="class-item-time">${classEntry.startTime} - ${classEntry.endTime}</div>
          </div>
          <div class="class-item-details">
            ${classEntry.teacher ? `
              <div class="class-item-detail">
                <span class="material-icons">person</span>
                ${classEntry.teacher}
              </div>
            ` : ''}
            ${classEntry.classroom ? `
              <div class="class-item-detail">
                <span class="material-icons">location_on</span>
                ${classEntry.classroom}
              </div>
            ` : ''}
            ${classEntry.onlineLink ? `
              <div class="class-item-detail">
                <span class="material-icons">link</span>
                <a href="${classEntry.onlineLink}" target="_blank" class="online-link">Online link</a>
              </div>
            ` : ''}
          </div>
        `;
        
        dayContainer.appendChild(classDiv);
      });
    });
  }
  
  toggleView() {
    this.currentView = this.currentView === 'table' ? 'list' : 'table';
    
    const toggleBtn = document.getElementById('timetable-view-toggle');
    if (toggleBtn) {
      if (this.currentView === 'table') {
        toggleBtn.innerHTML = `
          <span class="material-icons">view_list</span>
          Lista nézet
        `;
      } else {
        toggleBtn.innerHTML = `
          <span class="material-icons">view_module</span>
          Táblázat nézet
        `;
      }
    }
    
    this.renderTimetable();
  }
  
  openEditModal(classEntry) {
    this.currentEditId = classEntry.id;
    
    // Fill edit form
    document.getElementById('edit-timetable-subject').value = classEntry.subject;
    document.getElementById('edit-timetable-day').value = classEntry.day;
    document.getElementById('edit-timetable-start-time').value = classEntry.startTime;
    document.getElementById('edit-timetable-end-time').value = classEntry.endTime;
    document.getElementById('edit-timetable-teacher').value = classEntry.teacher || '';
    document.getElementById('edit-timetable-classroom').value = classEntry.classroom || '';
    document.getElementById('edit-timetable-online-link').value = classEntry.onlineLink || '';
    
    // Show modal
    const modal = document.getElementById('timetable-edit-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
  }
  
  closeEditModal() {
    const modal = document.getElementById('timetable-edit-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.currentEditId = null;
  }
  
  async updateTimetableEntry() {
    if (!this.currentEditId || !firebase.auth().currentUser) return;
    
    // Get form data
    const subject = document.getElementById('edit-timetable-subject')?.value.trim();
    const day = document.getElementById('edit-timetable-day')?.value;
    const startTime = document.getElementById('edit-timetable-start-time')?.value;
    const endTime = document.getElementById('edit-timetable-end-time')?.value;
    const teacher = document.getElementById('edit-timetable-teacher')?.value.trim();
    const classroom = document.getElementById('edit-timetable-classroom')?.value.trim();
    const onlineLink = document.getElementById('edit-timetable-online-link')?.value.trim();
    
    // Validation
    if (!subject || !day || !startTime || !endTime) {
      this.showNotification('Kérjük, töltse ki a kötelező mezőket!', 'error');
      return;
    }
    
    // Check for conflicts (excluding current entry)
    if (this.checkTimeConflict(day, startTime, endTime, this.currentEditId)) {
      this.showNotification('Ütközés: már van óra ebben az időpontban!', 'error');
      return;
    }
    
    try {
      const entryData = {
        subject,
        day,
        startTime,
        endTime,
        teacher: teacher || null,
        classroom: classroom || null,
        onlineLink: onlineLink || null,
        updatedAt: Date.now()
      };
      
      const entryRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}/timetable/${this.currentEditId}`);
      await entryRef.update(entryData);
      
      this.showNotification('✅ Óra sikeresen frissítve!', 'success');
      this.closeEditModal();
      await this.loadTimetableData();
      this.renderTimetable();
      
    } catch (error) {
      console.error('❌ Error updating timetable entry:', error);
      this.showNotification('Hiba történt az óra frissítésekor', 'error');
    }
  }
  
  async deleteTimetableEntry() {
    if (!this.currentEditId || !firebase.auth().currentUser) return;
    
    if (!confirm('Biztosan törölni szeretné ezt az órát?')) return;
    
    try {
      const entryRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}/timetable/${this.currentEditId}`);
      await entryRef.remove();
      
      this.showNotification('✅ Óra sikeresen törölve!', 'success');
      this.closeEditModal();
      await this.loadTimetableData();
      this.renderTimetable();
      
    } catch (error) {
      console.error('❌ Error deleting timetable entry:', error);
      this.showNotification('Hiba történt az óra törlésekor', 'error');
    }
  }
  
  showNotification(message, type = 'info') {
    if (window.showNotification) {
      window.showNotification(message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }
  
  // API for quest system integration
  getTodayClasses() {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKey = dayNames[today.getDay()];
    
    return this.timetableEntries.filter(entry => entry.day === todayKey);
  }
  
  getUpcomingClasses(hours = 24) {
    const now = new Date();
    const upcoming = [];
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayNames[checkDate.getDay()];
      
      const dayClasses = this.timetableEntries.filter(entry => entry.day === dayKey);
      
      dayClasses.forEach(classEntry => {
        const classDateTime = new Date(checkDate);
        const [hours, minutes] = classEntry.startTime.split(':');
        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const hoursUntil = (classDateTime - now) / (1000 * 60 * 60);
        
        if (hoursUntil >= 0 && hoursUntil <= hours) {
          upcoming.push({
            ...classEntry,
            date: classDateTime,
            hoursUntil
          });
        }
      });
    }
    
    return upcoming.sort((a, b) => a.date - b.date);
  }
  
  getSubjects() {
    return [...new Set(this.timetableEntries.map(entry => entry.subject))];
  }
}

// Initialize Timetable Manager
window.timetableManager = new TimetableManager();

// Debug functions for console access
window.debugTimetable = () => {
  console.log('📅 Timetable Debug Info:');
  console.log('Student status:', window.timetableManager.isStudentUser);
  console.log('Entries:', window.timetableManager.timetableEntries);
  console.log('Current view:', window.timetableManager.currentView);
};

window.getTodayClasses = () => {
  return window.timetableManager.getTodayClasses();
};

window.getUpcomingClasses = (hours = 24) => {
  return window.timetableManager.getUpcomingClasses(hours);
}; 