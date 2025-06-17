// PWA Manager Module
console.log('🔧 PWA Manager module loading...');

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
  
  // Force check install status
  if (typeof window.pwaInstall !== 'undefined' && window.pwaInstall.checkInstallStatus) {
    setTimeout(() => {
      window.pwaInstall.checkInstallStatus();
    }, 500);
  }
};

// Force show PWA button for testing
window.forceShowPWA = function() {
  const container = document.getElementById('pwa-floating-install');
  if (container) {
    container.style.display = 'block';
    console.log('🔧 PWA button force shown');
  }
};

// Test hogy a függvények elérhetők-e
console.log('✅ IMMEDIATE PWA functions defined successfully!');
console.log('🔧 Test immediately: debugPWA()');
console.log('📱 Available commands: showPWAButton(), hidePWAButton(), debugPWA(), installPWA(), resetPWA()');

// PWA Installation Prompt
let deferredPrompt = null;
let serviceWorkerRegistration = null;

// Service Worker regisztráció az index.js-ben történik
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.register('./sw.js')
//     .then(registration => {
//       console.log('ServiceWorker regisztrálva:', registration.scope);
//       serviceWorkerRegistration = registration;
//       
//       // Új service worker telepítése esetén
//       registration.addEventListener('updatefound', () => {
//         const newWorker = registration.installing;
//         if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
//           console.log('Új verzió elérhető!');
//         }
//       });
//     })
//     .catch(err => {
//       console.error('ServiceWorker regisztrációs hiba:', err);
//     });
// }

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

// PWA setup function
function setupPWAInstallButton() {
  console.log('🔧 Setting up PWA install button');
  
  function canShowInstallButton() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isiOSStandalone = window.navigator.standalone === true;
    const wasRecentlyInstalled = localStorage.getItem('pwa-recently-installed');
    const userDismissedTime = localStorage.getItem('pwa-user-dismissed');
    
    const now = Date.now();
    const dismissedRecently = userDismissedTime && (now - parseInt(userDismissedTime)) < (2 * 60 * 60 * 1000); // 2 hours instead of 24
    const installedRecently = wasRecentlyInstalled && (now - parseInt(wasRecentlyInstalled)) < (24 * 60 * 60 * 1000);
    
    console.log('🔍 PWA Install Check:', {
      isStandalone,
      isiOSStandalone,
      hasPrompt: !!deferredPrompt,
      dismissedRecently,
      installedRecently,
      canShow: !isStandalone && !isiOSStandalone && !installedRecently && !dismissedRecently && !!deferredPrompt
    });
    
    return !isStandalone && !isiOSStandalone && !installedRecently && !dismissedRecently && !!deferredPrompt;
  }
  
  function showInstallButton() {
    const container = document.getElementById('pwa-floating-install');
    if (container && canShowInstallButton()) {
      container.style.display = 'block';
      console.log('📱 PWA install button shown');
    }
  }
  
  function hideInstallButton() {
    const container = document.getElementById('pwa-floating-install');
    if (container) {
      container.style.display = 'none';
      console.log('📱 PWA install button hidden');
    }
  }
  
  // Install button click handler
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        console.log('❌ No deferred prompt available');
        return;
      }
      
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('✅ User accepted PWA install');
        } else {
          console.log('❌ User dismissed PWA install');
          localStorage.setItem('pwa-user-dismissed', Date.now().toString());
        }
        
        deferredPrompt = null;
        hideInstallButton();
      } catch (error) {
        console.error('❌ PWA install error:', error);
      }
    });
  }
  
  // Check install status periodically
  function checkInstallStatus() {
    if (canShowInstallButton()) {
      showInstallButton();
    } else {
      hideInstallButton();
    }
  }
  
  // Initial check
  setTimeout(checkInstallStatus, 1000);
  
  // Periodic checks
  setInterval(checkInstallStatus, 30000);
  
  // Export functions for global access
  window.pwaInstall = {
    showInstallButton,
    hideInstallButton,
    canShowInstallButton,
    checkInstallStatus
  };
}

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPWAInstallButton);
} else {
  setupPWAInstallButton();
}

console.log('✅ PWA Manager module loaded successfully');

export { deferredPrompt, serviceWorkerRegistration }; 