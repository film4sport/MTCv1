const CACHE_NAME = 'mtc-v3';
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

  // For Next.js pages, JS bundles, and API routes — ALWAYS go to network, no caching
  // This prevents stale pages from being served after code changes
  if (
    event.request.mode === 'navigate' ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    // Network only — no cache fallback for pages/bundles
    // This ensures users always get the latest version
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

  // Everything else — network only (don't intercept, let browser handle normally)
});
