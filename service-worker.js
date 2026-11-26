const NOMBRE_CACHE = 'sala-amigas-v5';
const ARCHIVOS_CORE = [
  './',
  './index.html',
  './login.html',
  './sala.html',
  './chat.html',
  './videollamada.html',
  './estilos.css',
  './app.js',
  './manifest.json'
];
const ARCHIVOS_OPCIONALES = [
  './icono-192.png',
  './icono-512.png',
  './icono.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(NOMBRE_CACHE)
      .then(async cache => {
        await cache.addAll(ARCHIVOS_CORE);
        await Promise.allSettled(
          ARCHIVOS_OPCIONALES.map(url => cache.add(url))
        );
      })
      .then(() => self.skipWaiting())
      .catch(err => console.error('❌ Error al cachear:', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nombres =>
      Promise.all(
        nombres.filter(n => n !== NOMBRE_CACHE).map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(respRed => {
        if (respRed && respRed.status === 200) {
          const copia = respRed.clone();
          caches.open(NOMBRE_CACHE).then(cache => cache.put(e.request, copia));
        }
        return respRed;
      })
      .catch(async () => {
        const enCache = await caches.match(e.request);
        if (enCache) return enCache;
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});