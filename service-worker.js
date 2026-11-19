const NOMBRE_CACHE = 'sala-amigas-v1';
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './login.html',
  './sala.html',
  './chat.html',
  './videollamada.html',
  './estilos.css',
  './manifest.json'
];

// Instalar
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(NOMBRE_CACHE)
      .then(cache => {
        console.log('✅ Cache abierto');
        return cache.addAll(ARCHIVOS_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nombresCache => {
      return Promise.all(
        nombresCache.filter(n => n !== NOMBRE_CACHE)
          .map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// Recuperar archivos
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(respCache => {
        return respCache || fetch(e.request)
          .then(respRed => {
            return caches.open(NOMBRE_CACHE).then(cache => {
              cache.put(e.request, respRed.clone());
              return respRed;
            });
          });
      })
  );
});
