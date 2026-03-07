const CACHE_NAME = 'mtc-v12'; // Bump on each deploy to invalidate old caches
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/tennis-ball-clean.png',
  '/tennis-ball-loader.png',
  '/mono-logo.png',
  '/Gotham_Rounded_Medium.otf',
];

// Install — cache only truly static assets (images, fonts, manifest)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean ALL old caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — only cache static assets, let everything else go to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip chrome-extension and HMR requests
  if (url.protocol === 'chrome-extension:') return;
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Skip Supabase API calls — always go direct to network
  if (url.hostname.endsWith('.supabase.co')) return;

  // For Next.js pages, JS bundles, and API routes — ALWAYS go to network
  // IMPORTANT: We use event.respondWith(fetch()) instead of bare return;
  // A bare return; falls through to the browser's HTTP cache, which can serve stale HTML.
  // fetch() inside a SW always goes to the network, bypassing the HTTP cache.
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    event.respondWith(
      fetch(event.request).catch(function() {
        // If network fails (offline), return a basic offline response for navigation
        if (event.request.mode === 'navigate') {
          return new Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:4rem"><h1>Offline</h1><p>Please check your connection and try again.</p></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        }
        // For non-navigate requests (_next bundles, API), propagate the error
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  // Skip cross-origin requests entirely — let the browser handle CDN images naturally
  if (url.origin !== self.location.origin) return;

  // For same-origin static assets (images, fonts, manifest) — cache-first strategy
  const isStaticAsset = STATIC_ASSETS.some(asset => url.pathname === asset) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|otf|ttf|webp)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else same-origin (RSC payloads, JSON, etc.) — force network fetch.
  // A bare `return;` would let the browser's HTTP cache serve stale content.
  // Using event.respondWith(fetch()) bypasses the HTTP cache from within the SW.
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response('Network error', { status: 503 });
    })
  );
});

// ─── Web Push ─────────────────────────────────────────────
// Receive push notifications from the server and display them.
// Mirrors the mobile PWA sw.js push handler.

self.addEventListener('push', (event) => {
  const defaultOptions = {
    title: 'Mono Tennis Club',
    body: 'You have a new notification',
    icon: '/favicon.png',
    badge: '/favicon.png',
    url: '/dashboard',
    tag: 'mtc-' + Date.now(),
  };

  let data = defaultOptions;
  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...defaultOptions, ...parsed };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || defaultOptions.icon,
    badge: data.badge || defaultOptions.badge,
    tag: data.tag || defaultOptions.tag,
    data: { url: data.url || defaultOptions.url },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || defaultOptions.title, options)
      .then(() => {
        // Notify open Dashboard tabs to refetch data
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PUSH_RECEIVED', tag: options.tag });
        });
      })
  );
});

// Handle notification click — focus existing dashboard tab or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus an existing dashboard tab if one is open
      for (const client of clients) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
