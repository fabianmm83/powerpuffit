const CACHE_NAME = 'powerpufffit-v1.1.8'; // ⚡ CAMBIA ESTA VERSIÓN
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
  
  
  '/images/logo.png'
  // Agrega aquí tu nueva imagen sin fondo
];

// Instalación - MÁS AGRESIVA
self.addEventListener('install', event => {
  console.log('🔄 Instalando Service Worker NUEVA VERSIÓN...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => {
        console.log('⚡ Saltando espera - Activación inmediata');
        return self.skipWaiting(); // Fuerza activación inmediata
      })
  );
});

// Activación - MÁS AGRESIVA
self.addEventListener('activate', event => {
  console.log('🔄 Activando Service Worker NUEVA VERSIÓN...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // ⚡ ELIMINA TODOS LOS CACHES VIEJOS
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('⚡ Tomando control de todos los clients');
      return self.clients.claim(); // Toma control inmediato
    })
  );
});

// 🔥 AGREGA ESTO: Detector de actualizaciones para notificar al usuario
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Notificar a todos los clients sobre nueva versión
self.addEventListener('activate', event => {
    console.log('🔄 Activando Service Worker NUEVA VERSIÓN...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('⚡ Tomando control de todos los clients');
            
            // Notificar a todas las pestañas abiertas
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'NEW_VERSION',
                        version: CACHE_NAME
                    });
                });
            });
            
            return self.clients.claim();
        })
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

// Estrategias de Cache (se mantienen igual)
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