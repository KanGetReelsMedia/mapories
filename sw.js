// Mapories - PWA Service Worker for connecthub-60473
// RTDB: https://connecthub-60473-default-rtdb.firebaseio.com/

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js');

// Your Firebase config for connecthub-60473
// NOTE: Replace apiKey etc with your real values from Firebase Console > Project Settings > General > Your apps > SDK setup
firebase.initializeApp({
  apiKey: "AIzaSyDUMMY-REPLACE-WITH-REAL-KEY-FROM-CONSOLE",
  authDomain: "connecthub-60473.firebaseapp.com",
  databaseURL: "https://connecthub-60473-default-rtdb.firebaseio.com/",
  projectId: "connecthub-60473",
  storageBucket: "connecthub-60473.appspot.com",
  messagingSenderId: "REPLACE_WITH_REAL_SENDER_ID",
  appId: "REPLACE_WITH_REAL_APP_ID"
});

let messaging;
try {
  messaging = firebase.messaging();
} catch(e) { console.log('Messaging not available', e); }

const CACHE_NAME = 'mapories-connecthub-60473-v5';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('mapories-') || k.startsWith('connecthub-')) && k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // NEVER cache Firebase RTDB / Firestore / Auth / Functions
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('identitytoolkit') ||
    url.pathname.includes('__/') // Firebase Hosting reserved
  ) {
    return; // let browser handle it, no cache
  }
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET' && url.origin === location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// --- Push Notifications ---
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message', payload);
    const title = payload.notification?.title || 'Mapories';
    const options = {
      body: payload.notification?.body || 'Time to weave a new memory ✨',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: payload.data?.url || '/' }
    };
    self.registration.showNotification(title, options);
  });
}

self.addEventListener('push', (e) => {
  if (!e.data) return;
  try {
    const data = e.data.json();
    if (data.notification) return; // handled by FCM above
    e.waitUntil(
      self.registration.showNotification(data.title || 'Mapories', {
        body: data.body || 'New memory in ConnectHub ✨',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url: data.url || '/' }
      })
    );
  } catch (err) {}
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) return client.focus();
      }
      return clients.openWindow(e.notification.data?.url || '/');
    })
  );
});
