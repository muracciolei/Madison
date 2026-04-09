const CACHE_NAME = 'madison-v1';
const STATIC_CACHE = 'madison-static-v1';
const API_CACHE = 'madison-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap'
];

// API endpoints to cache
const API_ENDPOINTS = [
  { url: 'https://api.open-meteo.com/v1/forecast', ttl: 30 * 60 * 1000 }, // 30 min
  { url: 'https://geocoding-api.open-meteo.com/v1/search', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  { url: 'https://api.exchangerate-api.com/v4/latest/USD', ttl: 60 * 60 * 1000 }, // 1 hour
  { url: 'https://en.wikipedia.org/api/rest_v1/page/summary', ttl: 24 * 60 * 60 * 1000 }, // 24 hours
  { url: 'api.dictionaryapi.dev', ttl: 24 * 60 * 60 * 1000 } // 24 hours
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => console.error('[SW] Install failed:', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle API requests
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and navigation requests
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update in background
          updateCacheInBackground(request);
          return cachedResponse;
        }

        // No cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Check if request is for an API
function isApiRequest(url) {
  const apiDomains = [
    'api.open-meteo.com',
    'api.exchangerate-api.com',
    'en.wikipedia.org',
    'api.dictionaryapi.dev',
    'api.nasa.gov',
    'newsapi.org',
    'rss'
  ];
  return apiDomains.some(domain => url.hostname.includes(domain) || url.href.includes(domain));
}

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime && Date.now() - parseInt(cachedTime) < getTtl(url)) {
      // Clone before returning to avoid "body locked" error
      return cachedResponse.clone();
    }
  }

  // Fetch from network
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Create a clone for caching
      const responseClone = response.clone();
      
      // Get the JSON data and create a new response
      const data = await responseClone.json();
      const headers = new Headers();
      headers.set('sw-cached-time', Date.now().toString());
      headers.set('Content-Type', 'application/json');
      
      const body = JSON.stringify(data);
      const cachedResponse = new Response(body, {
        status: 200,
        statusText: 'OK',
        headers
      });
      
      await cache.put(request, cachedResponse);
    }
    return response;
  } catch (error) {
    // Return cached response if available, even if expired
    if (cachedResponse) {
      return cachedResponse.clone();
    }
    throw error;
  }
}

// Get TTL for API endpoint
function getTtl(url) {
  for (const endpoint of API_ENDPOINTS) {
    if (url.href.includes(endpoint.url) || url.hostname.includes(endpoint.url.replace('https://', ''))) {
      return endpoint.ttl;
    }
  }
  return 30 * 60 * 1000; // Default 30 min
}

// Update cache in background
function updateCacheInBackground(request) {
  fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE)
          .then((cache) => cache.put(request, response));
      }
    })
    .catch(() => {});
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Madison', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
