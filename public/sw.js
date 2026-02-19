const CACHE_NAME = 'mtc-v8';
const STATIC_ASSETS = [
  '/manifest.json',
  '/favicon.png',
  '/tennis-ball-clean.png',
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

  // For static assets (images, fonts, manifest) — cache-first strategy
  const isStaticAsset = STATIC_ASSETS.some(asset => url.pathname === asset) ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|otf|ttf|webp)$/);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
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

  // Everything else (RSC payloads, JSON, etc.) — force network fetch.
  // A bare `return;` would let the browser's HTTP cache serve stale content.
  // Using event.respondWith(fetch()) bypasses the HTTP cache from within the SW.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }
});
