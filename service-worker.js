// service-worker.js — guarda los archivos para que la app funcione sin internet.
const NOMBRE_CACHE = 'sala-amigas-v6';
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './login.html',
  './sala.html',
  './chat.html',
  './videollamada.html',
  './estilos.css',
  './app.js',
  './manifest.json',
  './icono.svg',
  './icono-96.png',
  './icono-192.png',
  './icono-512.png'
];

// Instalar: guardar todos los archivos en el caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(NOMBRE_CACHE)
      .then(cache => cache.addAll(ARCHIVOS_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activar: borrar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(nombres => {
      return Promise.all(
        nombres.filter(n => n !== NOMBRE_CACHE).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

// Recuperar: si está en caché, usarlo; si no, bajarlo y guardarlo.
self.addEventListener('fetch', e => {
  // No guardar en caché las llamadas a Supabase (datos en tiempo real)
  if (e.request.url.includes('supabase')) return;
  e.respondWith(
    caches.match(e.request).then(respCache => {
      return respCache || fetch(e.request).then(respRed => {
        if (e.request.method === 'GET' && respRed.status === 200) {
          const copia = respRed.clone();
          caches.open(NOMBRE_CACHE).then(cache => cache.put(e.request, copia));
        }
        return respRed;
      });
    })
  );
});
