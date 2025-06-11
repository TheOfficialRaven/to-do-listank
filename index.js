import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, set, get, query, orderByChild, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase konfiguráció – cseréld ki a saját adataidra!
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

// DOM elemek – Autentikáció
const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authMessageEl = document.getElementById("auth-message");

// DOM elemek – Eredeti listák (todo, shop)
// Ezeket a default listákat a Firebaseből töltjük be, és megjelenítjük az egyesített konténerben.
const tasksUl = document.getElementById("tasks-ul");
const shopUl = document.getElementById("shop-ul");

// DOM elemek – Egyesített lista konténer (default + egyéni)
const listsContainer = document.getElementById("lists-container");

// DOM elemek – Új lista létrehozása
const newListSection = document.getElementById("new-list-section");
const customListNameInput = document.getElementById("custom-list-name-input");
const customListCategoryInput = document.getElementById("custom-list-category-input");
const customNewListBtn = document.getElementById("custom-new-list-btn");
const filterCategorySelect = document.getElementById("filter-category");

// Lista átrendezés toggle gomb
const toggleReorderBtn = document.getElementById("toggle-reorder-btn");
let isReorderingEnabled = false;
let sortableInstance = null;

// Téma váltó gomb
const themeToggleBtn = document.getElementById("theme-toggle-btn");
let isDarkTheme = true;

// Navigáció és új UI elemek
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

// Kereső és statisztikák
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const statsPanel = document.getElementById("stats-panel");

// Jegyzetek és naptár
const newNoteBtn = document.getElementById("new-note-btn");
const noteModal = document.getElementById("note-modal");
const saveNoteBtn = document.getElementById("save-note");
const cancelNoteBtn = document.getElementById("cancel-note");
const noteModalClose = document.getElementById("note-modal-close");

const newEventBtn = document.getElementById("new-event-btn");
const eventModal = document.getElementById("event-modal");
const saveEventBtn = document.getElementById("save-event");
const cancelEventBtn = document.getElementById("cancel-event");
const eventModalClose = document.getElementById("event-modal-close");

// Gyors műveletek
const actionButtons = document.querySelectorAll('.action-btn');

// Gamifikáció
let userLevel = 1;
let userXP = 0;
let currentStreak = 0;

// Gyors hozzáadás FAB
const quickAddFab = document.getElementById("quick-add-fab");
const quickAddModal = document.getElementById("quick-add-modal");
const quickAddText = document.getElementById("quick-add-text");
const quickAddListSelect = document.getElementById("quick-add-list-select");
const quickAddSubmit = document.getElementById("quick-add-submit");
const quickAddCancel = document.getElementById("quick-add-cancel");

// Confirmation modal (feltételezve, hogy az index.html-ben megvan)
function showConfirmModal(messageKey, callback, isListDeletion = true) {
  const modal = document.getElementById("confirm-modal");
  const confirmMessage = document.getElementById("confirm-message");
  const yesBtn = document.getElementById("confirm-yes");
  const noBtn = document.getElementById("confirm-no");

  const lang = document.documentElement.lang || "hu";
  let message, yesText, noText;
  
  if (isListDeletion) {
    if (lang === "en") {
      message = "Are you sure you want to delete this list?";
      yesText = "Yes";
      noText = "No";
    } else if (lang === "de") {
      message = "Sind Sie sicher, dass Sie diese Liste löschen möchten?";
      yesText = "Ja";
      noText = "Nein";
    } else {
      message = "Biztosan törlöd ezt a listát?";
      yesText = "Igen";
      noText = "Nem";
    }
  } else {
    if (lang === "en") {
      message = "Are you sure you want to delete this item?";
      yesText = "Yes";
      noText = "No";
    } else if (lang === "de") {
      message = "Sind Sie sicher, dass Sie dieses Element löschen möchten?";
      yesText = "Ja";
      noText = "Nein";
    } else {
      message = "Biztosan törlöd ezt a listaelemet?";
      yesText = "Igen";
      noText = "Nem";
    }
  }

  confirmMessage.textContent = message;
  yesBtn.textContent = yesText;
  noBtn.textContent = noText;
  modal.style.display = "flex";

  yesBtn.onclick = null;
  noBtn.onclick = null;

  yesBtn.onclick = () => {
    modal.style.display = "none";
    callback(true);
  };

  noBtn.onclick = () => {
    modal.style.display = "none";
    callback(false);
  };
}

// Auth állapot figyelése
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    
    // Modern UI megjelenítése
    const mainNav = document.getElementById("main-navigation");
    if (mainNav) mainNav.style.display = "block";
    
    // Dashboard alapértelmezett megjelenítése
    const dashboardSection = document.getElementById("dashboard-section");
    if (dashboardSection) {
      dashboardSection.style.display = "block";
      dashboardSection.classList.add("active");
    }
    
    // Régi UI elrejtése
    const oldNewListSection = document.getElementById("new-list-section");
    if (oldNewListSection) oldNewListSection.style.display = "none";
    
    document.getElementById("logout-section").style.display = "block";
    if (quickAddFab) {
      quickAddFab.style.display = "flex"; // FAB gomb megjelenítése
    }
    if (statsPanel) {
      statsPanel.style.display = "block"; // Statisztikák mindig láthatóak
    }
    
    // Alapvető funkciók betöltése
    createDefaultLists(user.uid);
    loadUserLists(user.uid);
    initializeSortable(); // Sortable inicializálása a bejelentkezés után
    
    // Új funkciók betöltése - azonnali dashboard frissítés
    loadUserProgress();
    loadNotes();
    updateDailyQuote();
    updateAchievements();
    
    // Azonnali dashboard frissítés
    updateDashboard();
    
    // Statisztikák frissítése kis késleltetéssel hogy a listák betöltődjenek
    setTimeout(() => {
      updateStatistics();
    }, 500); // Csak 0.5 másodperc a listák betöltéséhez
  } else {
    authSection.style.display = "block";
    
    // Modern UI elrejtése
    const mainNav = document.getElementById("main-navigation");
    if (mainNav) mainNav.style.display = "none";
    
    tabContents.forEach(content => {
      content.style.display = "none";
      content.classList.remove("active");
    });
    
    document.getElementById("logout-section").style.display = "none";
    if (quickAddFab) {
      quickAddFab.style.display = "none"; // FAB gomb elrejtése
    }
    if (statsPanel) {
      statsPanel.style.display = "none";
    }
    listsContainer.innerHTML = "";
    // Sortable eltávolítása kijelentkezéskor
    if (sortableInstance) {
      sortableInstance.destroy();
      sortableInstance = null;
    }
    isReorderingEnabled = false;
  }
});

// Sortable inicializálása és kezelése
function initializeSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
  }
  
  if (isReorderingEnabled) {
    sortableInstance = Sortable.create(listsContainer, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      onEnd: function(evt) {
        console.log("Drag end event fired");
        const children = Array.from(listsContainer.children);
        const updatePromises = children.map((child, index) => {
          const listId = child.getAttribute("data-list-id");
          console.log("Child index:", index, "ListID:", listId);
          if (listId && auth.currentUser) {
            console.log("Updating order for list", listId, "to", index + 1);
            return set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/order`), index + 1);
          } else {
            return Promise.resolve();
          }
        });
        Promise.all(updatePromises)
          .then(() => {
            console.log("All order updates complete");
            loadUserLists(auth.currentUser.uid);
          })
          .catch((error) => {
            console.error("Error updating order for one or more lists:", error);
          });
      }
    });
  }
}

// Toggle gomb eseménykezelő
toggleReorderBtn.addEventListener("click", () => {
  isReorderingEnabled = !isReorderingEnabled;
  const lang = document.documentElement.lang || "hu";
  
  if (isReorderingEnabled) {
    if (lang === "en") {
      toggleReorderBtn.textContent = "Disable List Reordering";
    } else if (lang === "de") {
      toggleReorderBtn.textContent = "Listenumordnung deaktivieren";
    } else {
      toggleReorderBtn.textContent = "Lista átrendezés letiltása";
    }
    toggleReorderBtn.classList.add("active");
    listsContainer.classList.add("reorder-enabled");
  } else {
    if (lang === "en") {
      toggleReorderBtn.textContent = "Enable List Reordering";
    } else if (lang === "de") {
      toggleReorderBtn.textContent = "Listenumordnung aktivieren";
    } else {
      toggleReorderBtn.textContent = "Lista átrendezés engedélyezése";
    }
    toggleReorderBtn.classList.remove("active");
    listsContainer.classList.remove("reorder-enabled");
  }
  
  initializeSortable();
});

// Téma váltó eseménykezelő
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    isDarkTheme = !isDarkTheme;
    const body = document.documentElement;
    
    if (isDarkTheme) {
      body.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      body.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  });
}

// Téma betöltése localStorage-ból
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  isDarkTheme = false;
  document.documentElement.setAttribute('data-theme', 'light');
}

// Kereső funkcionalitás
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterListsBySearch(searchTerm);
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener("click", () => {
    if (searchInput) {
      searchInput.value = "";
      filterListsBySearch("");
    }
  });
}

function filterListsBySearch(searchTerm) {
  const listBoxes = document.querySelectorAll('.list-box');
  
  listBoxes.forEach(box => {
    const listTitle = box.querySelector('h2').textContent.toLowerCase();
    const listItems = Array.from(box.querySelectorAll('li .item-text')).map(item => item.textContent.toLowerCase());
    
    const titleMatch = listTitle.includes(searchTerm);
    const itemMatch = listItems.some(item => item.includes(searchTerm));
    
    if (searchTerm === "" || titleMatch || itemMatch) {
      box.style.display = "";
      
      // Highlight matching items
      if (searchTerm !== "") {
        const items = box.querySelectorAll('li .item-text');
        items.forEach(item => {
          const text = item.textContent;
          if (text.toLowerCase().includes(searchTerm)) {
            item.style.backgroundColor = "rgba(16, 185, 129, 0.3)";
          } else {
            item.style.backgroundColor = "";
          }
        });
      } else {
        // Remove highlighting
        const items = box.querySelectorAll('li .item-text');
        items.forEach(item => {
          item.style.backgroundColor = "";
        });
      }
    } else {
      box.style.display = "none";
    }
  });
}

// ==============================================
// 🎯 MODERN NAVIGÁCIÓ ÉS UI KEZELÉS
// ==============================================

// Tab navigáció
navTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetTab = tab.dataset.tab;
    
    // Aktív tab váltás
    navTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Tartalom váltás
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });
    
    const targetContent = document.getElementById(`${targetTab}-section`);
    if (targetContent) {
      targetContent.style.display = 'block';
      targetContent.classList.add('active');
    }
    
    // Speciális kezelések
    if (targetTab === 'calendar') {
      initializeCalendar();
    } else if (targetTab === 'notes') {
      loadNotes();
    } else if (targetTab === 'achievements') {
      updateAchievements();
    }
  });
});

// Gyors műveletek
actionButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    
    switch(action) {
      case 'quick-task':
        // Váltás a listák fülre és az első input mezőre fókusz
        document.querySelector('[data-tab="lists"]').click();
        setTimeout(() => {
          const firstInput = document.querySelector('.item-input');
          if (firstInput) {
            firstInput.focus();
            firstInput.placeholder = "Gyors feladat hozzáadása...";
          }
        }, 300);
        break;
      case 'quick-note':
        openNoteModal();
        break;
      case 'quick-event':
        openEventModal();
        break;
    }
  });
});

// ==============================================
// 📒 JEGYZETEK KEZELÉSE
// ==============================================

function openNoteModal(noteId = null) {
  if (noteModal) {
    noteModal.style.display = 'flex';
    
    if (noteId) {
      // Szerkesztés mód
      loadNoteForEdit(noteId);
    } else {
      // Új jegyzet mód
      clearNoteModal();
    }
  }
}

function closeNoteModal() {
  if (noteModal) {
    noteModal.style.display = 'none';
    clearNoteModal();
  }
}

function clearNoteModal() {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('note-category').value = 'general';
  document.getElementById('note-private').checked = false;
}

function saveNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const isPrivate = document.getElementById('note-private').checked;
  
  if (!title || !content) {
    alert('Kérjük, töltsd ki a címet és a tartalmat!');
    return;
  }
  
  if (!auth.currentUser) {
    alert('Be kell jelentkezned a jegyzet mentéséhez!');
    return;
  }
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes`);
  const noteData = {
    title,
    content,
    category,
    isPrivate,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  push(notesRef, noteData).then(() => {
    closeNoteModal();
    loadNotes();
    addXP(5); // XP jegyzet mentésért
    showNotification('📒 Jegyzet sikeresen mentve!');
  }).catch(error => {
    console.error('Hiba a jegyzet mentése során:', error);
    alert('Hiba történt a jegyzet mentése során.');
  });
}

function loadNotes() {
  if (!auth.currentUser) return;
  
  const notesContainer = document.getElementById('notes-container');
  if (!notesContainer) return;
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes`);
  
  onValue(notesRef, (snapshot) => {
    notesContainer.innerHTML = '';
    
    if (snapshot.exists()) {
      const notes = Object.entries(snapshot.val()).map(([id, data]) => ({
        id,
        ...data
      })).sort((a, b) => b.timestamp - a.timestamp);
      
      notes.forEach(note => {
        const noteElement = createNoteElement(note);
        notesContainer.appendChild(noteElement);
      });
    } else {
      notesContainer.innerHTML = `
        <div class="empty-state">
          <h3>📒 Még nincsenek jegyzeteid</h3>
          <p>Hozz létre az első jegyzetedet a fenti gombbal!</p>
        </div>
      `;
    }
  });
}

function createNoteElement(note) {
  const noteCard = document.createElement('div');
  noteCard.className = 'note-card';
  if (note.pinned) noteCard.classList.add('pinned');
  
  // Kategória ikon
  const categoryIcons = {
    general: '📝',
    passwords: '🔒',
    ideas: '💡',
    important: '⭐',
    work: '💼',
    personal: '👤'
  };
  
  noteCard.innerHTML = `
    <div class="note-header">
      <h4 class="note-title">${categoryIcons[note.category] || '📝'} ${note.title}</h4>
      <span class="note-category">${note.category}</span>
    </div>
    <div class="note-content">${note.content}</div>
    <div class="note-actions">
      <button onclick="togglePinNote('${note.id}')" title="${note.pinned ? 'Kiemelt eltávolítása' : 'Kiemelés'}">
        <span class="material-icons">${note.pinned ? 'push_pin' : 'radio_button_unchecked'}</span>
      </button>
      <button onclick="editNote('${note.id}')" title="Szerkesztés">
        <span class="material-icons">edit</span>
      </button>
      <button onclick="deleteNote('${note.id}')" title="Törlés">
        <span class="material-icons">delete</span>
      </button>
      ${note.isPrivate ? '<span class="material-icons" style="color: var(--accent-primary);" title="Bizalmas">lock</span>' : ''}
    </div>
  `;
  
  return noteCard;
}

// Jegyzet kiemelés/kiemelés eltávolítása
function togglePinNote(noteId) {
  if (!auth.currentUser) return;
  
  const noteRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  
  get(noteRef).then((snapshot) => {
    if (snapshot.exists()) {
      const currentPinned = snapshot.val().pinned || false;
      
      update(noteRef, { 
        pinned: !currentPinned,
        updatedAt: new Date().toISOString()
      }).then(() => {
        loadNotes();
        updatePinnedNotes();
        showNotification(!currentPinned ? '📌 Jegyzet kiemelt!' : '📌 Kiemelés eltávolítva!');
      });
    }
  });
}

// ==============================================
// 🗓️ NAPTÁR KEZELÉSE
// ==============================================

let currentDate = new Date();

function initializeCalendar() {
  renderCalendar();
  loadUpcomingEvents();
}

function renderCalendar() {
  const calendarGrid = document.getElementById('calendar-grid');
  const monthYearDisplay = document.getElementById('current-month-year');
  
  if (!calendarGrid || !monthYearDisplay) return;
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Hónap név beállítása
  const monthNames = [
    'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
    'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
  ];
  monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
  
  // Naptár rács törlése
  calendarGrid.innerHTML = '';
  
  // Hét napjai header
  const dayNames = ['V', 'H', 'K', 'Sz', 'Cs', 'P', 'Sz'];
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    dayHeader.style.fontWeight = 'bold';
    dayHeader.style.background = 'var(--accent-primary)';
    dayHeader.style.color = 'var(--bg-primary)';
    calendarGrid.appendChild(dayHeader);
  });
  
  // Hónap első napja
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (firstDay.getDay() + 6) % 7);
  
  // Napok renderelése
  for (let i = 0; i < 42; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + i);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.textContent = currentDay.getDate();
    
    // Mai nap kiemelése
    if (isToday(currentDay)) {
      dayElement.classList.add('today');
    }
    
    // Más hónap napjai halvány színnel
    if (currentDay.getMonth() !== month) {
      dayElement.style.opacity = '0.3';
    }
    
    // Esemény jelzése (TODO: implementálni az esemény betöltést)
    // if (hasEvent(currentDay)) {
    //   dayElement.classList.add('has-event');
    // }
    
    dayElement.addEventListener('click', () => {
      openEventModal(currentDay);
    });
    
    calendarGrid.appendChild(dayElement);
  }
}

function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function openEventModal(selectedDate = null) {
  if (!auth.currentUser) {
    showNotification('⚠️ Be kell jelentkezned az esemény kezeléséhez!');
    return;
  }

  if (eventModal) {
    eventModal.style.display = 'flex';
    
    if (selectedDate) {
      const dateInput = document.getElementById('event-date');
      if (dateInput) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        dateInput.value = dateStr;
        
        // Meglévő események megjelenítése a dátumhoz
        const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
        get(eventsRef).then((snapshot) => {
          if (snapshot.exists()) {
            const dayEvents = Object.entries(snapshot.val())
              .filter(([id, data]) => data.date === dateStr)
              .map(([id, data]) => ({ id, ...data }));
            
            if (dayEvents.length > 0) {
              // Esemény lista modal vagy prompt megjelenítése
              showDayEventsModal(dayEvents, dateStr);
            }
          }
        });
      }
    }
  }
}

// Napi események megjelenítése törlési opcióval
function showDayEventsModal(events, dateStr) {
  if (events.length === 0) return;
  
  const message = `📅 ${new Date(dateStr).toLocaleDateString('hu-HU')} - Események:\n\n` +
    events.map(event => `• ${event.title} ${event.time ? '(' + event.time + ')' : '(Egész nap)'}`).join('\n') +
    '\n\nSzeretne törölni valamelyik eseményt?';
  
  if (confirm(message)) {
    // Események listázása törléshez
    const eventToDelete = prompt(
      'Írja be az esemény címét, amit törölni szeretne:\n\n' +
      events.map((event, index) => `${index + 1}. ${event.title}`).join('\n')
    );
    
    if (eventToDelete) {
      const foundEvent = events.find(event => 
        event.title.toLowerCase().includes(eventToDelete.toLowerCase())
      );
      
      if (foundEvent) {
        deleteEvent(foundEvent.id);
      } else {
        showNotification('❌ Nem található ilyen nevű esemény!');
      }
    }
  }
}

// Esemény törlése
function deleteEvent(eventId) {
  if (!auth.currentUser) return;
  
  if (confirm('🗑️ Biztosan törölni szeretnéd ezt az eseményt?')) {
    const eventRef = ref(db, `users/${auth.currentUser.uid}/events/${eventId}`);
    
    remove(eventRef).then(() => {
      loadEvents();
      renderCalendar();
      showNotification('🗑️ Esemény sikeresen törölve!');
    }).catch(error => {
      console.error('Hiba az esemény törlése során:', error);
      showNotification('❌ Hiba történt az esemény törlése során!');
    });
  }
}

function closeEventModal() {
  if (eventModal) {
    eventModal.style.display = 'none';
    clearEventModal();
  }
}

function clearEventModal() {
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = '';
  document.getElementById('event-time').value = '';
  document.getElementById('event-description').value = '';
  document.getElementById('event-type').value = 'birthday';
  document.getElementById('event-reminder').checked = false;
  document.getElementById('reminder-time').disabled = true;
}

// ==============================================
// 🏆 GAMIFIKÁCIÓ ÉS EREDMÉNYEK
// ==============================================

function addXP(amount) {
  userXP += amount;
  
  // Szint ellenőrzése
  const newLevel = Math.floor(userXP / 100) + 1;
  if (newLevel > userLevel) {
    userLevel = newLevel;
    showLevelUpNotification(newLevel);
  }
  
  updateLevelDisplay();
  saveUserProgress();
}

function updateLevelDisplay() {
  const levelElement = document.getElementById('user-level');
  const xpProgressElement = document.getElementById('xp-progress');
  const xpTextElement = document.getElementById('xp-text');
  
  if (levelElement) levelElement.textContent = userLevel;
  
  const currentLevelXP = userXP % 100;
  const nextLevelXP = 100;
  
  if (xpProgressElement) {
    xpProgressElement.style.width = `${(currentLevelXP / nextLevelXP) * 100}%`;
  }
  
  if (xpTextElement) {
    xpTextElement.textContent = `${currentLevelXP} / ${nextLevelXP} XP`;
  }
}

function showLevelUpNotification(level) {
  showNotification(`🎉 Szint ${level} elérve! Gratulálunk!`);
}

function showNotification(message) {
  // Egyszerű notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-primary);
    color: var(--bg-primary);
    padding: 1rem 2rem;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    z-index: 3000;
    animation: slideInRight 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// ==============================================
// 💾 HALADÁS MENTÉSE ÉS BETÖLTÉSE
// ==============================================

function saveUserProgress() {
  if (!auth.currentUser) return;
  
  const progressRef = ref(db, `users/${auth.currentUser.uid}/progress`);
  const progressData = {
    level: userLevel,
    xp: userXP,
    streak: currentStreak,
    lastActivity: Date.now()
  };
  
  set(progressRef, progressData);
}

function loadUserProgress() {
  if (!auth.currentUser) return;
  
  const progressRef = ref(db, `users/${auth.currentUser.uid}/progress`);
  
  onValue(progressRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      userLevel = data.level || 1;
      userXP = data.xp || 0;
      currentStreak = data.streak || 0;
      
      updateLevelDisplay();
      updateStreakDisplay();
    }
  });
}

function updateStreakDisplay() {
  const streakElement = document.getElementById('current-streak');
  if (!streakElement || !auth.currentUser) return;
  
  const today = new Date().toISOString().split('T')[0];
  const userActivityData = getUserActivityData();
  
  // Sorozat számítása visszafelé
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const activity = getActivityLevelForDate(dateStr, userActivityData);
    
    if (activity > 0) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
    
    // Végtelen ciklus elkerülése
    if (streak > 365) break;
  }
  
  streakElement.textContent = streak;
  currentStreak = streak;
}

function updateDailyQuote() {
  const quotes = [
    {
      text: "A legnagyobb dicsőség nem abban van, hogy sosem bukunk el, hanem abban, hogy minden bukás után felkelünk.",
      author: "Konfuciusz"
    },
    {
      text: "A jövő azoknak tartozik, akik hisznek álmaik szépségében.",
      author: "Eleanor Roosevelt"
    },
    {
      text: "Az egyetlen lehetetlen út az, amelyiken nem indulsz el.",
      author: "Tony Robbins"
    },
    {
      text: "A siker 99% izzadság és 1% inspiráció.",
      author: "Thomas Edison"
    },
    {
      text: "Nem az számít, hogy milyen lassan haladsz, amíg nem állsz meg.",
      author: "Konfuciusz"
    },
    {
      text: "A változás az egyetlen állandó dolog az életben.",
      author: "Hérakleitosz"
    },
    {
      text: "Az út ezer mérföld hosszú, de minden út egy lépéssel kezdődik.",
      author: "Lao Ce"
    }
  ];
  
  // Napi idézet kiválasztása a dátum alapján
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const selectedQuote = quotes[dayOfYear % quotes.length];
  
  const quoteText = document.getElementById('quote-text');
  const quoteAuthor = document.getElementById('quote-author');
  
  if (quoteText && quoteAuthor) {
    quoteText.textContent = `"${selectedQuote.text}"`;
    quoteAuthor.textContent = `- ${selectedQuote.author}`;
  }
}

function updateAchievements() {
  const achievementBadges = document.getElementById('achievement-badges');
  if (!achievementBadges) return;
  
  const achievements = [
    {
      id: 'first-task',
      title: 'Első lépés',
      description: 'Teljesítsd az első feladatod',
      icon: '🎯',
      condition: () => userXP >= 2,
      xpReward: 5
    },
    {
      id: 'task-master',
      title: 'Feladat mester',
      description: 'Teljesíts 10 feladatot',
      icon: '⭐',
      condition: () => userXP >= 20,
      xpReward: 15
    },
    {
      id: 'list-creator',
      title: 'Lista készítő',
      description: 'Hozz létre 3 listát',
      icon: '📝',
      condition: () => userXP >= 30,
      xpReward: 20
    },
    {
      id: 'note-taker',
      title: 'Jegyzet készítő',
      description: 'Írj 5 jegyzetet',
      icon: '📒',
      condition: () => userXP >= 25,
      xpReward: 10
    },
    {
      id: 'level-up',
      title: 'Szint emelkedés',
      description: 'Érj el 2. szintet',
      icon: '🏆',
      condition: () => userLevel >= 2,
      xpReward: 25
    },
    {
      id: 'streak-3',
      title: 'Kitartó',
      description: '3 napos sorozat',
      icon: '🔥',
      condition: () => currentStreak >= 3,
      xpReward: 15
    },
    {
      id: 'streak-7',
      title: 'Legenda',
      description: '7 napos sorozat',
      icon: '👑',
      condition: () => currentStreak >= 7,
      xpReward: 50
    },
    {
      id: 'explorer',
      title: 'Felfedező',
      description: 'Próbáld ki az összes funkciót',
      icon: '🌟',
      condition: () => userLevel >= 3,
      xpReward: 30
    }
  ];
  
  achievementBadges.innerHTML = '';
  
  achievements.forEach(achievement => {
    const isUnlocked = achievement.condition();
    const badgeElement = document.createElement('div');
    badgeElement.className = `achievement-badge ${isUnlocked ? 'unlocked' : ''}`;
    
    // Progress számítás
    let progressHTML = '';
    if (!isUnlocked) {
      let current = 0;
      let target = 100;
      
      // Specifikus progress logika minden achievementhez
      switch(achievement.id) {
        case 'first-task':
          current = Math.min(userXP, 2);
          target = 2;
          break;
        case 'task-master':
          current = Math.min(userXP, 20);
          target = 20;
          break;
        case 'list-creator':
          current = Math.min(userXP, 30);
          target = 30;
          break;
        case 'note-taker':
          current = Math.min(userXP, 25);
          target = 25;
          break;
        case 'level-up':
          current = userLevel;
          target = 2;
          break;
        case 'streak-3':
          current = Math.min(currentStreak, 3);
          target = 3;
          break;
        case 'streak-7':
          current = Math.min(currentStreak, 7);
          target = 7;
          break;
        case 'explorer':
          current = userLevel;
          target = 3;
          break;
      }
      
      const progressPercentage = Math.min((current / target) * 100, 100);
      
      progressHTML = `
        <div class="achievement-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
          </div>
          <div class="progress-text">${current}/${target}</div>
        </div>
      `;
    }
    
    badgeElement.innerHTML = `
      <div class="badge-icon">${achievement.icon}</div>
      <div class="badge-title">${achievement.title}</div>
      <div class="badge-description">${achievement.description}</div>
      ${isUnlocked ? '<div class="badge-unlocked">🔓 Elérve!</div>' : '<div class="badge-locked">🔒 Zárva</div>'}
      ${progressHTML}
    `;
    
    achievementBadges.appendChild(badgeElement);
  });
}

// Event listeners hozzáadása
if (newNoteBtn) newNoteBtn.addEventListener('click', () => openNoteModal());
if (saveNoteBtn) saveNoteBtn.addEventListener('click', saveNote);
if (cancelNoteBtn) cancelNoteBtn.addEventListener('click', closeNoteModal);
if (noteModalClose) noteModalClose.addEventListener('click', closeNoteModal);

if (newEventBtn) newEventBtn.addEventListener('click', () => openEventModal());
if (saveEventBtn) saveEventBtn.addEventListener('click', saveEvent);
if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeEventModal);
if (eventModalClose) eventModalClose.addEventListener('click', closeEventModal);

// Naptár navigáció
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
}

// Modal background click bezárás
[noteModal, eventModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
});

// Statisztikák automatikus frissítése - nincs toggle gomb
// A statisztikák mindig láthatóak és automatikusan frissülnek

function updateStatistics() {
  const listBoxes = document.querySelectorAll('.list-box');
  const totalLists = listBoxes.length;
  
  let totalItems = 0;
  let completedItems = 0;
  
  listBoxes.forEach(box => {
    const items = box.querySelectorAll('li');
    const doneItems = box.querySelectorAll('li.done');
    
    totalItems += items.length;
    completedItems += doneItems.length;
  });
  
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Számok animált frissítése
  animateNumber('total-lists', totalLists);
  animateNumber('total-items', totalItems);
  animateNumber('completed-items', completedItems);
  
  // Progress bar-ok frissítése
  updateProgressBar('lists-progress', totalLists, 10); // max 10 lista
  updateProgressBar('items-progress', totalItems, Math.max(50, totalItems)); // dinamikus max
  updateProgressBar('completed-progress', completedItems, totalItems || 1);
  
  // Kördiagram frissítése
  updateCircularProgress(completionRate);
}

function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const startValue = parseInt(element.textContent) || 0;
  const duration = 1000; // 1 másodperc
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutCubic);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

function updateProgressBar(elementId, value, maxValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  setTimeout(() => {
    element.style.width = percentage + '%';
  }, 300);
}

function updateCircularProgress(percentage) {
  const circle = document.getElementById('completion-circle');
  const percentageText = document.getElementById('completion-percentage');
  
  if (!circle || !percentageText) return;
  
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  setTimeout(() => {
    circle.style.strokeDasharray = strokeDasharray;
    percentageText.textContent = percentage + '%';
  }, 500);
}

// Gyors hozzáadás FAB funkciók
if (quickAddFab) {
  quickAddFab.addEventListener("click", () => {
    populateQuickAddListSelect();
    if (quickAddModal) {
      quickAddModal.style.display = "flex";
    }
    if (quickAddText) {
      quickAddText.focus();
    }
  });
}

if (quickAddCancel) {
  quickAddCancel.addEventListener("click", () => {
    if (quickAddModal) {
      quickAddModal.style.display = "none";
    }
    if (quickAddText) {
      quickAddText.value = "";
    }
    if (quickAddListSelect) {
      quickAddListSelect.value = "";
    }
  });
}

if (quickAddSubmit) {
  quickAddSubmit.addEventListener("click", () => {
    const text = quickAddText ? quickAddText.value.trim() : "";
    const selectedListId = quickAddListSelect ? quickAddListSelect.value : "";
    
    if (text && selectedListId && auth.currentUser) {
      // Elem hozzáadása a kiválasztott listához
      const itemsRef = ref(db, `users/${auth.currentUser.uid}/lists/${selectedListId}/items`);
      push(itemsRef, {
        text: text,
        done: false,
        timestamp: Date.now()
      }).then(() => {
        console.log("Gyors elem hozzáadva!");
        if (quickAddModal) {
          quickAddModal.style.display = "none";
        }
        if (quickAddText) {
          quickAddText.value = "";
        }
        if (quickAddListSelect) {
          quickAddListSelect.value = "";
        }
        loadUserLists(auth.currentUser.uid); // Listák újratöltése
      }).catch((error) => {
        console.error("Hiba az elem hozzáadása során:", error);
      });
    }
  });
}

function populateQuickAddListSelect() {
  if (!quickAddListSelect) return;
  
  const lang = document.documentElement.lang || "hu";
  let defaultText;
  if (lang === "en") {
    defaultText = "Choose list...";
  } else if (lang === "de") {
    defaultText = "Liste auswählen...";
  } else {
    defaultText = "Válassz listát...";
  }
  
  quickAddListSelect.innerHTML = `<option value="">${defaultText}</option>`;
  
  if (auth.currentUser) {
    // Listák betöltése a select elembe
    const listsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
    get(listsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const lists = snapshot.val();
        Object.keys(lists).forEach((listId) => {
          const list = lists[listId];
          const option = document.createElement('option');
          option.value = listId;
          option.textContent = list.name || "Névtelen lista";
          quickAddListSelect.appendChild(option);
        });
      }
    });
  }
}

// Regisztráció
registerBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (email && password) {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres regisztráció:", userCredential.user.email);
        authMessageEl.textContent = `Sikeres regisztráció! Üdvözlünk, ${userCredential.user.email}!`;
      })
      .catch((error) => {
        console.error("Regisztrációs hiba:", error.message);
        authMessageEl.textContent = `Regisztrációs hiba: ${error.message}`;
      });
  } else {
    authMessageEl.textContent = "Kérjük, add meg az email címet és a jelszót!";
  }
});

// Bejelentkezés
loginBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (email && password) {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Sikeres bejelentkezés:", userCredential.user.email);
      })
      .catch((error) => {
        console.error("Bejelentkezési hiba:", error.message);
        authMessageEl.textContent = `Bejelentkezési hiba: ${error.message}`;
      });
  }
});

// Kijelentkezés
logoutBtn.addEventListener("click", () => {
  if (auth.currentUser) {
    signOut(auth)
      .then(() => {
        console.log("Sikeres kijelentkezés");
      })
      .catch((error) => {
        console.error("Kijelentkezési hiba:", error.message);
      });
  } else {
    console.log("Nincs bejelentkezett felhasználó, nincs mit kijelentkezni.");
  }
});

// Létrehozza a default listákat (Teendőlista és Bevásárlólista), ha még nem léteznek
function createDefaultLists(uid) {
  const lang = document.documentElement.lang || "hu";
  let todoListName, shoppingListName, todoCategory, shoppingCategory;
  if (lang === "en") {
    todoListName = "📋 To-Do List";
    shoppingListName = "🛒 Shopping List";
    todoCategory = "Tasks";
    shoppingCategory = "Shopping";
  } else if (lang === "de") {
    todoListName = "📋 Aufgabenliste";
    shoppingListName = "🛒 Einkaufsliste";
    todoCategory = "Aufgaben";
    shoppingCategory = "Einkauf";
  } else {
    todoListName = "📋 Teendőlista";
    shoppingListName = "🛒 Bevásárlólista";
    todoCategory = "Feladatok";
    shoppingCategory = "Bevásárlás";
  }

  const userListsRef = ref(db, `users/${uid}/lists`);
  get(userListsRef).then((snapshot) => {
    if (!snapshot.exists()) {
      // A default listákhoz beállítjuk az order értéket (például 1 és 2)
      push(userListsRef, { name: todoListName, category: todoCategory, order: 1 });
      push(userListsRef, { name: shoppingListName, category: shoppingCategory, order: 2 });
    }
  });
}

// Betöltjük a felhasználó összes listáját (default + egyéni)
function loadUserLists(uid) {
  createDefaultLists(uid);
  const userListsRef = ref(db, `users/${uid}/lists`);
  const orderedQuery = query(userListsRef, orderByChild("order"));
  onValue(orderedQuery, (snapshot) => {
    listsContainer.innerHTML = "";
    if (snapshot.exists()) {
      // Használjuk a snapshot.forEach() metódust a rendezett tömb létrehozásához
      const fullListsArray = [];
      snapshot.forEach(childSnapshot => {
        const list = childSnapshot.val();
        list.id = childSnapshot.key;
        fullListsArray.push(list);
      });
      
      const filterValue = filterCategorySelect.value;
      let filteredListsArray = fullListsArray;
      if (filterValue !== "all") {
        filteredListsArray = fullListsArray.filter(
          list => list.category.toLowerCase() === filterValue.toLowerCase()
        );
      }
      
      filteredListsArray.forEach(list => {
        renderListBox(list.id, list.name, list.category, uid);
      });
      updateFilterOptions(fullListsArray);
      
      // Statisztikák automatikus frissítése
      setTimeout(() => {
        updateStatistics();
      }, 500);
    } else {
      const lang = document.documentElement.lang || "hu";
      let noListsMsg = "Nincsenek listák.";
      if (lang === "en") {
        noListsMsg = "No lists available.";
      } else if (lang === "de") {
        noListsMsg = "Keine Listen verfügbar.";
      }
      listsContainer.innerHTML = `<p>${noListsMsg}</p>`;
      
      // Üres állapotban is frissítsük a statisztikákat
      setTimeout(() => {
        updateStatistics();
      }, 100);
    }
  });
}

function updateFilterOptions(listsArray) {
  const currentValue = filterCategorySelect.value;
  const lang = document.documentElement.lang || "hu";
  
  let allOptionText = "Összes";
  if (lang === "en") {
    allOptionText = "All";
  } else if (lang === "de") {
    allOptionText = "Alle";
  }
  
  let optionsHTML = `<option value="all">${allOptionText}</option>`;
  const categories = new Set(listsArray.map(list => list.category));
  categories.forEach(cat => {
    optionsHTML += `<option value="${cat}">${cat}</option>`;
  });
  filterCategorySelect.innerHTML = optionsHTML;
  if (currentValue) {
    filterCategorySelect.value = currentValue;
  }
}

filterCategorySelect.addEventListener("change", () => {
  if (auth.currentUser) {
    loadUserLists(auth.currentUser.uid);
  }
});

// Megjeleníti a lista boxot (default és egyéni)
function renderListBox(listId, listName, category, uid) {
  const box = document.createElement("div");
  box.classList.add("list-box");
  // Állítsuk be a data-list-id attribútumot
  box.setAttribute("data-list-id", listId);

  const lang = document.documentElement.lang || "hu";
  let placeholder, addButtonText;
  
  if (lang === "en") {
    placeholder = "Add new item";
    addButtonText = "Add";
  } else if (lang === "de") {
    placeholder = "Neues Element hinzufügen";
    addButtonText = "Hinzufügen";
  } else {
    placeholder = "Új elem hozzáadása";
    addButtonText = "Hozzáadás";
  }
  
  box.innerHTML = `
    <h2>
      <span class="list-title">${listName}</span>
      <div class="title-icons">
        <button class="pin-list-btn" data-list="${listId}" title="Kiemelés dashboard-ra">
          <span class="material-icons">push_pin</span>
        </button>
        <button class="edit-title-btn" data-list="${listId}">
          <span class="material-icons">edit</span>
        </button>
        <button class="delete-list-btn" data-list="${listId}">
          <span class="material-icons">delete</span>
        </button>
      </div>
    </h2>
    <input type="text" class="item-input" placeholder="${placeholder}" data-list="${listId}">
    <button class="item-add-btn" data-list="${listId}">${addButtonText}</button>
    <ul class="items-ul" id="items-${listId}"></ul>
  `;
  listsContainer.appendChild(box);
  
  // Enter billentyű támogatás hozzáadása
  const itemInput = box.querySelector('.item-input');
  itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const addBtn = e.target.nextElementSibling;
      if (addBtn && addBtn.classList.contains('item-add-btn')) {
        addBtn.click();
      }
    }
  });
  
  loadListItems(uid, listId, box.querySelector(".items-ul"));
}

// Betölti az adott lista elemeit
function loadListItems(uid, listId, ulElement) {
  const itemsRef = ref(db, `users/${uid}/lists/${listId}/items`);
  onValue(itemsRef, (snapshot) => {
    ulElement.innerHTML = "";
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([itemId, item]) => {
        renderListItem(itemId, item.text, item.done, ulElement, listId, uid);
      });
    }
    
    // Statisztikák frissítése a lista elemek betöltése után
    setTimeout(() => {
      updateStatistics();
    }, 200);
  });
}

// Megjeleníti az egyes listaelemeket
function renderListItem(itemId, text, done, ulElement, listId, uid) {
  const li = document.createElement("li");
  li.classList.toggle("done", done);
  li.innerHTML = `
    <span class="item-text">${text}</span>
    <div class="icons">
      <span class="material-icons done-icon" data-item="${itemId}" data-list="${listId}" data-done="${done}">done</span>
      <span class="material-icons delete-icon" data-item="${itemId}" data-list="${listId}">delete</span>
      <span class="material-icons edit-icon" data-item="${itemId}" data-list="${listId}">edit</span>
    </div>
  `;
  ulElement.appendChild(li);
}

// Új lista boxok létrehozása
customNewListBtn.addEventListener("click", () => {
  const listName = customListNameInput.value.trim();
  const category = customListCategoryInput.value.trim();
  console.log("Custom lista hozzáadása:", listName, category);

  if (listName === "") {
    const lang = document.documentElement.lang || "hu";
    let errorMsg = "Kérjük, add meg a lista nevét!";
    if (lang === "en") {
      errorMsg = "Please enter a list name!";
    } else if (lang === "de") {
      errorMsg = "Bitte geben Sie einen Listennamen ein!";
    }
    alert(errorMsg);
    customListNameInput.focus();
    return;
  }
  if (!auth.currentUser) {
    console.warn("Nincs bejelentkezett felhasználó!");
    return;
  }

  const userListsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
  
  // Alapértelmezett kategória beállítása, ha üres
  const lang = document.documentElement.lang || "hu";
  let finalCategory = category;
  if (!finalCategory) {
    if (lang === "en") {
      finalCategory = "General";
    } else if (lang === "de") {
      finalCategory = "Allgemein";
    } else {
      finalCategory = "Általános";
    }
  }
  
  // Először lekérjük a meglévő listák maximum order értékét
  get(userListsRef).then((snapshot) => {
    let maxOrder = 0;
    if (snapshot.exists()) {
      const lists = Object.values(snapshot.val());
      lists.forEach(list => {
        if (list.order && list.order > maxOrder) {
          maxOrder = list.order;
        }
      });
    }
    let fullName = listName;
    
    // Emoji hozzáadása kategória alapján
    if (lang === "en") {
      if (finalCategory.toLowerCase() === "shopping") {
        fullName = "🛒 " + listName;
      } else if (finalCategory.toLowerCase() === "tasks") {
        fullName = "📋 " + listName;
      }
    } else if (lang === "de") {
      if (finalCategory.toLowerCase() === "einkauf") {
        fullName = "🛒 " + listName;
      } else if (finalCategory.toLowerCase() === "aufgaben") {
        fullName = "📋 " + listName;
      }
    } else {
      if (finalCategory.toLowerCase() === "bevásárlás") {
        fullName = "🛒 " + listName;
      } else if (finalCategory.toLowerCase() === "feladatok") {
        fullName = "📋 " + listName;
      }
    }
    // Az új lista order értéke: max + 1
    const newOrder = maxOrder + 1;
    push(userListsRef, { name: fullName, category: finalCategory, order: newOrder })
      .then(() => {
        console.log("Custom lista sikeresen hozzáadva:", fullName, "order:", newOrder);
        
        // XP hozzáadása új lista létrehozásáért
        addXP(10);
        showNotification("📝 +10 XP új lista létrehozásáért!");
        
        // Input mezők tisztítása csak sikeres hozzáadás után
        customListNameInput.value = "";
        customListCategoryInput.value = "";
        customListNameInput.focus(); // Visszafókuszál az első input mezőre
      })
      .catch((error) => {
        console.error("Hiba a custom lista hozzáadásakor:", error);
      });
  });
});

// Eseménykezelés a listaelemekhez
document.addEventListener("click", (e) => {
  // Új elem hozzáadása a lista boxban
  if (e.target.matches(".item-add-btn")) {
    const listId = e.target.dataset.list;
    const inputField = e.target.previousElementSibling;
    const text = inputField.value.trim();
    if (text !== "" && auth.currentUser) {
      const itemsRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items`);
      push(itemsRef, { text: text, done: false }).then(() => {
        addXP(1); // XP új elem hozzáadásért
        showNotification("➕ +1 XP új elem hozzáadásért!");
      });
      inputField.value = "";
      inputField.focus(); // Visszafókuszál az input mezőre
    }
  }
  
  // Lista pinelése
  if (e.target.closest(".pin-list-btn")) {
    const listId = e.target.closest(".pin-list-btn").dataset.list;
    togglePinList(listId);
  }
  
  // Lista box törlése
  if (e.target.closest(".delete-list-btn")) {
    const listId = e.target.closest(".delete-list-btn").dataset.list;
    showConfirmModal("deleteList", (confirmed) => {
      if (confirmed) {
        remove(ref(db, `users/${auth.currentUser.uid}/lists/${listId}`));
      }
    }, true);
  }
  
  // Listaelem pipálása
  if (e.target.matches(".done-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    const currentDone = e.target.dataset.done === "true";
    
    set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}/done`), !currentDone).then(() => {
      // XP hozzáadása elem befejezésért
      if (!currentDone) { // Ha éppen most lett kész
        addXP(2);
        showNotification("✅ +2 XP elem befejezésért!");
      }
    });
  }
  
  // Listaelem törlése
  if (e.target.matches(".delete-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    showConfirmModal("deleteItem", (confirmed) => {
      if (confirmed) {
        remove(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}`));
      }
    }, false);
  }
  
  // Listaelem inline szerkesztése
  if (e.target.matches(".edit-icon")) {
    const itemId = e.target.dataset.item;
    const listId = e.target.dataset.list;
    const spanEl = e.target.parentElement.previousElementSibling;
    const input = document.createElement("input");
    input.type = "text";
    input.value = spanEl.textContent;
    input.className = "inline-edit-input";
    spanEl.replaceWith(input);
    input.focus();
    input.addEventListener("blur", () => {
      const newText = input.value.trim();
      if (newText !== "") {
        set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${itemId}/text`), newText);
      }
      const newSpan = document.createElement("span");
      newSpan.className = "item-text";
      newSpan.textContent = newText;
      input.replaceWith(newSpan);
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        input.blur();
      }
    });
  }
  
  // Lista box címének inline szerkesztése
  if (e.target.matches(".edit-title-btn") || e.target.closest(".edit-title-btn")) {
    const btn = e.target.closest(".edit-title-btn");
    const listId = btn.dataset.list;
    const h2El = btn.closest("h2");
    if (!h2El) return;
    const titleSpan = h2El.querySelector(".list-title");
    if (!titleSpan) return;
    const currentTitle = titleSpan.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentTitle;
    input.className = "inline-edit-input";
    titleSpan.replaceWith(input);
    input.focus();
    input.addEventListener("blur", () => {
      const newTitle = input.value.trim();
      if (newTitle !== "") {
        set(ref(db, `users/${auth.currentUser.uid}/lists/${listId}/name`), newTitle);
      }
      const newSpan = document.createElement("span");
      newSpan.className = "list-title";
      newSpan.textContent = newTitle || currentTitle;
      input.replaceWith(newSpan);
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        input.blur();
      }
    });
  }
});

// Hamburger ikon és nyelvválasztó menü kezelése
const hamburgerIcon = document.getElementById("hamburger-icon");
const languageDropdown = document.getElementById("language-dropdown");

hamburgerIcon.addEventListener("click", () => {
  if (languageDropdown.style.display === "none" || languageDropdown.style.display === "") {
    languageDropdown.style.display = "block";
  } else {
    languageDropdown.style.display = "none";
  }
});

// Service Worker regisztráció (PWA támogatás)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker regisztrálva:', registration.scope);
      })
      .catch(err => {
        console.error('ServiceWorker regisztrációs hiba:', err);
      });
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter: Gyors elem hozzáadás
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('item-input')) {
      const addBtn = activeElement.nextElementSibling;
      if (addBtn && addBtn.classList.contains('item-add-btn')) {
        addBtn.click();
      }
    }
  }
});

// Debug információ a konzolban
console.log('Todo & Shopping List App initialized');
console.log('Language:', document.documentElement.lang || 'hu');
console.log('Firebase config loaded:', !!firebaseConfig.apiKey);

// Tab navigáció kezelése
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Aktív tab frissítése
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Aktív szekció frissítése
      sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active');
      });
      
      const targetSection = document.getElementById(`${targetTab}-section`);
      if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.classList.add('active');
      }
      
      // Speciális működés az egyes fülekhez
      if (targetTab === 'dashboard') {
        updateDashboard();
      } else if (targetTab === 'overview') {
        updateOverview();
      } else if (targetTab === 'calendar') {
        renderCalendar();
        loadEvents();
      } else if (targetTab === 'notes') {
        loadNotes();
      }
    });
  });
}

// Dashboard frissítése
function updateDashboard() {
  updateCurrentTime();
  updateTodayEvents();
  updatePinnedItems();
  updateUrgentTasks();
  updateStreakDisplay();
}

// Dashboard automatikus frissítése minden 30 másodpercben
setInterval(() => {
  if (document.querySelector('.nav-tab[data-tab="dashboard"]').classList.contains('active')) {
    updateDashboard();
  }
}, 30000);

// Aktuális idő frissítése
function updateCurrentTime() {
  const now = new Date();
  const dateElement = document.getElementById('current-date');
  const timeElement = document.getElementById('current-time-display');
  
  if (dateElement && timeElement) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    
    dateElement.textContent = now.toLocaleDateString('hu-HU', options);
    timeElement.textContent = now.toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
}

// Mai események frissítése már implementálva fent

// Kiemelt elemek frissítése
function updatePinnedItems() {
  updatePinnedNotes();
  updatePinnedTasks();
}

// Kiemelt jegyzetek
function updatePinnedNotes() {
  const pinnedNotesList = document.getElementById('pinned-notes-list');
  if (!pinnedNotesList || !auth.currentUser) return;
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes`);
  
  onValue(notesRef, (snapshot) => {
    if (snapshot.exists()) {
      const notes = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(note => note.pinned)
        .slice(0, 3);
      
      if (notes.length === 0) {
        pinnedNotesList.innerHTML = '<p class="no-pinned">Nincs kiemelt jegyzet</p>';
      } else {
        pinnedNotesList.innerHTML = notes.map(note => `
          <div class="pinned-item" onclick="openNoteForEdit('${note.id}')">
            <span class="pinned-title">${note.title}</span>
            <span class="pinned-category">${getCategoryIcon(note.category)}</span>
          </div>
        `).join('');
      }
    } else {
      pinnedNotesList.innerHTML = '<p class="no-pinned">Nincs kiemelt jegyzet</p>';
    }
  });
}

// Kiemelt feladatok
function updatePinnedTasks() {
  const pinnedTasksList = document.getElementById('pinned-tasks-list');
  if (!pinnedTasksList || !auth.currentUser) return;
  
  const listsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
  
  onValue(listsRef, (snapshot) => {
    if (snapshot.exists()) {
      const pinnedLists = Object.entries(snapshot.val())
        .filter(([id, data]) => data.pinned)
        .slice(0, 3);
      
      if (pinnedLists.length === 0) {
        pinnedTasksList.innerHTML = '<p class="no-pinned">Használd a 📌 gombot a listáknál</p>';
      } else {
        pinnedTasksList.innerHTML = pinnedLists.map(([listId, listData]) => `
          <div class="pinned-item" onclick="switchToListsTab('${listId}')">
            <span class="pinned-title">${listData.name}</span>
            <span class="pinned-category">${getCategoryIcon(listData.category)}</span>
          </div>
        `).join('');
      }
    } else {
      pinnedTasksList.innerHTML = '<p class="no-pinned">Használd a 📌 gombot a listáknál</p>';
    }
  });
}

// Listákra váltás és adott lista megjelenítése
function switchToListsTab(listId) {
  // Váltás a listák fülre
  document.querySelector('[data-tab="lists"]').click();
  
  // Kis késleltetés után scroll a listához
  setTimeout(() => {
    const listElement = document.querySelector(`[data-list-id="${listId}"]`);
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      listElement.style.border = '2px solid var(--accent-primary)';
      setTimeout(() => {
        listElement.style.border = '';
      }, 2000);
    }
  }, 100);
}

// Sürgős feladatok frissítése
function updateUrgentTasks() {
  const urgentTasksList = document.getElementById('urgent-tasks-list');
  if (!urgentTasksList) return;
  
  // Itt implementálhatnánk a sürgős feladatok logikáját
  // Egyelőre placeholder
  urgentTasksList.innerHTML = '<p class="no-urgent">Nincs sürgős feladat</p>';
}

// Áttekintés frissítése
async function updateOverview() {
  updateStatistics();
  updateAchievements();
  await generateActivityCalendar();
  updateProductivityInsights();
}

// Aktivitás naptár generálása javítva
async function generateActivityCalendar() {
  const activityCalendar = document.getElementById('activity-calendar');
  if (!activityCalendar) return;
  
  const today = new Date();
  const daysToShow = 70; // 10 hét = 70 nap
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (daysToShow - 1));
  
  let html = '';
  const userActivityData = await getUserActivityData();
  let totalActiveDays = 0;
  let maxStreak = 0;
  let currentStreak = 0;
  let totalActivity = 0;
  
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Tevékenység szint kiszámítása (0-4)
    const activityLevel = getActivityLevelForDate(dateStr, userActivityData);
    const levelClass = activityLevel > 0 ? `level-${activityLevel}` : 'level-0';
    
    if (activityLevel > 0) {
      totalActiveDays++;
      currentStreak++;
      totalActivity += activityLevel;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 0;
    }
    
    html += `<div class="activity-day ${levelClass}" 
                  title="${date.toLocaleDateString('hu-HU')} - ${getActivityDescription(activityLevel)}" 
                  data-date="${dateStr}"></div>`;
  }
  
  // Final streak check
  maxStreak = Math.max(maxStreak, currentStreak);
  
  activityCalendar.innerHTML = html;
  
  // Statisztikák frissítése
  updateActivityStats(totalActiveDays, maxStreak, totalActivity / daysToShow);
}

// Felhasználó aktivitási adatainak lekérése
async function getUserActivityData() {
  if (!auth.currentUser) return {};
  
  const activityData = {};
  
  try {
    // Firebase-ből olvassuk az adatokat
    const promises = [];
    
    // Listák aktivitása
    promises.push(
      get(ref(db, `users/${auth.currentUser.uid}/lists`)).then(snapshot => {
        if (snapshot.exists()) {
          Object.values(snapshot.val()).forEach(list => {
            if (list.items) {
              Object.values(list.items).forEach(item => {
                if (item.timestamp) {
                  const date = new Date(item.timestamp).toISOString().split('T')[0];
                  activityData[date] = (activityData[date] || 0) + 1;
                }
              });
            }
          });
        }
      })
    );
    
    // Jegyzetek aktivitása
    promises.push(
      get(ref(db, `users/${auth.currentUser.uid}/notes`)).then(snapshot => {
        if (snapshot.exists()) {
          Object.values(snapshot.val()).forEach(note => {
            if (note.timestamp) {
              const date = new Date(note.timestamp).toISOString().split('T')[0];
              activityData[date] = (activityData[date] || 0) + 2;
            }
          });
        }
      })
    );
    
    // Események aktivitása
    promises.push(
      get(ref(db, `users/${auth.currentUser.uid}/events`)).then(snapshot => {
        if (snapshot.exists()) {
          Object.values(snapshot.val()).forEach(event => {
            if (event.timestamp) {
              const date = new Date(event.timestamp).toISOString().split('T')[0];
              activityData[date] = (activityData[date] || 0) + 1;
            }
          });
        }
      })
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.warn('Aktivitás adatok betöltési hiba:', error);
  }
  
  return activityData;
}

// Aktivitási szint meghatározása
function getActivityLevelForDate(dateStr, activityData) {
  const activity = activityData[dateStr] || 0;
  
  if (activity === 0) return 0;
  if (activity <= 2) return 1;
  if (activity <= 5) return 2;
  if (activity <= 8) return 3;
  return 4;
}

// Aktivitás leírása
function getActivityDescription(level) {
  const descriptions = {
    0: 'Nincs aktivitás',
    1: 'Alacsony aktivitás',
    2: 'Közepes aktivitás', 
    3: 'Magas aktivitás',
    4: 'Kiemelkedő aktivitás'
  };
  return descriptions[level] || 'Ismeretlen';
}

// Aktivitás statisztikák frissítése
function updateActivityStats(totalDays, maxStreak, avgActivity) {
  const totalElement = document.getElementById('activity-total');
  const streakElement = document.getElementById('activity-streak');
  const avgElement = document.getElementById('activity-avg');
  
  if (totalElement) totalElement.textContent = totalDays;
  if (streakElement) streakElement.textContent = maxStreak;
  if (avgElement) avgElement.textContent = avgActivity.toFixed(1);
}

// Produktivitási betekintések frissítése
function updateProductivityInsights() {
  const insightsList = document.getElementById('insights-list');
  if (!insightsList) return;
  
  // Valós statisztikák alapján generált betekintések
  const totalLists = document.querySelectorAll('.list-box').length;
  const totalItems = document.querySelectorAll('.list-box li').length;
  const completedItems = document.querySelectorAll('.list-box li.done').length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  const insights = [
    { 
      icon: completionRate > 70 ? '📈' : completionRate > 40 ? '📊' : '📉', 
      text: `Teljesítés: ${completionRate}% (${completedItems}/${totalItems} feladat)` 
    },
    { 
      icon: '⭐', 
      text: `${totalLists} aktív lista kezelése` 
    },
    { 
      icon: currentStreak > 0 ? '🔥' : '💤', 
      text: currentStreak > 0 ? `${currentStreak} napos sorozat aktív!` : 'Kezdj új sorozatot ma!' 
    },
    { 
      icon: userLevel >= 3 ? '🏆' : '🎯', 
      text: `${userLevel}. szint - ${userXP} XP összesen` 
    }
  ];
  
  insightsList.innerHTML = insights.map(insight => `
    <div class="insight-item">
      <span class="insight-icon">${insight.icon}</span>
      <span class="insight-text">${insight.text}</span>
    </div>
  `).join('');
}

// Esemény típus ikon
function getEventTypeIcon(type) {
  const icons = {
    birthday: '🎂',
    meeting: '💼',
    reminder: '⏰',
    appointment: '🏥',
    event: '🎉',
    deadline: '📝'
  };
  return icons[type] || '📅';
}

// Kategória ikon
function getCategoryIcon(category) {
  const icons = {
    general: '📝',
    passwords: '🔒',
    ideas: '��',
    important: '⭐',
    work: '💼',
    personal: '👤'
  };
  return icons[category] || '📝';
}

// Jegyzet megnyitása szerkesztéshez
function openNoteForEdit(noteId) {
  editNote(noteId);
}

// Időt folyamatosan frissítjük
setInterval(updateCurrentTime, 1000);

// Alkalmazás inicializálása
document.addEventListener('DOMContentLoaded', () => {
  // Navigáció inicializálása
  initNavigation();
  
  // Dashboard kezdeti betöltése
  updateDashboard();
  
  // Quick actions eseménykezelők
  const quickActionBtns = document.querySelectorAll('.action-btn');
  quickActionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      handleQuickAction(action);
    });
  });
  
  const eventReminderCheckbox = document.getElementById('event-reminder');
  const reminderTimeSelect = document.getElementById('reminder-time');
  
  if (eventReminderCheckbox && reminderTimeSelect) {
    eventReminderCheckbox.addEventListener('change', () => {
      reminderTimeSelect.disabled = !eventReminderCheckbox.checked;
      if (eventReminderCheckbox.checked) {
        reminderTimeSelect.style.opacity = '1';
        reminderTimeSelect.style.pointerEvents = 'auto';
      } else {
        reminderTimeSelect.style.opacity = '0.5';
        reminderTimeSelect.style.pointerEvents = 'none';
      }
    });
  }
  
  // Notification permission kérése
  requestNotificationPermission();
  
  // Közelgő értesítések ellenőrzése
  setTimeout(checkUpcomingNotifications, 2000); // 2 másodperc késleltetéssel
  
  // Nyelv dropdown kezelése
  initLanguageDropdown();
});

// Gyors műveletek kezelése
function handleQuickAction(action) {
  switch(action) {
    case 'quick-task':
      // Váltás a listák fülre és új elem hozzáadás
      document.querySelector('[data-tab="lists"]').click();
      setTimeout(() => {
        const firstInput = document.querySelector('.item-input');
        if (firstInput) firstInput.focus();
      }, 100);
      break;
    case 'quick-note':
      // Váltás a jegyzetek fülre és új jegyzet
      document.querySelector('[data-tab="notes"]').click();
      setTimeout(() => {
        document.getElementById('new-note-btn').click();
      }, 100);
      break;
    case 'quick-event':
      // Váltás a naptár fülre és új esemény
      document.querySelector('[data-tab="calendar"]').click();
      setTimeout(() => {
        document.getElementById('new-event-btn').click();
      }, 100);
      break;
  }
}

// Közelgő események betöltése már implementálva fent

// Az események betöltése implementálva van lent

// Jegyzetek szerkesztése és törlése
function editNote(noteId) {
  if (!auth.currentUser) return;
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  get(notesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      // Modal megnyitása szerkesztési módban
      if (noteModal) {
        noteModal.style.display = 'flex';
        
        // Adatok betöltése
        document.getElementById('note-title').value = noteData.title || '';
        document.getElementById('note-content').value = noteData.content || '';
        document.getElementById('note-category').value = noteData.category || 'general';
        document.getElementById('note-private').checked = noteData.isPrivate || false;
        
        // Modal címének változtatása
        document.getElementById('note-modal-title').textContent = '✏️ Jegyzet szerkesztése';
        
        // Mentés gomb átállítása
        const saveBtn = document.getElementById('save-note');
        saveBtn.textContent = 'Frissítés';
        saveBtn.onclick = () => updateNote(noteId);
      }
    }
  });
}

function updateNote(noteId) {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const isPrivate = document.getElementById('note-private').checked;
  
  if (!title || !content) {
    alert('Kérjük, töltsd ki a címet és a tartalmat!');
    return;
  }
  
  if (!auth.currentUser) return;
  
  const noteRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  const updatedData = {
    title,
    content,
    category,
    isPrivate,
    updatedAt: new Date().toISOString()
  };
  
  update(noteRef, updatedData).then(() => {
    closeNoteModal();
    loadNotes();
    showNotification('✏️ Jegyzet sikeresen frissítve!');
    
    // Mentés gomb visszaállítása
    const saveBtn = document.getElementById('save-note');
    saveBtn.textContent = 'Mentés';
    saveBtn.onclick = saveNote;
    document.getElementById('note-modal-title').textContent = '📒 Új jegyzet';
  }).catch(error => {
    console.error('Hiba a jegyzet frissítése során:', error);
    alert('Hiba történt a jegyzet frissítése során.');
  });
}

function deleteNote(noteId) {
  if (!auth.currentUser) return;
  
  // A jegyzet adatainak betöltése a modal-hoz
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  get(notesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      // Modal megjelenítése
      const deleteModal = document.getElementById('delete-note-modal');
      const titleElement = document.getElementById('delete-note-title');
      const contentElement = document.getElementById('delete-note-content');
      
      if (deleteModal && titleElement && contentElement) {
        titleElement.textContent = noteData.title || 'Cím nélküli jegyzet';
        contentElement.textContent = noteData.content ? 
          (noteData.content.length > 100 ? noteData.content.substring(0, 100) + '...' : noteData.content) : 
          'Tartalom nélküli jegyzet';
        
        deleteModal.style.display = 'flex';
        
        // Törlés megerősítés
        const confirmBtn = document.getElementById('confirm-delete-note');
        const cancelBtn = document.getElementById('cancel-delete-note');
        const closeBtn = document.getElementById('delete-note-modal-close');
        
        const closeModal = () => {
          deleteModal.style.display = 'none';
        };
        
        // Event listeneres cleanup
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;
        closeBtn.onclick = null;
        
        confirmBtn.onclick = () => {
          // Tényleges törlés végrehajtása
          remove(notesRef).then(() => {
            loadNotes();
            showNotification('🗑️ Jegyzet sikeresen törölve!');
            closeModal();
          }).catch(error => {
            console.error('Hiba a jegyzet törlése során:', error);
            alert('Hiba történt a jegyzet törlése során.');
          });
        };
        
        cancelBtn.onclick = closeModal;
        closeBtn.onclick = closeModal;
      }
    }
  }).catch(error => {
    console.error('Hiba a jegyzet betöltése során:', error);
    // Fallback egyszerű megerősítésre
    if (confirm('Biztosan törölni szeretnéd ezt a jegyzetet?')) {
      remove(notesRef).then(() => {
        loadNotes();
        showNotification('🗑️ Jegyzet sikeresen törölve!');
      }).catch(error => {
        console.error('Hiba a jegyzet törlése során:', error);
        alert('Hiba történt a jegyzet törlése során.');
      });
    }
  });
}

// ==============================================
// 📅 NAPTÁR ESEMÉNYEK TELJES IMPLEMENTÁLÁSA
// ==============================================

// Esemény mentés implementálása
function saveEvent() {
  const title = document.getElementById('event-title').value.trim();
  const date = document.getElementById('event-date').value;
  const time = document.getElementById('event-time').value;
  const description = document.getElementById('event-description').value.trim();
  const type = document.getElementById('event-type').value;
  const reminder = document.getElementById('event-reminder').checked;
  const reminderTime = document.getElementById('reminder-time').value;
  
  if (!title || !date) {
    alert('Kérjük, töltsd ki legalább a címet és a dátumot!');
    return;
  }
  
  if (!auth.currentUser) {
    alert('Be kell jelentkezned az esemény mentéséhez!');
    return;
  }
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  const eventData = {
    title,
    date,
    time: time || null,
    description,
    type,
    reminder,
    reminderTime: reminder ? parseInt(reminderTime) : null,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  push(eventsRef, eventData).then(() => {
    closeEventModal();
    loadEvents();
    renderCalendar();
    addXP(3); // XP esemény hozzáadásért
    showNotification('📅 Esemény sikeresen mentve!');
    
    // Emlékeztető beállítása ha szükséges
    if (reminder) {
      scheduleNotification(eventData);
    }
  }).catch(error => {
    console.error('Hiba az esemény mentése során:', error);
    alert('Hiba történt az esemény mentése során.');
  });
}

// Események betöltése a naptárhoz
function loadEvents() {
  if (!auth.currentUser) return;
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  
  onValue(eventsRef, (snapshot) => {
    const calendarEvents = {};
    
    if (snapshot.exists()) {
      Object.entries(snapshot.val()).forEach(([id, data]) => {
        const eventDate = data.date;
        if (!calendarEvents[eventDate]) {
          calendarEvents[eventDate] = [];
        }
        calendarEvents[eventDate].push({ id, ...data });
      });
    }
    
    // Naptár napok frissítése eseményekkel
    updateCalendarWithEvents(calendarEvents);
    
    // Dashboard és közelgő események frissítése
    updateTodayEvents();
    loadUpcomingEvents();
  });
}

// Naptár napok frissítése eseményekkel
function updateCalendarWithEvents(events) {
  const calendarDays = document.querySelectorAll('.calendar-day');
  
  calendarDays.forEach(dayElement => {
    const dayNumber = parseInt(dayElement.textContent);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Skip header days
    if (isNaN(dayNumber)) return;
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    
    // Esemény jelzés eltávolítása
    dayElement.classList.remove('has-event');
    
    // Esemény jelzés hozzáadása ha van esemény
    if (events[dateStr] && events[dateStr].length > 0) {
      dayElement.classList.add('has-event');
      dayElement.title = `${events[dateStr].length} esemény`;
    }
  });
}

// Mai események frissítése Firebase-ből
function updateTodayEvents() {
  if (!auth.currentUser) return;
  
  const todayEventsList = document.getElementById('today-events-list');
  if (!todayEventsList) return;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  
  onValue(eventsRef, (snapshot) => {
    if (snapshot.exists()) {
      const todayEvents = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(event => event.date === todayStr)
        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
      
      if (todayEvents.length === 0) {
        todayEventsList.innerHTML = '<p class="no-events">Nincs mai esemény</p>';
      } else {
        todayEventsList.innerHTML = todayEvents.map(event => `
          <div class="event-preview">
            <div class="event-time">${event.time || 'Egész nap'}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-type">${getEventTypeIcon(event.type)}</div>
          </div>
        `).join('');
      }
    } else {
      todayEventsList.innerHTML = '<p class="no-events">Nincs mai esemény</p>';
    }
  });
}

// Közelgő események betöltése Firebase-ből
function loadUpcomingEvents() {
  if (!auth.currentUser) return;
  
  const upcomingEventsList = document.getElementById('upcoming-events-list');
  if (!upcomingEventsList) return;
  
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const todayStr = today.toISOString().split('T')[0];
  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  
  onValue(eventsRef, (snapshot) => {
    if (snapshot.exists()) {
      const upcomingEvents = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(event => event.date >= todayStr && event.date <= nextWeekStr)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare === 0) {
            return (a.time || '00:00').localeCompare(b.time || '00:00');
          }
          return dateCompare;
        });
      
      if (upcomingEvents.length === 0) {
        upcomingEventsList.innerHTML = '<p class="no-events">Nincs közelgő esemény</p>';
      } else {
        upcomingEventsList.innerHTML = upcomingEvents.map(event => `
          <div class="upcoming-event">
            <div class="event-date">${new Date(event.date).toLocaleDateString('hu-HU')}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-type">${getEventTypeIcon(event.type)}</div>
            <button class="delete-event-btn" onclick="deleteEvent('${event.id}')" title="Esemény törlése">
              <span class="material-icons">delete</span>
            </button>
          </div>
        `).join('');
      }
    } else {
      upcomingEventsList.innerHTML = '<p class="no-events">Nincs közelgő esemény</p>';
    }
  });
}

// Emlékeztető ütemezése
function scheduleNotification(eventData) {
  const eventDateTime = new Date(`${eventData.date}T${eventData.time || '00:00'}`);
  const reminderTime = eventData.reminderTime || 0;
  const notificationTime = new Date(eventDateTime.getTime() - (reminderTime * 60000));
  
  const now = new Date();
  const timeUntilNotification = notificationTime.getTime() - now.getTime();
  
  if (timeUntilNotification > 0 && timeUntilNotification <= 24 * 60 * 60 * 1000) { // 24 óráig előre
    setTimeout(() => {
      showEventNotification(eventData);
    }, timeUntilNotification);
    console.log(`Emlékeztető beállítva ${eventData.title} eseményhez: ${new Date(notificationTime).toLocaleString()}`);
  }
}

// Rendszeres ellenőrzés közelgő eseményekre
function checkUpcomingNotifications() {
  if (!auth.currentUser) return;
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  get(eventsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const events = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
      
      events.forEach(event => {
        if (event.reminder && event.reminderTime) {
          scheduleNotification(event);
        }
      });
    }
  });
}

// Értesítések ellenőrzése minden 5 percben
setInterval(checkUpcomingNotifications, 5 * 60 * 1000);

// Esemény értesítés megjelenítése
function showEventNotification(eventData) {
  // Browser notification kérése
  if (Notification.permission === 'granted') {
    new Notification(`📅 Közelgő esemény: ${eventData.title}`, {
      body: `${eventData.time || 'Egész nap'} - ${eventData.description || ''}`,
      icon: '/favicon-32x32.png'
    });
  }
  
  // Alkalmazáson belüli notification is
  showNotification(`📅 Emlékeztető: ${eventData.title} - ${eventData.time || 'Egész nap'}`);
}

// Notification permission kérése
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Nyelv dropdown inicializálása
function initLanguageDropdown() {
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const languageDropdown = document.getElementById('language-dropdown');
  
  if (hamburgerIcon && languageDropdown) {
    // Aktuális nyelv jelzése
    markCurrentLanguage();
    
    hamburgerIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      // CSS class alapú megjelenítés használata style.display helyett
      languageDropdown.classList.toggle('show');
      console.log('Language dropdown toggled:', languageDropdown.classList.contains('show'));
    });
    
    // Kívülre kattintás esetén bezárás
    document.addEventListener('click', (e) => {
      if (!hamburgerIcon.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageDropdown.classList.remove('show');
      }
    });
    
    // Nyelv linkekre kattintás
    const languageLinks = languageDropdown.querySelectorAll('a');
    languageLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
        languageDropdown.classList.remove('show');
      });
    });
  }
}

// Aktuális nyelv jelölése
function markCurrentLanguage() {
  const currentPath = window.location.pathname;
  const languageLinks = document.querySelectorAll('.language-dropdown a');
  const languageText = document.querySelector('.language-text');
  
  languageLinks.forEach(link => {
    link.classList.remove('current');
    
    // Ellenőrizzük az aktuális oldalt
    if (currentPath.includes('en-index.html') && link.href.includes('en-index.html')) {
      link.classList.add('current');
      if (languageText) languageText.textContent = 'EN';
    } else if (currentPath.includes('de-index.html') && link.href.includes('de-index.html')) {
      link.classList.add('current');
      if (languageText) languageText.textContent = 'DE';
    } else if ((!currentPath.includes('en-index.html') && !currentPath.includes('de-index.html')) 
               && link.href.includes('index.html') && !link.href.includes('en-') && !link.href.includes('de-')) {
      link.classList.add('current');
      if (languageText) languageText.textContent = 'HU';
    }
  });
}

// Globális függvények elérhetővé tétele
window.editNote = editNote;
window.deleteNote = deleteNote;
window.togglePinNote = togglePinNote;
window.deleteEvent = deleteEvent;
window.togglePinList = togglePinList;
window.switchToListsTab = switchToListsTab;

// Lista kiemelés/kiemelés eltávolítása
function togglePinList(listId) {
  if (!auth.currentUser) return;
  
  const listRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}`);
  
  get(listRef).then((snapshot) => {
    if (snapshot.exists()) {
      const currentPinned = snapshot.val().pinned || false;
      
      update(listRef, { 
        pinned: !currentPinned,
        updatedAt: new Date().toISOString()
      }).then(() => {
        updatePinnedTasks();
        showNotification(!currentPinned ? '📌 Lista kiemelt!' : '📌 Kiemelés eltávolítva!');
      });
    }
  });
}
