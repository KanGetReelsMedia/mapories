// Mapories Push Setup - add this to your index.html after Firebase init
// VAPID Key: BLWEbNlBPBjYAKc1HLG9pvF6Df83KBB6Fk8KimbKvgXsEvL_AlRDAE5vw1EgsxtSDEPHrgSNeKW3CBvfW0maCAc

async function initMaporiesPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.log('Push permission denied');
    return;
  }

  // Register SW
  const registration = await navigator.serviceWorker.ready;

  // For Firebase Messaging
  const messaging = firebase.messaging();
  try {
    const token = await messaging.getToken({
      vapidKey: 'BLWEbNlBPBjYAKc1HLG9pvF6Df83KBB6Fk8KimbKvgXsEvL_AlRDAE5vw1EgsxtSDEPHrgSNeKW3CBvfW0maCAc',
      serviceWorkerRegistration: registration
    });
    console.log('Mapories FCM Token:', token);
    localStorage.setItem('mapories_fcm_token', token);
    // TODO: Save to Firestore: doc(db, 'mapories_push_tokens', userId)
    return token;
  } catch (err) {
    console.error('Push token error:', err);
  }
}

// Call after login:
// initMaporiesPush();

// Test notification locally
function testMaporiesPush() {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification('Mapories The Living Thread', {
        body: 'Time to weave a new memory ✨',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    });
  }
}

