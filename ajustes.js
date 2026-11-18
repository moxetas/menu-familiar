'use strict';

// ---------- Temas y pestaña de Ajustes ----------
// Un tema pone una foto en la cabecera y cambia el color de la app. Se guarda en cada móvil (no se comparte).

const TEMAS = [
  { id: 'clasico', nombre: T('Sin foto'), color: '' },
  { id: 'pizarra', nombre: T('Pizarra'), color: '#3d5a4c', img: 'temas/tema1.webp' },
  { id: 'mercado', nombre: T('Mercado'), color: '#b91c1c', img: 'temas/tema2.webp' },
  { id: 'cocina', nombre: T('Cocina'), color: '#1f4f99', img: 'temas/tema3.webp' },
  { id: 'agenda', nombre: T('Agenda'), color: '#0e6a9c', img: 'temas/tema4.webp' },
  { id: 'hogar', nombre: T('Hogar'), color: '#a34a0b', img: 'temas/tema5.webp' },
  { id: 'albahaca', nombre: T('Albahaca'), color: '#2e7032', img: 'temas/tema6.webp' },
  { id: 'bolsa', nombre: T('Bolsa de la compra'), color: '#85552a', img: 'temas/tema7.webp' },
  { id: 'recetario', nombre: T('Recetario'), color: '#5f6f12', img: 'temas/tema8.webp' },
  { id: 'citas', nombre: T('Calendario'), color: '#23387a', img: 'temas/tema9.webp' },
];
// La foto que le corresponde a cada pestaña (se puede cambiar en Ajustes)
const PESTANAS = [
  ['semana', '📅 ' + T('Semana'), 'pizarra'],
  ['compra', '🛒 ' + T('Compra'), 'mercado'],
  ['platos', '📖 ' + T('Mis platos'), 'recetario'],
  ['familia', '👨‍👩‍👧 ' + T('Familia'), 'hogar'],
  ['ideas', '✨ ' + T('Ideas'), 'cocina'],
  ['citas', '📌 ' + T('Citas'), 'agenda'],
  ['ajustes', '⚙️ ' + T('Ajustes'), 'albahaca'],
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
    <div class="sheet-head"><h3>${T('Fondo de {pestana}', { pestana: esc(nombre) })}</h3><button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button></div>
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
    <h2>🌐 ${T('Idioma')}</h2>
    <div class="card">
      <div class="chips" id="set-idioma">${Object.entries(IDIOMAS).map(([k, x]) => `<button type="button" class="chip" lang="${k}" data-v="${k}" aria-pressed="${k === (IDIOMA || 'es')}">${x.nombre}</button>`).join('')}</div>
      <p class="muted small">${T('Se elige en cada móvil. Los nombres que escribís no se traducen, y las recetas y las ideas de platos, de momento, están en español.')}</p>
    </div>

    <h2>🎨 ${T('Fondo de cada pestaña')}</h2>
    <p class="muted small">${T('Cada pestaña tiene su foto de fondo. Toca una para cambiarla. Se guarda en este móvil.')}</p>
    <div class="tema-pestanas">${PESTANAS.map(([tab, nombre]) => {
      const t = TEMAS.find((x) => x.id === elegidos[tab]) || TEMAS[0];
      return `<button type="button" class="tema-pestana" data-tema-tab="${tab}">
        <span class="tema-mini ${t.img ? '' : 'sin-foto'}" ${t.img ? `style="background-image:url('${t.img}')"` : ''}>${t.img ? '' : '🍽️'}</span>
        <span class="tema-pestana-txt"><strong>${esc(nombre)}</strong><span class="muted small">${esc(t.nombre)}</span></span>
        <span class="muted">›</span>
      </button>`;
    }).join('')}</div>
    <div class="row">
      <button type="button" class="btn small grow" id="temas-siempre">${T('Las fotos de siempre')}</button>
      <button type="button" class="btn small grow" id="temas-ninguna">${T('Sin fotos')}</button>
    </div>

    <h2>🍽️ ${T('Menú')}</h2>
    <div class="card">
      <label class="field">${T('Qué planificar')}</label>
      <div class="chips" id="set-meals">
        ${chip('ambas', T('Comida y cena'), meals)}
        ${chip('comida', T('Solo comida'), meals)}
        ${chip('cena', T('Solo cena'), meals)}
      </div>
      <label class="field">${T('Ideas nuevas en cada menú semanal')}</label>
      <div class="chips" id="set-new">${[0, 1, 2, 3].map((n) => chip(String(n), n === 0 ? T('Ninguna') : String(n), String(state.settings.nuevos))).join('')}</div>
      <label class="field">${T('Cocina')}</label>
      <div class="chips"><button type="button" class="chip" id="set-caldo" aria-pressed="${!!state.settings.caldoCasero}">🍲 ${T('Usamos caldo casero sin sal')}</button></div>
      <p class="muted small">${T('Si está activado, la sal de los platos se calcula con caldo casero sin sal en vez de caldo de brick, que lleva mucha.')}</p>
    </div>

    <h2>📖 ${T('Platos')}</h2>
    <div class="card">
      <div class="row">
        <button type="button" class="btn small grow" id="export">${T('Compartir mi lista de platos')}</button>
        ${state.dismissed.length ? `<button type="button" class="btn small grow" id="undismiss">${T('Recuperar ideas descartadas ({n})', { n: state.dismissed.length })}</button>` : ''}
      </div>
    </div>

    <h2>❓ ${T('Ayuda')}</h2>
    <div class="card">
      <div class="row">
        <button type="button" class="btn small grow" id="ver-guia">${T('Cómo funciona')}</button>
        ${IDIOMA === 'es' ? '<a class="btn small grow" href="guia.pdf" download="Guia-Menu-familiar.pdf">📄 Guía en PDF</a>' : ''}
      </div>
      <p class="muted small">${T('Lo de compartir entre móviles está en la pestaña Familia, y los avisos de las citas, en Citas.')}</p>
    </div>
    <p class="muted small" style="text-align:center"><a href="privacidad.html" target="_blank" rel="noopener">${T('Política de privacidad')}</a></p>
    <p class="muted small" style="text-align:center">${T('Versión {n}', { n: APP_VERSION })}${typeof FAMILIA_VERSION !== 'undefined' && FAMILIA_VERSION === APP_VERSION ? '' : ' · ⚠️ ' + T('a medio actualizar: cierra la app y ábrela otra vez')}</p>`;

  main.querySelectorAll('#set-idioma .chip').forEach((b) => b.onclick = () => { if (b.dataset.v !== IDIOMA) ponerIdioma(b.dataset.v); });
  main.querySelectorAll('[data-tema-tab]').forEach((b) => b.onclick = () => elegirTema(b.dataset.temaTab));
  $('#temas-siempre').onclick = () => { guardarTemas({}); render(); toast(T('Cada pestaña con su foto')); };
  $('#temas-ninguna').onclick = () => { guardarTemas(Object.fromEntries(PESTANAS.map(([tab]) => [tab, 'clasico']))); render(); toast(T('Sin fotos de fondo')); };
  main.querySelectorAll('#set-meals .chip').forEach((b) => b.onclick = () => {
    state.settings.meals = b.dataset.v === 'ambas' ? ['comida', 'cena'] : [b.dataset.v];
    save(); render();
  });
  main.querySelectorAll('#set-new .chip').forEach((b) => b.onclick = () => { state.settings.nuevos = Number(b.dataset.v); save(); render(); });
  $('#set-caldo').onclick = () => { state.settings.caldoCasero = !state.settings.caldoCasero; save(); render(); toast(state.settings.caldoCasero ? T('La sal se calcula con caldo casero sin sal') : T('La sal se calcula con caldo de brick')); };
  $('#export').onclick = exportList;
  $('#undismiss')?.addEventListener('click', () => { state.dismissed = []; save(); render(); toast(T('Esas ideas pueden volver a salir')); });
  $('#ver-guia').onclick = abrirGuia;
}
