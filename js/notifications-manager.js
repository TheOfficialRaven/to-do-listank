/* ===================================
   NOTIFICATIONS-MANAGER.JS - Event Notifications & Audio
   =================================== */

import { showNotification } from './app-core.js';

// Audio and notification state
let audioContext = null;
let audioEnabled = false;
let audioFullyActivated = false;
let isNotificationPlaying = false;
let notificationInterval = null;

/**
 * Initialize notifications manager
 */
export function initializeNotificationsManager() {
  console.log('🔔 Initializing Notifications Manager...');
  
  // Set up audio system
  enableAudio();
  
  // Request notification permission
  requestNotificationPermission();
  
  // Set up snooze monitoring
  startSnoozeMonitoring();
  
  // Enable audio on user interaction
  enableAudioOnUserInteraction();
  
  console.log('✅ Notifications Manager initialized');
}

/**
 * Enable audio for notifications
 */
function enableAudio() {
  if (typeof window !== 'undefined' && window.AudioContext) {
    console.log('🔊 Audio system initialization starting...');
    
    // Audio aktiválás késleltetése user interaction-ig
    prepareAudioForNotifications();
    
    console.log('✅ Audio system prepared (waiting for user interaction)');
  } else {
    console.warn('⚠️ Web Audio API not supported in this browser');
    audioEnabled = false;
  }
}

/**
 * Prepare audio for notifications (delayed activation)
 */
function prepareAudioForNotifications() {
  console.log('🔧 Audio system prepared but NOT activated yet');
  console.log('💡 Audio will activate on first user interaction (click/touch/key)');
  
  // Flag hogy az audio rendszer készen áll, de még nincs aktiválva
  audioEnabled = true;
  audioFullyActivated = false;
}

/**
 * Enable audio on user interaction
 */
function enableAudioOnUserInteraction() {
  function audioHandler() {
    if (!audioFullyActivated && audioEnabled) {
      try {
        // AudioContext létrehozása user interaction után
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioFullyActivated = true;
        
        console.log('✅ Audio system FULLY ACTIVATED after user interaction');
        console.log('🔊 Notifications can now play sounds');
        
        // Event listener eltávolítása
        document.removeEventListener('click', audioHandler);
        document.removeEventListener('touchstart', audioHandler);
        document.removeEventListener('keydown', audioHandler);
      } catch (error) {
        console.error('❌ Failed to initialize AudioContext:', error);
        audioEnabled = false;
        audioFullyActivated = false;
      }
    }
  }
  
  // Minden fontos elemre event listener
  document.addEventListener('click', audioHandler, { once: false });
  document.addEventListener('touchstart', audioHandler, { once: false });
  document.addEventListener('keydown', audioHandler, { once: false });
}

/**
 * Enable audio on important elements
 */
function enableAudioOnImportantElements() {
  const importantElements = document.querySelectorAll('button, input, a, .clickable');
  importantElements.forEach(element => {
    element.addEventListener('click', enableAudioOnUserInteraction, { once: true });
  });
}

/**
 * Play notification sound
 */
export function playNotificationSound() {
  if (!audioEnabled || !audioFullyActivated) {
    console.log('🔇 Audio not activated yet - sound skipped');
    return;
  }
  
  if (isNotificationPlaying) {
    console.log('🔊 Notification already playing - skipping duplicate');
    return;
  }
  
  console.log('🔊 Starting notification sound loop...');
  isNotificationPlaying = true;
  
  // Egyszerű loop rendszer
  startSimpleLoop();
}

/**
 * Start simple loop system
 */
function startSimpleLoop() {
  if (!audioContext || !audioFullyActivated) {
    console.log('❌ AudioContext not ready for sound');
    return;
  }
  
  console.log('▶️ Simple loop system started');
  
  // Beep lejátszása azonnal
  playSingleBeep();
  
  // Ismétlés 3 másodpercenként
  notificationInterval = setInterval(() => {
    if (isNotificationPlaying && audioContext) {
      playSingleBeep();
    } else {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  }, 3000);
}

/**
 * Start working audio loop
 */
function startWorkingAudioLoop() {
  console.log('🎵 Starting working audio loop...');
  startContinuousLoop();
}

/**
 * Start continuous loop
 */
function startContinuousLoop() {
  if (!audioContext || !audioFullyActivated) {
    console.log('❌ AudioContext not ready for continuous sound');
    return;
  }
  
  console.log('🔄 Continuous loop system started');
  
  function playLoop() {
    if (isNotificationPlaying && audioContext) {
      playSingleBeep();
      
      // Következő beep ütemezése
      setTimeout(playLoop, 3000);
    }
  }
  
  // Loop indítása
  playLoop();
}

/**
 * Play single beep
 */
function playSingleBeep() {
  if (!audioContext || !audioFullyActivated) {
    console.log('❌ Cannot play beep - AudioContext not ready');
    return;
  }
  
  try {
    // Oscillator létrehozása
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Beállítások
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz
    oscillator.type = 'sine';
    
    // Hangerő envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    // Kapcsolatok
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Lejátszás
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
    
    console.log('🔊 Beep played');
    
  } catch (error) {
    console.error('❌ Error playing beep:', error);
  }
}

/**
 * Stop notification sound
 */
export function stopNotificationSound() {
  console.log('🔇 Stopping all notification sounds...');
  
  // Flag állítása
  isNotificationPlaying = false;
  
  // Interval leállítása
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('✅ Notification interval cleared');
  } else {
    console.log('ℹ️ No notification interval to clear');
  }
  
  console.log('✅ All notification sounds stopped completely');
}

/**
 * Schedule notification for event
 */
export function scheduleNotification(eventData) {
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
 * Check upcoming notifications
 */
export function checkUpcomingNotifications() {
  // This would check for upcoming events and schedule notifications
  console.log('Checking for upcoming notifications...');
}

/**
 * Show event notification
 */
export function showEventNotification(eventData) {
  console.log('🔔 Showing event notification:', eventData.title);
  
  // Show browser notification if permission granted
  if (Notification.permission === 'granted') {
    createRegularNotification(eventData);
  }
  
  // Show modal notification
  showEventNotificationModal(eventData);
}

/**
 * Create regular browser notification
 */
function createRegularNotification(eventData) {
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

/**
 * Request notification permission
 */
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Notification permission:', permission);
    });
  }
}

/**
 * Show event notification modal
 */
function showEventNotificationModal(eventData) {
  // Remove any existing notification modal
  const existingModal = document.getElementById('event-notification-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'event-notification-modal';
  modal.className = 'modal notification-modal';
  modal.innerHTML = `
    <div class="modal-content notification-content">
      <div class="notification-header">
        <h2>🔔 Event Reminder</h2>
        <button class="close-btn" id="close-notification">×</button>
      </div>
      <div class="notification-body">
        <h3>${eventData.title}</h3>
        <p><strong>Time:</strong> ${eventData.time}</p>
        <p><strong>Description:</strong> ${eventData.description || 'No description'}</p>
      </div>
      <div class="notification-actions">
        <button id="snooze-notification" class="btn-secondary">
          ⏰ Snooze (1 min)
        </button>
        <button id="dismiss-notification" class="btn-primary">
          ✓ Got it
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  // Start notification sound
  playNotificationSound();
  
  // Set up event listeners
  setupEventNotificationListeners(eventData);
}

/**
 * Set up event notification listeners
 */
function setupEventNotificationListeners(eventData) {
  const modal = document.getElementById('event-notification-modal');
  const closeBtn = document.getElementById('close-notification');
  const snoozeBtn = document.getElementById('snooze-notification');
  const dismissBtn = document.getElementById('dismiss-notification');
  
  const closeModal = () => {
    stopNotificationSound();
    if (modal && document.body.contains(modal)) {
      document.body.removeChild(modal);
    }
  };
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  if (snoozeBtn) {
    snoozeBtn.addEventListener('click', () => {
      snoozeEventNotification(eventData);
    });
  }
  
  if (dismissBtn) {
    dismissBtn.addEventListener('click', closeModal);
  }
  
  // Close on escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

/**
 * Close event notification modal
 */
export function closeEventNotificationModal() {
  const modal = document.getElementById('event-notification-modal');
  if (modal) {
    stopNotificationSound();
    document.body.removeChild(modal);
  }
}

/**
 * Snooze event notification
 */
function snoozeEventNotification(eventData) {
  // Stop sound first
  stopNotificationSound();
  
  const snoozeTime = new Date(Date.now() + 1 * 60 * 1000); // 1 minute for testing
  
  // Store in localStorage for persistence
  const snoozeData = {
    eventData: eventData,
    snoozeTime: snoozeTime.getTime(),
    id: `snooze_${Date.now()}_${Math.random()}`
  };
  
  // Save to localStorage
  let snoozedEvents = JSON.parse(localStorage.getItem('snoozedEvents') || '[]');
  snoozedEvents.push(snoozeData);
  localStorage.setItem('snoozedEvents', JSON.stringify(snoozedEvents));
  
  console.log(`Event notification snoozed for 1 minute: ${eventData.title} until ${snoozeTime.toLocaleString()}`);
  showNotification(`⏰ ${eventData.title} - 1 perc múlva újra emlékeztetés`);
  
  // Close modal
  closeEventNotificationModal();
  
  // Start checking for snoozed notifications
  checkSnoozedNotifications();
}

/**
 * Check snoozed notifications
 */
function checkSnoozedNotifications() {
  const now = Date.now();
  let snoozedEvents = JSON.parse(localStorage.getItem('snoozedEvents') || '[]');
  let activeSnoozedEvents = [];
  
  snoozedEvents.forEach(snoozeData => {
    if (now >= snoozeData.snoozeTime) {
      // Time's up - show notification
      console.log(`Showing snoozed notification: ${snoozeData.eventData.title}`);
      showEventNotification(snoozeData.eventData);
    } else {
      // Not yet time - keep it
      activeSnoozedEvents.push(snoozeData);
    }
  });
  
  // Update localStorage
  localStorage.setItem('snoozedEvents', JSON.stringify(activeSnoozedEvents));
}

/**
 * Clear snoozed notifications
 */
function clearSnoozedNotifications() {
  stopNotificationSound();
  localStorage.removeItem('snoozedEvents');
  console.log('All snoozed notifications cleared');
}

/**
 * Start snooze monitoring
 */
function startSnoozeMonitoring() {
  // Check every 30 seconds for snoozed notifications
  setInterval(() => {
    checkSnoozedNotifications();
  }, 30000);
}

/**
 * Stop snooze monitoring
 */
function stopSnoozeMonitoring() {
  // This would stop the monitoring interval if needed
  console.log('Snooze monitoring stopped');
}

// Testing functions for console access
window.stopTestSound = function() {
  stopNotificationSound();
  console.log('🔇 Test sound stopped manually');
};

window.testContinuousSound = function() {
  console.log('🔊 ========== TESTING CONTINUOUS SOUND (SAFE MODE) ==========');
  
  if (!audioFullyActivated) {
    console.log('⚠️ Audio not yet activated! Please click somewhere on the page first.');
    return;
  }
  
  console.log('📋 Audio status: ready');
  
  // Reset audio flags
  isNotificationPlaying = false;
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  console.log('🔧 Audio system reset complete');
  console.log('🔊 Starting SIMPLE LOOP system...');
  
  playNotificationSound();
  
  console.log('▶️ Simple loop sound started. Use stopTestSound() to stop.');
  console.log('📋 Expected behavior: Sound plays every 3 seconds');
};

window.testNotificationSystem = function() {
  console.log('🧪 ========== TESTING COMPLETE NOTIFICATION SYSTEM (SAFE MODE) ==========');
  console.log('📊 Current audio status:');
  console.log('  - audioContext:', !!audioContext);
  console.log('  - audioEnabled:', audioEnabled);
  console.log('  - audioFullyActivated:', audioFullyActivated);
  console.log('  - isNotificationPlaying:', isNotificationPlaying);
  
  if (!audioFullyActivated) {
    console.log('⚠️ Audio not yet activated by user interaction!');
    console.log('💡 Please click/touch/type somewhere on the page first.');
    console.log('🔧 After user interaction, try this test again.');
    console.log('📋 This prevents AudioContext browser errors.');
    return;
  }
  
  // Test event
  const testEvent = {
    title: '🔊 Teszt Értesítés - SAFE MODE',
    description: 'Ellenőrizd: hang loop működik + modal bezáráskor leáll',
    time: new Date().toLocaleTimeString()
  };
  
  console.log('✅ Audio is ready - testing notification...');
  console.log('📱 Showing test notification...');
  showEventNotification(testEvent);
  
  console.log('✅ Test notification shown (user interaction safe). Check that:');
  console.log('   1. Modal appears');
  console.log('   2. Sound plays every 3 seconds (loop)');
  console.log('   3. Sound stops when modal is closed');
  console.log('==================================================');
};

// Export main functions
export {
  enableAudio,
  requestNotificationPermission,
  checkUpcomingNotifications,
  clearSnoozedNotifications,
  startSnoozeMonitoring,
  stopSnoozeMonitoring
}; 