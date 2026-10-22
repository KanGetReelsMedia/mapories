// Mapories The Living Thread - PWA + Push Notifications
// VAPID: BLWEbNlBPBjYAKc1HLG9pvF6Df83KBB6Fk8KimbKvgXsEvL_AlRDAE5vw1EgsxtSDEPHrgSNeKW3CBvfW0maCAc

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDummy-ConnectHub-60473",
  authDomain: "connecthub-60473.firebaseapp.com",
  projectId: "connecthub-60473",
  storageBucket: "connecthub-60473.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'mapories-living-thread-v3-push';
const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME && k.startsWith('mapories-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.hostname.includes('firestore.googleapis.com') || u.hostname.includes('firebase') || u.hostname.includes('googleapis') || u.hostname.includes('gstatic') || u.hostname.includes('identitytoolkit')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html') || caches.match('/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=> cached || fetch(e.request).then(res => {
    if (res.ok && e.request.method === 'GET' && u.origin === location.origin) {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
    }
    return res;
  })));
});

// --- PUSH NOTIFICATIONS ---
messaging.onBackgroundMessage(payload => {
  console.log('[SW] Background message', payload);
  const title = payload.notification?.title || 'Mapories';
  const options = {
    body: payload.notification?.body || 'Time to weave a new memory ✨',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: payload.data?.url || '/' },
    actions: [
      { action: 'open', title: 'Open Thread' },
      { action: 'close', title: 'Later' }
    ]
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('push', e => {
  // For Web Push without FCM (fallback)
  if (e.data) {
    const data = e.data.json();
    const title = data.title || 'Mapories';
    const options = {
      body: data.body || 'Helping shape, weave, and preserve your most meaningful memories.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' }
    };
    e.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});
