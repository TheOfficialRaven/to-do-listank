/* ===================================
   APP-CORE.JS - Core Application Logic
   =================================== */

import { initializeFirebase, auth, db } from './firebase-config.js';

// Core application state
let currentUser = null;
let currentTab = 'dashboard';
let appInitialized = false;

// Application configuration
const APP_CONFIG = {
  version: '2.1.0',
  debugMode: false,
  features: {
    pwa: true,
    audio: true,
    notifications: true,
    offline: true
  }
};

/**
 * Initialize the entire application
 */
export async function initializeApp() {
  if (appInitialized) {
    console.log('⚠️ App already initialized');
    return;
  }

  console.log('🚀 Initializing application...');
  
  try {
    // Show loading state
    showLoadingState();
    
    // Initialize core systems
    await initializeFirebase();
    await import('./language-manager.js').then(module => module.initializeLanguageSystem());
    
    // Initialize optional features
    if (APP_CONFIG.features.pwa) {
      await import('./pwa-manager.js').then(module => module.initializePWA());
    }
    
    if (APP_CONFIG.features.audio) {
      await import('./audio-manager.js').then(module => module.initializeAudio());
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize navigation
    initializeNavigation();
    
    // Check authentication state
    setupAuthStateListener();
    
    appInitialized = true;
    hideLoadingState();
    
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    showErrorState('Failed to initialize application');
  }
}

/**
 * Set up authentication state listener
 */
function setupAuthStateListener() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showMainApp();
      loadUserData();
    } else {
      currentUser = null;
      showAuthSection();
    }
  });
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (APP_CONFIG.debugMode) {
      showNotification(`Error: ${event.error.message}`, 'error');
    }
  });
  
  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (APP_CONFIG.debugMode) {
      showNotification(`Promise error: ${event.reason}`, 'error');
    }
  });
  
  // Online/offline status
  window.addEventListener('online', () => {
    showNotification('🌐 Connection restored', 'success');
    syncOfflineData();
  });
  
  window.addEventListener('offline', () => {
    showNotification('📱 Working offline', 'info');
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Tab visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
  // Ctrl/Cmd + K: Quick search/add
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    openQuickActionModal();
  }
  
  // Escape: Close modals
  if (event.key === 'Escape') {
    closeAllModals();
  }
  
  // Ctrl/Cmd + 1-4: Switch tabs
  if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '4') {
    event.preventDefault();
    const tabIndex = parseInt(event.key) - 1;
    const tabs = ['dashboard', 'lists', 'notes', 'calendar'];
    if (tabs[tabIndex]) {
      switchTab(tabs[tabIndex]);
    }
  }
}

/**
 * Handle tab visibility changes
 */
function handleVisibilityChange() {
  if (document.hidden) {
    // Tab became hidden
    pauseAnimations();
  } else {
    // Tab became visible
    resumeAnimations();
    refreshData();
  }
}

/**
 * Initialize navigation system
 */
function initializeNavigation() {
  const navTabs = document.querySelectorAll('.nav-tab');
  
  navTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });
  
  // Set initial tab
  switchTab('dashboard');
}

/**
 * Switch between application tabs
 */
export function switchTab(tabId) {
  if (currentTab === tabId) return;
  
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  // Remove active class from all nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content
  const selectedContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
  const selectedTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  
  if (selectedContent && selectedTab) {
    selectedContent.classList.add('active');
    selectedTab.classList.add('active');
    currentTab = tabId;
    
    // Trigger tab-specific initialization
    initializeTabContent(tabId);
    
    // Update URL without page reload
    history.replaceState(null, '', `#${tabId}`);
  }
}

/**
 * Initialize tab-specific content
 */
function initializeTabContent(tabId) {
  switch (tabId) {
    case 'dashboard':
      updateDashboard();
      break;
    case 'lists':
      loadLists();
      break;
    case 'notes':
      loadNotes();
      break;
    case 'calendar':
      initializeCalendar();
      break;
    case 'overview':
      updateOverview();
      break;
  }
}

/**
 * Load user-specific data
 */
async function loadUserData() {
  if (!currentUser) return;
  
  try {
    showLoadingIndicator();
    
    // Load user preferences
    await loadUserPreferences();
    
    // Load user data for current tab
    await initializeTabContent(currentTab);
    
    // Start periodic data refresh
    startPeriodicRefresh();
    
    hideLoadingIndicator();
    
  } catch (error) {
    console.error('Failed to load user data:', error);
    showNotification('Failed to load user data', 'error');
    hideLoadingIndicator();
  }
}

/**
 * Load user preferences (theme, language, etc.)
 */
async function loadUserPreferences() {
  if (!currentUser) return;
  
  try {
    const userRef = ref(db, `users/${currentUser.uid}/preferences`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const preferences = snapshot.val();
      
      // Apply theme
      if (preferences.theme) {
        applyTheme(preferences.theme.name, preferences.theme.mode);
      }
      
      // Apply language
      if (preferences.language) {
        await loadLanguage(preferences.language);
      }
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
}

/**
 * Start periodic data refresh
 */
function startPeriodicRefresh() {
  // Refresh every 5 minutes
  setInterval(() => {
    if (!document.hidden && currentUser) {
      refreshData();
    }
  }, 5 * 60 * 1000);
}

/**
 * Refresh current tab data
 */
function refreshData() {
  if (currentUser) {
    initializeTabContent(currentTab);
  }
}

/**
 * Show/hide loading states
 */
function showLoadingState() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) {
    loadingEl.style.display = 'flex';
  }
}

function hideLoadingState() {
  const loadingEl = document.getElementById('app-loading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }
}

function showLoadingIndicator() {
  document.body.classList.add('loading');
}

function hideLoadingIndicator() {
  document.body.classList.remove('loading');
}

/**
 * Show error state
 */
function showErrorState(message) {
  const errorEl = document.getElementById('app-error');
  if (errorEl) {
    errorEl.querySelector('.error-message').textContent = message;
    errorEl.style.display = 'flex';
  }
}

/**
 * Show/hide main app sections
 */
function showMainApp() {
  document.getElementById('auth-section')?.style.setProperty('display', 'none');
  document.getElementById('main-app')?.style.setProperty('display', 'block');
}

function showAuthSection() {
  document.getElementById('auth-section')?.style.setProperty('display', 'block');
  document.getElementById('main-app')?.style.setProperty('display', 'none');
}

/**
 * Utility functions
 */
function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.style.display = 'none';
  });
}

function openQuickActionModal() {
  const modal = document.getElementById('quick-add-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function pauseAnimations() {
  document.body.classList.add('animations-paused');
}

function resumeAnimations() {
  document.body.classList.remove('animations-paused');
}

/**
 * Sync offline data when connection is restored
 */
async function syncOfflineData() {
  // Implementation for offline data synchronization
  console.log('🔄 Syncing offline data...');
}

/**
 * Show notification to user
 */
export function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Add show class after a brief delay for animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove notification after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get current tab
 */
export function getCurrentTab() {
  return currentTab;
}

/**
 * Get app configuration
 */
export function getAppConfig() {
  return { ...APP_CONFIG };
}

/**
 * Enable debug mode
 */
export function enableDebugMode() {
  APP_CONFIG.debugMode = true;
  console.log('🐛 Debug mode enabled');
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Global debug functions for development
if (typeof window !== 'undefined') {
  window.appDebug = {
    enableDebugMode,
    showNotification,
    switchTab,
    getCurrentUser,
    getAppConfig
  };
} 