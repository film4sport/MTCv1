// MTC Court Service Worker v48 (monorepo edition — served from /mobile-app/)
const CACHE_NAME = 'mtc-court-a04ac13f';
const OFFLINE_URL = '/mobile-app/offline.html';

// Assets to cache immediately on install (bundles built by scripts/build-mobile.js)
const PRECACHE_ASSETS = [
  '/mobile-app/offline.html',
  '/mobile-app/manifest.json',
  '/mobile-app/dist/app.bundle.css',
  '/mobile-app/dist/app.bundle.js',
  '/mobile-app/icon-192.png',
  '/mobile-app/favicon.png',
  '/mobile-app/favicon-16.png',
  '/mobile-app/badge-72.png',
  '/mobile-app/icons/tennis-ball.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing mtc-court-a04ac13f...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating mtc-court-a04ac13f...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK FIRST for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first for navigation (HTML pages)
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Network-first for ALL assets (prevents stale cache bugs)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200) {
          // On HTTP error, try returning cached version instead of the error
          return caches.match(event.request).then((cached) => cached || response);
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cached) => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync for bookings (when back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    console.log('[ServiceWorker] Syncing bookings...');
    event.waitUntil(syncPendingBookings());
  }
  if (event.tag === 'sync-messages') {
    console.log('[ServiceWorker] Syncing messages...');
    event.waitUntil(syncPendingMessages());
  }
});

// Sync pending bookings from IndexedDB/localStorage queue
async function syncPendingBookings() {
  try {
    const allClients = await self.clients.matchAll();
    // Notify the app to flush its pending booking queue
    allClients.forEach((client) => {
      client.postMessage({ type: 'SYNC_BOOKINGS' });
    });
  } catch (e) {
    console.warn('[ServiceWorker] Booking sync failed:', e);
  }
}

// Sync pending messages
async function syncPendingMessages() {
  try {
    const allClients = await self.clients.matchAll();
    allClients.forEach((client) => {
      client.postMessage({ type: 'SYNC_MESSAGES' });
    });
  } catch (e) {
    console.warn('[ServiceWorker] Message sync failed:', e);
  }
}

// Push notifications — parse JSON payload for rich notifications
self.addEventListener('push', (event) => {
  let title = 'MTC Court';
  let options = {
    body: 'New notification',
    icon: '/mobile-app/icon-192.png',
    badge: '/mobile-app/badge-72.png',
    data: { url: '/mobile-app/' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.body || options.body;
      if (payload.url) options.data.url = payload.url;
      if (payload.tag) options.tag = payload.tag; // collapse duplicate notifications
    } catch {
      // Not JSON — use raw text
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click — open app to the right screen
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || '/mobile-app/';

  if (event.action === 'close') return;

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/mobile-app/') && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
