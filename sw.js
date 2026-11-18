// Guarda la app en el teléfono para que abra aunque no haya cobertura.
// Cambia el número de CACHE cada vez que se publique una versión nueva.
const CACHE = 'menu-familiar-v27';
const FILES = [
  './',
  'index.html',
  'styles.css',
  'platos.js',
  'familia.js',
  'avisos.js',
  'compra.js',
  'recetas.js',
  'dibujos.js',
  'miembros.js',
  'citas.js',
  'i18n.js',
  'lang/de.js',
  'lang/en.js',
  'lang/pl.js',
  'lang/ro.js',
  'lang/ru.js',
  'lang/fr.js',
  'lang/ar.js',
  'lang/recetas-de.js',
  'lang/recetas-en.js',
  'lang/recetas-pl.js',
  'lang/recetas-ro.js',
  'lang/recetas-ru.js',
  'lang/recetas-fr.js',
  'lang/recetas-ar.js',
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

// Avisos de citas: los manda el servicio de avisos (repositorio moxetas/avisos-familia) una semana antes y un día antes.
// Llegan cifrados ({ v: 1, p }) y se abren con la clave que la app guardó en IndexedDB (avisos.js): el servidor nunca ve el texto.
const TIPOS_AVISO = { medica: '🩺', reunion: '💼', colegio: '🏫', otra: '📌' };

function claveAvisos(cual = 'clave') {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('menu-familiar-avisos', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('kv');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const r = open.result.transaction('kv', 'readonly').objectStore('kv').get(cual);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    };
  });
}

async function abrirAviso(p) {
  const key = await claveAvisos();
  if (!key || typeof p !== 'string') throw new Error('sin clave');
  const b = Uint8Array.from(atob(p.slice(3).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((p.length - 3 + 3) % 4)), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12) }, key, b.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

// Las palabras del aviso en cada idioma (el idioma lo deja la app en IndexedDB, i18n.js)
const PALABRAS_AVISO = {
  es: { tag: 'es-ES', hoy: 'hoy', manana: 'mañana', semana: 'dentro de una semana', dias: 'dentro de {n} días', a: ' a las {h}', sin: '📌 Tienes una cita', abre: 'Abre Menú familiar para verla.' },
  de: { tag: 'de-DE', hoy: 'heute', manana: 'morgen', semana: 'in einer Woche', dias: 'in {n} Tagen', a: ' um {h}', sin: '📌 Du hast einen Termin', abre: 'Öffne Familienmenü, um ihn zu sehen.' },
  en: { tag: 'en-GB', hoy: 'today', manana: 'tomorrow', semana: 'in a week', dias: 'in {n} days', a: ' at {h}', sin: '📌 You have an appointment', abre: 'Open Family Menu to see it.' },
  pl: { tag: 'pl-PL', hoy: 'dziś', manana: 'jutro', semana: 'za tydzień', dias: 'za {n} dni', a: ' o {h}', sin: '📌 Masz wizytę', abre: 'Otwórz Rodzinne menu, aby ją zobaczyć.' },
  ro: { tag: 'ro-RO', hoy: 'azi', manana: 'mâine', semana: 'peste o săptămână', dias: 'peste {n} zile', a: ' la {h}', sin: '📌 Ai o programare', abre: 'Deschide Meniul familiei ca s-o vezi.' },
  ru: { tag: 'ru-RU', hoy: 'сегодня', manana: 'завтра', semana: 'через неделю', dias: 'через {n} дн.', a: ' в {h}', sin: '📌 У вас встреча', abre: 'Откройте «Семейное меню», чтобы посмотреть.' },
  fr: { tag: 'fr-FR', hoy: 'aujourd’hui', manana: 'demain', semana: 'dans une semaine', dias: 'dans {n} jours', a: ' à {h}', sin: '📌 Vous avez un rendez-vous', abre: 'Ouvrez Menu familial pour le voir.' },
  ar: { tag: 'ar-u-nu-latn', hoy: 'اليوم', manana: 'غدًا', semana: 'بعد أسبوع', dias: 'بعد {n} أيام', a: ' الساعة {h}', sin: '📌 لديك موعد', abre: 'افتح قائمة العائلة لرؤيته.' },
};

// Mismo texto que la app: «Mañana, viernes 14 de noviembre a las 10:30 · Centro de salud · Lucía»
function textoAviso(c, w = PALABRAS_AVISO.es) {
  const zona = c.zona || 'Europe/Madrid';
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(new Date());
  const dias = Math.round((Date.UTC(...c.fecha.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) - Date.UTC(...hoy.split('-').map((n, i) => (i === 1 ? n - 1 : +n)))) / 864e5);
  const cuando = dias <= 0 ? w.hoy : dias === 1 ? w.manana : dias === 7 ? w.semana : w.dias.replace('{n}', dias);
  const [y, m, d] = c.fecha.split('-').map(Number);
  const dia = new Intl.DateTimeFormat(w.tag, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
  return {
    title: `${TIPOS_AVISO[c.tipo] || '📌'} ${c.titulo}`,
    body: `${cuando[0].toUpperCase()}${cuando.slice(1)}, ${dia}${c.hora ? w.a.replace('{h}', c.hora) : ''}${c.lugar ? ` · ${c.lugar}` : ''}${c.quien ? ` · ${c.quien}` : ''}`,
    tag: `cita-${c.id || ''}-${c.aviso || ''}`,
  };
}

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const mostrar = (n) => self.registration.showNotification(n.title, {
    body: n.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: n.tag || undefined,
    data: { url: './#citas' },
  });
  event.waitUntil(
    claveAvisos('idioma').catch(() => 'es').then((l) => {
      const w = PALABRAS_AVISO[l] || PALABRAS_AVISO.es;
      return abrirAviso(data.p).then((c) => mostrar(textoAviso(c, w)))
        // Sin la clave (por ejemplo, tras borrar los datos del navegador): un aviso sin detalles
        .catch(() => mostrar({ title: data.title || w.sin, body: data.body || w.abre }));
    }),
  );
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
