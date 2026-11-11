'use strict';

// ---------- Avisos con la app cerrada para todas las familias ----------
// Protocolo «avisos/v1», el mismo que Finanzas familiares y el servicio de avisos (repositorio moxetas/avisos-familia).
//
// Cómo funciona, sin que el servidor pueda leer nada:
// 1. La app calcula los avisos de las citas y deja cada uno en /cola/<id> con la hora a la que hay que enviarlo (t),
//    hasta cuándo vale (h) y el texto CIFRADO (p) con una clave que sale del código de familia.
// 2. Cada móvil que activa los avisos se apunta en /subs/<huella de la familia>/m_<móvil>.
// 3. El servicio de avisos (cada hora) manda a los móviles de la familia los avisos cuya hora ha llegado.
//    Solo ve horas y huellas, nunca el código, los títulos ni las fechas.
// 4. El service worker (sw.js) descifra el aviso y lo enseña.
// En /familias/<código>/avisos-m queda la lista de avisos puestos en la cola, con una firma de su contenido,
// para que cualquier móvil de la familia sepa qué cambiar o quitar.

const Avisos = (() => {
  const APP = 'm';
  // Clave pública para firmar los avisos (la privada solo la tiene el servicio de avisos)
  const VAPID_PUBLIC = 'BBgZ_6g8t-8HrrKObqkIyGRIBs_LSXo5ymEplnPACy_FfEojNkAMF4PWBdZbw79qTJuNKNPMfaoGE1buefuUH_Q';
  const HORIZONTE = 180 * 864e5;   // citas de los próximos 6 meses
  const te = new TextEncoder();
  const clean = (code) => String(code).toLowerCase().replace(/[^a-z0-9]/g, '');
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  async function sha(text) {
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', te.encode(text)));
    return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Huella de la familia (32 caracteres): no deja sacar el código
  const famId = async (code) => (await sha(`avisos/v1|${clean(code)}`)).slice(0, 32);
  // Identificador de un aviso en la cola (57 caracteres)
  const itemId = async (code, key) => (await famId(code)) + APP + (await sha(`avisos/v1|${clean(code)}|${APP}|${key}`)).slice(0, 24);
  // Huella de un miembro, para «Avisarme solo de las citas de…»
  const miembroId = async (code, id) => (id ? (await sha(`avisos/v1|${clean(code)}|m|${id}`)).slice(0, 16) : '');

  const keys = {};
  function clave(code) {
    const c = clean(code);
    keys[c] ||= crypto.subtle.importKey('raw', te.encode(c), 'HKDF', false, ['deriveKey'])
      .then((k) => crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: te.encode('avisos/v1'), info: te.encode('aviso') }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
    return keys[c];
  }
  async function cifrar(code, value) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await clave(code), te.encode(JSON.stringify(value))));
    const out = new Uint8Array(12 + ct.length);
    out.set(iv); out.set(ct, 12);
    return 'c1.' + b64u(out);
  }

  // Fecha y hora de una zona horaria («2026-11-14», «10:30», «Europe/Madrid») → milisegundos UTC
  function horaEnZona(fecha, hora, zona) {
    const [y, m, d] = fecha.split('-').map(Number);
    const [hh, mm] = (hora || '09:00').split(':').map(Number);
    const guess = Date.UTC(y, m - 1, d, hh, mm);
    const offset = (t) => {
      try {
        const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
          timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
        return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
      } catch (e) { return -new Date(t).getTimezoneOffset() * 60000; }
    };
    let t = guess - offset(guess);
    const o2 = offset(t);
    if (guess - o2 !== t) t = guess - o2;
    return t;
  }

  // Avisos de la cola: una semana antes (si aún faltan al menos 2 días) y un día antes de cada cita
  async function cola(code, citas, members, ahora = Date.now()) {
    const nombres = Object.fromEntries((members || []).map((m) => [m.id, m.name]));
    const out = [];
    for (const c of citas || []) {
      if (!c || !c.titulo || !/^\d{4}-\d{2}-\d{2}$/.test(c.fecha || '')) continue;
      const zona = c.zona || 'Europe/Madrid';
      const tc = horaEnZona(c.fecha, c.hora, zona);
      if (tc <= ahora || tc - ahora > HORIZONTE) continue;
      const payload = { id: c.id, titulo: c.titulo, tipo: c.tipo || 'otra', fecha: c.fecha, hora: c.hora || '', lugar: c.lugar || '', zona, quien: (c.para && nombres[c.para]) || '' };
      const m = await miembroId(code, c.para);
      const base = `${c.id}|${c.fecha}|${c.hora || ''}`;
      if (c.avisos?.semana !== false) out.push({ key: `${base}|semana`, t: tc - 7 * 864e5, h: tc - 2 * 864e5, m, payload: { ...payload, aviso: 'semana' } });
      if (c.avisos?.dia !== false) out.push({ key: `${base}|dia`, t: tc - 864e5, h: tc, m, payload: { ...payload, aviso: 'dia' } });
    }
    return out.filter((e) => e.h > ahora);
  }

  const firma = async (e) => (await sha(JSON.stringify([e.t, e.h, e.m, e.payload]))).slice(0, 16);

  // Cambios para Firebase (una sola escritura en varias rutas), o null si no hay nada que cambiar
  async function cambios(code, entries, prev) {
    const fam = await famId(code);
    const next = {};
    const updates = {};
    for (const e of entries) {
      const id = await itemId(code, e.key);
      const sig = await firma(e);
      next[id] = sig;
      if (prev[id] !== sig) updates[`cola/${id}`] = { f: fam, a: APP, t: e.t, h: e.h, p: await cifrar(code, e.payload), ...(e.m ? { m: e.m } : {}) };
    }
    for (const id of Object.keys(prev)) if (!(id in next)) updates[`cola/${id}`] = null;
    if (!Object.keys(updates).length) return null;
    updates[`familias/${code}/avisos-${APP}`] = Object.keys(next).length ? next : null;
    return updates;
  }

  // Pone al día la cola. Solo si algún móvil de la familia tiene los avisos activados (ya hay lista) o este móvil los tiene.
  // Solo con la familia conectada: un móvil con las citas atrasadas quitaría de la cola las de los demás.
  let timer = null;
  function actualizar(force = false, delay = 3000, intentos = 8) {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(async () => {
        try {
          const code = Familia.code;
          if (!code) return resolve();
          if (!Familia.online) {
            if (intentos > 0) actualizar(force, 5000, intentos - 1).then(resolve);
            else resolve();
            return;
          }
          const db = dbFor(code);
          const res = await fetch(`${db}/familias/${code}/avisos-${APP}.json`, { cache: 'no-store' });
          if (!res.ok) return resolve();
          const prev = (await res.json()) || {};
          if (!force && !pushInfo()?.v && !Object.keys(prev).length) return resolve();
          const updates = await cambios(code, await cola(code, state.citas, state.members), prev);
          if (updates) await fetch(`${db}/.json`, { method: 'PATCH', body: JSON.stringify(updates) });
        } catch (e) { /* se intentará en el próximo cambio */ }
        resolve();
      }, delay);
    });
  }

  // La clave de los avisos, para que el service worker pueda descifrarlos (IndexedDB)
  function guardarClave(code) {
    return clave(code).then((key) => new Promise((resolve, reject) => {
      const open = indexedDB.open('menu-familiar-avisos', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('kv');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(key, 'clave');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    }));
  }

  return { APP, VAPID_PUBLIC, famId, itemId, miembroId, cola, cambios, firma, actualizar, guardarClave, horaEnZona };
})();
