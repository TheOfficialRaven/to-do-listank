// Egyszerű service worker, amely csak az installációt kezeli
self.addEventListener('install', (event) => {
    console.log('Service worker telepítve');
    // Itt előtölthetsz erőforrásokat, ha szeretnéd.
  });
  
  self.addEventListener('fetch', (event) => {
    // Egyszerű, nem cache-elő service worker
    event.respondWith(fetch(event.request));
  });