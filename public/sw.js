// Bitget AI RedTeam Desk Service Worker
// Version: redteam-desk-v2
//
// v2 fix: hashed production chunks under /_next/static/ used to be served
// cache-first forever, so any deploy left returning users on stale JS/CSS
// until they manually purged (seen live on 2026-10-06). Static assets are
// now stale-while-revalidate: the cached copy answers instantly, the
// network copy refreshes the cache in the background, so staleness can
// never outlive a single reload.

const CACHE_NAME = 'redteam-desk-v2';
const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/maskable-icon-512.png',
  '/apple-touch-icon.png'
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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background-color: #F7F8F6;
      border: 1px solid rgba(84, 105, 126, 0.25);
      padding: 32px;
      max-width: 520px;
      width: 100%;
    }
    .badge {
      display: inline-block;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #54697E;
      margin-bottom: 12px;
      background: #E7E9E6;
      border: 1px solid rgba(84, 105, 126, 0.25);
      padding: 3px 8px;
    }
    h1 {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 20px;
      font-weight: 700;
      color: #0E2436;
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
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      background-color: #0E2436;
      color: #F7F8F6;
      text-decoration: none;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 20px;
      border: none;
      cursor: pointer;
      min-height: 44px;
      width: 100%;
      text-align: center;
    }
    .btn:hover {
      background-color: #06121C;
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

// Put a successful response into the runtime cache (best-effort).
const refreshCache = (request, response) => {
  if (response && response.status === 200 && response.type !== 'opaque') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
};

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

  // 2. NETWORK FIRST FOR NAVIGATION: always fresh HTML when online; the SW
  //    never serves a stale document (a stale document hydrating against
  //    fresh chunks causes React #418 hydration mismatches).
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

  // 3. STALE-WHILE-REVALIDATE for static assets (scripts, styles, images,
  //    fonts). Cached copy answers immediately; network copy refreshes the
  //    cache so the next load is always current. Offline falls back to the
  //    last-good copy, preserving PWA behaviour.
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
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            refreshCache(event.request, networkResponse);
            return networkResponse;
          })
          .catch(() => cachedResponse);
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Default network fetch
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
