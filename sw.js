// Guarda la app en el teléfono para que abra aunque no haya cobertura.
// Cambia el número de CACHE cada vez que se publique una versión nueva.
const CACHE = 'menu-familiar-v20';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'platos.js',
  'familia.js',
  'compra.js',
  'recetas.js',
  'dibujos.js',
  'miembros.js',
  'citas.js',
  'ajustes.js',
  'temas/tema1.webp',
  'temas/tema2.webp',
  'temas/tema3.webp',
  'temas/tema4.webp',
  'temas/tema5.webp',
  'temas/tema6.webp',
  'temas/tema7.webp',
  'temas/tema8.webp',
  'temas/tema9.webp',
  'guia.js',
  'app.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' para no guardar copias viejas que el navegador tenga a mano
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la red (preguntando siempre al servidor si hay versión nueva); sin conexión, la copia guardada
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});

// Avisos de citas: los envía el proceso de GitHub (.github/scripts/avisos.mjs) una semana antes y un día antes
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Menú familiar', body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || '📌 Cita', {
    body: data.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: data.tag || undefined,
    data: { url: data.url || './#citas' },
  }));
});

// Al tocar el aviso se abre la app en la pestaña Citas
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './#citas', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope) && 'focus' in c) { c.navigate(url).catch(() => {}); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
