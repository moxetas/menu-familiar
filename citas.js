'use strict';

// ---------- Citas: médicas, reuniones, colegio… ----------
// Cada cita: { id, titulo, tipo, fecha 'AAAA-MM-DD', hora 'HH:MM' (o ''), lugar, para (id del miembro o '' = toda la familia),
//              notas, avisos: { semana, dia }, zona (zona horaria del móvil que la apuntó) }
//
// Avisos:
// - En el móvil, aunque la app esté cerrada: cada móvil se suscribe con «Activar avisos». La app deja los avisos
//   cifrados en la cola (avisos.js) y el servicio de avisos (repositorio moxetas/avisos-familia) los envía cada hora:
//   una semana antes y un día antes.
// - Dentro de la app: al abrirla sale un recordatorio con las citas que tocan.

const TIPOS_CITA = {
  medica: { nombre: 'Médica', emoji: '🩺' },
  reunion: { nombre: 'Reunión', emoji: '💼' },
  colegio: { nombre: 'Colegio', emoji: '🏫' },
  otra: { nombre: 'Otra', emoji: '📌' },
};
const DIA_MS = 864e5;
const AVISOS = { semana: { ms: 7 * DIA_MS, label: 'Una semana antes' }, dia: { ms: DIA_MS, label: 'Un día antes' } };

const citaFecha = (c) => new Date(`${c.fecha}T${c.hora || '09:00'}:00`);
const fmtCitaDia = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtMes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const fmtDiaSemana = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });

function cuandoFalta(c) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dia = new Date(`${c.fecha}T00:00:00`);
  const d = Math.round((dia - hoy) / DIA_MS);
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d === -1) return 'ayer';
  if (d > 1 && d < 14) return `dentro de ${d} días`;
  if (d >= 14 && d < 60) return `dentro de ${Math.round(d / 7)} semanas`;
  if (d < 0) return `hace ${-d} días`;
  return '';
}

const quienCita = (c) => {
  if (!c.para) return 'Toda la familia';
  const m = (state.members || []).find((x) => x.id === c.para);
  return m ? `${avatarOf(m)} ${m.name}` : '';
};

// ---------- Pestaña ----------

const citasView = { pasadas: false };

function renderCitas(main) {
  const ahora = Date.now();
  const todas = [...(state.citas || [])].sort((a, b) => citaFecha(a) - citaFecha(b));
  const proximas = todas.filter((c) => citaFecha(c).getTime() + 2 * 3600e3 >= ahora || c.fecha >= iso(new Date()));
  const pasadas = todas.filter((c) => !proximas.includes(c)).reverse();

  const porMes = [];
  for (const c of proximas) {
    const mes = cap(fmtMes.format(new Date(`${c.fecha}T12:00:00`)));
    if (!porMes.length || porMes[porMes.length - 1][0] !== mes) porMes.push([mes, []]);
    porMes[porMes.length - 1][1].push(c);
  }

  main.innerHTML = `
    <div id="avisos-card">${avisosCard()}</div>
    <button type="button" class="btn primary" id="new-cita">➕ Nueva cita</button>
    ${proximas.length ? porMes.map(([mes, list]) => `
      <h2>${esc(mes)}</h2>
      <div class="citas">${list.map(citaCard).join('')}</div>`).join('')
    : `<div class="card empty-state"><div class="big">📌</div><p><strong>No hay citas apuntadas</strong></p>
        <p class="muted">Apunta citas médicas, reuniones o lo que sea. Os avisará una semana antes y un día antes.</p></div>`}
    ${pasadas.length ? `
      <button type="button" class="btn small" id="toggle-pasadas">${citasView.pasadas ? 'Ocultar' : 'Ver'} las pasadas (${pasadas.length})</button>
      ${citasView.pasadas ? `<div class="citas pasadas">${pasadas.map(citaCard).join('')}</div>` : ''}` : ''}
  `;
  $('#new-cita').onclick = () => openCita(null);
  main.querySelectorAll('[data-cita]').forEach((b) => b.onclick = () => openCita(b.dataset.cita));
  $('#toggle-pasadas')?.addEventListener('click', () => { citasView.pasadas = !citasView.pasadas; render(); });
  bindAvisos();
}

function citaCard(c) {
  const t = TIPOS_CITA[c.tipo] || TIPOS_CITA.otra;
  const d = new Date(`${c.fecha}T12:00:00`);
  const falta = cuandoFalta(c);
  return `<button type="button" class="cita tipo-${c.tipo || 'otra'}" data-cita="${c.id}">
    <span class="cita-fecha"><strong>${d.getDate()}</strong><span>${esc(fmtDiaSemana.format(d))}</span></span>
    <span class="cita-text">
      <strong>${t.emoji} ${esc(c.titulo)}</strong>
      <span class="muted small">${[c.hora ? `🕐 ${c.hora}` : 'Sin hora', c.lugar ? `📍 ${esc(c.lugar)}` : '', esc(quienCita(c))].filter(Boolean).join(' · ')}</span>
      ${falta ? `<span class="cita-falta">${esc(falta)}</span>` : ''}
    </span>
    <span class="cita-bell" aria-label="Avisos">${c.avisos?.semana === false && c.avisos?.dia === false ? '🔕' : '🔔'}</span>
  </button>`;
}

// Citas de un día, para la pestaña Semana
function citasDelDia(key) {
  return (state.citas || []).filter((c) => c.fecha === key).sort((a, b) => (a.hora || '99').localeCompare(b.hora || '99'))
    .map((c) => `<button type="button" class="day-cita" data-cita-sem="${c.id}">${(TIPOS_CITA[c.tipo] || TIPOS_CITA.otra).emoji} ${c.hora ? `${c.hora} · ` : ''}${esc(c.titulo)}</button>`).join('');
}

// ---------- Ficha de una cita ----------

function openCita(id, fecha) {
  const old = (state.citas || []).find((c) => c.id === id);
  const c = old ? JSON.parse(JSON.stringify(old)) : {
    id: uid(), titulo: '', tipo: 'medica', fecha: fecha || iso(new Date(Date.now() + 7 * DIA_MS)), hora: '', lugar: '', para: '', notas: '',
    avisos: { semana: true, dia: true },
  };
  c.avisos ||= { semana: true, dia: true };
  const keep = () => {
    if (!$('#ct-titulo')) return;
    c.titulo = $('#ct-titulo').value.trim();
    c.fecha = $('#ct-fecha').value || c.fecha;
    c.hora = $('#ct-hora').value || '';
    c.lugar = $('#ct-lugar').value.trim();
    c.notas = $('#ct-notas').value.trim();
  };
  const draw = () => {
    openSheet(`
      <div class="sheet-head"><h3>${old ? 'Cita' : 'Nueva cita'}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <label class="field">Qué<input type="text" id="ct-titulo" value="${esc(c.titulo)}" placeholder="Ej.: Nefrología, reunión del colegio…" autocomplete="off"></label>
      <div class="chips" id="ct-tipo">${Object.entries(TIPOS_CITA).map(([k, t]) => chip(k, `${t.emoji} ${t.nombre}`, c.tipo)).join('')}</div>
      <div class="row">
        <label class="field grow">Día<input type="date" id="ct-fecha" value="${c.fecha}"></label>
        <label class="field grow">Hora<input type="time" id="ct-hora" value="${c.hora || ''}"></label>
      </div>
      <label class="field">Dónde<input type="text" id="ct-lugar" value="${esc(c.lugar || '')}" placeholder="Ej.: Hospital, consulta 12" autocomplete="off"></label>
      <label class="field">Para quién</label>
      <div class="chips" id="ct-para">${chip('', '👨‍👩‍👧 Toda la familia', c.para || '')}${(state.members || []).map((m) => chip(m.id, `${avatarOf(m)} ${m.name}`, c.para || '')).join('')}</div>
      <label class="field">Notas<textarea id="ct-notas" class="short" placeholder="Ej.: ir en ayunas, llevar análisis…">${esc(c.notas || '')}</textarea></label>
      <label class="field">Avisos</label>
      <div class="chips" id="ct-avisos">${Object.entries(AVISOS).map(([k, a]) => `<button type="button" class="chip" data-aviso="${k}" aria-pressed="${c.avisos[k] !== false}">🔔 ${a.label}</button>`).join('')}</div>
      <p class="muted small">Sin hora, el aviso llega a las 9 de la mañana.</p>
      <div class="row">
        <button type="button" class="btn primary grow" id="ct-ok">Guardar</button>
        ${old ? '<button type="button" class="btn danger" id="ct-del">Borrar</button>' : ''}
      </div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#ct-tipo .chip').forEach((b) => b.onclick = () => { keep(); c.tipo = b.dataset.v; draw(); });
    sheet.querySelectorAll('#ct-para .chip').forEach((b) => b.onclick = () => { keep(); c.para = b.dataset.v; draw(); });
    sheet.querySelectorAll('[data-aviso]').forEach((b) => b.onclick = () => { keep(); c.avisos[b.dataset.aviso] = c.avisos[b.dataset.aviso] === false; draw(); });
    $('#ct-ok').onclick = () => {
      keep();
      if (!c.titulo) { toast('Escribe qué es la cita'); return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) { toast('Pon el día'); return; }
      c.zona = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
      if (!c.hora) delete c.hora;
      state.citas ||= [];
      const i = state.citas.findIndex((x) => x.id === c.id);
      if (i >= 0) state.citas[i] = c; else state.citas.push(c);
      save(); closeSheet(); render();
      toast(old ? 'Cita guardada' : 'Cita apuntada');
    };
    $('#ct-del')?.addEventListener('click', () => {
      if (!confirm(`¿Borrar «${old.titulo}»?`)) return;
      state.citas = state.citas.filter((x) => x.id !== c.id);
      save(); closeSheet(); render();
    });
  };
  draw();
}

// ---------- Recordatorio dentro de la app ----------
// Al abrir la app, sale un aviso con las citas a las que les toca recordatorio (una semana antes o un día antes)
// y que este móvil aún no ha enseñado.

const VISTOS = 'menu-familiar-avisos-vistos';
function avisosPendientes() {
  let vistos = {};
  try { vistos = JSON.parse(localStorage.getItem(VISTOS)) || {}; } catch (e) { /* nada */ }
  const ahora = Date.now();
  const out = [];
  for (const c of state.citas || []) {
    const t = citaFecha(c).getTime();
    if (t < ahora) continue;
    for (const [k, a] of Object.entries(AVISOS)) {
      if (c.avisos?.[k] === false || ahora < t - a.ms) continue;
      const clave = `${c.id}|${c.fecha}|${c.hora || ''}|${k}`;
      if (!vistos[clave]) out.push({ c, k, clave });
    }
  }
  // Si tocan los dos avisos de una cita, basta con el más cercano
  return out.filter((x) => !(x.k === 'semana' && out.some((y) => y.c.id === x.c.id && y.k === 'dia')))
    .sort((a, b) => citaFecha(a.c) - citaFecha(b.c));
}

function comprobarAvisos() {
  if (!state.citas?.length || $('#sheet').classList.contains('open')) return;
  const list = avisosPendientes();
  if (!list.length) return;
  openSheet(`
    <div class="sheet-head"><h3>🔔 Recordatorio</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <div class="citas">${list.map(({ c }) => citaCard(c)).join('')}</div>
    <button type="button" class="btn primary" id="avisos-ok">Entendido</button>
  `);
  const marcar = () => {
    let vistos = {};
    try { vistos = JSON.parse(localStorage.getItem(VISTOS)) || {}; } catch (e) { /* nada */ }
    // También se marca el aviso de la semana de las citas que ya están a un día
    for (const { c } of list) for (const k of Object.keys(AVISOS)) vistos[`${c.id}|${c.fecha}|${c.hora || ''}|${k}`] = Date.now();
    try { localStorage.setItem(VISTOS, JSON.stringify(vistos)); } catch (e) { /* nada */ }
  };
  $('#avisos-ok').onclick = () => { marcar(); closeSheet(); };
  $('#sheet').querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', marcar));
  $('#sheet').querySelectorAll('[data-cita]').forEach((b) => b.onclick = () => { marcar(); go('citas'); openCita(b.dataset.cita); });
}

// ---------- Avisos en el móvil (notificaciones) ----------

const PUSH_LS = 'menu-familiar-push';
const deviceId = () => {
  let id = null;
  try { id = localStorage.getItem('menu-familiar-dispositivo'); } catch (e) { /* nada */ }
  if (!id) { id = uid() + uid(); try { localStorage.setItem('menu-familiar-dispositivo', id); } catch (e) { /* nada */ } }
  return id;
};
const pushInfo = () => { try { return JSON.parse(localStorage.getItem(PUSH_LS)) || null; } catch (e) { return null; } };
const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const enPantallaDeInicio = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
const nombreDispositivo = () => (/iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iPad' : /iPhone/.test(navigator.userAgent) ? 'iPhone' : /Android/.test(navigator.userAgent) ? 'Android' : 'Ordenador');

function avisosCard() {
  const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const info = pushInfo();
  let body;
  if (!soporta) {
    body = esIOS() && !enPantallaDeInicio()
      ? '<p class="small">Para que los avisos salten en este móvil, abre la app desde su <strong>icono de la pantalla de inicio</strong>, no desde Safari.</p>'
      : '<p class="small">Este navegador no permite avisos. En iPhone y iPad hace falta iOS 16.4 o posterior y abrir la app desde la pantalla de inicio.</p>';
  } else if (!Familia.active) {
    body = '<p class="small">Para recibir avisos, primero conecta la familia en la pestaña <strong>Familia</strong>: los avisos salen de las citas compartidas.</p>';
  } else if (Notification.permission === 'denied') {
    body = '<p class="small">Los avisos están bloqueados en este móvil. Actívalos en <strong>Ajustes → Notificaciones → Menú familiar</strong>.</p>';
  } else if (info && Notification.permission === 'granted') {
    const members = state.members || [];
    body = `<p class="small">✅ <strong>Avisos activados en este ${esc(info.dispositivo || 'móvil')}.</strong> Saltarán una semana antes y un día antes de cada cita, aunque la app esté cerrada.</p>
      ${members.length ? `<label class="field">Avisarme de</label>
      <div class="chips" id="push-solo">${chip('', 'Todas las citas', info.soloDe || '')}${members.map((m) => chip(m.id, `Solo las de ${m.name}`, info.soloDe || '')).join('')}</div>` : ''}
      <p class="muted small" id="push-servidor">Comprobando el servicio de avisos…</p>
      <div class="row">
        <button type="button" class="btn small grow" id="push-test">Probar un aviso</button>
        <button type="button" class="btn small" id="push-off">Desactivar</button>
      </div>`;
  } else {
    body = `<p class="small">Activa los avisos para que salten en este móvil una semana antes y un día antes de cada cita, aunque la app esté cerrada. Hay que activarlos en cada móvil.</p>
      <button type="button" class="btn primary" id="push-on">🔔 Activar avisos en este móvil</button>`;
  }
  return `<div class="card avisos">${body}</div>`;
}

function bindAvisos() {
  $('#push-on')?.addEventListener('click', activarAvisos);
  $('#push-off')?.addEventListener('click', desactivarAvisos);
  $('#push-test')?.addEventListener('click', async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('📌 Así te avisaré', { body: 'Las citas te avisarán una semana antes y un día antes.', icon: 'icons/icon-192.png', tag: 'prueba' });
    } catch (e) { toast('No se ha podido mostrar el aviso'); }
  });
  document.querySelectorAll('#push-solo .chip').forEach((b) => b.onclick = async () => {
    const info = pushInfo();
    if (!info) return;
    info.soloDe = b.dataset.v;
    try {
      await apuntarMovil(info);
      render();
    } catch (e) { toast('No se ha podido guardar. ¿Hay conexión?'); }
  });
  // Cuándo pasó por última vez el servicio que envía los avisos
  const el = $('#push-servidor');
  if (el && Familia.code) {
    fetch(`${dbFor(Familia.code)}/estado-avisos.json`, { cache: 'no-store' }).then((r) => r.json()).then((s) => {
      if (!document.body.contains(el)) return;
      if (s?.ultimaVez) {
        const min = Math.round((Date.now() - s.ultimaVez) / 60000);
        el.textContent = `El servicio de avisos pasó por última vez ${min < 2 ? 'hace un momento' : min < 120 ? `hace ${min} minutos` : `hace ${Math.round(min / 60)} horas`}.${min > 180 ? ' Debería pasar cada hora: algo no va bien.' : ''}`;
      } else {
        el.textContent = 'El servicio de avisos todavía no ha pasado. Debería pasar cada hora: si dentro de una hora sigue así, algo no va bien.';
      }
    }).catch(() => { el.textContent = ''; });
  }
}

const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (ch) => ch.charCodeAt(0));

// Apunta este móvil en el servicio de avisos (avisos.js): /subs/<huella de la familia>/m_<móvil>
async function apuntarMovil(info) {
  const code = Familia.code;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  // Los móviles apuntados antes usaban las claves de cada familia: se cambian por las del servicio
  if (sub && b64url(sub.options?.applicationServerKey || new ArrayBuffer(0)) !== Avisos.VAPID_PUBLIC) { await sub.unsubscribe(); sub = null; }
  sub ||= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(Avisos.VAPID_PUBLIC) });
  const json = sub.toJSON();
  await Avisos.guardarClave(code);
  const res = await fetch(`${dbFor(code)}/subs/${await Avisos.famId(code)}/m_${info.id}.json`, {
    method: 'PUT',
    body: JSON.stringify({ e: json.endpoint, k: json.keys, a: 'm', m: await Avisos.miembroId(code, info.soloDe), d: info.dispositivo, t: Date.now() }),
  });
  if (!res.ok) throw new Error(`Firebase respondió ${res.status}`);
  info.v = 2;
  localStorage.setItem(PUSH_LS, JSON.stringify(info));
}

async function activarAvisos() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') { toast('Sin permiso no puedo avisarte'); render(); return; }
    const info = { id: deviceId(), dispositivo: nombreDispositivo(), soloDe: '' };
    await apuntarMovil(info);
    await Avisos.actualizar(true, 0);   // se ponen ya en la cola los avisos de las próximas citas
    render();
    toast('Avisos activados');
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification('🔔 Avisos activados', { body: 'Te avisaré una semana antes y un día antes de cada cita.', icon: 'icons/icon-192.png', tag: 'prueba' }).catch(() => {});
  } catch (e) {
    toast(`No se han podido activar los avisos${e && e.message ? `: ${e.message}` : ''}`);
  }
}

// Al abrir la app: los móviles con los avisos del sistema de antes (solo para una familia) se pasan solos al servicio nuevo
async function actualizarAvisosDeAntes() {
  const info = pushInfo();
  if (!Familia.code || !info || info.v === 2 || !('PushManager' in window) || Notification.permission !== 'granted') return;
  try {
    await apuntarMovil(info);
    await Familia.raw(`push/${info.id}`, 'DELETE').catch(() => {});
    await Familia.raw('vapid', 'DELETE').catch(() => {});   // las claves de antes estaban guardadas con la familia
  } catch (e) { /* se intentará la próxima vez */ }
}

async function desactivarAvisos() {
  const info = pushInfo();
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    if (info && Familia.code) await fetch(`${dbFor(Familia.code)}/subs/${await Avisos.famId(Familia.code)}/m_${info.id}.json`, { method: 'DELETE' });
  } catch (e) { /* aunque falle, se olvida en este móvil */ }
  try { localStorage.removeItem(PUSH_LS); } catch (e) { /* nada */ }
  render();
  toast('Avisos desactivados en este móvil');
}
