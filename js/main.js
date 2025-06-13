// Main Application Entry Point
console.log('🟢 MAIN APPLICATION LOADING - main.js started');
console.log('🟢 Script execution beginning at:', new Date().toLocaleTimeString());

// Import Firebase configuration
import { db, auth, ref, push, onValue, remove, set, get, query, orderByChild, update, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-config.js';

// Import PWA Manager
import './pwa-manager.js';

// Import Audio Manager
import { enableAudio, prepareAudioForNotifications, playNotificationSound, playSingleBeep, stopNotificationSound, startWorkingAudioLoop } from './audio-manager.js';

// Import Language Manager
import { initLanguageSystem, getText, updateUITexts, initLanguageDropdown } from './language-manager.js';

// Import Quick Fixes
import './quick-fixes.js';

console.log('📦 All modules imported successfully');

// Global variables
let currentUser = null;
let userLists = {};
let snoozedNotifications = [];
let snoozeMonitoringInterval = null;

// Notification and UI helper functions
function showNotification(message) {
  const notificationEl = document.createElement('div');
  notificationEl.className = 'notification';
  notificationEl.textContent = message;
  notificationEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-primary);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: var(--box-shadow-primary);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
  `;
  
  document.body.appendChild(notificationEl);
  
  setTimeout(() => {
    notificationEl.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (notificationEl.parentNode) {
        notificationEl.parentNode.removeChild(notificationEl);
      }
    }, 300);
  }, 3000);
}

// Snooze monitoring functions
function startSnoozeMonitoring() {
  if (snoozeMonitoringInterval) {
    clearInterval(snoozeMonitoringInterval);
  }
  
  snoozeMonitoringInterval = setInterval(() => {
    checkSnoozedNotifications();
  }, 60000); // Check every minute
  
  console.log('🔔 Snooze monitoring started');
}

function stopSnoozeMonitoring() {
  if (snoozeMonitoringInterval) {
    clearInterval(snoozeMonitoringInterval);
    snoozeMonitoringInterval = null;
    console.log('🔕 Snooze monitoring stopped');
  }
}

function checkSnoozedNotifications() {
  const now = Date.now();
  const storedSnoozes = JSON.parse(localStorage.getItem('snoozedNotifications') || '[]');
  
  storedSnoozes.forEach((snooze, index) => {
    if (now >= snooze.showAt) {
      // Show the notification again
      showEventNotificationModal(snooze.eventData);
      
      // Remove from storage
      storedSnoozes.splice(index, 1);
      localStorage.setItem('snoozedNotifications', JSON.stringify(storedSnoozes));
      
      console.log('🔔 Snoozed notification triggered:', snooze.eventData.title);
    }
  });
}

// Authentication Functions
const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const authPasswordInput = document.getElementById("auth-password-input");
const registerBtn = document.getElementById("register-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const authMessageEl = document.getElementById("auth-message");

// Initialize Authentication
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("✅ User signed in:", user.email);
    authSection.style.display = "none";
    document.getElementById("app-content").style.display = "block";
    
    // Load user data
    loadUserLists(user.uid);
    loadUserProgress();
    loadThemeFromFirebase();
    
    // Start monitoring
    startSnoozeMonitoring();
    
    // Initialize all app features
    initializeApp();
  } else {
    currentUser = null;
    console.log("❌ User signed out");
    authSection.style.display = "block";
    document.getElementById("app-content").style.display = "none";
    
    // Stop monitoring
    stopSnoozeMonitoring();
  }
});

// Register functionality
if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = authPasswordInput.value;
    
    if (!email || !password) {
      authMessageEl.textContent = "Kérlek add meg az email címet és a jelszót!";
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ User registered:", userCredential.user.email);
      
      // Create default lists for new user
      setTimeout(() => {
        createDefaultLists(userCredential.user.uid);
      }, 1000);
      
      authMessageEl.textContent = "Sikeres regisztráció!";
      authMessageEl.style.color = "var(--accent-primary)";
    } catch (error) {
      console.error("❌ Registration error:", error);
      authMessageEl.textContent = "Regisztráció sikertelen: " + error.message;
      authMessageEl.style.color = "#ef4444";
    }
  });
}

// Login functionality
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = authPasswordInput.value;
    
    if (!email || !password) {
      authMessageEl.textContent = "Kérlek add meg az email címet és a jelszót!";
      return;
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ User logged in:", userCredential.user.email);
      authMessageEl.textContent = "Sikeres bejelentkezés!";
      authMessageEl.style.color = "var(--accent-primary)";
    } catch (error) {
      console.error("❌ Login error:", error);
      authMessageEl.textContent = "Bejelentkezés sikertelen: " + error.message;
      authMessageEl.style.color = "#ef4444";
    }
  });
}

// Logout functionality
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("✅ User logged out");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  });
}

// Initialize main application
function initializeApp() {
  console.log('🚀 Initializing main application...');
  
  // Initialize audio
  prepareAudioForNotifications();
  
  // Initialize navigation
  initNavigation();
  
  // Initialize language system
  initLanguageSystem();
  
  // Initialize theme selector
  initThemeSelector();
  
  // Initialize profile menu
  initProfileMenu();
  
  // Load initial data
  updateDashboard();
  
  console.log('✅ Main application initialized successfully');
}

// Basic navigation initialization
function initNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      
      // Remove active class from all tabs and contents
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const targetContent = document.querySelector(`[data-tab="${targetTab}"]`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
      
      // Update specific tab content
      switch(targetTab) {
        case 'dashboard':
          updateDashboard();
          break;
        case 'lists':
          // Lists are already loaded
          break;
        case 'notes':
          loadNotes();
          break;
        case 'calendar':
          initializeCalendar();
          loadEvents();
          break;
        case 'overview':
          updateOverview();
          break;
      }
    });
  });
}

// Placeholder functions (to be implemented in separate modules)
function loadUserLists(uid) { console.log('Loading user lists...'); }
function loadUserProgress() { console.log('Loading user progress...'); }
function loadThemeFromFirebase() { console.log('Loading theme...'); }
function createDefaultLists(uid) { console.log('Creating default lists...'); }
function updateDashboard() { 
  console.log('Updating dashboard...');
  // Update UI texts after content loads
  setTimeout(() => updateUITexts(), 100);
}
function initThemeSelector() { console.log('Initializing theme selector...'); }
function initProfileMenu() { console.log('Initializing profile menu...'); }
function loadNotes() { 
  console.log('Loading notes...');
  // Update UI texts after notes load
  setTimeout(() => updateUITexts(), 100);
}
function initializeCalendar() { 
  console.log('Initializing calendar...');
  // Update UI texts after calendar loads
  setTimeout(() => updateUITexts(), 100);
}
function loadEvents() { console.log('Loading events...'); }
function updateOverview() { 
  console.log('Updating overview...');
  // Update UI texts after overview loads
  setTimeout(() => updateUITexts(), 100);
}
function showEventNotificationModal(eventData) { console.log('Showing event notification:', eventData); }

// Export global functions for external access
window.showNotification = showNotification;
window.playNotificationSound = playNotificationSound;
window.stopNotificationSound = stopNotificationSound;

console.log('✅ Main application module loaded successfully');
console.log('🎯 Application ready for user interaction'); 