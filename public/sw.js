// Bitget AI RedTeam Desk Service Worker
// Version: redteam-desk-v1

const CACHE_NAME = 'redteam-desk-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png',
  '/apple-touch-icon.png',
  '/brand/bitget-endorsed-lockup.svg'
];

// Offline fallback HTML
const OFFLINE_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Offline | Bitget AI RedTeam Desk</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #E7E9E6;
      color: #0E2436;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background-color: #F7F8F6;
      border: 1px solid #CFD4CF;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #C8102E;
      margin-bottom: 12px;
      background: #E7E9E6;
      border: 1px solid #CFD4CF;
      padding: 3px 8px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.3;
    }
    p {
      font-size: 13px;
      color: #54697E;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background-color: #06121C;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 20px;
      border: none;
      cursor: pointer;
      min-height: 44px;
      width: 100%;
      text-align: center;
    }
    .btn:hover {
      background-color: #0E2436;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Connection Required</div>
    <h1>Bitget AI RedTeam Desk</h1>
    <p>
      The desk requires an active network connection to query live Bitget orderbooks, evaluate off-hours basis decoupling, and calculate deterministic stress scenarios.
    </p>
    <button class="btn" onclick="window.location.reload()">Retry connection</button>
  </div>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache non-critical error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NETWORK ONLY: API routes and market-data endpoints. Never cache prices or state.
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. NETWORK FIRST FOR NAVIGATION: Try network, fall back to offline shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(OFFLINE_PAGE_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
    return;
  }

  // 3. CACHE FIRST FOR STATIC ASSETS (scripts, styles, images, fonts)
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default network fetch
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
