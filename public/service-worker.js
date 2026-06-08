const CACHE_NAME = 'ttech-iptv-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline support files');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Precache initialized with core resources, non-blocking warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting out-of-date cache state:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Ensure we bypass Service Worker interception for chunks/HLS components and dynamic API routing entirely
  const isVideoOrPlaylist = event.request.url.includes('.m3u8') || 
                            event.request.url.includes('.ts') || 
                            event.request.url.includes('stream') || 
                            event.request.url.includes('/api/');
                            
  if (isVideoOrPlaylist || event.request.method !== 'GET') {
    return; // Pass through to standard browser networking immediately
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse && 
            networkResponse.status === 200 && 
            networkResponse.type === 'basic' &&
            !event.request.url.includes('chrome-extension')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Serve fallback for top-level navigate requests if offline
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
