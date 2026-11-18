// service-worker.js · Funciona sin internet
const CACHE = 'sala-amigas-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './login.html',
  './sala.html',
  './chat.html',
  './videollamada.html',
  './estilos.css',
  './app.js',
  './manifest.json',
  './icono.svg'
];

self.addEventListener('install', evento => {
  console.log('✅ Instalando versión:', CACHE);
  self.skipWaiting();
  evento.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS))
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys().then(nombres => {
      return Promise.all(
        nombres.filter(n => n !== CACHE).map(n => caches.delete(n))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evento => {
  if (!evento.request.url.startsWith(self.location.origin)) return;
  
  evento.respondWith(
    caches.match(evento.request).then(respuesta => {
      if (respuesta) {
        fetch(evento.request).then(respuestaNueva => {
          caches.open(CACHE).then(cache => {
            cache.put(evento.request, respuestaNueva);
          });
        }).catch(() => {});
        return respuesta;
      }
      return fetch(evento.request);
    })
  );
});
