'use strict';

// ---------- Temas y pestaña de Ajustes ----------
// Un tema pone una foto en la cabecera y cambia el color de la app. Se guarda en cada móvil (no se comparte).

const TEMAS = [
  { id: 'clasico', nombre: 'Sin foto', color: '' },
  { id: 'pizarra', nombre: 'Pizarra', color: '#3d5a4c', img: 'temas/tema1.webp' },
  { id: 'mercado', nombre: 'Mercado', color: '#b91c1c', img: 'temas/tema2.webp' },
  { id: 'cocina', nombre: 'Cocina', color: '#1f4f99', img: 'temas/tema3.webp' },
  { id: 'agenda', nombre: 'Agenda', color: '#0e6a9c', img: 'temas/tema4.webp' },
  { id: 'hogar', nombre: 'Hogar', color: '#a34a0b', img: 'temas/tema5.webp' },
  { id: 'albahaca', nombre: 'Albahaca', color: '#2e7032', img: 'temas/tema6.webp' },
  { id: 'bolsa', nombre: 'Bolsa de la compra', color: '#85552a', img: 'temas/tema7.webp' },
  { id: 'recetario', nombre: 'Recetario', color: '#5f6f12', img: 'temas/tema8.webp' },
  { id: 'citas', nombre: 'Calendario', color: '#23387a', img: 'temas/tema9.webp' },
];
// La foto que le corresponde a cada pestaña (se puede cambiar en Ajustes)
const PESTANAS = [
  ['semana', '📅 Semana', 'pizarra'],
  ['compra', '🛒 Compra', 'mercado'],
  ['platos', '📖 Mis platos', 'recetario'],
  ['familia', '👨‍👩‍👧 Familia', 'hogar'],
  ['ideas', '✨ Ideas', 'cocina'],
  ['citas', '📌 Citas', 'agenda'],
  ['ajustes', '⚙️ Ajustes', 'albahaca'],
];
const TEMAS_LS = 'menu-familiar-temas';

function temasElegidos() {
  let t = {};
  try { t = JSON.parse(localStorage.getItem(TEMAS_LS)) || {}; } catch (e) { /* nada */ }
  return Object.fromEntries(PESTANAS.map(([tab, , def]) => [tab, t[tab] || def]));
}
function guardarTemas(t) { try { localStorage.setItem(TEMAS_LS, JSON.stringify(t)); } catch (e) { /* nada */ } }

// Pone de fondo la foto de la pestaña (se queda quieta al bajar) y su color en toda la app
function aplicarTema(tab) {
  const t = TEMAS.find((x) => x.id === temasElegidos()[tab]) || TEMAS[0];
  const root = document.documentElement;
  if (t.img) {
    root.dataset.tema = t.id;
    root.style.setProperty('--tema', t.color);
    root.style.setProperty('--tema-img', `url("${t.img}")`);
  } else {
    delete root.dataset.tema;
    root.style.removeProperty('--tema');
    root.style.removeProperty('--tema-img');
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.dataset.orig ||= m.content;
    m.content = t.img ? t.color : m.dataset.orig;
  });
}

function elegirTema(tab) {
  const [, nombre] = PESTANAS.find((p) => p[0] === tab);
  const actual = temasElegidos()[tab];
  openSheet(`
    <div class="sheet-head"><h3>Fondo de ${esc(nombre)}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <div class="temas">${TEMAS.map((t) => `
      <button type="button" class="tema-op" data-tema-op="${t.id}" aria-pressed="${t.id === actual}">
        <span class="tema-foto ${t.img ? '' : 'sin-foto'}" ${t.img ? `style="background-image:url('${t.img}')"` : ''}>${t.img ? '' : '🍽️'}</span>
        <span class="tema-nombre">${t.color ? `<span class="tema-color" style="background:${t.color}"></span>` : ''}${esc(t.nombre)}</span>
      </button>`).join('')}</div>
  `);
  $('#sheet').querySelectorAll('[data-tema-op]').forEach((b) => b.onclick = () => {
    const t = temasElegidos(); t[tab] = b.dataset.temaOp; guardarTemas(t);
    closeSheet(); render();
  });
}

// ---------- Pestaña Ajustes ----------

function renderAjustes(main) {
  const elegidos = temasElegidos();
  const meals = state.settings.meals.length === 2 ? 'ambas' : state.settings.meals[0];
  main.innerHTML = `
    <h2>🎨 Fondo de cada pestaña</h2>
    <p class="muted small">Cada pestaña tiene su foto de fondo. Toca una para cambiarla. Se guarda en este móvil.</p>
    <div class="tema-pestanas">${PESTANAS.map(([tab, nombre]) => {
      const t = TEMAS.find((x) => x.id === elegidos[tab]) || TEMAS[0];
      return `<button type="button" class="tema-pestana" data-tema-tab="${tab}">
        <span class="tema-mini ${t.img ? '' : 'sin-foto'}" ${t.img ? `style="background-image:url('${t.img}')"` : ''}>${t.img ? '' : '🍽️'}</span>
        <span class="tema-pestana-txt"><strong>${esc(nombre)}</strong><span class="muted small">${esc(t.nombre)}</span></span>
        <span class="muted">›</span>
      </button>`;
    }).join('')}</div>
    <div class="row">
      <button type="button" class="btn small grow" id="temas-siempre">Las fotos de siempre</button>
      <button type="button" class="btn small grow" id="temas-ninguna">Sin fotos</button>
    </div>

    <h2>🍽️ Menú</h2>
    <div class="card">
      <label class="field">Qué planificar</label>
      <div class="chips" id="set-meals">
        ${chip('ambas', 'Comida y cena', meals)}
        ${chip('comida', 'Solo comida', meals)}
        ${chip('cena', 'Solo cena', meals)}
      </div>
      <label class="field">Ideas nuevas en cada menú semanal</label>
      <div class="chips" id="set-new">${[0, 1, 2, 3].map((n) => chip(String(n), n === 0 ? 'Ninguna' : String(n), String(state.settings.nuevos))).join('')}</div>
      <label class="field">Cocina</label>
      <div class="chips"><button type="button" class="chip" id="set-caldo" aria-pressed="${!!state.settings.caldoCasero}">🍲 Usamos caldo casero sin sal</button></div>
      <p class="muted small">Si está activado, la sal de los platos se calcula con caldo casero sin sal en vez de caldo de brick, que lleva mucha.</p>
    </div>

    <h2>📖 Platos</h2>
    <div class="card">
      <div class="row">
        <button type="button" class="btn small grow" id="export">Compartir mi lista de platos</button>
        ${state.dismissed.length ? `<button type="button" class="btn small grow" id="undismiss">Recuperar ideas descartadas (${state.dismissed.length})</button>` : ''}
      </div>
    </div>

    <h2>❓ Ayuda</h2>
    <div class="card">
      <div class="row">
        <button type="button" class="btn small grow" id="ver-guia">Cómo funciona</button>
        <a class="btn small grow" href="guia.pdf" download="Guia-Menu-familiar.pdf">📄 Guía en PDF</a>
      </div>
      <p class="muted small">Lo de compartir entre móviles está en la pestaña Familia, y los avisos de las citas, en Citas.</p>
    </div>
    <p class="muted small" style="text-align:center"><a href="privacidad.html" target="_blank" rel="noopener">Política de privacidad</a></p>
    <p class="muted small" style="text-align:center">Versión ${APP_VERSION}${typeof FAMILIA_VERSION !== 'undefined' && FAMILIA_VERSION === APP_VERSION ? '' : ' · ⚠️ a medio actualizar: cierra la app y ábrela otra vez'}</p>`;

  main.querySelectorAll('[data-tema-tab]').forEach((b) => b.onclick = () => elegirTema(b.dataset.temaTab));
  $('#temas-siempre').onclick = () => { guardarTemas({}); render(); toast('Cada pestaña con su foto'); };
  $('#temas-ninguna').onclick = () => { guardarTemas(Object.fromEntries(PESTANAS.map(([tab]) => [tab, 'clasico']))); render(); toast('Sin fotos de fondo'); };
  main.querySelectorAll('#set-meals .chip').forEach((b) => b.onclick = () => {
    state.settings.meals = b.dataset.v === 'ambas' ? ['comida', 'cena'] : [b.dataset.v];
    save(); render();
  });
  main.querySelectorAll('#set-new .chip').forEach((b) => b.onclick = () => { state.settings.nuevos = Number(b.dataset.v); save(); render(); });
  $('#set-caldo').onclick = () => { state.settings.caldoCasero = !state.settings.caldoCasero; save(); render(); toast(state.settings.caldoCasero ? 'La sal se calcula con caldo casero sin sal' : 'La sal se calcula con caldo de brick'); };
  $('#export').onclick = exportList;
  $('#undismiss')?.addEventListener('click', () => { state.dismissed = []; save(); render(); toast('Esas ideas pueden volver a salir'); });
  $('#ver-guia').onclick = abrirGuia;
}
