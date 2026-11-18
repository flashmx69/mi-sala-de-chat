// service-worker.js  ·  Hace que la PWA funcione SIN internet (offline)
const CACHE = 'sala-amigas-v1';
const ARCHIVOS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icono.svg'];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS))
  );
});

self.addEventListener('fetch', evento => {
  evento.respondWith(
    caches.match(evento.request).then(respuesta => respuesta || fetch(evento.request))
  );
});
