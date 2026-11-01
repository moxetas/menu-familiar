'use strict';

// Comparte platos y menús entre los móviles de casa usando Firebase Realtime Database.
// Cada familia es un documento /familias/<código>. Solo quien conoce el código puede leerlo o cambiarlo
// (así lo dicen las reglas de la base de datos).
//
// Cómo funciona:
// - Cada cambio en este móvil se compara con la última versión sincronizada y solo se envía lo que ha cambiado.
// - Los cambios de los demás llegan al momento por una conexión abierta (EventSource).
// - Sin cobertura, los cambios se guardan y se envían cuando vuelve la conexión.

const FIREBASE_DB = 'https://menu-familiar-a2424-default-rtdb.europe-west1.firebasedatabase.app';
const FAMILIA_VERSION = 11;

const Familia = (() => {
  const LS = 'menu-familiar-sync';
  let info = load();     // { code, needsMerge, pending: { ruta: valor }, base }
  let base = info.base || null;
  let remote = null;     // última copia conocida del servidor
  let es = null;
  let status = 'off';    // off | connecting | online | offline | denied
  let dirty = false;     // han llegado cambios que aún no se han mostrado
  let flushing = false;
  let retryTimer = null;
  let announce = null;   // mensaje para el primer dato que llegue tras conectarse
  let lastEvent = 0;     // cuándo llegó lo último del servidor (también los avisos de «sigo aquí»)
  let lastSync = 0;      // cuándo se recibió o envió el último cambio
  let hiddenAt = 0;
  let flushTimer = null;
  const log = [];        // registro de lo que pasa, para el diagnóstico
  function note(s) {
    log.push(`${new Date().toLocaleTimeString('es-ES')} ${s}`);
    if (log.length > 40) log.shift();
  }

  function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
  function persist() { try { localStorage.setItem(LS, JSON.stringify(info)); } catch (e) { /* sin espacio */ } }

  const clone = (v) => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
  const stable = (v) => JSON.stringify(v ?? null, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)
    ? Object.keys(x).sort().reduce((o, kk) => { o[kk] = x[kk]; return o; }, {}) : x));
  const fbKey = (s) => norm(s).replace(/[.#$[\]/]/g, '_') || '_';
  const url = () => `${FIREBASE_DB}/familias/${info.code}.json`;
  const count = (o) => Object.keys(o || {}).length;

  // ---------- Del estado de la app a la forma guardada en Firebase, y al revés ----------

  function shape(s) {
    return clone({
      dishes: Object.fromEntries(s.dishes.map((d) => [d.id, d])),
      plan: s.plan,
      dismissed: Object.fromEntries(s.dismissed.map((n) => [fbKey(n), n])),
      settings: s.settings,
      shopping: Object.fromEntries((s.shopping || []).map((i) => [i.id, i])),
      members: Object.fromEntries((s.members || []).map((m) => [m.id, m])),
    });
  }

  function fromShape(r) {
    r = clone(r) || {};
    const d = defaults();
    return {
      dishes: Object.entries(r.dishes || {}).map(([id, x]) => ({ ...x, id })),
      plan: r.plan || {},
      dismissed: Object.values(r.dismissed || {}),
      settings: { ...d.settings, ...(r.settings || {}) },
      shopping: Object.entries(r.shopping || {}).map(([id, x]) => ({ ...x, id })),
      members: Object.entries(r.members || {}).map(([id, x]) => ({ ...x, id })),
    };
  }

  // Lo que ha cambiado de a a b, como rutas: { 'dishes/abc': {...}, 'plan/2026-11-02/cena': null, ... }
  function diff(a, b) {
    const out = {};
    const walk = (pa, pb, prefix, depth) => {
      const keys = new Set([...Object.keys(pa || {}), ...Object.keys(pb || {})]);
      for (const k of keys) {
        const va = pa ? pa[k] : undefined;
        const vb = pb ? pb[k] : undefined;
        const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
        if (depth > 1 && (isObj(va) || isObj(vb))) walk(va, vb, `${prefix}${k}/`, depth - 1);
        else if (stable(va) !== stable(vb)) out[prefix + k] = vb ?? null;
      }
    };
    walk(a.dishes, b.dishes, 'dishes/', 1);
    walk(a.plan, b.plan, 'plan/', 2);
    walk(a.dismissed, b.dismissed, 'dismissed/', 1);
    walk(a.shopping, b.shopping, 'shopping/', 1);
    walk(a.members, b.members, 'members/', 1);
    if (stable(a.settings) !== stable(b.settings)) out.settings = b.settings ?? null;
    return out;
  }

  function setPath(obj, path, val) {
    const parts = path.split('/').filter(Boolean);
    if (!parts.length) return val && typeof val === 'object' ? clone(val) : {};
    obj = obj && typeof obj === 'object' ? obj : {};
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (val === null || val === undefined) delete o[last]; else o[last] = clone(val);
    return obj;
  }

  // ---------- Enviar cambios de este móvil ----------

  function changed() {
    if (!info.code || !base) return;
    const now = shape(state);
    const ch = diff(base, now);
    base = now;
    info.base = base;
    if (!count(ch)) { persist(); return; }
    for (const [p, v] of Object.entries(ch)) if (remote) remote = setPath(remote, p, v);
    info.pending = { ...(info.pending || {}), ...ch };
    persist();
    flush();
  }

  async function flush() {
    if (!info.code || flushing || !count(info.pending)) return;
    flushing = true;
    const batch = clone(info.pending);
    let ok = false;
    try {
      const res = await fetch(url(), { method: 'PATCH', body: JSON.stringify(batch) });
      const answer = res.ok ? '' : ` ${(await res.text().catch(() => '')).slice(0, 300)}`;
      note(`envío [${Object.keys(batch).join(', ').slice(0, 200)}] → ${res.status}${answer}`);
      if (res.status === 401 || res.status === 403) setStatus('denied');
      else if (res.ok) {
        ok = true;
        lastSync = Date.now();
        // Quita lo enviado, salvo que haya vuelto a cambiar mientras tanto
        for (const [p, v] of Object.entries(batch)) if (info.pending && stable(info.pending[p]) === stable(v)) delete info.pending[p];
        persist();
      }
    } catch (e) {
      note(`envío falló: ${e && e.message}`);
      setStatus('offline');
    }
    flushing = false;
    if (ok && count(info.pending)) flush();
    // Sin cobertura (en el súper pasa): vuelve a intentarlo dentro de un rato
    else if (!ok && status !== 'denied') { clearTimeout(flushTimer); flushTimer = setTimeout(flush, 6000); }
    setStatus(status);
  }

  // ---------- Recibir cambios de los demás ----------

  function connect() {
    if (!info.code) return;
    disconnect();
    setStatus(navigator.onLine === false ? 'offline' : 'connecting');
    lastEvent = Date.now();
    note('conectando');
    es = new EventSource(url());
    es.addEventListener('keep-alive', () => { lastEvent = Date.now(); });
    es.addEventListener('put', (e) => onEvent(e, false));
    es.addEventListener('patch', (e) => onEvent(e, true));
    es.addEventListener('cancel', (e) => { note(`cancel ${e.data}`); setStatus('denied'); disconnect(); });
    es.onerror = () => {
      note(`error de conexión (estado ${es ? es.readyState : '-'})`);
      if (!es || es.readyState !== EventSource.CLOSED) { if (status !== 'denied') setStatus(navigator.onLine === false ? 'offline' : 'connecting'); return; }
      // La conexión se ha cerrado del todo: averigua si es por permisos o por falta de cobertura
      disconnect();
      fetch(url()).then((r) => {
        if (r.status === 401 || r.status === 403) setStatus('denied');
        else retryLater();
      }).catch(() => { setStatus('offline'); retryLater(); });
    };
  }

  function disconnect() {
    if (es) { es.onerror = null; es.close(); es = null; }
    clearTimeout(retryTimer);
  }

  function retryLater() {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(connect, 8000);
  }

  function onEvent(e, isPatch) {
    let msg;
    try { msg = JSON.parse(e.data); } catch (err) { return; }
    if (!msg) return;
    lastEvent = Date.now();
    lastSync = Date.now();
    const { path, data } = msg;
    note(`${isPatch ? 'patch' : 'put'} ${path} ${data && typeof data === 'object' ? `{${Object.keys(data).join(', ').slice(0, 160)}}` : JSON.stringify(data)}`);
    if (!isPatch && (path === '/' || path === '')) {
      // Copia completa (al conectarse o reconectarse)
      remote = data && typeof data === 'object' ? clone(data) : {};
      // Lo que aún no se ha podido enviar va por encima
      for (const [p, v] of Object.entries(info.pending || {})) remote = setPath(remote, p, v);
      if (info.needsMerge) merge();
      flush();
    } else if (isPatch) {
      for (const [k, v] of Object.entries(data || {})) remote = setPath(remote, `${path}/${k}`, v);
    } else {
      remote = setPath(remote, path, data);
    }
    setStatus('online');
    apply();
  }

  // Al crear o unirse a una familia: junta lo de este móvil con lo que ya hay en la familia
  function merge() {
    const theirs = fromShape(remote);
    const mine = shape(state);
    const names = new Set(theirs.dishes.map((d) => norm(d.name)));
    const add = {};
    for (const [id, d] of Object.entries(mine.dishes || {})) if (!names.has(norm(d.name))) add[`dishes/${id}`] = d;
    for (const [day, meals] of Object.entries(mine.plan || {})) {
      for (const [m, p] of Object.entries(meals || {})) if (p && !remote.plan?.[day]?.[m]) add[`plan/${day}/${m}`] = p;
    }
    for (const [k, n] of Object.entries(mine.dismissed || {})) if (!remote.dismissed?.[k]) add[`dismissed/${k}`] = n;
    if (!remote.settings) add.settings = mine.settings;
    const items = new Set(theirs.shopping.map((i) => norm(i.name)));
    for (const [id, i] of Object.entries(mine.shopping || {})) if (!items.has(norm(i.name))) add[`shopping/${id}`] = i;
    const people = new Set(theirs.members.map((m) => norm(m.name)));
    for (const [id, m] of Object.entries(mine.members || {})) if (!people.has(norm(m.name))) add[`members/${id}`] = m;
    for (const [p, v] of Object.entries(add)) remote = setPath(remote, p, v);
    info.pending = { ...(info.pending || {}), ...add };
    info.needsMerge = false;
    persist();
  }

  // Con una hoja abierta se espera a que se cierre. Escribiendo en la pantalla no hace falta esperar:
  // la lista se redibuja sin tocar el campo de texto.
  const busy = () => $('#sheet').classList.contains('open');

  // Muestra en pantalla la versión de la familia, si el usuario no está a mitad de algo
  function apply() {
    if (!remote) return;
    if (busy()) { dirty = true; return; }
    dirty = false;
    const before = stable(shape(state));
    const next = fromShape(remote);
    state.dishes = next.dishes;
    state.plan = next.plan;
    state.dismissed = next.dismissed;
    state.settings = next.settings;
    state.shopping = next.shopping;
    state.members = next.members;
    base = shape(state);
    info.base = base;
    persist();
    saveLocal();
    const changedNow = stable(base) !== before;
    if (changedNow || announce) render();
    if (announce) { toast(announce); announce = null; } else if (changedNow) toast('Actualizado desde otro móvil');
  }

  function retry() {
    if (dirty) setTimeout(() => { if (dirty && !busy()) apply(); }, 500);
  }

  // ---------- Estado de la conexión ----------

  const TEXTOS = {
    off: '',
    connecting: 'Conectando…',
    online: '✅ Conectado. Lo que cambiéis se ve en todos los móviles.',
    offline: '📴 Sin conexión. Los cambios se enviarán cuando vuelva.',
    denied: '⛔ Firebase no deja entrar. Revisa las reglas de la base de datos.',
  };
  const hhmm = (t) => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  function statusText() {
    const extra = [];
    if (lastSync) extra.push(`última vez a las ${hhmm(lastSync)}`);
    const n = count(info.pending);
    if (n) extra.push(`${n} ${n === 1 ? 'cambio' : 'cambios'} por enviar`);
    return TEXTOS[status] + (extra.length ? ` (${extra.join(', ')})` : '');
  }
  function setStatus(s) {
    status = s;
    document.querySelectorAll('[data-fam-status]').forEach((el) => { el.textContent = statusText(); });
  }

  // Vuelve a conectar desde cero y envía lo pendiente
  function resync() {
    if (!info.code) return;
    connect();
    flush();
  }

  // ---------- Código de familia ----------

  function newCode() {
    const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
    const r = new Uint32Array(20);
    crypto.getRandomValues(r);
    const s = Array.from(r, (n) => abc[n % abc.length]).join('');
    return s.match(/.{4}/g).join('-');
  }
  function readCode(text) {
    const m = String(text).toLowerCase().match(/[a-z0-9]{4}(?:-[a-z0-9]{4}){4}/);
    const s = (m ? m[0] : String(text).toLowerCase()).replace(/[^a-z0-9]/g, '');
    return s.length === 20 ? s.match(/.{4}/g).join('-') : null;
  }

  function begin(code, message) {
    info = { code, needsMerge: true, pending: {}, base: shape(state) };
    base = info.base;
    remote = null;
    announce = message;
    persist();
    connect();
  }

  function leave() {
    disconnect();
    info = {};
    base = null;
    remote = null;
    persist();
    setStatus('off');
  }

  function appLink() { return location.href.split('#')[0].split('?')[0]; }

  async function shareCode() {
    const text = `Únete a nuestro Menú familiar:\n1. Abre la app (${appLink()})\n2. Ve a la pestaña «Familia» → «Tengo un código»\n3. Pega este código: ${info.code}`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast('Código copiado. Pégalo en WhatsApp.');
    } catch (e) {
      if (e && e.name !== 'AbortError') toast('No se ha podido compartir');
    }
  }

  // ---------- Pantallas ----------

  function card() {
    if (!info.code) {
      return `<div class="card">
        <p><strong>👨‍👩‍👧 Compartir con la familia</strong></p>
        <p class="muted small">Conecta los móviles de casa: los platos, los menús, la familia y la lista de la compra serán los mismos en todos, y lo que cambie uno lo verán los demás.</p>
        <div class="row">
          <button type="button" class="btn primary grow" data-fam="create">Crear código de familia</button>
          <button type="button" class="btn grow" data-fam="join">Tengo un código</button>
        </div>
      </div>`;
    }
    return `<div class="card">
      <p><strong>👨‍👩‍👧 Compartido con la familia</strong></p>
      <p class="small" data-fam-status>${statusText()}</p>
      <p class="muted small">Código que termina en <strong>${esc(info.code.slice(-4))}</strong>. Tiene que ser el mismo en todos los móviles.</p>
      <div class="row">
        <button type="button" class="btn small grow" data-fam="sync">🔄 Sincronizar ahora</button>
        <button type="button" class="btn small grow" data-fam="show">Ver código</button>
        <button type="button" class="btn small grow" data-fam="diag">🩺 Diagnóstico</button>
      </div>
    </div>`;
  }

  function bind(root) {
    root.querySelectorAll('[data-fam]').forEach((b) => {
      b.onclick = () => ({ create, join: openJoin, share: shareCode, show: openShow, diag: openDiag, sync: () => { resync(); toast('Sincronizando…'); } })[b.dataset.fam]();
    });
  }

  function create() {
    begin(newCode(), 'Familia creada. Envía el código a los demás.');
    render();
    openShow();
  }

  function openJoin() {
    openSheet(`
      <div class="sheet-head"><h3>Unirme a la familia</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <p class="muted small">Pega el código que te han enviado. Si ya tenías platos en este móvil, se juntarán con los de la familia.</p>
      <form id="join-form" class="stack">
        <input type="text" id="join-code" placeholder="xxxx-xxxx-xxxx-xxxx-xxxx" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go">
        <button type="submit" class="btn primary">Unirme</button>
      </form>
    `);
    $('#join-form').onsubmit = (e) => {
      e.preventDefault();
      const code = readCode($('#join-code').value);
      if (!code) { toast('Ese código no está completo. Son 5 grupos de 4.'); return; }
      begin(code, 'Ya estáis conectados 🎉');
      closeSheet();
      render();
    };
    setTimeout(() => $('#join-code')?.focus(), 250);
  }

  function openShow() {
    openSheet(`
      <div class="sheet-head"><h3>Código de familia</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <p class="muted small">Envíalo a los demás de casa. En su app tienen que ir a la pestaña «Familia» → «Tengo un código» y pegarlo.</p>
      <div class="code-box">${esc(info.code)}</div>
      <p class="small" data-fam-status>${statusText()}</p>
      <button type="button" class="btn primary" id="fam-share">Enviar código por WhatsApp…</button>
      <button type="button" class="btn danger" id="fam-leave">Dejar de compartir en este móvil</button>
    `);
    $('#fam-share').onclick = shareCode;
    $('#fam-leave').onclick = () => {
      if (!confirm('Este móvil dejará de recibir los cambios de la familia. Los platos que tienes ahora se quedan. ¿Seguir?')) return;
      leave();
      closeSheet();
      render();
      toast('Este móvil ya no comparte');
    };
  }

  // ---------- Diagnóstico ----------

  function diagnostic() {
    const names = (list) => list.map((i) => i.name + (i.done ? ' ✓' : '')).join(', ');
    const r = fromShape(remote || {});
    const ago = (t) => (t ? `hace ${Math.round((Date.now() - t) / 1000)} s` : 'nunca');
    return [
      `Menú familiar · versión ${FAMILIA_VERSION}/${typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?'}`,
      `Código: …-${info.code ? info.code.slice(-4) : '(ninguno)'}`,
      `Estado: ${status} · conexión ${es ? ['abriendo', 'abierta', 'cerrada'][es.readyState] : 'sin abrir'} · último dato del servidor ${ago(lastEvent)}`,
      `Pendientes de enviar: ${count(info.pending)} ${count(info.pending) ? JSON.stringify(Object.keys(info.pending)) : ''}`,
      remote
        ? `En Firebase: ${r.dishes.length} platos, ${Object.keys(r.plan).length} días de menú, ${r.shopping.length} en la lista (${names(r.shopping)})`
        : 'En Firebase: todavía no ha llegado nada',
      `En este móvil: ${state.dishes.length} platos, ${Object.keys(state.plan).length} días de menú, ${state.shopping.length} en la lista (${names(state.shopping)})`,
      `Base: ${base ? `${count(base.shopping)} en la lista${base.shopping ? '' : ' (sin lista)'}` : 'ninguna'}`,
      `Navegador: ${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 120)}`,
      '',
      'Registro:',
      ...log,
    ].join('\n');
  }

  function openDiag() {
    openSheet(`
      <div class="sheet-head"><h3>Diagnóstico</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <p class="muted small">Si algo no se sincroniza, copia esto y pégaselo a quien te ayuda con la app.</p>
      <pre class="diag" id="diag-text">${esc(diagnostic())}</pre>
      <div class="row">
        <button type="button" class="btn primary grow" id="diag-copy">Copiar</button>
        <button type="button" class="btn grow" id="diag-again">Actualizar</button>
      </div>
    `);
    $('#diag-copy').onclick = async () => {
      const text = diagnostic();
      try {
        if (navigator.share) await navigator.share({ text });
        else { await navigator.clipboard.writeText(text); toast('Copiado'); }
      } catch (e) { if (e && e.name !== 'AbortError') toast('No se ha podido copiar'); }
    };
    $('#diag-again').onclick = () => { $('#diag-text').textContent = diagnostic(); };
  }

  // ---------- Arranque ----------

  function start() {
    if (!info.code) return;
    if (!base) { base = shape(state); info.base = base; persist(); }
    // La familia se creó antes de que existiera la lista de la compra: lo apuntado en este móvil se envía
    if (!base.shopping) { base.shopping = {}; info.base = base; persist(); changed(); }
    if (!base.members) { base.members = {}; info.base = base; persist(); changed(); }
    connect();
    flush();
  }

  window.addEventListener('online', resync);
  window.addEventListener('offline', () => { if (info.code) setStatus('offline'); });
  // El iPhone corta la conexión cuando la app pasa a segundo plano, a veces sin avisar.
  // Al volver, se conecta otra vez desde cero, que es rápido y trae todo lo que haya cambiado.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
    if (!info.code) return;
    if (!es || es.readyState === EventSource.CLOSED || Date.now() - hiddenAt > 3000) resync();
    else flush();
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) resync(); });
  // Firebase manda un «sigo aquí» cada medio minuto. Si deja de llegar, la conexión está muerta.
  setInterval(() => {
    if (info.code && document.visibilityState === 'visible' && Date.now() - lastEvent > 75000) resync();
  }, 15000);

  return { start, changed, retry, card, bind, openJoin, get active() { return !!info.code; } };
})();
