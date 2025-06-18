// PWA Management
let deferredPrompt = null;
let serviceWorkerRegistration = null;

// PWA Functions
export function showPWAButton() {
  console.log('🔧 showPWAButton() called');
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('✅ PWA button shown');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
    console.log('💡 Try calling this function after page load');
  }
}

export function hidePWAButton() {
  console.log('🔧 hidePWAButton() called');
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'none';
    console.log('✅ PWA button hidden');
  } else {
    console.error('❌ PWA container not found! DOM might not be ready yet.');
  }
}

export function debugPWA() {
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
}

export function installPWA() {
  console.log('🔧 installPWA() called');
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.click();
    console.log('✅ PWA install triggered');
  } else {
    console.error('❌ PWA install button not found! DOM might not be ready yet.');
  }
}

export function resetPWA() {
  localStorage.removeItem('pwa-recently-installed');
  localStorage.removeItem('pwa-user-dismissed');
  console.log('🧹 PWA localStorage flags cleared');
  console.log('🔄 Refresh the page to see install button again');
  
  // Force show the install button for testing
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('📱 PWA install button forced visible for testing');
  }
}

export function clearPWAState() {
  localStorage.removeItem('pwa-recently-installed');
  localStorage.removeItem('pwa-user-dismissed');
  console.log('🧹 PWA state cleared');
  
  // Show the install button immediately
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('📱 PWA install button shown after state clear');
  }
  
  return true;
}

// Service Worker Registration
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
  
  // Save installation timestamp
  localStorage.setItem('pwa-recently-installed', Date.now().toString());
  
  // Hide install button
  hidePWAButton();
});

// Make PWA functions globally available
window.showPWAButton = showPWAButton;
window.hidePWAButton = hidePWAButton;
window.debugPWA = debugPWA;
window.installPWA = installPWA;
window.resetPWA = resetPWA;
window.clearPWAState = clearPWAState; 