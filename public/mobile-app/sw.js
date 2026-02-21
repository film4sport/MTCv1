// MTC Court Service Worker v47 (monorepo edition — served from /mobile-app/)
const CACHE_NAME = 'mtc-court-v148';
const OFFLINE_URL = '/mobile-app/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/mobile-app/offline.html',
  '/mobile-app/manifest.json',
  '/mobile-app/css/variables.css',
  '/mobile-app/css/base.css',
  '/mobile-app/css/login.css',
  '/mobile-app/css/layout.css',
  '/mobile-app/css/home.css',
  '/mobile-app/css/booking.css',
  '/mobile-app/css/navigation.css',
  '/mobile-app/css/social.css',
  '/mobile-app/css/admin.css',
  '/mobile-app/css/payments.css',
  '/mobile-app/css/search.css',
  '/mobile-app/css/profile.css',
  '/mobile-app/css/messaging.css',
  '/mobile-app/css/events.css',
  '/mobile-app/css/partners.css',
  '/mobile-app/css/schedule.css',
  '/mobile-app/css/events-screen.css',
  '/mobile-app/css/screens.css',
  '/mobile-app/css/modals.css',
  '/mobile-app/css/enhancements.css',
  '/mobile-app/css/neumorphic.css',
  '/mobile-app/css/chat.css',
  '/mobile-app/js/utils.js',
  '/mobile-app/js/config.js',
  '/mobile-app/js/auth.js',
  '/mobile-app/js/theme.js',
  '/mobile-app/js/navigation.js',
  '/mobile-app/js/partners.js',
  '/mobile-app/js/weather.js',
  '/mobile-app/js/booking.js',
  '/mobile-app/js/schedule.js',
  '/mobile-app/js/events.js',
  '/mobile-app/js/interactive.js',
  '/mobile-app/js/payments.js',
  '/mobile-app/js/mybookings.js',
  '/mobile-app/js/onboarding.js',
  '/mobile-app/js/events-registration.js',
  '/mobile-app/js/avatar.js',
  '/mobile-app/js/messaging.js',
  '/mobile-app/js/account.js',
  '/mobile-app/js/notifications.js',
  '/mobile-app/js/pull-refresh.js',
  '/mobile-app/js/profile.js',
  '/mobile-app/js/enhancements.js',
  '/mobile-app/js/confirm-modal.js',
  '/mobile-app/js/app.js',
  '/mobile-app/icon-192.png',
  '/mobile-app/favicon.png',
  '/mobile-app/favicon-16.png',
  '/mobile-app/badge-72.png',
  '/mobile-app/icons/tennis-ball.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing v47...');

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
  console.log('[ServiceWorker] Activating v47...');

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
          return response;
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
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from MTC Court',
    icon: '/mobile-app/icon-192.png',
    badge: '/mobile-app/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MTC Court', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/mobile-app/')
    );
  }
});
