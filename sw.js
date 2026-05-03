const STATIC_CACHE = 'madison-static-v3';
const API_CACHE    = 'madison-api-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/js/config.js',
  '/js/i18n.js',
  '/js/intents.js',
  '/js/api.js',
  '/js/formatters.js',
  '/js/speech.js',
  '/js/ui.js',
  '/js/history.js',
  '/js/settings.js',
  '/js/app.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap',
];

// Per-domain TTLs (ms)
const API_TTLS = [
  { match: 'open-meteo.com',         ttl: 30 * 60_000 },
  { match: 'geocoding-api',          ttl: 24 * 60 * 60_000 },
  { match: 'exchangerate-api.com',   ttl: 60 * 60_000 },
  { match: 'wikipedia.org',          ttl: 24 * 60 * 60_000 },
  { match: 'dictionaryapi.dev',      ttl: 24 * 60 * 60_000 },
  { match: 'nasa.gov',               ttl: 60 * 60_000 },
  { match: 'hacker-news.firebase',   ttl: 10 * 60_000 },
  { match: 'allorigins.win',         ttl: 15 * 60_000 },
];

const API_DOMAINS = [
  'open-meteo.com',
  'geocoding-api.open-meteo.com',
  'exchangerate-api.com',
  'wikipedia.org',
  'dictionaryapi.dev',
  'api.nasa.gov',
  'hacker-news.firebaseio.com',
  'allorigins.win',
];

// ---- Install ----
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

// ---- Activate — purge old caches ----
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k !== STATIC_CACHE && k !== API_CACHE)
            .map(k => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---- Fetch ----
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request, url));
    return;
  }

  // Static assets: cache-first, background update
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        updateInBackground(request);
        return cached;
      }
      return fetchAndCache(request, STATIC_CACHE);
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match('/index.html');
      return new Response('Offline', { status: 503 });
    })
  );
});

function isApiRequest(url) {
  return API_DOMAINS.some(d => url.hostname.includes(d));
}

async function handleApiRequest(request, url) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    const age = Date.now() - parseInt(cached.headers.get('sw-cached-at') ?? '0');
    if (age < getTtl(url)) return cached.clone();
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const body = await response.text();
      const headers = new Headers({
        'Content-Type': response.headers.get('Content-Type') ?? 'application/json',
        'sw-cached-at': String(Date.now()),
      });
      await cache.put(request, new Response(body, { status: 200, headers }));
      return new Response(body, { status: 200, headers });
    }
    return response;
  } catch {
    if (cached) return cached.clone();
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getTtl(url) {
  for (const { match, ttl } of API_TTLS) {
    if (url.href.includes(match)) return ttl;
  }
  return 30 * 60_000;
}

async function fetchAndCache(request, cacheName) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

function updateInBackground(request) {
  fetch(request)
    .then(response => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then(c => c.put(request, response));
      }
    })
    .catch(() => {});
}

// ---- Push notifications ----
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Madison', {
      body: data.body ?? 'New update available',
      icon: '/manifest.json',
      data: { url: data.url ?? '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
