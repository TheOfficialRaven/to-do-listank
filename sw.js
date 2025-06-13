// ===============================================
//  PROGRESSIVE WEB APP SERVICE WORKER
// Todo & Shopping List - Personal Organizer
// ===============================================

const CACHE_NAME = 'todo-app-v2.0.3';
const OFFLINE_CACHE = 'todo-offline-v2.0.3';

// Cache stratégia - mit cache-eljünk
const CACHE_RESOURCES = [
  './',
  './index.html',
  './index.js',
  './styles.css',
  './index.css',
  './modern-themes.css',
  './css/variables.css',
  './css/base.css',
  './css/navigation.css',
  './manifest.json',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png',
  './apple-touch-icon.png',
  './languages/hu.json',
  './languages/en.json',
  './languages/de.json'
];

// Essential resources for offline functionality
const ESSENTIAL_RESOURCES = [
  './',
  './index.html',
  './index.js',
  './index.css'
];

// ===============================================
// 📦 SERVICE WORKER INSTALLATION
// ===============================================
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache essential resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching app resources');
        return cache.addAll(CACHE_RESOURCES);
      }),
      
      // Cache offline fallbacks
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('📦 Caching offline resources');
        return cache.addAll(ESSENTIAL_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// ===============================================
// 🔄 SERVICE WORKER ACTIVATION
// ===============================================
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE)
            .map((cacheName) => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// ===============================================
// 🌐 NETWORK REQUEST HANDLING
// ===============================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Skip Firebase and external API requests (let them go through)
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.startsWith('https://apis.')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Try network request
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone response for caching
            const responseToCache = response.clone();
            
            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed, try to serve offline fallback
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
            
            // For other resources, return from offline cache
            return caches.match(event.request, { cacheName: OFFLINE_CACHE });
          });
      })
  );
});

// ===============================================
// 📱 PUSH NOTIFICATIONS
// ===============================================
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received');
  
  let notificationData = {
    title: '📅 Event Reminder',
    body: 'You have an upcoming event',
    icon: './android-chrome-192x192.png',
    badge: './favicon-32x32.png',
    tag: 'event-reminder',
    data: {
      url: './',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: '👀 View',
        icon: './favicon-16x16.png'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 5min',
        icon: './favicon-16x16.png'
      }
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    sound: 'default'
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (e) {
      console.log('Failed to parse push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// ===============================================
// 🔔 NOTIFICATION INTERACTION - ENHANCED
// ===============================================
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  console.log('🔔 Notification data:', event.notification.data);
  
  // Close the notification
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'snooze') {
    console.log('⏰ Snooze action clicked');
    
    // Snooze for 1 minute (for testing - in production could be 5-10 minutes)
    const snoozeTime = Date.now() + (1 * 60 * 1000); // 1 minute
    
    // Store snooze data for re-notification
    const snoozeData = {
      ...event.notification.data,
      snoozeTime: snoozeTime,
      originalTitle: event.notification.title,
      originalBody: event.notification.body
    };
    
    // Use service worker storage or postMessage to main app
    event.waitUntil(
      storeSnoozeData(snoozeData).then(() => {
        // Schedule re-notification
        setTimeout(() => {
          self.registration.showNotification(
            `⏰ Snoozed: ${snoozeData.originalTitle}`,
            {
              body: snoozeData.originalBody,
              icon: './android-chrome-192x192.png',
              badge: './favicon-32x32.png',
              tag: `snooze-${Date.now()}`,
              requireInteraction: true,
              vibrate: [200, 100, 200],
              data: snoozeData,
              actions: [
                {
                  action: 'snooze',
                  title: '⏰ Snooze again',
                  icon: './favicon-16x16.png'
                },
                {
                  action: 'dismiss',
                  title: '✅ Dismiss',
                  icon: './favicon-16x16.png'
                }
              ]
            }
          );
        }, 60000); // 1 minute delay
      })
    );
    
    return;
  }
  
  if (event.action === 'dismiss') {
    console.log('✅ Dismiss action clicked');
    // Just close - no further action needed
    return;
  }
  
  // Default action (clicking notification body) - open app
  console.log('👀 Opening app...');
  
  event.notification.close();
  
  switch (event.action) {
    case 'view':
      // Open the app
      event.waitUntil(
        clients.openWindow(event.notification.data?.url || './')
      );
      break;
      
    case 'snooze':
      // Schedule another notification in 5 minutes
      event.waitUntil(
        scheduleSnoozeNotification(event.notification.data)
      );
      break;
      
    default:
      // Default action - open app
      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
          .then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
              if (client.url.includes(self.location.origin) && 'focus' in client) {
                return client.focus();
              }
            }
            
            // Otherwise open new window
            if (clients.openWindow) {
              return clients.openWindow('./');
            }
          })
      );
  }
});

// ===============================================
// ⏰ SCHEDULED NOTIFICATIONS
// ===============================================
function scheduleSnoozeNotification(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      self.registration.showNotification('⏰ Snoozed Reminder', {
        body: 'Your snoozed event is now due',
        icon: './android-chrome-192x192.png',
        badge: './favicon-32x32.png',
        tag: 'snoozed-reminder',
        data: data,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });
      resolve();
    }, 5 * 60 * 1000); // 5 minutes
  });
}

// ===============================================
// 🔄 BACKGROUND SYNC
// ===============================================
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-user-data':
      event.waitUntil(syncUserData());
      break;
      
    case 'check-notifications':
      event.waitUntil(checkScheduledNotifications());
      break;
      
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Sync user data when online
async function syncUserData() {
  try {
    console.log('🔄 Syncing user data...');
    
    // Get stored offline data
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Send to Firebase when online
      // This would integrate with your existing Firebase code
      console.log('📤 Uploading offline data:', offlineData);
      
      // Clear offline data after successful sync
      await clearOfflineData();
    }
    
    console.log('✅ Data sync completed');
  } catch (error) {
    console.error('❌ Data sync failed:', error);
  }
}

// Check for scheduled notifications
async function checkScheduledNotifications() {
  try {
    console.log('🔔 Checking scheduled notifications...');
    
    // Get scheduled events from storage
    const scheduledEvents = await getScheduledEvents();
    const now = Date.now();
    
    for (const event of scheduledEvents) {
      if (event.time <= now) {
        // Show notification
        await self.registration.showNotification(event.title, {
          body: event.body,
          icon: './android-chrome-192x192.png',
          badge: './favicon-32x32.png',
          tag: `event-${event.id}`,
          data: event.data,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200]
        });
        
        // Remove from scheduled events
        await removeScheduledEvent(event.id);
      }
    }
    
    console.log('✅ Notification check completed');
  } catch (error) {
    console.error('❌ Notification check failed:', error);
  }
}

// ===============================================
// 💾 STORAGE HELPERS
// ===============================================
async function getOfflineData() {
  // Placeholder for offline data retrieval
  return [];
}

async function clearOfflineData() {
  // Placeholder for offline data clearing
  return true;
}

async function getScheduledEvents() {
  // Placeholder for scheduled events retrieval
  return [];
}

async function removeScheduledEvent(eventId) {
  // Placeholder for scheduled event removal
  return true;
}

// Store snooze data for re-notification
async function storeSnoozeData(snoozeData) {
  try {
    console.log('💾 Storing snooze data:', snoozeData);
    
    // Use IndexedDB or Cache API to store snooze data
    const cache = await caches.open('snooze-data-v1');
    const response = new Response(JSON.stringify(snoozeData));
    await cache.put(`snooze-${snoozeData.snoozeTime}`, response);
    
    console.log('✅ Snooze data stored successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to store snooze data:', error);
    return false;
  }
}

// Get stored snooze data
async function getSnoozeData() {
  try {
    const cache = await caches.open('snooze-data-v1');
    const keys = await cache.keys();
    const snoozeItems = [];
    
    for (const request of keys) {
      const response = await cache.match(request);
      const data = await response.json();
      snoozeItems.push(data);
    }
    
    return snoozeItems;
  } catch (error) {
    console.error('❌ Failed to get snooze data:', error);
    return [];
  }
}

// ===============================================
// 📊 PERIODIC BACKGROUND SYNC (if supported)
// ===============================================
self.addEventListener('periodicsync', (event) => {
  console.log('🔄 Periodic sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'check-events':
      event.waitUntil(checkScheduledNotifications());
      break;
      
    default:
      console.log('Unknown periodic sync tag:', event.tag);
  }
});

// ===============================================
// 🛠️ MESSAGE HANDLING
// ===============================================
self.addEventListener('message', (event) => {
  console.log('💬 Message received from main thread:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SCHEDULE_NOTIFICATION':
      scheduleNotificationFromData(event.data.payload);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
      
    default:
      console.log('Unknown message type:', event.data.type);
  }
});

// Schedule notification from main thread
function scheduleNotificationFromData(data) {
  // Store notification data for later triggering
  console.log('📅 Scheduling notification:', data);
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
  console.log('🗑️ All caches cleared');
}

console.log('✅ Service Worker fully loaded and ready'); 