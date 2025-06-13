// === IMMEDIATE DEBUG LOGGING ===
console.log('🟢 EXTERNAL JS FILE LOADING - index.js started');
console.log('🟢 Script execution beginning at:', new Date().toLocaleTimeString());
console.log('🟢 If you see this, the JS file is loading properly');

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, set, get, query, orderByChild, update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log('📦 Firebase imports loaded successfully');

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

console.log('🔧 Firebase initialized, defining PWA functions...');

// ===== IMMEDIATE GLOBAL PWA FUNCTIONS =====
// Ezek azonnal elérhetők lesznek, DOM betöltés nélkül is
window.showPWAButton = function() {
  console.log('🔧 showPWAButton() called');
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('✅ PWA button shown');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
    console.log('💡 Try calling this function after page load');
  }
};

window.hidePWAButton = function() {
  console.log('🔧 hidePWAButton() called');
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'none';
    console.log('✅ PWA button hidden');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
  }
};

window.debugPWA = function() {
  console.log('🔧 debugPWA() called');
  const container = document.getElementById('pwa-floating-install');
  const btn = document.getElementById('pwa-install-btn');
  const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
  const userDismissedTime = localStorage.getItem('pwa-user-dismissed');
  
  console.log('🔍 PWA DEBUG INFO:');
  console.log('  - container found:', !!container);
  console.log('  - button found:', !!btn);
  console.log('  - deferredPrompt:', typeof deferredPrompt !== 'undefined' ? !!deferredPrompt : 'not defined');
  console.log('  - display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
  console.log('  - iOS standalone:', window.navigator.standalone === true);
  console.log('  - container display:', container ? container.style.display : 'N/A');
  console.log('  - DOM ready:', document.readyState);
  console.log('  - recently installed:', wasRecentlyInstalled ? new Date(parseInt(wasRecentlyInstalled)).toLocaleString() : 'no');
  console.log('  - user dismissed until:', userDismissedTime ? new Date(parseInt(userDismissedTime)).toLocaleString() : 'no');
  console.log('  - Current timestamp:', new Date().toLocaleTimeString());
  console.log('💡 Use resetPWA() to clear localStorage flags');
};

window.installPWA = function() {
  console.log('🔧 installPWA() called');
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.click();
    console.log('✅ PWA install triggered');
  } else {
    console.error('❌ PWA install button not found! DOM might not be ready yet.');
  }
};

// PWA Reset funkció fejlesztéshez
window.resetPWA = function() {
  localStorage.removeItem('pwa-recently-installed');
  localStorage.removeItem('pwa-user-dismissed');
  console.log('🧹 PWA localStorage flags cleared');
  console.log('🔄 Refresh the page to see install button again');
};

// Test hogy a függvények elérhetők-e
console.log('✅ IMMEDIATE PWA functions defined successfully!');
console.log('🔧 Test immediately: debugPWA()');
console.log('📱 Available commands: showPWAButton(), hidePWAButton(), debugPWA(), installPWA(), resetPWA()');

// Immediate test
setTimeout(() => {
  console.log('🔧 Auto-testing PWA functions after 1 second...');
  if (typeof window.debugPWA === 'function') {
    console.log('✅ debugPWA function is accessible');
  } else {
    console.error('❌ debugPWA function is NOT accessible');
  }
}, 1000);

// ===============================================
// 🚀 PROGRESSIVE WEB APP SETUP
// ===============================================

// PWA Installation Prompt
let deferredPrompt = null;
let serviceWorkerRegistration = null;

// Service Worker regisztrálása
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        serviceWorkerRegistration = registration;
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New Service Worker available');
              showNotification('🔄 Új verzió elérhető! Frissítsd az oldalt.');
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// PWA Install Event
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA install prompt available');
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  console.log('PWA install prompt ready');
  
  // Ellenőrizzük, hogy szabad-e megjeleníteni
  setTimeout(() => {
    const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
    const userDismissedRecently = localStorage.getItem('pwa-user-dismissed');
    
    if (!wasRecentlyInstalled && !userDismissedRecently) {
      if (typeof pwaInstall !== 'undefined' && pwaInstall.showInstallButton) {
        pwaInstall.showInstallButton();
        console.log('📱 PWA install button shown');
      }
    } else {
      console.log('🔕 PWA install button not shown - user preference/status');
    }
  }, 500); // Kis késleltetés, hogy az elem biztosan létezzen
});

// PWA Installed Event
window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed');
  showNotification('🎉 Alkalmazás sikeresen telepítve!');
  deferredPrompt = null;
  
  // Jegyezzük meg, hogy telepítették
  localStorage.setItem('pwa-recently-installed', Date.now().toString());
  console.log('📝 PWA installation marked in localStorage');
  
  // Elrejtjük a telepítési gombot
  if (typeof pwaInstall !== 'undefined' && pwaInstall.hideInstallButton) {
    pwaInstall.hideInstallButton();
  }
});

// DOM elemek – Autentikáció
const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const authPasswordInput = document.getElementById("auth-password-input");
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

// Modern téma választó rendszer
let currentTheme = {
  name: 'default',
  mode: 'light'
};

// Hátramaradó régi téma változók (kompatibilitásért)
let isDarkTheme = false;

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

// Globális változók elérhetővé tétele
window.userLevel = userLevel;
window.userXP = userXP;
window.currentStreak = currentStreak;

// Gyors hozzáadás FAB
const quickAddFab = document.getElementById("quick-add-fab");
const quickAddModal = document.getElementById("quick-add-modal");
const quickAddText = document.getElementById("quick-add-text");
const quickAddListSelect = document.getElementById("quick-add-list-select");
const quickAddSubmit = document.getElementById("quick-add-submit");
const quickAddCancel = document.getElementById("quick-add-cancel");

// Quick task modal elemek
const quickTaskModal = document.getElementById("quick-task-modal");
const quickTaskText = document.getElementById("quick-task-text");
const quickTaskListSelect = document.getElementById("quick-task-list-select");
const quickTaskSubmit = document.getElementById("quick-task-submit");
const quickTaskCancel = document.getElementById("quick-task-cancel");

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
    
    // Logout button is now in the profile menu - no need to show/hide
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
    
    // updateAchievements csak akkor hívható, ha a translations már inicializálva van
    // Ezért setTimeout-tal késleltetjük
    setTimeout(() => {
      updateAchievements();
    }, 500);
    
    // Azonnali dashboard frissítés
    updateDashboard();
    
    // Téma betöltése Firebase-ből
    loadThemeFromFirebase();
    
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
    
    // Logout button is now in the profile menu - no need to show/hide
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

  // Segédfüggvény a sortable példány biztonságos megsemmisítésére
  function destroySortableInstance() {
    if (sortableInstance) {
      try {
        // Ellenőrizzük, hogy a sortable példány még érvényes-e
        if (sortableInstance.el && sortableInstance.el.parentNode) {
          sortableInstance.destroy();
        }
      } catch (error) {
        console.warn('Error destroying sortable instance:', error);
      }
      sortableInstance = null;
    }
  }

  // Sortable inicializálása és kezelése
    function initializeSortable() {
    // Biztonságosan megsemmisítjük a meglévő példányt
    destroySortableInstance();
  
  // Ellenőrizzük, hogy a listsContainer létezik és van benne elem
  if (isReorderingEnabled && listsContainer && listsContainer.parentNode) {
    try {
      sortableInstance = Sortable.create(listsContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function(evt) {
          console.log("Drag end event fired");
          if (!listsContainer || !listsContainer.children) {
            console.warn("Lists container no longer exists");
            return;
          }
          
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
              if (auth.currentUser) {
                loadUserLists(auth.currentUser.uid);
              }
            })
            .catch((error) => {
              console.error("Error updating order for one or more lists:", error);
            });
        }
      });
    } catch (error) {
      console.error('Error creating sortable instance:', error);
      sortableInstance = null;
    }
  }
}

// Toggle gomb eseménykezelő
if (toggleReorderBtn) {
  toggleReorderBtn.addEventListener("click", () => {
    isReorderingEnabled = !isReorderingEnabled;
    
    if (isReorderingEnabled) {
      // Használjuk a getText függvényt a lokalizációhoz
      updateButtonText(toggleReorderBtn, getText('lists.disable_reorder') || "Átrendezés letiltása");
      toggleReorderBtn.classList.add("active");
      if (listsContainer) {
        listsContainer.classList.add("reorder-enabled");
      }
    } else {
      updateButtonText(toggleReorderBtn, getText('lists.reorder') || "Átrendezés");
      toggleReorderBtn.classList.remove("active");
      if (listsContainer) {
        listsContainer.classList.remove("reorder-enabled");
      }
    }
    
    initializeSortable();
  });
}

// Régi téma rendszer eltávolítva - modern theme selector használata

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
    } else if (targetTab === 'overview') {
      updateOverview();
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
      editNote(noteId);
    } else {
      // Új jegyzet mód
      clearNoteModal();
      // Visszaállítjuk a mentés gombot új jegyzet módra
      const saveBtn = document.getElementById('save-note');
      if (saveBtn) {
        // Eltávolítjuk a régi event listener-t
        saveBtn.removeEventListener('click', saveNote);
        // Új event listener hozzáadása
        saveBtn.addEventListener('click', saveNote);
        saveBtn.textContent = getText ? getText('notes.save') : 'Mentés';
      }
      // Modal cím visszaállítása
      const noteModalTitle = document.getElementById('note-modal-title');
      if (noteModalTitle) {
        noteModalTitle.textContent = getText ? getText('notes.note_title') : '📒 Új jegyzet';
      }
    }
    
    // Jelszó mező megjelenítés/elrejtés beállítása
    setupPasswordToggle();
  }
}

// Jelszó mező megjelenítés/elrejtés beállítása
function setupPasswordToggle() {
  const privateCheckbox = document.getElementById('note-private');
  const passwordSection = document.getElementById('note-password-section');
  const passwordInput = document.getElementById('note-password');
  
  if (!privateCheckbox || !passwordSection || !passwordInput) return;
  
  // Kezdeti állapot beállítása
  togglePasswordSection();
  
  // Eseménykezelő a checkbox-ra (csak egyszer adjuk hozzá)
  privateCheckbox.removeEventListener('change', togglePasswordSection);
  privateCheckbox.addEventListener('change', togglePasswordSection);
  
  function togglePasswordSection() {
    if (privateCheckbox.checked) {
      passwordSection.style.display = 'block';
      passwordInput.required = true;
    } else {
      passwordSection.style.display = 'none';
      passwordInput.required = false;
      passwordInput.value = '';
    }
  }
}

function editNote(noteId) {
  if (!auth.currentUser) return;
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  get(notesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      // Ha jelszóval védett, kérjük be a jelszót
      if (noteData.hasPassword && noteData.isPrivate) {
        requestPasswordForEdit(noteId, noteData);
      } else {
        // Normál jegyzet szerkesztése
        openEditModal(noteData, noteId);
      }
    }
  });
}

// Közvetlen szerkesztés már feloldott tartalommal (jelszó modal nélkül)
function editNoteDirectly(noteId, title, content, category) {
  if (!auth.currentUser) return;
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  get(notesRef).then((snapshot) => {
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      // Feloldott tartalommal építjük az editableNoteData-t
      const editableNoteData = {
        ...noteData,
        title: title,
        content: content,
        category: category
      };
      
      // Közvetlenül megnyitjuk a szerkesztő modal-t jelszó nélkül
      openEditModal(editableNoteData, noteId);
    }
  });
}

// Jelszó bekérése szerkesztéshez
function requestPasswordForEdit(noteId, noteData) {
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const passwordMessage = document.getElementById('password-modal-message');
  
  // Modal megjelenítése
  passwordModal.style.display = 'flex';
  passwordMessage.textContent = getText('notes.password_edit_prompt');
  
  // Input mező tisztítása és fókusz
  passwordInput.value = '';
  passwordError.style.display = 'none';
  setTimeout(() => passwordInput.focus(), 100);
  
  // Enter lenyomására is működjön
  passwordInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      attemptEditUnlock(noteId, noteData);
    }
  };
  
  // Modal gombjai
  document.getElementById('password-submit').onclick = () => attemptEditUnlock(noteId, noteData);
  document.getElementById('password-cancel').onclick = closePasswordModal;
  document.getElementById('password-modal-close').onclick = closePasswordModal;
}

// Szerkesztési feloldás kísérlet
async function attemptEditUnlock(noteId, noteData) {
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const inputPassword = passwordInput.value.trim();
  
  if (!inputPassword) {
    passwordError.textContent = getText('notes.password_error_empty');
    passwordError.style.display = 'block';
    return;
  }
  
  try {
    // Jelszó ellenőrzése
    const isValidPassword = await verifyPassword(inputPassword, noteData.passwordHash);
    
    if (isValidPassword) {
      // Sikeres feloldás - tartalom visszafejtése és szerkesztő modal megnyitása
      const decryptedContent = decryptContent(noteData.content, inputPassword);
      
      if (decryptedContent !== null) {
        closePasswordModal();
        // Visszafejtett tartalommal töltjük fel a szerkesztő modal-t
        const editableNoteData = {
          ...noteData,
          content: decryptedContent
        };
        openEditModal(editableNoteData, noteId, inputPassword);
              } else {
          passwordError.textContent = getText('notes.password_error_decrypt');
          passwordError.style.display = 'block';
        }
      } else {
        passwordError.textContent = getText('notes.password_error_wrong');
        passwordError.style.display = 'block';
        passwordInput.select();
      }
  } catch (error) {
    console.error('Hiba a jegyzet feloldása során:', error);
    passwordError.textContent = getText('notes.password_error_access');
    passwordError.style.display = 'block';
  }
}

// Szerkesztő modal megnyitása
function openEditModal(noteData, noteId, currentPassword = '') {
  // Modal megnyitása szerkesztési módban
  if (noteModal) {
    noteModal.style.display = 'flex';
    
    // Adatok betöltése
    document.getElementById('note-title').value = noteData.title || '';
    document.getElementById('note-content').value = noteData.content || '';
    document.getElementById('note-category').value = noteData.category || 'general';
    document.getElementById('note-private').checked = noteData.isPrivate || false;
    
    // Ha van jelenlegi jelszó, töltsük be
    if (currentPassword) {
      document.getElementById('note-password').value = currentPassword;
    } else {
      // Ha nincs jelszó, hagyjuk üresen 
      document.getElementById('note-password').value = '';
    }
    
    // Modal címének változtatása
    document.getElementById('note-modal-title').textContent = getText ? getText('notes.edit_note') : '✏️ Jegyzet szerkesztése';
    
    // Mentés gomb átállítása
    const saveBtn = document.getElementById('save-note');
    if (saveBtn) {
      // Klónozzuk a gombot hogy minden event listener eltávolodjon
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
      // Új event listener hozzáadása
      newSaveBtn.addEventListener('click', () => updateNote(noteId));
      newSaveBtn.textContent = getText ? getText('notes.update') : 'Frissítés';
    }
    
    // Jelszó mező megjelenítés/elrejtés beállítása
    setupPasswordToggle();
  }
}

async function updateNote(noteId) {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const isPrivate = document.getElementById('note-private').checked;
  const password = document.getElementById('note-password').value.trim();
  
  if (!title || !content) {
    showNotification('Kérjük, töltsd ki a címet és a tartalmat!', 'error');
    return;
  }
  
  if (isPrivate && !password) {
    showNotification(getText('notes.password_required'), 'error');
    return;
  }
  
  if (!auth.currentUser) {
    showNotification('Be kell jelentkezned a jegyzet frissítéséhez!', 'error');
    return;
  }
  
  const noteRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  
  try {
    // Ellenőrizzük, hogy a jegyzet létezik-e
    const snapshot = await get(noteRef);
    if (snapshot.exists()) {
      // Ha bizalmas, akkor titkosítjuk a tartalmat
      let finalContent = content;
      let hashedPassword = null;
      
      if (isPrivate && password) {
        finalContent = encryptContent(content, password);
        hashedPassword = await hashPassword(password);
      }
      
      const updatedData = {
        title,
        content: finalContent,
        category,
        isPrivate,
        hasPassword: isPrivate && !!password,
        passwordHash: hashedPassword,
        updatedAt: new Date().toISOString()
      };
      
      // Csak akkor frissítjük, ha a jegyzet létezik
      await update(noteRef, updatedData);
      closeNoteModal();
      loadNotes();
      showNotification('✏️ Jegyzet sikeresen frissítve!');
    } else {
      showNotification('A jegyzet nem található!', 'error');
    }
  } catch (error) {
    console.error('Hiba a jegyzet frissítése során:', error);
    showNotification('Hiba történt a jegyzet frissítése során.', 'error');
  }
}

function closeNoteModal() {
  if (noteModal) {
    noteModal.style.display = 'none';
    // Visszaállítjuk a modal állapotát
    clearNoteModal();
    // Visszaállítjuk a mentés gombot új jegyzet módra
    const saveBtn = document.getElementById('save-note');
    if (saveBtn) {
      // Klónozzuk a gombot hogy minden event listener eltávolodjon
      const newSaveBtn = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
      // Új event listener hozzáadása
      newSaveBtn.addEventListener('click', saveNote);
      newSaveBtn.textContent = getText ? getText('notes.save') : 'Mentés';
    }
    // Modal cím visszaállítása
    const noteModalTitle = document.getElementById('note-modal-title');
    if (noteModalTitle) {
      noteModalTitle.textContent = getText ? getText('notes.note_title') : '📒 Új jegyzet';
    }
  }
}

function clearNoteModal() {
  document.getElementById('note-title').value = '';
  document.getElementById('note-content').value = '';
  document.getElementById('note-category').value = 'general';
  document.getElementById('note-private').checked = false;
  document.getElementById('note-password').value = '';
  
  // Jelszó mező elrejtése
  const passwordSection = document.getElementById('note-password-section');
  if (passwordSection) {
    passwordSection.style.display = 'none';
  }
}

async function saveNote() {
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const category = document.getElementById('note-category').value;
  const isPrivate = document.getElementById('note-private').checked;
  const password = document.getElementById('note-password').value.trim();
  
  if (!title || !content) {
    alert('Kérjük, töltsd ki a címet és a tartalmat!');
    return;
  }
  
  if (isPrivate && !password) {
    alert(getText('notes.password_required'));
    return;
  }
  
  if (!auth.currentUser) {
    alert('Be kell jelentkezned a jegyzet mentéséhez!');
    return;
  }
  
  const notesRef = ref(db, `users/${auth.currentUser.uid}/notes`);
  
  try {
    // Ha bizalmas, akkor titkosítjuk a tartalmat
    let finalContent = content;
    let hashedPassword = null;
    
    if (isPrivate && password) {
      finalContent = encryptContent(content, password);
      hashedPassword = await hashPassword(password);
    }
    
    const noteData = {
      title,
      content: finalContent,
      category,
      isPrivate,
      hasPassword: isPrivate && !!password,
      passwordHash: hashedPassword,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    await push(notesRef, noteData);
    closeNoteModal();
    loadNotes();
    addXP(5); // XP jegyzet mentésért
    showNotification(getText('notifications.note_saved'));
    
    // Teljes adatfrissítés
    await forceRefreshAllData();
  } catch (error) {
    console.error('Hiba a jegyzet mentése során:', error);
    alert('Hiba történt a jegyzet mentése során.');
  }
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
  
  // Ha jelszóval védett, adjuk hozzá a védett osztályt
  const isPasswordProtected = note.hasPassword && note.isPrivate;
  if (isPasswordProtected) {
    noteCard.classList.add('password-protected');
  }
  
  // Kategória ikon
  const categoryIcons = {
    general: '📝',
    passwords: '🔒',
    ideas: '💡',
    important: '⭐',
    work: '💼',
    personal: '👤'
  };
  
  // Tartalom megjelenítése - védett vagy normal
  let contentDisplay = note.content;
  let overlayHtml = '';
  
  if (isPasswordProtected) {
    contentDisplay = '🔒 Ez egy jelszóval védett bizalmas jegyzet. A tartalom megtekintéséhez szükséges a jelszó megadása.';
    overlayHtml = `
      <div class="note-content-overlay">
        <div class="unlock-prompt">
          <span class="material-icons">lock</span>
          <h4>${getText('notes.protected_content')}</h4>
          <p>${getText('notes.password_required_view')}</p>
          <button class="unlock-btn" onclick="requestNotePassword('${note.id}')">
            ${getText('notes.unlock_note')}
          </button>
        </div>
      </div>
    `;
  }
  
  noteCard.innerHTML = `
    <div class="note-header">
      <h4 class="note-title">${categoryIcons[note.category] || '📝'} ${note.title}</h4>
      <span class="note-category">${note.category}</span>
    </div>
    <div class="note-content">${contentDisplay}</div>
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
    ${overlayHtml}
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

// Jelszó bekérése a jegyzet megjelenítéséhez
function requestNotePassword(noteId) {
  const passwordModal = document.getElementById('password-modal');
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  
  // Modal megjelenítése
  passwordModal.style.display = 'flex';
  
  // Szövegek beállítása
  const passwordMessage = document.getElementById('password-modal-message');
  if (passwordMessage) {
    passwordMessage.textContent = getText('notes.password_prompt');
  }
  
  // Input mező tisztítása és fókusz
  passwordInput.value = '';
  passwordError.style.display = 'none';
  setTimeout(() => passwordInput.focus(), 100);
  
  // Enter lenyomására is működjön
  passwordInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      attemptUnlockNote(noteId);
    }
  };
  
  // Modal gombjai
  document.getElementById('password-submit').onclick = () => attemptUnlockNote(noteId);
  document.getElementById('password-cancel').onclick = closePasswordModal;
  document.getElementById('password-modal-close').onclick = closePasswordModal;
}

// Jegyzet feloldási kísérlet
async function attemptUnlockNote(noteId) {
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const inputPassword = passwordInput.value.trim();
  
  if (!inputPassword) {
    passwordError.textContent = getText('notes.password_error_empty');
    passwordError.style.display = 'block';
    return;
  }
  
  if (!auth.currentUser) return;
  
  const noteRef = ref(db, `users/${auth.currentUser.uid}/notes/${noteId}`);
  
  try {
    const snapshot = await get(noteRef);
    if (snapshot.exists()) {
      const noteData = snapshot.val();
      
      // Jelszó ellenőrzése
      const isValidPassword = await verifyPassword(inputPassword, noteData.passwordHash);
      
      if (isValidPassword) {
        // Sikeres feloldás - tartalom visszafejtése és megjelenítése
        const decryptedContent = decryptContent(noteData.content, inputPassword);
        
        if (decryptedContent !== null) {
          showUnlockedNote(noteId, noteData.title, decryptedContent, noteData.category);
          closePasswordModal();
        } else {
          passwordError.textContent = getText('notes.password_error_decrypt');
          passwordError.style.display = 'block';
        }
      } else {
        passwordError.textContent = getText('notes.password_error_wrong');
        passwordError.style.display = 'block';
        passwordInput.select();
      }
    }
  } catch (error) {
    console.error('Hiba a jegyzet feloldása során:', error);
    passwordError.textContent = getText('notes.password_error_access');
    passwordError.style.display = 'block';
  }
}

// Feloldott jegyzet megjelenítése
function showUnlockedNote(noteId, title, content, category) {
  const categoryIcons = {
    general: '📝',
    passwords: '🔒',
    ideas: '💡',
    important: '⭐',
    work: '💼',
    personal: '👤'
  };
  
  // Új modal a feloldott tartalomhoz
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>${categoryIcons[category] || '📝'} ${title}</h3>
        <button class="close-btn">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="modal-body">
        <div style="white-space: pre-wrap; line-height: 1.6; color: var(--text-primary);">
          ${content}
        </div>
      </div>
      <div class="modal-footer">
        <button class="primary-btn edit-note-btn">${getText('notes.edit')}</button>
        <button class="secondary-btn close-modal-btn">${getText('notes.close')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listener-ek hozzáadása
  const closeBtn = modal.querySelector('.close-btn');
  const editBtn = modal.querySelector('.edit-note-btn');
  const closeModalBtn = modal.querySelector('.close-modal-btn');
  
  closeBtn.addEventListener('click', () => modal.remove());
  closeModalBtn.addEventListener('click', () => modal.remove());
  editBtn.addEventListener('click', () => {
    modal.remove(); // Bezárjuk a megtekintő modal-t
    // Közvetlenül nyissuk meg a szerkesztő modal-t anélkül, hogy újra bekérnénk a jelszót
    editNoteDirectly(noteId, title, content, category); // Szerkesztő modal megnyitása
  });
  
  // Kattintás a modal háttérre bezárja
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Jelszó modal bezárása
function closePasswordModal() {
  const passwordModal = document.getElementById('password-modal');
  passwordModal.style.display = 'none';
  
  // Eseménykezelők tisztítása
  document.getElementById('password-input').onkeypress = null;
  document.getElementById('password-submit').onclick = null;
  document.getElementById('password-cancel').onclick = null;
  document.getElementById('password-modal-close').onclick = null;
}

// ==============================================
// 🔐 JEGYZET TITKOSÍTÁS
// ==============================================

// Egyszerű jelszó hash (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Tartalom titkosítás (egyszerű XOR alapú)
function encryptContent(content, password) {
  let encrypted = '';
  for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    const keyChar = password.charCodeAt(i % password.length);
    encrypted += String.fromCharCode(charCode ^ keyChar);
  }
  return btoa(encrypted); // Base64 kódolás
}

// Tartalom visszafejtés
function decryptContent(encryptedContent, password) {
  try {
    const encrypted = atob(encryptedContent); // Base64 dekódolás
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i);
      const keyChar = password.charCodeAt(i % password.length);
      decrypted += String.fromCharCode(charCode ^ keyChar);
    }
    return decrypted;
  } catch (error) {
    return null; // Hibás jelszó vagy sérült adat
  }
}

// Jelszó ellenőrzés
async function verifyPassword(inputPassword, storedHash) {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
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
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthName = getText(`calendar.months.${monthKeys[month]}`);
  monthYearDisplay.textContent = `${monthName} ${year}`;
  
  // Naptár rács törlése
  calendarGrid.innerHTML = '';
  
  // Hét napjai header
  const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayNames = dayKeys.map(day => getText(`calendar.days.${day}`));
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

// Timezone-safe dátum formázás YYYY-MM-DD formátumban
function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function openEventModal(selectedDate = null, showExistingEvents = false) {
  if (!auth.currentUser) {
    showNotification('⚠️ Be kell jelentkezned az esemény kezeléséhez!');
    return;
  }

  if (eventModal) {
    eventModal.style.display = 'flex';
    clearEventModal(); // Tisztítsuk meg a modal-t
    
    if (selectedDate) {
      const dateInput = document.getElementById('event-date');
      if (dateInput) {
        const dateStr = formatDateToString(selectedDate);
        dateInput.value = dateStr;
        
        // Csak akkor mutassuk meg a meglévő eseményeket, ha explicit kérjük
        if (showExistingEvents) {
          const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
          get(eventsRef).then((snapshot) => {
            if (snapshot.exists()) {
              const dayEvents = Object.entries(snapshot.val())
                .filter(([id, data]) => data.date === dateStr)
                .map(([id, data]) => ({ id, ...data }));
              
              if (dayEvents.length > 0) {
                showDayEventsModal(dayEvents, dateStr);
              }
            }
          });
        }
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
  window.userXP = userXP;
  
  // Szint ellenőrzése
  const newLevel = Math.floor(userXP / 100) + 1;
  if (newLevel > userLevel) {
    userLevel = newLevel;
    window.userLevel = userLevel;
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
      
      // Window objektumon is frissítjük
      window.userLevel = userLevel;
      window.userXP = userXP;
      window.currentStreak = currentStreak;
      
      updateLevelDisplay();
      updateStreakDisplay();
    }
  });
}

async function updateStreakDisplay() {
  const streakElement = document.getElementById('current-streak');
  if (!streakElement || !auth.currentUser) return;
  
  try {
    const userActivityData = await getUserActivityData();
    
    // Sorozat számítása visszafelé a mai naptól
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = formatDateToString(currentDate);
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
    window.currentStreak = currentStreak;
  } catch (error) {
    console.error('Error updating streak display:', error);
    streakElement.textContent = '0';
    currentStreak = 0;
    window.currentStreak = currentStreak;
  }
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
  
  // Ellenőrizzük, hogy a translations inicializálva van-e
  if (!translations || Object.keys(translations).length === 0) {
    console.warn('Translations not loaded yet, skipping achievements update');
    return;
  }
  
  const achievements = [
    {
      id: 'first-task',
      icon: '🎯',
      condition: () => userXP >= 2,
      xpReward: 5
    },
    {
      id: 'task-master',
      icon: '⭐',
      condition: () => userXP >= 20,
      xpReward: 15
    },
    {
      id: 'list-creator',
      icon: '📝',
      condition: () => userXP >= 30,
      xpReward: 20
    },
    {
      id: 'note-taker',
      icon: '📒',
      condition: () => userXP >= 25,
      xpReward: 10
    },
    {
      id: 'level-up',
      icon: '🏆',
      condition: () => userLevel >= 2,
      xpReward: 25
    },
    {
      id: 'streak-3',
      icon: '🔥',
      condition: () => currentStreak >= 3,
      xpReward: 15
    },
    {
      id: 'streak-7',
      icon: '👑',
      condition: () => currentStreak >= 7,
      xpReward: 50
    },
    {
      id: 'explorer',
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
    
    const title = getText(`achievements.${achievement.id.replace('-', '_')}.title`);
    const description = getText(`achievements.${achievement.id.replace('-', '_')}.description`);
    
          const unlockedText = isUnlocked ? '🔓 ' + (currentLanguage === 'en' ? 'Unlocked!' : currentLanguage === 'de' ? 'Erreicht!' : 'Elérve!') : 
                                           '🔒 ' + (currentLanguage === 'en' ? 'Locked' : currentLanguage === 'de' ? 'Gesperrt' : 'Zárva');
      
      badgeElement.innerHTML = `
        <div class="badge-icon">${achievement.icon}</div>
        <div class="badge-title">${title}</div>
        <div class="badge-description">${description}</div>
        <div class="badge-${isUnlocked ? 'unlocked' : 'locked'}">${unlockedText}</div>
        ${progressHTML}
      `;
    
    achievementBadges.appendChild(badgeElement);
  });
}

// Event listeners hozzáadása
if (newNoteBtn) newNoteBtn.addEventListener('click', () => openNoteModal());
if (saveNoteBtn) {
  // Eltávolítjuk a régi event listener-t
  saveNoteBtn.removeEventListener('click', saveNote);
  // Új event listener hozzáadása
  saveNoteBtn.addEventListener('click', saveNote);
}
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

// Quick task modal event listeners
if (quickTaskCancel) {
  quickTaskCancel.addEventListener("click", () => {
    closeQuickTaskModal();
  });
}

if (quickTaskSubmit) {
  quickTaskSubmit.addEventListener("click", () => {
    submitQuickTask();
  });
}

// Enter key support for quick task
if (quickTaskText) {
  quickTaskText.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      submitQuickTask();
    }
  });
}

// Click outside to close quick task modal
if (quickTaskModal) {
  quickTaskModal.addEventListener("click", (e) => {
    if (e.target === quickTaskModal) {
      closeQuickTaskModal();
    }
  });
}

function populateQuickAddListSelect() {
  if (!quickAddListSelect) return;
  
  const defaultText = getText('modals.quick_add.select_list');
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
  const password = authPasswordInput.value.trim();
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
  const password = authPasswordInput.value.trim();
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
  
  const allOptionText = getText('lists.all_categories');
  
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

  const placeholder = getText('dashboard.item_placeholder');
  const addButtonText = getText('lists.add_item');
  
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
    const errorMsg = getText('lists.list_name_required') || "Kérjük, add meg a lista nevét!";
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
  let finalCategory = category;
  if (!finalCategory) {
    finalCategory = getText('notes.categories.general') || "Általános";
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
    const categoryLower = finalCategory.toLowerCase();
    if (categoryLower === "bevásárlás" || categoryLower === "shopping" || categoryLower === "einkauf") {
      fullName = "🛒 " + listName;
    } else if (categoryLower === "feladatok" || categoryLower === "tasks" || categoryLower === "aufgaben") {
      fullName = "📋 " + listName;
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
async function updateDashboard() {
  updateCurrentTime();
  updateTodayEvents();
  updatePinnedItems();
  updateUrgentTasks();
  await updateStreakDisplay();
  updateStatistics(); // Statisztikák frissítése
  
  // Ha az overview fül aktív, akkor frissítsük az activity graph-ot is
  const overviewTab = document.querySelector('.nav-tab[data-tab="overview"]');
  if (overviewTab && overviewTab.classList.contains('active')) {
    await updateOverview();
  }
}

// Minden adatfrissítő funkció, amit gyakran hívni kell
async function forceRefreshAllData() {
  await updateStreakDisplay();
  await updateOverview();
  updateStatistics();
  updateDashboard();
  updateAchievements();
}

// Dashboard automatikus frissítése minden 30 másodpercben
setInterval(() => {
  if (document.querySelector('.nav-tab[data-tab="dashboard"]').classList.contains('active')) {
    updateDashboard();
  }
}, 30000);

// Aktuális idő frissítése lokalizációval
function updateCurrentTime() {
  const now = new Date();
  const dateElement = document.getElementById('current-date');
  const timeElement = document.getElementById('current-time-display');
  
  if (dateElement && timeElement) {
    // Nyelv alapú lokalizáció
    let locale = 'hu-HU';
    switch(currentLanguage) {
      case 'en':
        locale = 'en-US';
        break;
      case 'de':
        locale = 'de-DE';
        break;
      case 'hu':
      default:
        locale = 'hu-HU';
        break;
    }
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    
    dateElement.textContent = now.toLocaleDateString(locale, options);
    timeElement.textContent = now.toLocaleTimeString(locale, { 
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
  if (!urgentTasksList || !auth.currentUser) return;
  
  const listsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
  
  onValue(listsRef, (snapshot) => {
    let urgentTasks = [];
    
    if (snapshot.exists()) {
      const lists = snapshot.val();
      
      // Sürgős feladatok gyűjtése (nem kész feladatok + fontosnak megjelölt listák)
      Object.entries(lists).forEach(([listId, listData]) => {
        if (listData.items) {
          Object.entries(listData.items).forEach(([itemId, item]) => {
            // Sürgős ha: nem kész ÉS (régi vagy fontos kategóriából)
            if (!item.done) {
              const isOld = item.timestamp && (Date.now() - item.timestamp > 7 * 24 * 60 * 60 * 1000); // 7 napnál régebbi
              const isImportant = listData.category && ['Fontos', 'Munka', 'important', 'work'].includes(listData.category);
              
              if (isOld || isImportant) {
                urgentTasks.push({
                  id: itemId,
                  listId: listId,
                  text: item.text,
                  listName: listData.name,
                  category: listData.category,
                  isOld: isOld,
                  isImportant: isImportant,
                  pinned: item.pinned || false
                });
              }
            }
          });
        }
      });
    }
    
    // Sürgős feladatok megjelenítése
    if (urgentTasks.length === 0) {
      urgentTasksList.innerHTML = `<p class="no-urgent" data-i18n="dashboard.no_urgent">${getText('dashboard.no_urgent')}</p>`;
    } else {
      urgentTasksList.innerHTML = urgentTasks.map(task => `
        <div class="urgent-task ${task.pinned ? 'pinned' : ''}" data-task-id="${task.id}" data-list-id="${task.listId}">
          <div class="urgent-task-content">
            <span class="urgent-task-text">${task.text}</span>
            <span class="urgent-task-list">${task.listName}</span>
          </div>
          <div class="urgent-task-actions">
            <button class="pin-btn" onclick="togglePinUrgentTask('${task.listId}', '${task.id}')" title="${getText('common.pin')}">
              ${task.pinned ? '📌' : '📍'}
            </button>
            <button class="done-btn" onclick="markUrgentTaskDone('${task.listId}', '${task.id}')" title="${getText('common.done')}">
              ✓
            </button>
          </div>
        </div>
      `).join('');
    }
  });
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
    const dateStr = formatDateToString(date);
    
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
                  const date = formatDateToString(new Date(item.timestamp));
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
              const date = formatDateToString(new Date(note.timestamp));
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
              const date = formatDateToString(new Date(event.timestamp));
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

// Produktivitási betekintések frissítése (lokalizációval)
function updateProductivityInsights() {
  const insightsList = document.getElementById('insights-list');
  if (!insightsList) return;
  
  // Valós statisztikák alapján generált betekintések
  const totalLists = document.querySelectorAll('.list-box').length;
  const totalItems = document.querySelectorAll('.list-box li').length;
  const completedItems = document.querySelectorAll('.list-box li.done').length;
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  
  // Globális változók elérése (nem a lokális változóké)
  const globalCurrentStreak = window.currentStreak || currentStreak || 0;
  const globalUserLevel = window.userLevel || userLevel || 1;
  const globalUserXP = window.userXP || userXP || 0;
  

  
  // Lokalizált szövegek a getText függvénnyel
  const insights = [
    { 
      icon: completionRate > 70 ? '📈' : completionRate > 40 ? '📊' : '📉', 
      text: getText('overview.productivity_insights.completion', {
        rate: completionRate,
        completed: completedItems,
        total: totalItems
      })
    },
    { 
      icon: '⭐', 
      text: getText('overview.productivity_insights.managing_lists', {
        count: totalLists
      })
    },
    { 
      icon: globalCurrentStreak > 0 ? '🔥' : '💤', 
      text: globalCurrentStreak > 0 
        ? getText('overview.productivity_insights.streak_active', { days: globalCurrentStreak })
        : getText('overview.productivity_insights.streak_start')
    },
    { 
      icon: globalUserLevel >= 3 ? '🏆' : '🎯', 
      text: getText('overview.productivity_insights.level_progress', {
        level: globalUserLevel,
        xp: globalUserXP
      })
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
    ideas: '',
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
document.addEventListener('DOMContentLoaded', async () => {
  // Nyelv rendszer inicializálása
  await initLanguageSystem();
  
  // Navigáció inicializálása
  initNavigation();
  
  // Téma választó inicializálása
  initThemeSelector();
  
  // Profile menü inicializálása
  initProfileMenu();
  
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
  
  // Audio engedélyezése user interaction után
  enableAudioOnUserInteraction();
  
  // ELTÁVOLÍTVA: enableAudioOnImportantElements() - ez okozta a snooze gomb hang problémát
  console.log('⚠️ enableAudioOnImportantElements disabled to prevent snooze button sounds');
  
  // ⚠️ NO AUTOMATIC AUDIO - Wait for user interaction
  console.log('⚠️ No automatic audio initialization - waiting for user interaction');
  
  // NO AUTOMATIC enableAudio() call - this causes AudioContext errors!
  console.log('🎵 Audio will be enabled on first user interaction via enableAudioOnUserInteraction()');
  
  // Közelgő értesítések ellenőrzése
  setTimeout(checkUpcomingNotifications, 2000); // 2 másodperc késleltetéssel
  
  // Elhalasztott értesítések ellenőrzése
  setTimeout(checkSnoozedNotifications, 3000); // 3 másodperc késleltetéssel
  
  // Rendszeres snooze monitoring indítása
  setTimeout(startSnoozeMonitoring, 5000); // 5 másodperc múlva indítjuk
  
  // DEBUG: Teszt értesítés 10 másodperc múlva (csak teszteléshez)
  // setTimeout(() => {
  //   showEventNotification({
  //     title: "Teszt esemény",
  //     time: "12:00",
  //     description: "Ez egy teszt értesítés"
  //   });
  // }, 10000);
  
  // Teszt funkció a hangok ellenőrzéséhez (fejlesztői konzolból hívható)
  // ⚠️ MANUÁLIS AUDIO TESZTELŐK ELTÁVOLÍTVA
  console.log('🧹 Manual audio test functions removed for production');
  
  // ⚠️ TESZTELŐ FUNKCIÓK ELTÁVOLÍTVA - ÉLES VERZIÓ
  console.log('🧹 Test functions removed for production');
  
  // ⚠️ TESZT ÉRTESÍTÉSEK ELTÁVOLÍTVA - ÉLES VERZIÓ
  console.log('✅ Production ready - Test notifications removed');
  console.log('🔧 Audio system: User interaction safe');
  console.log('📱 PWA notifications: Mobile compatible');
  
  // PWA Debug funkciók
  console.log('🔧 PWA Debug Commands:');
  console.log('  showPWAButton() - Force show install button');
  console.log('  hidePWAButton() - Hide install button');
  console.log('  debugPWA() - Show PWA debug info');
  console.log('  installPWA() - Trigger install dialog');

// ===== IMMEDIATE GLOBAL PWA FUNCTIONS =====
// Ezek azonnal elérhetők lesznek, DOM betöltés nélkül is
window.showPWAButton = function() {
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('🔧 IMMEDIATE: PWA button shown');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
    console.log('💡 Try calling this function after page load');
  }
};

window.hidePWAButton = function() {
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'none';
    console.log('🔧 IMMEDIATE: PWA button hidden');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
  }
};

window.debugPWA = function() {
  const container = document.getElementById('pwa-floating-install');
  const btn = document.getElementById('pwa-install-btn');
  console.log('🔧 IMMEDIATE PWA DEBUG:');
  console.log('  - container found:', !!container);
  console.log('  - button found:', !!btn);
  console.log('  - deferredPrompt:', typeof deferredPrompt !== 'undefined' ? !!deferredPrompt : 'not defined');
  console.log('  - display mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
  console.log('  - container display:', container ? container.style.display : 'N/A');
  console.log('  - DOM ready:', document.readyState);
};

window.installPWA = function() {
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.click();
    console.log('🔧 IMMEDIATE: PWA install triggered');
  } else {
    console.error('❌ PWA install button not found! DOM might not be ready yet.');
  }
};

// Test hogy a függvények elérhetők-e
console.log('✅ Immediate PWA functions defined');
console.log('🔧 Test now: debugPWA()');
  
  // ⚠️ AUDIO STATUS TESZTELŐ ELTÁVOLÍTVA
  console.log('🧹 Audio status checker removed for production');
  
  // ⚠️ PWA ÉS AUDIO TESZTELŐK ELTÁVOLÍTVA
  console.log('🧹 PWA and audio test functions removed for production');
});

// Gyors műveletek kezelése
function handleQuickAction(action) {
  switch(action) {
    case 'quick-task':
      // Quick task modal megnyitása
      openQuickTaskModal();
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
  const todayStr = formatDateToString(today);
  
  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  
  onValue(eventsRef, (snapshot) => {
    if (snapshot.exists()) {
      const todayEvents = Object.entries(snapshot.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(event => event.date === todayStr)
        .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
      
      if (todayEvents.length === 0) {
        todayEventsList.innerHTML = `<p class="no-events" data-i18n="dashboard.no_events">${getText('dashboard.no_events')}</p>`;
      } else {
        todayEventsList.innerHTML = todayEvents.map(event => `
          <div class="event-preview">
            <div class="event-time">${event.time || getText('calendar.all_day')}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-type">${getEventTypeIcon(event.type)}</div>
          </div>
        `).join('');
      }
    } else {
      todayEventsList.innerHTML = `<p class="no-events" data-i18n="dashboard.no_events">${getText('dashboard.no_events')}</p>`;
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
  
  const todayStr = formatDateToString(today);
  const nextWeekStr = formatDateToString(nextWeek);
  
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
        upcomingEventsList.innerHTML = `<p class="no-events" data-i18n="dashboard.no_upcoming_events">${getText('dashboard.no_upcoming_events')}</p>`;
      } else {
        upcomingEventsList.innerHTML = upcomingEvents.map(event => `
          <div class="upcoming-event">
            <div class="event-date">${new Date(event.date).toLocaleDateString(currentLanguage === 'hu' ? 'hu-HU' : currentLanguage === 'de' ? 'de-DE' : 'en-US')}</div>
            <div class="event-title">${event.title}</div>
            <div class="event-type">${getEventTypeIcon(event.type)}</div>
            <button class="delete-event-btn" onclick="deleteEvent('${event.id}')" title="${getText('common.delete')}">
              <span class="material-icons">delete</span>
            </button>
          </div>
        `).join('');
      }
    } else {
      upcomingEventsList.innerHTML = `<p class="no-events" data-i18n="dashboard.no_upcoming_events">${getText('dashboard.no_upcoming_events')}</p>`;
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
  
  if (timeUntilNotification > 0) {
    setTimeout(() => {
      showEventNotification(eventData);
    }, timeUntilNotification);
    console.log(`Emlékeztető beállítva ${eventData.title} eseményhez: ${new Date(notificationTime).toLocaleString()}`);
  }
}

// Az oldal betöltésekor minden jövőbeli eseményre újraütemezünk
function checkUpcomingNotifications() {
  if (!auth.currentUser) return;

  const eventsRef = ref(db, `users/${auth.currentUser.uid}/events`);
  get(eventsRef).then((snapshot) => {
    if (snapshot.exists()) {
      const events = Object.entries(snapshot.val()).map(([id, data]) => ({ id, ...data }));
      const now = new Date();
      events.forEach(event => {
        if (event.reminder && event.reminderTime) {
          const eventDateTime = new Date(`${event.date}T${event.time || '00:00'}`);
          const reminderTime = event.reminderTime || 0;
          const notificationTime = new Date(eventDateTime.getTime() - (reminderTime * 60000));
          if (notificationTime > now) {
            scheduleNotification(event);
          }
        }
      });
    }
  });
}

// Értesítések ellenőrzése minden 1 percben a pontosabb időzítés érdekében
setInterval(() => {
  checkUpcomingNotifications();
  checkSnoozedNotifications();
}, 60 * 1000);

// Esemény értesítés megjelenítése - PWA és mobil kompatibilis
function showEventNotification(eventData) {
  console.log('🔔 ========== SHOWING EVENT NOTIFICATION ==========');
  console.log('📅 Event:', eventData.title);
  console.log('⏰ Time:', eventData.time);
  
  // MOBIL PWA NOTIFICATION - PRIORITÁS!
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    const notificationOptions = {
      body: `${eventData.time || getText('calendar.all_day')} - ${eventData.description || ''}`,
      icon: '/android-chrome-192x192.png',
      badge: '/favicon-32x32.png',
      vibrate: [200, 100, 200], // Vibráció mobil eszközökön
      requireInteraction: true, // Nem tűnik el automatikusan
      persistent: true, // Perzisztens értesítés
      actions: [
        {
          action: 'snooze',
          title: '⏰ 1 perc múlva',
          icon: '/favicon-16x16.png'
        },
        {
          action: 'dismiss',
          title: '✅ Rendben',
          icon: '/favicon-16x16.png'
        }
      ],
      tag: `event-${eventData.id || Date.now()}`, // Egyedi tag
      renotify: true, // Újra értesítés ha már van ilyen tag
      silent: false // NE legyen silent - kell a hang
    };
    
    console.log('📱 Creating PWA notification for mobile...');
    
    // Service Worker notification (mobil kompatibilis)
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(
          `📅 ${getText('notifications.upcoming_event')}: ${eventData.title}`,
          notificationOptions
        ).then(() => {
          console.log('✅ PWA notification created successfully');
        }).catch(err => {
          console.log('❌ PWA notification failed:', err);
          // Fallback to regular notification
          createRegularNotification(eventData);
        });
      });
    } else {
      // Fallback to regular notification
      createRegularNotification(eventData);
    }
  } else {
    // No permission or no service worker
    console.log('⚠️ No PWA notification support, using regular methods');
    createRegularNotification(eventData);
  }
  
  // Alkalmazáson belüli értesítési modal megjelenítése
  showEventNotificationModal(eventData);
  
  // HANG LEJÁTSZÁSA - LOOP RENDSZERREL
  console.log('🔊 Starting notification sound...');
  playNotificationSound();
  
  // Hagyományos értesítés is (fallback)
  showNotification(`📅 ${getText('notifications.upcoming_event')}: ${eventData.title} - ${eventData.time || getText('calendar.all_day')}`);
  
  console.log('✅ Event notification fully displayed');
}

// Regular browser notification fallback
function createRegularNotification(eventData) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(`📅 ${getText('notifications.upcoming_event')}: ${eventData.title}`, {
      body: `${eventData.time || getText('calendar.all_day')} - ${eventData.description || ''}`,
      icon: '/android-chrome-192x192.png',
      requireInteraction: true,
      silent: false
    });
    
    // Handle notification clicks
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    console.log('✅ Regular browser notification created');
  }
}

// Notification permission kérése
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Event Notification Modal megjelenítése
function showEventNotificationModal(eventData) {
  const modal = document.getElementById('event-notification-modal');
  const title = document.getElementById('event-notification-event-title');
  const time = document.getElementById('event-notification-time-text');
  const description = document.getElementById('event-notification-description-text');
  const modalTitle = document.getElementById('event-notification-title');
  
  // Nyelvi szövegek beállítása
  if (modalTitle) modalTitle.textContent = `🔔 ${getText('notifications.event_reminder')}`;
  
  // Esemény adatok kitöltése
  if (title) title.textContent = eventData.title;
  if (time) time.textContent = eventData.time || getText('calendar.all_day');
  if (description) description.textContent = eventData.description || '';
  
  // Modal megjelenítése
  if (modal) {
    modal.style.display = 'flex';
    
    // NINCS KÜLÖN AUDIO AKTIVÁLÁS - a playNotificationSound() már elindult
    
    // Event listeners beállítása
    setupEventNotificationListeners(eventData);
  }
}

// Event notification modal event listeners
function setupEventNotificationListeners(eventData) {
  const modal = document.getElementById('event-notification-modal');
  const closeBtn = document.getElementById('event-notification-close');
  const snoozeBtn = document.getElementById('event-notification-snooze');
  const dismissBtn = document.getElementById('event-notification-dismiss');
  
  // Bezárás gomb
  if (closeBtn) {
    closeBtn.onclick = () => closeEventNotificationModal();
  }
  
  // Elhalasztás gomb
  if (snoozeBtn) {
    snoozeBtn.textContent = `⏰ 1 perc múlva`;
    snoozeBtn.onclick = () => {
      // HANG LEÁLLÍTÁSA AZONNAL - SEMMILYEN HANG VAGY AUDIO AKTIVÁLÁS NINCS!
      console.log('🔇 Snooze button clicked - COMPLETELY SILENT operation');
      
      // Hang leállítása ELŐSZÖR - ez a legfontos!
      stopNotificationSound();
      
      // ⚠️ NO AUDIO FLAG MODIFICATION! Ez okozta a problémákat!
      console.log('✅ Snooze: Sound stopped, no audio flags modified');
      
      // Snooze végrehajtása (ez már tartalmazza a modal bezárását)
      snoozeEventNotification(eventData);
    };
  }
  
  // Rendben gomb
  if (dismissBtn) {
    dismissBtn.textContent = `✅ ${getText('notifications.dismiss')}`;
    dismissBtn.onclick = () => closeEventNotificationModal();
  }
  
  // Modal háttérre kattintás
  modal.onclick = (e) => {
    if (e.target === modal) {
      console.log('🖱️ Background clicked - closing modal and stopping sound');
      stopNotificationSound(); // Biztosíték
      closeEventNotificationModal();
    }
  };
  
  // ESC billentyű
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      console.log('⌨️ ESC pressed - closing modal and stopping sound');
      stopNotificationSound(); // Biztosíték
      closeEventNotificationModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

// Event notification modal bezárása
function closeEventNotificationModal() {
  console.log('🚪 ========== CLOSING EVENT NOTIFICATION MODAL ==========');
  
  // CRITICAL: STOP AUDIO LOOP IMMEDIATELY TO PREVENT SOUNDS ON CLOSE
  console.log('🔇 STOPPING ALL AUDIO to prevent sounds on modal close');
  stopNotificationSound();
  
  const modal = document.getElementById('event-notification-modal');
  if (modal) {
    modal.style.display = 'none';
    console.log('✅ Modal hidden');
  }
  
  // EXTRA SAFETY: Set a short delay to ensure no audio triggers
  setTimeout(() => {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
      console.log('🛑 SAFETY: Extra interval clearance');
    }
  }, 100);
  
  console.log('✅ Event notification modal closed completely - NO SOUNDS');
}

// Audio context a hang engedélyezéséhez
let audioContext = null;
let audioEnabled = false;
let audioFullyActivated = false; // Track if user has interacted and audio is fully ready
let notificationInterval = null;
let isNotificationPlaying = false;

// Audio engedélyezése user interaction után
function enableAudio() {
  if (!audioEnabled && !audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioEnabled = true;
      console.log('Audio enabled successfully');
      
      // Resume context ha suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      // NINCS TESZT HANG - csak az audio context létrehozása!
      console.log('✅ Audio context ready (no test sound)');
    } catch (error) {
      console.log('Audio context creation failed:', error);
    }
  }
}

// Audio előkészítése értesítésekhez
function prepareAudioForNotifications() {
  console.log('🎵 ========== AUDIO PREPARATION (NO AUTO-PLAY) ==========');
  try {
    // HTML audio CSAK előkészítése - NINCS AUTOMATIKUS LEJÁTSZÁS!
    const audio = document.getElementById('notification-sound');
    if (audio) {
      audio.volume = 0.9; // Beállítjuk a megfelelő hangerőt
      audio.currentTime = 0;
      // ⚠️ NO AUTO-PLAY - ez okozta az AudioContext hibákat!
      console.log('✅ HTML Audio configured (no auto-play)');
    }
    
    // Web Audio API - CSAK CONTEXT ELLENŐRZÉS, NINCS OSCILLATOR TESZT!
    if (audioContext) {
      console.log('✅ Web Audio Context is available');
      console.log('  - State:', audioContext.state);
      console.log('  - Sample rate:', audioContext.sampleRate);
      // ⚠️ NO OSCILLATOR TEST - ez okozta az AudioContext hibákat!
      console.log('✅ Web Audio API prepared (no test oscillator)');
    } else {
      console.log('⚠️ No audio context available yet');
    }
    
    console.log('✅ Audio preparation complete (silent mode - no auto-play)');
  } catch (error) {
    console.log('❌ Audio preparation failed:', error);
  }
}

// Audio engedélyezése az első user interaction-nál
function enableAudioOnUserInteraction() {
  const events = ['click', 'touchstart', 'keydown'];
  
  function audioHandler() {
    console.log('🎵 First user interaction detected - enabling audio context');
    enableAudio();
    audioFullyActivated = true;
    
    // Event listener-ek eltávolítása az első interaction után
    events.forEach(event => {
      document.removeEventListener(event, audioHandler);
    });
    
    console.log('✅ Audio fully activated on user interaction');
  }
  
  // Event listener-ek hozzáadása
  events.forEach(event => {
    document.addEventListener(event, audioHandler, { once: true });
  });
}

// ⚠️ DISABLED - Ez okozta a snooze gomb hang problémát
function enableAudioOnImportantElements() {
  console.log('⚠️ enableAudioOnImportantElements is DISABLED to prevent unwanted sounds');
  // Az összes functionality ki van kapcsolva
  return;
}

// 🔊 EGYSZERŰ NOTIFICATION HANG RENDSZER
function playNotificationSound() {
  console.log('🔊 ========== STARTING NOTIFICATION SOUND (SIMPLE LOOP) ==========');
  
  // AUDIO ACTIVATION CHECK - CRITICAL SAFETY!
  if (!audioFullyActivated) {
    console.log('⚠️ Audio not activated yet! Need user interaction first.');
    console.log('💡 Audio will be enabled on first click/touch/key press');
    return;
  }
  
  // Ha már szól egy értesítés, állítsuk le előbb
  if (isNotificationPlaying) {
    console.log('⚠️ Notification already playing - stopping previous first');
    stopNotificationSound();
  }
  
  // BIZTOSÍTSUK, HOGY AZ AUDIO CONTEXT LÉTEZIK ÉS AKTÍV
  if (!audioContext) {
    console.log('❌ No audio context available - this should not happen after user interaction');
    console.log('🔧 Attempting audio context creation...');
    enableAudio();
    
    // If still no context, abort
    if (!audioContext) {
      console.log('❌ Failed to create audio context - aborting sound');
      return;
    }
  }
  
  // AUDIO CONTEXT STATE CHECK
  if (audioContext.state === 'suspended') {
    console.log('⚠️ Audio context is suspended - trying to resume...');
    audioContext.resume().then(() => {
      console.log('✅ Audio context resumed - starting simple sound');
      startSimpleLoop();
    }).catch(err => {
      console.log('❌ Failed to resume audio context:', err);
    });
  } else {
    startSimpleLoop();
  }
  
  function startSimpleLoop() {
    console.log('🔊 Starting simple notification loop...');
    
    // ÁLLÍTSUK BE A FLAG-ET
    isNotificationPlaying = true;
    console.log('✅ isNotificationPlaying = TRUE');
    
    // ELSŐ HANG AZONNAL
    playSingleBeep();
    
    // LOOP INDÍTÁSA
    startContinuousLoop();
  }
}

// ⚠️ DEPRECATED FUNCTION - REPLACED BY SIMPLE LOOP IN playNotificationSound()
function startWorkingAudioLoop() {
  console.log('⚠️ startWorkingAudioLoop is deprecated - redirecting to startContinuousLoop');
  startContinuousLoop();
}

// 🔄 FOLYAMATOS LOOP - 3 MÁSODPERCENKÉNT
function startContinuousLoop() {
  console.log('🔄 ========== STARTING CONTINUOUS LOOP ==========');
  
  // ELLENŐRIZZÜK, hogy nincs-e már futó interval
  if (notificationInterval) {
    console.log('⚠️ Clearing existing interval first');
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  // Loop: minden 3 másodpercben ismétlés
  notificationInterval = setInterval(() => {
    console.log('🔄 Loop tick - isNotificationPlaying:', isNotificationPlaying);
    if (isNotificationPlaying) {
      console.log('🔊 Playing loop beep...');
      playSingleBeep();
    } else {
      console.log('🛑 Loop stopped - clearing interval');
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  }, 3000); // 3 másodpercenként
  
  console.log('✅ Continuous loop started - playing every 3 seconds');
  console.log('📊 isNotificationPlaying flag:', isNotificationPlaying);
}

// 🔊 EGYSZERŰ BEEP HANG - TISZTA ÉS EGYEDÜLÁLLÓ
function playSingleBeep() {
  if (!audioContext) return;
  
  try {
    console.log('🔊 SINGLE BEEP! (880Hz)');
    
    // Egyszerű oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Beállítások
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A note
    oscillator.type = 'sine';
    
    // Hangerő beállítása - kicsit hangosabb
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.1); // 0.3 → 0.4
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6); // 0.5 → 0.6 (hosszabb)
    
    // Lejátszás - kicsit hosszabb hang
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
    
  } catch (error) {
    console.log('❌ Single beep failed:', error);
  }
}

// ⚠️ CLEANED UP - Deprecated functions removed to simplify audio system
// All audio functionality now goes through:
// - playNotificationSound() -> startContinuousLoop() -> playSingleBeep()
console.log('✅ Deprecated audio functions cleaned up for simpler system');

// 🛑 EGYSZERŰ HANG LEÁLLÍTÁS
function stopNotificationSound() {
  console.log('🛑 ========== STOPPING NOTIFICATION SOUND ==========');
  
  // ELSŐ LÉPÉS: isNotificationPlaying = false (ez megállítja a loop-okat)
  isNotificationPlaying = false;
  console.log('✅ isNotificationPlaying = FALSE');
  
  // Folyamatos lejátszás leállítása (Web Audio interval)
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('✅ Notification interval cleared');
  } else {
    console.log('ℹ️ No notification interval to clear');
  }
  
  console.log('✅ All notification sounds stopped completely');
}

// 5 perces elhalasztás (teszteléshez 1 perc)
function snoozeEventNotification(eventData) {
  // ELSŐ: HANGOT LEÁLLÍTJUK!
  stopNotificationSound();
  
  const snoozeTime = new Date(Date.now() + 1 * 60 * 1000); // 1 perc múlva (teszteléshez)
  
  // Perzisztens tárolás localStorage-ban
  const snoozeData = {
    eventData: eventData,
    snoozeTime: snoozeTime.getTime(),
    id: `snooze_${Date.now()}_${Math.random()}`
  };
  
  // Mentés localStorage-ba
  let snoozedEvents = JSON.parse(localStorage.getItem('snoozedEvents') || '[]');
  snoozedEvents.push(snoozeData);
  localStorage.setItem('snoozedEvents', JSON.stringify(snoozedEvents));
  
  console.log(`Event notification snoozed for 1 minute: ${eventData.title} until ${snoozeTime.toLocaleString()}`);
  showNotification(`⏰ ${eventData.title} - 1 perc múlva újra emlékeztetés`);
  
  // Modal bezárása
  closeEventNotificationModal();
  
  // Azonnali check indítása
  checkSnoozedNotifications();
}

// Elhalasztott értesítések ellenőrzése
function checkSnoozedNotifications() {
  const now = Date.now();
  let snoozedEvents = JSON.parse(localStorage.getItem('snoozedEvents') || '[]');
  let activeSnoozedEvents = [];
  
  snoozedEvents.forEach(snoozeData => {
    if (now >= snoozeData.snoozeTime) {
      // Lejárt - megjelenítjük az értesítést
      console.log(`Showing snoozed notification: ${snoozeData.eventData.title}`);
      showEventNotification(snoozeData.eventData);
    } else {
      // Még nem járt le - megtartjuk
      activeSnoozedEvents.push(snoozeData);
    }
  });
  
  // Frissítjük a localStorage-t
  localStorage.setItem('snoozedEvents', JSON.stringify(activeSnoozedEvents));
}

// Elhalasztott értesítések törlése (ha bezárjuk az értesítést véglegesen)
function clearSnoozedNotifications() {
  // Hang leállítása ha szükséges
  stopNotificationSound();
  
  localStorage.removeItem('snoozedEvents');
  console.log('All snoozed notifications cleared');
}

// ===============================================
// 🔧 TESTING FUNCTIONS (Console accessible)
// ===============================================

// Teszteléshez - hang leállítása
window.stopTestSound = function() {
  stopNotificationSound();
  console.log('🔇 Test sound stopped manually');
};

// Teszteléshez - valódi loop hang tesztelése
window.testContinuousSound = function() {
  console.log('🔊 ========== TESTING CONTINUOUS SOUND (SAFE MODE) ==========');
  
  // SAFETY CHECK FIRST
  if (!audioFullyActivated) {
    console.log('⚠️ Audio not yet activated! Please click somewhere on the page first.');
    return;
  }
  
  console.log('📋 Audio status: ready');
  
  // RESET minden audio flag
  isNotificationPlaying = false;
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  console.log('🔧 Audio system reset complete');
  console.log('🔊 Starting SIMPLE LOOP system...');
  
  // EGYSZERŰ HANG LEJÁTSZÁSA - nem dupla
  playNotificationSound();
  
  console.log('▶️ Simple loop sound started. Use stopTestSound() to stop.');
  console.log('📋 Expected behavior: Sound plays every 3 seconds');
};

// Új teszt funkció - teljes rendszer ellenőrzése
window.testNotificationSystem = function() {
  console.log('🧪 ========== TESTING COMPLETE NOTIFICATION SYSTEM (SAFE MODE) ==========');
  console.log('📊 Current audio status:');
  console.log('  - audioContext:', !!audioContext);
  console.log('  - audioEnabled:', audioEnabled);
  console.log('  - audioFullyActivated:', audioFullyActivated);
  console.log('  - isNotificationPlaying:', isNotificationPlaying);
  
  // SAFETY CHECK - NO AUTOMATIC AUDIO ACTIVATION!
  if (!audioFullyActivated) {
    console.log('⚠️ Audio not yet activated by user interaction!');
    console.log('💡 Please click/touch/type somewhere on the page first.');
    console.log('🔧 After user interaction, try this test again.');
    console.log('📋 This prevents AudioContext browser errors.');
    return;
  }
  
  // Test event létrehozása
  const testEvent = {
    title: '🔊 Teszt Értesítés - SAFE MODE',
    description: 'Ellenőrizd: hang loop működik + modal bezáráskor leáll',
    time: new Date().toLocaleTimeString()
  };
  
  console.log('✅ Audio is ready - testing notification...');
  
  // Értesítés megjelenítése
  console.log('📱 Showing test notification...');
  showEventNotification(testEvent);
  
  console.log('✅ Test notification shown (user interaction safe). Check that:');
  console.log('   1. Modal appears');
  console.log('   2. Sound plays every 3 seconds (loop)');
  console.log('   3. Sound stops when modal is closed');
  console.log('==================================================');
};

// ===============================================
// 🌐 INTERNATIONALIZATION (i18n) SYSTEM
// ===============================================

let currentLanguage = 'hu';
let translations = {};

// Nyelv inicializálása
async function initLanguageSystem() {
  // Mentett nyelv betöltése
  const savedLanguage = localStorage.getItem('language') || 'hu';
  await loadLanguage(savedLanguage);
  
  // Nyelv dropdown inicializálása
  initLanguageDropdown();
}

// Nyelvi fájl betöltése
async function loadLanguage(languageCode) {
  try {
    const response = await fetch(`languages/${languageCode}.json`);
    if (response.ok) {
      translations = await response.json();
      currentLanguage = languageCode;
      localStorage.setItem('language', languageCode);
      
      // UI frissítése
      updateUITexts();
    } else {
      console.error(`Language file ${languageCode}.json not found, falling back to Hungarian`);
      if (languageCode !== 'hu') {
        await loadLanguage('hu');
      }
    }
  } catch (error) {
    console.error('Error loading language:', error);
    if (languageCode !== 'hu') {
      await loadLanguage('hu');
    }
  }
}

// Szöveg lekérése
function getText(key, placeholders = {}) {
  const keys = key.split('.');
  let value = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  // Placeholder-ek helyettesítése
  if (typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (match, placeholder) => {
      return placeholders[placeholder] !== undefined ? placeholders[placeholder] : match;
    });
  }
  
  return value;
}

// Segédfüggvény a gomb szöveg frissítéséhez (text node alapú)
function updateButtonText(button, text) {
  if (!button) return;
  
  const textNodes = Array.from(button.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
  if (textNodes.length > 0) {
    textNodes[textNodes.length - 1].textContent = text;
  }
}

// UI szövegek frissítése
function updateUITexts() {
  // Navigáció
  const dashboardTab = document.querySelector('[data-tab="dashboard"]');
  const overviewTab = document.querySelector('[data-tab="overview"]');
  const listsTab = document.querySelector('[data-tab="lists"]');
  const notesTab = document.querySelector('[data-tab="notes"]');
  const calendarTab = document.querySelector('[data-tab="calendar"]');
  
  if (dashboardTab) dashboardTab.innerHTML = getText('navigation.dashboard');
  if (overviewTab) overviewTab.innerHTML = getText('navigation.overview');
  if (listsTab) listsTab.innerHTML = getText('navigation.lists');
  if (notesTab) notesTab.innerHTML = getText('navigation.notes');
  if (calendarTab) calendarTab.innerHTML = getText('navigation.calendar');
  
  // Auth szekció szövegek
  const authTitle = document.querySelector('#auth-section h1');
  const emailInput = document.getElementById('email-input');
  const authPasswordInput = document.getElementById('auth-password-input');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (authTitle) authTitle.textContent = getText('auth.title');
  if (emailInput) emailInput.placeholder = getText('auth.email_placeholder');
  if (authPasswordInput) authPasswordInput.placeholder = getText('auth.password_placeholder');
  if (loginBtn) loginBtn.textContent = getText('auth.login');
  if (registerBtn) registerBtn.textContent = getText('auth.register');
  if (logoutBtn) logoutBtn.textContent = getText('auth.logout');
  
  // Dashboard szövegek
  const welcomeTitle = document.querySelector('.welcome-card h2');
  const welcomeText = document.querySelector('.welcome-card p');
  const streakLabel = document.querySelector('.streak-label');
  
  if (welcomeTitle) welcomeTitle.textContent = getText('dashboard.welcome');
  if (welcomeText) welcomeText.textContent = getText('dashboard.overview_text');
  if (streakLabel) streakLabel.textContent = getText('dashboard.streak_label');
  
  // Quick actions
  const quickActionsTitle = document.querySelector('.quick-actions h3');
  if (quickActionsTitle) quickActionsTitle.textContent = getText('dashboard.quick_actions');
  
  const quickTaskBtn = document.querySelector('[data-action="quick-task"]');
  const quickNoteBtn = document.querySelector('[data-action="quick-note"]');
  const quickEventBtn = document.querySelector('[data-action="quick-event"]');
  
  if (quickTaskBtn) quickTaskBtn.textContent = getText('dashboard.quick_task');
  if (quickNoteBtn) quickNoteBtn.textContent = getText('dashboard.quick_note');
  if (quickEventBtn) quickEventBtn.textContent = getText('dashboard.quick_event');
  
  // Dashboard további szövegek
  const dailyInspirationTitle = document.querySelector('.daily-quote h3');
  const todayEventsTitle = document.querySelector('.today-events h3');
  const pinnedItemsTitle = document.querySelector('.pinned-items h3');
  const urgentTasksTitle = document.querySelector('.urgent-tasks h3');
  const noEventsText = document.querySelector('.no-events');
  const noUrgentText = document.querySelector('.no-urgent');
  
  if (dailyInspirationTitle) dailyInspirationTitle.textContent = getText('dashboard.daily_inspiration');
  if (todayEventsTitle) todayEventsTitle.textContent = getText('dashboard.today_events');
  if (pinnedItemsTitle) pinnedItemsTitle.textContent = getText('dashboard.pinned_items');
  if (urgentTasksTitle) urgentTasksTitle.textContent = getText('dashboard.urgent_tasks');
  if (noEventsText) noEventsText.textContent = getText('dashboard.no_events');
  if (noUrgentText) noUrgentText.textContent = getText('dashboard.no_urgent');
  
  // Pinned items szekcióban
  const pinnedNotesTitle = document.querySelector('#pinned-notes h4');
  const pinnedTasksTitle = document.querySelector('#pinned-tasks h4');
  
  if (pinnedNotesTitle) pinnedNotesTitle.textContent = getText('dashboard.notes');
  if (pinnedTasksTitle) pinnedTasksTitle.textContent = getText('dashboard.tasks');
  
  // Overview szekció
  const overviewTitle = document.querySelector('#overview-section .section-header h2');
  const statisticsTitle = document.querySelector('#main-stats-panel h3');
  const levelTitle = document.querySelector('.level-card h3');
  const activityGraphTitle = document.querySelector('.activity-graph h3');
  const productivityTitle = document.querySelector('.productivity-insights h3');
  
  if (overviewTitle) overviewTitle.textContent = getText('overview.title');
  if (statisticsTitle) statisticsTitle.textContent = getText('overview.statistics');
  if (levelTitle) levelTitle.textContent = getText('overview.level');
  if (activityGraphTitle) activityGraphTitle.textContent = getText('overview.activity_graph');
  if (productivityTitle) productivityTitle.textContent = getText('overview.productivity');
  
  // Stat cards
  const statLabels = document.querySelectorAll('.stat-label');
  if (statLabels[0]) statLabels[0].textContent = getText('overview.lists');
  if (statLabels[1]) statLabels[1].textContent = getText('overview.items');
  if (statLabels[2]) statLabels[2].textContent = getText('overview.completed');
  if (statLabels[3]) statLabels[3].textContent = getText('overview.completion');
  
  // Activity legend
  const activityLegendItems = document.querySelectorAll('.activity-legend-item span');
  if (activityLegendItems[0]) activityLegendItems[0].textContent = getText('overview.activity_less');
  if (activityLegendItems[1]) activityLegendItems[1].textContent = getText('overview.activity_medium');
  if (activityLegendItems[2]) activityLegendItems[2].textContent = getText('overview.activity_high');
  
  // Activity stats labels
  const activityStatLabels = document.querySelectorAll('.activity-stat-label');
  if (activityStatLabels[0]) activityStatLabels[0].textContent = getText('overview.activity_total');
  if (activityStatLabels[1]) activityStatLabels[1].textContent = getText('overview.activity_streak');
  if (activityStatLabels[2]) activityStatLabels[2].textContent = getText('overview.activity_avg');
  
  // Quick task modal
  const quickTaskModalTitle = document.querySelector('#quick-task-modal h3');
  const quickTaskInput = document.getElementById('quick-task-text');
  const quickTaskSelect = document.getElementById('quick-task-list-select');
  const quickTaskSubmitBtn = document.getElementById('quick-task-submit');
  const quickTaskCancelBtn = document.getElementById('quick-task-cancel');
  
  if (quickTaskModalTitle) quickTaskModalTitle.textContent = getText('modals.quick_task.title');
  if (quickTaskInput) quickTaskInput.placeholder = getText('modals.quick_task.placeholder');
  if (quickTaskSubmitBtn) quickTaskSubmitBtn.textContent = getText('modals.quick_task.add');
  if (quickTaskCancelBtn) quickTaskCancelBtn.textContent = getText('modals.quick_task.cancel');
  
  // Listák szekció fordítása
  const listsTitle = document.querySelector('#lists-section .section-header h2');
  const createNewListBtn = document.getElementById('create-new-list-btn');
  const listNameInput = document.getElementById('list-name');
  const listCategoryInput = document.getElementById('list-category');
  const createListBtn = document.getElementById('create-list-btn');
  const reorderBtn = document.getElementById('toggle-reorder-btn');
  
  if (listsTitle) listsTitle.textContent = getText('lists.title');
  if (createNewListBtn) createNewListBtn.textContent = getText('lists.create_new');
  if (listNameInput) listNameInput.placeholder = getText('lists.list_name_placeholder');
  if (listCategoryInput) listCategoryInput.placeholder = getText('lists.category_placeholder');
  if (createListBtn) createListBtn.textContent = getText('lists.create_list');
  if (reorderBtn) {
    updateButtonText(reorderBtn, getText('lists.reorder'));
  }
  
  // Jegyzetek szekció fordítása
  const notesTitle = document.querySelector('#notes-section .section-header h2');
  const newNoteBtn = document.getElementById('new-note-btn');
  
  if (notesTitle) notesTitle.textContent = getText('notes.title');
  if (newNoteBtn) newNoteBtn.textContent = getText('notes.new_note');
  
  // Naptár szekció fordítása
  const calendarTitle = document.querySelector('#calendar-section .section-header h2');
  const newEventBtn = document.getElementById('new-event-btn');
  const upcomingEventsTitle = document.querySelector('.upcoming-events h3');
  
  if (calendarTitle) calendarTitle.textContent = getText('calendar.title');
  if (newEventBtn) newEventBtn.textContent = getText('calendar.new_event');
  if (upcomingEventsTitle) upcomingEventsTitle.textContent = getText('calendar.upcoming_events');
  
  // Event modal fordítása
  const eventModalTitle = document.getElementById('event-modal-title');
  const eventTitleInput = document.getElementById('event-title');
  const eventDateInput = document.getElementById('event-date');
  const eventTimeInput = document.getElementById('event-time');
  const eventDescInput = document.getElementById('event-description');
  const saveEventBtn = document.getElementById('save-event');
  const cancelEventBtn = document.getElementById('cancel-event');
  
  if (eventModalTitle) eventModalTitle.textContent = getText('calendar.new_event');
  if (eventTitleInput) eventTitleInput.placeholder = getText('calendar.event_title');
  if (eventDescInput) eventDescInput.placeholder = getText('calendar.event_description');
  if (saveEventBtn) saveEventBtn.textContent = getText('calendar.save_event');
  if (cancelEventBtn) cancelEventBtn.textContent = getText('calendar.cancel');
  
  // Note modal fordítása
  const noteModalTitle = document.getElementById('note-modal-title');
  const noteTitleInput = document.getElementById('note-title');
  const noteContentInput = document.getElementById('note-content');
  const saveNoteBtn = document.getElementById('save-note');
  const cancelNoteBtn = document.getElementById('cancel-note');
  
  if (noteModalTitle) noteModalTitle.textContent = getText('notes.note_title');
  if (noteTitleInput) noteTitleInput.placeholder = getText('notes.title_placeholder');
  if (noteContentInput) noteContentInput.placeholder = getText('notes.content_placeholder');
  if (saveNoteBtn) saveNoteBtn.textContent = getText('notes.save');
  if (cancelNoteBtn) cancelNoteBtn.textContent = getText('notes.cancel');
  

  
  // Naptár hónapok és napok nevei (dinamikusan generált tartalom)
  updateCalendarLocales();
  
  // Create panel fordítása
  const createHeader = document.querySelector('.create-header h3');
  const createListNameLabel = document.querySelector('label[for="custom-list-name-input"]');
  const createListCategoryLabel = document.querySelector('label[for="custom-list-category-input"]');
  const customCreateListBtn = document.getElementById('custom-new-list-btn');
  const createListNameInput = document.getElementById('custom-list-name-input');
  const createListCategoryInput = document.getElementById('custom-list-category-input');
  
  if (createHeader) createHeader.textContent = getText('lists.create_new');
  if (createListNameLabel) createListNameLabel.textContent = getText('lists.list_name');
  if (createListCategoryLabel) createListCategoryLabel.textContent = getText('lists.category');
  if (createListNameInput) createListNameInput.placeholder = getText('lists.list_name_placeholder');
  if (createListCategoryInput) createListCategoryInput.placeholder = getText('lists.category_placeholder');
  if (customCreateListBtn) {
    updateButtonText(customCreateListBtn, getText('lists.create_list'));
  }
  
  // Filter panel fordítása
  const filterHeader = document.querySelector('.filter-header h3');
  const filterCategoryLabel = document.querySelector('label[for="filter-category"]');
  const searchLabel = document.querySelector('label[for="search-input"]');
  const searchInput = document.getElementById('search-input');
  const allCategoriesOption = document.querySelector('#filter-category option[value="all"]');
  
  if (filterHeader) filterHeader.textContent = getText('lists.filter_search');
  if (filterCategoryLabel) filterCategoryLabel.textContent = getText('lists.filter_category');
  if (searchLabel) searchLabel.textContent = getText('lists.search');
  if (searchInput) searchInput.placeholder = getText('lists.search_placeholder');
  if (allCategoriesOption) allCategoriesOption.textContent = getText('lists.all_categories');
  
  // Toggle reorder button fordítása
  if (toggleReorderBtn) {
    updateButtonText(toggleReorderBtn, getText('lists.reorder'));
  }
  
  // Jegyzetek törlési modal fordítása
  const deleteNoteTitle = document.querySelector('#delete-note-modal .modal-header h3');
  const deleteNoteConfirm = document.querySelector('#delete-note-modal .warning-content p');
  const deleteNoteWarning = document.querySelector('#delete-note-modal .warning-text');
  const deleteNoteBtn = document.getElementById('confirm-delete-note');
  const cancelDeleteNoteBtn = document.getElementById('cancel-delete-note');
  
  if (deleteNoteTitle) deleteNoteTitle.textContent = getText('notes.delete_note');
  if (deleteNoteConfirm) deleteNoteConfirm.textContent = getText('notes.delete_confirm');
  if (deleteNoteWarning) deleteNoteWarning.textContent = getText('notes.delete_warning');
  if (deleteNoteBtn) deleteNoteBtn.textContent = getText('notes.delete_button');
  if (cancelDeleteNoteBtn) cancelDeleteNoteBtn.textContent = getText('notes.cancel');
  
  // Sürgős feladatok "nincs sürgős" szövege
  const noUrgentElements = document.querySelectorAll('.no-urgent');
  noUrgentElements.forEach(el => {
    if (el) el.textContent = getText('dashboard.no_urgent');
  });
  
  // Note categories select opciók
  const noteCategorySelect = document.getElementById('note-category');
  if (noteCategorySelect) {
    noteCategorySelect.innerHTML = `
      <option value="general">${getText('notes.categories.general')}</option>
      <option value="passwords">${getText('notes.categories.passwords')}</option>
      <option value="ideas">${getText('notes.categories.ideas')}</option>
      <option value="important">${getText('notes.categories.important')}</option>
      <option value="work">${getText('notes.categories.work')}</option>
      <option value="personal">${getText('notes.categories.personal')}</option>
    `;
  }
  
  // Event type select opciók
  const eventTypeSelect = document.getElementById('event-type');
  if (eventTypeSelect) {
    eventTypeSelect.innerHTML = `
      <option value="birthday">${getText('calendar.event_types.birthday')}</option>
      <option value="meeting">${getText('calendar.event_types.meeting')}</option>
      <option value="reminder">${getText('calendar.event_types.reminder')}</option>
      <option value="appointment">${getText('calendar.event_types.appointment')}</option>
      <option value="event">${getText('calendar.event_types.event')}</option>
      <option value="deadline">${getText('calendar.event_types.deadline')}</option>
    `;
  }
  
  // Reminder times select opciók
  const reminderTimeSelect = document.getElementById('reminder-time');
  if (reminderTimeSelect) {
    reminderTimeSelect.innerHTML = `
      <option value="0">${getText('calendar.reminder_times.0')}</option>
      <option value="15">${getText('calendar.reminder_times.15')}</option>
      <option value="30">${getText('calendar.reminder_times.30')}</option>
      <option value="60">${getText('calendar.reminder_times.60')}</option>
      <option value="1440">${getText('calendar.reminder_times.1440')}</option>
    `;
  }
  
  // Event modal input labelek
  const eventDateLabel = document.querySelector('label[for="event-date"]');
  const eventTimeLabel = document.querySelector('label[for="event-time"]');
  const eventTypeLabel = document.querySelector('label[for="event-type"]');
  const eventReminderLabel = document.querySelector('label[for="event-reminder"]');
  
  if (eventDateLabel) eventDateLabel.textContent = getText('calendar.date_label');
  if (eventTimeLabel) eventTimeLabel.textContent = getText('calendar.time_label');
  if (eventTypeLabel) eventTypeLabel.textContent = getText('calendar.type_label');
  if (eventReminderLabel) eventReminderLabel.textContent = getText('calendar.reminder_label');
  
  // Event modal placeholder szövegek
  const modalEventTitleInput = document.getElementById('event-title');
  const modalEventDescInput = document.getElementById('event-description');
  if (modalEventTitleInput) modalEventTitleInput.placeholder = getText('calendar.event_name_placeholder');
  if (modalEventDescInput) modalEventDescInput.placeholder = getText('calendar.event_desc_placeholder');
  
  // Produktivitási insights frissítése (lokalizált)
  updateProductivityInsights();
  
  // Confirm modal szövegek
  const confirmMessage = document.getElementById('confirm-message');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  
  if (confirmYes) confirmYes.textContent = getText('modals.yes');
  if (confirmNo) confirmNo.textContent = getText('modals.no');
  
  // Quick add modal szövegek (FAB modal)
  const quickAddTitle = document.querySelector('#quick-add-modal h3');
  const quickAddInput = document.getElementById('quick-add-text');
  const quickAddSubmit = document.getElementById('quick-add-submit');
  const quickAddCancel = document.getElementById('quick-add-cancel');
  
  if (quickAddTitle) quickAddTitle.textContent = getText('modals.quick_add.title');
  if (quickAddInput) quickAddInput.placeholder = getText('modals.quick_add.placeholder');
  if (quickAddSubmit) quickAddSubmit.textContent = getText('modals.quick_add.add');
  if (quickAddCancel) quickAddCancel.textContent = getText('modals.quick_add.cancel');
  
  // Item input placeholder frissítése (dinamikusan létrehozott elemekhez)
  updateItemInputPlaceholders();
  
  // Quick add lista select frissítése
  populateQuickTaskListSelect();
  
  // Dátum frissítése lokalizációval
  updateCurrentTime();
  
  // Achievement szövegek frissítése
  updateAchievements();
  
  // Theme modal szövegek frissítése
  const themeText = document.querySelector('.theme-text');
  if (themeText) {
    themeText.textContent = getText('common.theme');
  }
  
  // Theme modal címe és gombok
  const themeModalTitle = document.querySelector('#theme-modal .modern-theme-header h2');
  const themeApplyBtn = document.getElementById('theme-apply-btn');
  const themeCancelBtn = document.getElementById('theme-cancel-btn');
  
  if (themeModalTitle) themeModalTitle.textContent = getText('modals.theme.title');
  if (themeApplyBtn) {
    updateButtonText(themeApplyBtn, getText('modals.theme.apply'));
  }
  if (themeCancelBtn) {
    updateButtonText(themeCancelBtn, getText('modals.theme.cancel'));
  }
  
  // Theme kártya szövegek frissítése
  updateThemeCardTexts();
  
  // Kategória szűrő frissítése (ha van felhasználó bejelentkezve)
  if (auth.currentUser) {
    loadUserLists(auth.currentUser.uid);
  }
  
  // Profile menu gombok frissítése
  const privacyMenuBtn = document.getElementById('privacy-btn');
  if (privacyMenuBtn) {
    updateButtonText(privacyMenuBtn, getText('navigation.privacy'));
  }

  // Modal select opciók frissítése
  updateModalSelectOptions();
}

// Modal select opciók frissítése
function updateModalSelectOptions() {
  // Event típusok frissítése
  const eventTypeOptions = document.querySelectorAll('#event-type option');
  eventTypeOptions.forEach(option => {
    const value = option.value;
    if (value) {
      option.textContent = getText(`calendar.event_types.${value}`);
    }
  });
  
  // Event emlékeztető opciók frissítése
  const reminderOptions = document.querySelectorAll('#reminder-time option');
  reminderOptions.forEach(option => {
    const value = option.value;
    if (value !== undefined) {
      option.textContent = getText(`calendar.reminder_times.${value}`);
    }
  });
  
  // Note kategóriák frissítése
  const noteCategoryOptions = document.querySelectorAll('#note-category option');
  noteCategoryOptions.forEach(option => {
    const value = option.value;
    if (value) {
      option.textContent = getText(`notes.categories.${value}`);
    }
  });
  
  // Event modal címkék frissítése
  const eventDateLabelEl = document.querySelector('.date-time-group .input-group:first-child label');
  const eventTimeLabelEl = document.querySelector('.date-time-group .input-group:last-child label');
  const eventTypeLabelEl = document.querySelector('.event-categories label');
  
  if (eventDateLabelEl) eventDateLabelEl.textContent = getText('calendar.date_label');
  if (eventTimeLabelEl) eventTimeLabelEl.textContent = getText('calendar.time_label');
  if (eventTypeLabelEl) eventTypeLabelEl.textContent = getText('calendar.type_label');
  
  // Event emlékeztető címke frissítése
  const eventReminderLabelEl = document.querySelector('.reminder-settings .checkbox-label');
  if (eventReminderLabelEl) {
    const textNode = Array.from(eventReminderLabelEl.childNodes).find(node => 
      node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (textNode) {
      textNode.textContent = getText('calendar.reminder_label');
    }
  }
  
  // Note kategória címke frissítése
  const noteCategoryLabelEl = document.querySelector('.note-categories label');
  if (noteCategoryLabelEl) noteCategoryLabelEl.textContent = getText('notes.category_label');
  
  // Note private checkbox címke frissítése
  const notePrivateLabelEl = document.querySelector('.note-security .checkbox-label');
  if (notePrivateLabelEl) {
    // Keressük meg az utolsó text node-ot (ami a checkbox szövege)
    const textNodes = Array.from(notePrivateLabelEl.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
    if (textNodes.length > 0) {
      const lastTextNode = textNodes[textNodes.length - 1];
      lastTextNode.textContent = getText('notes.private_note');
    }
  }
  
  // Jelszó mezők frissítése
  const notePasswordInput = document.getElementById('note-password');
  const notePasswordLabel = document.getElementById('note-password-label');
  const passwordModalTitle = document.getElementById('password-modal-title');
  const passwordInput = document.getElementById('password-input');
  const passwordSubmit = document.getElementById('password-submit');
  const passwordCancel = document.getElementById('password-cancel');
  
  if (notePasswordInput) {
    notePasswordInput.placeholder = getText('notes.password_placeholder');
  }
  if (notePasswordLabel) {
    notePasswordLabel.textContent = getText('notes.password_label');
  }
  if (passwordModalTitle) {
    passwordModalTitle.textContent = getText('notes.password_needed');
  }
  if (passwordInput) {
    passwordInput.placeholder = getText('notes.password_placeholder_input');
  }
  if (passwordSubmit) {
    passwordSubmit.textContent = getText('notes.password_submit');
  }
  if (passwordCancel) {
    passwordCancel.textContent = getText('notes.password_cancel');
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
      languageDropdown.classList.toggle('show');
      
      // Ha megnyitjuk, távolítsuk el az inline style-t
      if (languageDropdown.classList.contains('show')) {
        languageDropdown.style.display = '';
      } else {
        languageDropdown.style.display = 'none';
      }
    });
    
    // Kívülre kattintás esetén bezárás
    document.addEventListener('click', (e) => {
      if (!hamburgerIcon.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageDropdown.classList.remove('show');
        languageDropdown.style.display = 'none';
      }
    });
    
    // ESC billentyű lenyomásakor bezárás
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && languageDropdown.classList.contains('show')) {
        languageDropdown.classList.remove('show');
        languageDropdown.style.display = 'none';
      }
    });
    
    // Nyelv linkekre kattintás - JSON alapú váltás
    const languageLinks = languageDropdown.querySelectorAll('a');
    languageLinks.forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const languageCode = link.getAttribute('data-lang') || 'hu';
        
        // Dropdown azonnal bezárása a nyelv váltás előtt
        languageDropdown.classList.remove('show');
        languageDropdown.style.display = 'none'; // Erős override
        
        try {
          await loadLanguage(languageCode);
          markCurrentLanguage();
          
          // Biztonságos bezárás a nyelv váltás után is
          setTimeout(() => {
            languageDropdown.classList.remove('show');
            languageDropdown.style.display = 'none';
          }, 100);
        } catch (error) {
          console.error('Hiba a nyelv betöltése során:', error);
        }
      });
    });
  }
}

// Aktuális nyelv jelölése
function markCurrentLanguage() {
  const languageLinks = document.querySelectorAll('.language-dropdown a');
  const languageText = document.querySelector('.language-text');
  
  languageLinks.forEach(link => {
    link.classList.remove('current');
    
    // Ellenőrizzük az aktuális nyelvet
    const linkLang = link.getAttribute('data-lang');
    if (linkLang === currentLanguage) {
      link.classList.add('current');
      
      // Frissítjük a hamburger menü szövegét
      if (languageText) {
        switch(currentLanguage) {
          case 'en':
            languageText.textContent = 'EN';
            break;
          case 'de':
            languageText.textContent = 'DE';
            break;
          case 'hu':
          default:
            languageText.textContent = 'HU';
            break;
        }
      }
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
window.openNoteForEdit = openNoteForEdit;
window.requestNotePassword = requestNotePassword;

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

// ===============================================
// 🚀 QUICK TASK MODAL FUNCTIONS
// ===============================================

function openQuickTaskModal() {
  if (quickTaskModal) {
    populateQuickTaskListSelect();
    quickTaskModal.style.display = 'flex';
    if (quickTaskText) quickTaskText.focus();
  }
}

function populateQuickTaskListSelect() {
  if (!quickTaskListSelect || !auth.currentUser) return;
  
  quickTaskListSelect.innerHTML = `<option value="">${getText('modals.quick_task.select_list')}</option>`;
  
  const listsRef = ref(db, `users/${auth.currentUser.uid}/lists`);
  onValue(listsRef, (snapshot) => {
    if (snapshot.exists()) {
      const lists = snapshot.val();
      Object.keys(lists).forEach(listId => {
        const list = lists[listId];
        const option = document.createElement('option');
        option.value = listId;
        option.textContent = list.name;
        quickTaskListSelect.appendChild(option);
      });
    }
  });
}

function submitQuickTask() {
  const taskText = quickTaskText.value.trim();
  const selectedListId = quickTaskListSelect.value;
  
  if (!taskText || !selectedListId) {
    const message = currentLanguage === 'en' ? 'Please fill in the task text and choose a list!' : 
                   currentLanguage === 'de' ? 'Bitte füllen Sie den Aufgabentext aus und wählen Sie eine Liste!' : 
                   'Kérjük, töltsd ki a feladat szövegét és válassz egy listát!';
    alert(message);
    return;
  }
  
  if (!auth.currentUser) {
    alert(getText('notifications.login_required'));
    return;
  }
  
  const listItemsRef = ref(db, `users/${auth.currentUser.uid}/lists/${selectedListId}/items`);
  push(listItemsRef, {
    text: taskText,
    done: false,
    createdAt: new Date().toISOString(),
    timestamp: Date.now()
  }).then(async () => {
    quickTaskText.value = '';
    quickTaskModal.style.display = 'none';
    showNotification(getText('notifications.task_added'));
    addXP(5); // XP hozzáadása
    
    // Teljes adatfrissítés
    await forceRefreshAllData();
  }).catch(error => {
    console.error('Hiba a feladat hozzáadása során:', error);
    alert('Hiba történt a feladat hozzáadása során.');
  });
}

function closeQuickTaskModal() {
  if (quickTaskModal) {
    quickTaskModal.style.display = 'none';
    quickTaskText.value = '';
  }
}

// Sürgős feladatok kezelése
function togglePinUrgentTask(listId, taskId) {
  if (!auth.currentUser) return;
  
  const taskRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${taskId}`);
  
  get(taskRef).then((snapshot) => {
    if (snapshot.exists()) {
      const currentPinned = snapshot.val().pinned || false;
      
      update(taskRef, { 
        pinned: !currentPinned,
        updatedAt: new Date().toISOString()
      }).then(() => {
        updateUrgentTasks();
        updatePinnedTasks();
        showNotification(!currentPinned ? getText('notifications.task_pinned') : getText('notifications.task_unpinned'));
      });
    }
  });
}

function markUrgentTaskDone(listId, taskId) {
  if (!auth.currentUser) return;
  
  const taskRef = ref(db, `users/${auth.currentUser.uid}/lists/${listId}/items/${taskId}`);
  
  update(taskRef, { 
    done: true,
    completedAt: new Date().toISOString()
  }).then(async () => {
    updateUrgentTasks();
    addXP(5); // XP a feladat teljesítéséért
    showNotification(getText('notifications.task_completed'));
    await forceRefreshAllData();
  });
}

// Helper funkciók a fordításokhoz
function updateCalendarLocales() {
  // Naptár lokalizációja a renderCalendar funkciónál történik
  if (document.getElementById('calendar-grid')) {
    renderCalendar();
  }
}



function updateItemInputPlaceholders() {
  // Dinamikusan létrehozott item inputok frissítése
  setTimeout(() => {
    const itemInputs = document.querySelectorAll('.item-input');
    itemInputs.forEach(input => {
      if (input) input.placeholder = getText('dashboard.item_placeholder');
    });
  }, 100);
}

// Theme kártya szövegek frissítése
function updateThemeCardTexts() {
  // Téma kártyák szövegei
  const themeCards = {
    'default': {
      name: getText('modals.theme.themes.default.name'),
      description: getText('modals.theme.themes.default.description')
    },
    'ocean-blue': {
      name: getText('modals.theme.themes.ocean_blue.name'),
      description: getText('modals.theme.themes.ocean_blue.description')
    },
    'sakura-pink': {
      name: getText('modals.theme.themes.sakura_pink.name'),
      description: getText('modals.theme.themes.sakura_pink.description')
    },
    'forest-green': {
      name: getText('modals.theme.themes.forest_green.name'),
      description: getText('modals.theme.themes.forest_green.description')
    },
    'minimal-mono': {
      name: getText('modals.theme.themes.minimal_mono.name'),
      description: getText('modals.theme.themes.minimal_mono.description')
    },
    'sunset-orange': {
      name: getText('modals.theme.themes.sunset_orange.name'),
      description: getText('modals.theme.themes.sunset_orange.description')
    },
    'royal-purple': {
      name: getText('modals.theme.themes.royal_purple.name'),
      description: getText('modals.theme.themes.royal_purple.description')
    }
  };
  
  // Frissítjük minden téma kártya szövegét
  Object.keys(themeCards).forEach(themeKey => {
    const themeCard = document.querySelector(`[data-theme="${themeKey}"]`);
    if (themeCard) {
      const nameElement = themeCard.querySelector('h3');
      const descElement = themeCard.querySelector('p');
      
      if (nameElement) nameElement.textContent = themeCards[themeKey].name;
      if (descElement) descElement.textContent = themeCards[themeKey].description;
    }
  });
  
  // Theme mode gombok szövegei
  const lightModeButtons = document.querySelectorAll('.theme-mode-btn[data-mode="light"]');
  const darkModeButtons = document.querySelectorAll('.theme-mode-btn[data-mode="dark"]');
  
  lightModeButtons.forEach(button => {
    const textNode = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = ` ${getText('modals.theme.modes.light')}`;
    }
  });
  
  darkModeButtons.forEach(button => {
    const textNode = Array.from(button.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = ` ${getText('modals.theme.modes.dark')}`;
    }
  });
}

// Modern téma választó rendszer
function initThemeSelector() {
  const themeSelector = document.getElementById('theme-selector-btn');
  const themeModal = document.getElementById('theme-modal');
  const themeModalClose = document.getElementById('theme-modal-close');
  const themeApplyBtn = document.getElementById('theme-apply-btn');
  const themeCancelBtn = document.getElementById('theme-cancel-btn');
  const themeCards = document.querySelectorAll('.modern-theme-card');
  const themeModeButtons = document.querySelectorAll('.theme-mode-btn');
  
  if (!themeSelector || !themeModal) return;
  
  // Load saved theme
  const savedTheme = JSON.parse(localStorage.getItem('selectedTheme') || '{"name":"default","mode":"light"}');
  currentTheme = savedTheme;
  applyTheme(currentTheme.name, currentTheme.mode);
  updateActiveThemeCard();
  
  let selectedTheme = { ...currentTheme };
  
  // Open modal
  themeSelector.addEventListener('click', (e) => {
    e.stopPropagation();
    themeModal.style.display = 'flex';
    selectedTheme = { ...currentTheme };
    updateActiveThemeCard();
  });
  
  // Close modal and revert theme
  const closeModal = () => {
    themeModal.style.display = 'none';
    selectedTheme = { ...currentTheme };
    // Visszaállítjuk az eredeti témát
    applyTheme(currentTheme.name, currentTheme.mode);
    updateActiveThemeCard();
  };
  
  if (themeModalClose) themeModalClose.addEventListener('click', closeModal);
  if (themeCancelBtn) themeCancelBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking outside
  themeModal.addEventListener('click', (e) => {
    if (e.target === themeModal) {
      closeModal();
    }
  });
  
  // Theme card selection
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const themeName = card.dataset.theme;
      
      // Update selected theme with current mode
      selectedTheme.name = themeName;
      window.selectedTheme = selectedTheme;
      
      // Apply theme with live preview
      applyTheme(selectedTheme.name, selectedTheme.mode);
      updateActiveThemeCard();
    });
  });
  
  // Theme mode button selection
  themeModeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      
      const mode = button.dataset.mode;
      const card = button.closest('.modern-theme-card');
      const themeName = card.dataset.theme;
      
      // Update selected theme
      selectedTheme = { name: themeName, mode: mode };
      window.selectedTheme = selectedTheme;
      
      // Apply theme with live preview
      applyTheme(selectedTheme.name, selectedTheme.mode);
      updateActiveThemeCard();
    });
  });
  
  // Apply selected theme
  if (themeApplyBtn) {
    themeApplyBtn.addEventListener('click', () => {
      selectTheme(selectedTheme.name, selectedTheme.mode);
      themeModal.style.display = 'none';
    });
  }
}

function selectTheme(themeName, themeMode) {
  currentTheme = { name: themeName, mode: themeMode };
  
  // Save to localStorage
  localStorage.setItem('selectedTheme', JSON.stringify(currentTheme));
  
  // Apply theme
  applyTheme(themeName, themeMode);
  updateActiveThemeCard();
  
  // Save to Firebase if user is logged in
  if (auth.currentUser) {
    saveThemeToFirebase(currentTheme);
  }
  
  // Show notification
  showNotification(`🎨 ${getText('notifications.theme_applied')}: ${themeName} (${themeMode})`);
}

function applyTheme(themeName, themeMode) {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.className = root.className.replace(/theme-\w+/g, '');
  
  // Set theme data attributes
  root.setAttribute('data-theme', themeMode);
  
  // Add theme class
  if (themeName !== 'default') {
    root.classList.add(`theme-${themeName}`);
  }
  
  // Load theme CSS if needed
  loadThemeCSS(themeName);
}

function loadThemeCSS(themeName) {
  const existingLink = document.getElementById('theme-css');
  
  if (themeName === 'default') {
    if (existingLink) {
      existingLink.remove();
    }
    return;
  }
  
  if (!existingLink) {
    const link = document.createElement('link');
    link.id = 'theme-css';
    link.rel = 'stylesheet';
    link.href = 'modern-themes.css';
    document.head.appendChild(link);
  }
}

function updateActiveThemeCard() {
  const themeCards = document.querySelectorAll('.modern-theme-card');
  const themeModeButtons = document.querySelectorAll('.theme-mode-btn');
  const themeModal = document.getElementById('theme-modal');
  
  // Ha a modal nyitva van, használjuk a selectedTheme-t, különben a currentTheme-t
  let targetTheme = currentTheme;
  if (themeModal && themeModal.style.display === 'flex' && window.selectedTheme) {
    targetTheme = window.selectedTheme;
  }
  
  // Reset all cards and buttons
  themeCards.forEach(card => {
    card.classList.remove('selected');
  });
  
  themeModeButtons.forEach(button => {
    button.classList.remove('active');
  });
  
  // Set active card and mode
  themeCards.forEach(card => {
    if (card.dataset.theme === targetTheme.name) {
      card.classList.add('selected');
      
      // Set active mode button within this card
      const modeButtons = card.querySelectorAll('.theme-mode-btn');
      modeButtons.forEach(button => {
        if (button.dataset.mode === targetTheme.mode) {
          button.classList.add('active');
        }
      });
    }
  });
}

async function saveThemeToFirebase(themeSettings) {
  if (!auth.currentUser) return;
  
  try {
    const userRef = ref(db, `users/${auth.currentUser.uid}/themeSettings`);
    await set(userRef, themeSettings);
  } catch (error) {
    console.log('Theme save error:', error);
  }
}

async function loadThemeFromFirebase() {
  if (!auth.currentUser) return;
  
  try {
    const userRef = ref(db, `users/${auth.currentUser.uid}/themeSettings`);
    const userSnap = await get(userRef);
    
    if (userSnap.exists()) {
      const savedTheme = userSnap.val();
      currentTheme = savedTheme;
      localStorage.setItem('selectedTheme', JSON.stringify(currentTheme));
      applyTheme(currentTheme.name, currentTheme.mode);
      updateActiveThemeCard();
    }
  } catch (error) {
    console.log('Theme load error:', error);
  }
}

// Profile menü inicializálása
function initProfileMenu() {
  const profileBtn = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  const logoutBtn = document.getElementById('logout-btn');
  const privacyBtn = document.getElementById('privacy-btn');
  
  if (!profileBtn || !profileDropdown || !logoutBtn) return;
  
  // Profile gomb kattintás
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
  });
  
  // Kívülre kattintás esetén bezárás
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove('show');
    }
  });
  
  // ESC billentyű lenyomásakor bezárás
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileDropdown.classList.contains('show')) {
      profileDropdown.classList.remove('show');
    }
  });
  
  // Privacy gomb
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      openPrivacyModal();
      profileDropdown.classList.remove('show');
    });
  }
  
  // Logout gomb
  logoutBtn.addEventListener('click', () => {
    if (confirm(getText('auth.logout') + '?')) {
      signOut(auth).then(() => {
        profileDropdown.classList.remove('show');
        showNotification('👋 ' + getText('notifications.logout_success'));
      }).catch((error) => {
        console.error('Kijelentkezési hiba:', error);
      });
    }
  });
}

// Privacy modal functions
function openPrivacyModal() {
  const privacyModal = document.getElementById('privacy-modal');
  if (privacyModal) {
    // Frissítjük a modal szövegeit a jelenlegi nyelv szerint
    updatePrivacyModalTexts();
    privacyModal.style.display = 'flex';
  }
}

function closePrivacyModal() {
  const privacyModal = document.getElementById('privacy-modal');
  if (privacyModal) {
    privacyModal.style.display = 'none';
  }
}

function updatePrivacyModalTexts() {
  // Modal címe
  const title = document.getElementById('privacy-modal-title');
  if (title) title.textContent = getText('modals.privacy.title');

  // Szekció címek és tartalmak
  const sections = [
    { titleId: 'privacy-intro-title', contentId: 'privacy-intro-content', key: 'intro' },
    { titleId: 'privacy-controller-title', contentId: 'privacy-controller-content', key: 'controller' },
    { titleId: 'privacy-data-title', key: 'data' },
    { titleId: 'privacy-purpose-title', key: 'purpose' },
    { titleId: 'privacy-legal-title', contentId: 'privacy-legal-content', key: 'legal' },
    { titleId: 'privacy-storage-title', contentId: 'privacy-storage-content', key: 'storage' },
    { titleId: 'privacy-retention-title', contentId: 'privacy-retention-content', key: 'retention' },
    { titleId: 'privacy-rights-title', key: 'rights' },
    { titleId: 'privacy-security-title', key: 'security' },
    { titleId: 'privacy-contact-title', contentId: 'privacy-contact-content', key: 'contact' },
    { titleId: 'privacy-changes-title', contentId: 'privacy-changes-content', key: 'changes' },
    { titleId: 'privacy-effective-title', contentId: 'privacy-effective-content', key: 'effective' }
  ];

  sections.forEach(section => {
    const titleElement = document.getElementById(section.titleId);
    const contentElement = section.contentId ? document.getElementById(section.contentId) : null;
    
    if (titleElement) {
      titleElement.textContent = getText(`modals.privacy.${section.key}_title`);
    }
    
    if (contentElement) {
      contentElement.textContent = getText(`modals.privacy.${section.key}_content`);
    }
  });

  // Lista elemek frissítése
  const dataItems = [
    { id: 'privacy-data-email', key: 'data_email' },
    { id: 'privacy-data-lists', key: 'data_lists' },
    { id: 'privacy-data-notes', key: 'data_notes' },
    { id: 'privacy-data-events', key: 'data_events' },
    { id: 'privacy-data-settings', key: 'data_settings' },
    { id: 'privacy-data-usage', key: 'data_usage' }
  ];

  dataItems.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      element.textContent = getText(`modals.privacy.${item.key}`);
    }
  });

  const purposeItems = [
    { id: 'privacy-purpose-service', key: 'purpose_service' },
    { id: 'privacy-purpose-sync', key: 'purpose_sync' },
    { id: 'privacy-purpose-security', key: 'purpose_security' },
    { id: 'privacy-purpose-features', key: 'purpose_features' }
  ];

  purposeItems.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      element.textContent = getText(`modals.privacy.${item.key}`);
    }
  });

  const rightsItems = [
    { id: 'privacy-right-access', key: 'right_access' },
    { id: 'privacy-right-rectification', key: 'right_rectification' },
    { id: 'privacy-right-erasure', key: 'right_erasure' },
    { id: 'privacy-right-portability', key: 'right_portability' },
    { id: 'privacy-right-objection', key: 'right_objection' }
  ];

  rightsItems.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      element.textContent = getText(`modals.privacy.${item.key}`);
    }
  });

  const securityItems = [
    { id: 'privacy-security-encryption', key: 'security_encryption' },
    { id: 'privacy-security-firebase', key: 'security_firebase' },
    { id: 'privacy-security-https', key: 'security_https' },
    { id: 'privacy-security-access', key: 'security_access' }
  ];

  securityItems.forEach(item => {
    const element = document.getElementById(item.id);
    if (element) {
      element.textContent = getText(`modals.privacy.${item.key}`);
    }
  });

  // Gombok
  const acceptBtn = document.getElementById('privacy-accept');
  const closeBtn = document.getElementById('privacy-close');
  
  if (acceptBtn) acceptBtn.textContent = getText('modals.privacy.accept');
  if (closeBtn) closeBtn.textContent = getText('modals.privacy.close');
}

// Globális függvény elérhetővé tétele
window.openQuickTaskModal = openQuickTaskModal;
window.submitQuickTask = submitQuickTask;
window.closeQuickTaskModal = closeQuickTaskModal;
window.togglePinUrgentTask = togglePinUrgentTask;
window.markUrgentTaskDone = markUrgentTaskDone;
window.destroySortableInstance = destroySortableInstance;

// Privacy modal eseménykezelők inicializálása
function initPrivacyModal() {
  const privacyModalClose = document.getElementById('privacy-modal-close');
  const privacyAccept = document.getElementById('privacy-accept');
  const privacyClose = document.getElementById('privacy-close');
  const privacyModal = document.getElementById('privacy-modal');

  if (privacyModalClose) {
    privacyModalClose.addEventListener('click', closePrivacyModal);
  }

  if (privacyAccept) {
    privacyAccept.addEventListener('click', closePrivacyModal);
  }

  if (privacyClose) {
    privacyClose.addEventListener('click', closePrivacyModal);
  }

  // Kívülre kattintás esetén bezárás
  if (privacyModal) {
    privacyModal.addEventListener('click', (e) => {
      if (e.target === privacyModal) {
        closePrivacyModal();
      }
    });
  }

  // ESC billentyű lenyomásakor bezárás
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (privacyModal && privacyModal.style.display === 'flex') {
        closePrivacyModal();
      }
    }
  });
}

// Sortable inicializálás késleltetése DOM betöltés után
document.addEventListener('DOMContentLoaded', () => {
  // Privacy modal inicializálása
  initPrivacyModal();
  
  // AUDIO USER INTERACTION RENDSZER INICIALIZÁLÁS
  enableAudioOnUserInteraction();
  console.log('🎵 Audio user interaction system initialized');
  
  // PWA FLOATING INSTALL BUTTON SETUP
  function setupPWAInstallButton() {
    const installContainer = document.getElementById('pwa-floating-install');
    const installBtn = document.getElementById('pwa-install-btn');
    
    // Debug: elemek ellenőrzése
    console.log('🔧 PWA Elements Check:');
    console.log('  - installContainer:', !!installContainer);
    console.log('  - installBtn:', !!installBtn);
    console.log('  - deferredPrompt:', !!deferredPrompt);
    
    if (!installContainer || !installBtn) {
      console.error('❌ PWA install elements not found in DOM!');
      return { showInstallButton: () => {}, hideInstallButton: () => {}, checkInstallStatus: () => false };
    }
    
    // PWA telepíthetőség és állapot ellenőrzése
    function canShowInstallButton() {
      // Csak akkor jelenítjük meg, ha:
      // 1. Van elérhető install prompt (deferredPrompt)
      // 2. NEM standalone módban vagyunk (nem telepített PWA)
      // 3. NEM a getDisplayMode() szerint standalone
      // 4. localStorage nem jelzi, hogy nemrég volt telepítve
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = window.navigator.standalone === true; // iOS Safari
      const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
      const userDismissedRecently = localStorage.getItem('pwa-user-dismissed');
      
      // Ha nemrég telepítették vagy elutasították, ne jelenjen meg
      if (wasRecentlyInstalled || userDismissedRecently) {
        return false;
      }
      
      return deferredPrompt && !isStandalone && !isInstalled;
    }
    
    // Gomb megjelenítése
    function showInstallButton() {
      if (canShowInstallButton()) {
        installContainer.style.display = 'block';
        console.log('📱 PWA floating install button shown');
      }
    }
    
    // Gomb elrejtése
    function hideInstallButton() {
      installContainer.style.display = 'none';
      console.log('📱 PWA install button hidden');
    }
    
    // PWA telepítés kezelése
    if (installBtn) {
      installBtn.addEventListener('click', () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('✅ PWA installation accepted');
              showNotification('📱 App sikeresen telepítve!');
              hideInstallButton();
              // Jegyezzük meg, hogy telepítették
              localStorage.setItem('pwa-recently-installed', Date.now().toString());
            } else {
              console.log('❌ PWA installation declined');
              // Jegyezzük meg, hogy elutasították (24 órára)
              const dismissTime = Date.now() + (24 * 60 * 60 * 1000); // 24 óra
              localStorage.setItem('pwa-user-dismissed', dismissTime.toString());
              hideInstallButton();
              console.log('🔕 PWA gomb elrejtve 24 órára felhasználói kérésre');
            }
            deferredPrompt = null;
          });
        } else {
          console.log('PWA már telepítve vagy nem támogatott');
          showNotification('📱 Az alkalmazás már telepítve van');
          hideInstallButton();
        }
      });
    }
    
    // PWA telepítési állapot ellenőrzése és localStorage tisztítása
    function checkInstallStatus() {
      // localStorage időzítések ellenőrzése és tisztítása
      const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
      const userDismissedTime = localStorage.getItem('pwa-user-dismissed');
      
      if (wasRecentlyInstalled) {
        // Ha 30 napnál régebben telepítették, töröljük a jelölést
        const installedTime = parseInt(wasRecentlyInstalled);
        if (Date.now() - installedTime > (30 * 24 * 60 * 60 * 1000)) { // 30 nap
          localStorage.removeItem('pwa-recently-installed');
          console.log('🧹 PWA installed flag cleared after 30 days');
        }
      }
      
      if (userDismissedTime) {
        // Ha lejárt az elutasítás időzítése, töröljük
        const dismissTime = parseInt(userDismissedTime);
        if (Date.now() > dismissTime) {
          localStorage.removeItem('pwa-user-dismissed');
          console.log('🧹 PWA dismissed flag cleared after timeout');
        }
      }
      
      // Ha már telepítve van PWA módban, rejtjük a gombot
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInstalled = window.navigator.standalone === true; // iOS Safari
      
      if (isStandalone || isInstalled) {
        hideInstallButton();
        console.log('📱 PWA already installed - hiding install button');
        // Jegyezzük meg, hogy telepítve van
        if (!wasRecentlyInstalled) {
          localStorage.setItem('pwa-recently-installed', Date.now().toString());
        }
        return false;
      }
      return true;
    }
    
    // Kezdeti ellenőrzés
    if (checkInstallStatus() && deferredPrompt) {
      showInstallButton();
    }
    
    // Debug funkciók console-ból
    window.showPWAButton = () => {
      if (installContainer) {
        installContainer.style.display = 'block';
        console.log('🔧 DEBUG: PWA button forced to show');
      } else {
        console.error('❌ Install container not found!');
      }
    };
    
    window.hidePWAButton = () => {
      if (installContainer) {
        installContainer.style.display = 'none';
        console.log('🔧 DEBUG: PWA button hidden');
      } else {
        console.error('❌ Install container not found!');
      }
    };
    
    window.debugPWA = () => {
      console.log('🔧 PWA DEBUG INFO:');
      console.log('  - installContainer:', installContainer);
      console.log('  - installBtn:', installBtn);
      console.log('  - deferredPrompt:', deferredPrompt);
      console.log('  - display-mode:', window.matchMedia('(display-mode: standalone)').matches);
      console.log('  - current display:', installContainer ? installContainer.style.display : 'N/A');
    };
    
    // Automatikus megjelenítés teszteléshez (csak ha engedélyezett)
    console.log('🔧 No deferredPrompt available yet - use showPWAButton() to test UI');
    setTimeout(() => {
      // Csak akkor jelenítjük meg automatikusan, ha minden feltétel teljesül
      if (canShowInstallButton() || !deferredPrompt) {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
        const userDismissed = localStorage.getItem('pwa-user-dismissed');
        
        if (!isStandalone && !wasRecentlyInstalled && !userDismissed) {
          installContainer.style.display = 'block';
          console.log('🔧 AUTO-SHOWING PWA button for testing purposes');
          console.log('📱 PWA button should now be visible in bottom-left corner');
        } else {
          console.log('🔕 PWA button auto-show skipped - user preferences/status');
        }
      }
    }, 3000);
    
    return { showInstallButton, hideInstallButton, checkInstallStatus };
  }
  
  // PWA setup inicializálása
  const pwaInstall = setupPWAInstallButton();
  
  // Globális függvény konzolból való használatra
  window.installPWA = function() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.click();
    } else {
      console.error('❌ PWA install button not found!');
    }
  };
  
  // Backup globális függvények (ha a setupPWAInstallButton nem futott le)
  if (!window.showPWAButton) {
    window.showPWAButton = () => {
      const container = document.getElementById('pwa-floating-install');
      if (container) {
        container.style.display = 'block';
        console.log('🔧 BACKUP: PWA button shown');
      } else {
        console.error('❌ PWA container not found!');
      }
    };
  }
  
  if (!window.hidePWAButton) {
    window.hidePWAButton = () => {
      const container = document.getElementById('pwa-floating-install');
      if (container) {
        container.style.display = 'none';
        console.log('🔧 BACKUP: PWA button hidden');
      } else {
        console.error('❌ PWA container not found!');
      }
    };
  }
  
  if (!window.debugPWA) {
    window.debugPWA = () => {
      const container = document.getElementById('pwa-floating-install');
      const btn = document.getElementById('pwa-install-btn');
      console.log('🔧 BACKUP PWA DEBUG:');
      console.log('  - container:', !!container);
      console.log('  - button:', !!btn);
      console.log('  - display:', container ? container.style.display : 'N/A');
    };
  }
  
  // Várjunk egy kicsit, hogy minden elem biztosan betöltödjön
  setTimeout(() => {
    if (listsContainer && toggleReorderBtn) {
      // Inicializáljuk a sortable-t ha szükséges
      initializeSortable();
    }
  }, 500);
});

// =================================
// SNOOZE RENDSZER JAVÍTÁSA
// =================================

// Rendszeres ellenőrzés globális timer
let snoozeCheckInterval = null;

// Rendszeres snooze ellenőrzés indítása
function startSnoozeMonitoring() {
  // Ha már fut, ne indítsuk újra
  if (snoozeCheckInterval) {
    clearInterval(snoozeCheckInterval);
  }
  
  // Ellenőrzés minden 30 másodpercben
  snoozeCheckInterval = setInterval(() => {
    checkSnoozedNotifications();
  }, 30000); // 30 másodpercenként
  
  console.log('Snooze monitoring started - checking every 30 seconds');
}

// Snooze monitoring leállítása
function stopSnoozeMonitoring() {
  if (snoozeCheckInterval) {
    clearInterval(snoozeCheckInterval);
    snoozeCheckInterval = null;
    console.log('Snooze monitoring stopped');
  }
}
