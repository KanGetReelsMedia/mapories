const CACHE_NAME = 'mapories-living-thread-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install - Cache App Shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - Cache first for app, Network only for Firebase
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // NEVER cache Firebase - causes login + syncing issues
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return; // Let browser handle it normally
  }

  // Navigation - Network first, fallback to cache
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => 
        caches.match('./index.html') || caches.match('./')
      )
    );
    return;
  }

  // Everything else - Cache first, then network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(e.request).then((res) => {
        // Cache successful same-origin GETs
        if (res.ok && e.request.method === 'GET' && url.origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
