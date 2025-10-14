const CACHE_NAME = 'powerpufffit-v1.3.0';
const API_CACHE_NAME = 'powerpufffit-api-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html', 
  '/inventario.html',
  '/ventas.html',
  '/reportes.html',
  '/offline.html',
  '/manifest.json',
  
  // CSS y JS externos
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
  
  // Imágenes
  '/images/logo.png',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Instalación
self.addEventListener('install', event => {
  console.log('🔄 Instalando Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activación
self.addEventListener('activate', event => {
  console.log('🔄 Activando Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Cache inteligente
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Estrategia: Cache First para recursos estáticos
  if (url.origin === location.origin && 
      (request.destination === 'style' || 
       request.destination === 'script' ||
       request.destination === 'image')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estrategia: Network First para HTML
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Para Firebase y APIs: Network Only
  if (url.href.includes('firebase') || url.href.includes('googleapis')) {
    event.respondWith(networkOnly(request));
    return;
  }
});

// Estrategias de Cache
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Network error', { status: 408 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return caches.match('/offline.html');
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('Network error', { status: 408 });
  }
}