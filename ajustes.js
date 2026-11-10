'use strict';

// ---------- Temas y pestaña de Ajustes ----------
// Un tema pone una foto en la cabecera y cambia el color de la app. Se guarda en cada móvil (no se comparte).

const TEMAS = [
  { id: 'clasico', nombre: 'Clásico', color: '' },
  { id: 'pizarra', nombre: 'Pizarra', color: '#3d5a4c', img: 'temas/tema1.webp' },
  { id: 'mercado', nombre: 'Mercado', color: '#b91c1c', img: 'temas/tema2.webp' },
  { id: 'cocina', nombre: 'Cocina', color: '#1f4f99', img: 'temas/tema3.webp' },
  { id: 'agenda', nombre: 'Agenda', color: '#0e6a9c', img: 'temas/tema4.webp' },
  { id: 'hogar', nombre: 'Hogar', color: '#a34a0b', img: 'temas/tema5.webp' },
  { id: 'albahaca', nombre: 'Albahaca', color: '#2e7032', img: 'temas/tema6.webp' },
  { id: 'bolsa', nombre: 'Bolsa de la compra', color: '#85552a', img: 'temas/tema7.webp' },
  { id: 'recetario', nombre: 'Recetario', color: '#5f6f12', img: 'temas/tema8.webp' },
  { id: 'citas', nombre: 'Calendario', color: '#23387a', img: 'temas/tema9.webp' },
  { id: 'pestana', nombre: 'Según la pestaña', color: '' },
];
// Para «Según la pestaña»: la foto que va con cada pestaña
const TEMA_DE_PESTANA = { semana: 'albahaca', compra: 'bolsa', platos: 'recetario', citas: 'citas', familia: 'hogar', ideas: 'cocina', ajustes: 'pizarra' };
const TEMA_LS = 'menu-familiar-tema';

function temaElegido() {
  try { return localStorage.getItem(TEMA_LS) || 'clasico'; } catch (e) { return 'clasico'; }
}

// Aplica el tema a la cabecera y a los colores. Se llama en cada render (cambia con la pestaña en «Según la pestaña»).
function aplicarTema(tab) {
  let id = temaElegido();
  if (id === 'pestana') id = TEMA_DE_PESTANA[tab] || 'pizarra';
  const t = TEMAS.find((x) => x.id === id) || TEMAS[0];
  const root = document.documentElement;
  const header = document.querySelector('.topbar');
  if (t.img) {
    root.dataset.tema = t.id;
    root.style.setProperty('--tema', t.color);
    header.style.setProperty('--tema-img', `url("${t.img}")`);
  } else {
    delete root.dataset.tema;
    root.style.removeProperty('--tema');
    header.style.removeProperty('--tema-img');
  }
  // Color de la barra del sistema
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.dataset.orig ||= m.content;
    m.content = t.img ? t.color : m.dataset.orig;
  });
}

// ---------- Pestaña Ajustes ----------

function renderAjustes(main) {
  const elegido = temaElegido();
  const meals = state.settings.meals.length === 2 ? 'ambas' : state.settings.meals[0];
  main.innerHTML = `
    <h2>🎨 Tema</h2>
    <p class="muted small">Cambia la foto de arriba y los colores de la app. Cada móvil puede tener el suyo.</p>
    <div class="temas">${TEMAS.map((t) => `
      <button type="button" class="tema-op" data-tema-op="${t.id}" aria-pressed="${t.id === elegido}">
        <span class="tema-foto ${t.img ? '' : `sin-foto ${t.id}`}" ${t.img ? `style="background-image:url('${t.img}')"` : ''}>${t.id === 'pestana' ? '🔀' : t.id === 'clasico' ? '🍽️' : ''}</span>
        <span class="tema-nombre"><span class="tema-color" style="background:${t.color || 'var(--accent)'}"></span>${esc(t.nombre)}</span>
      </button>`).join('')}</div>
    <p class="muted small">«Según la pestaña» pone en cada pestaña su foto: la pizarra en Semana, la bolsa en Compra, el recetario en Mis platos…</p>

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
    <p class="muted small" style="text-align:center">Versión ${APP_VERSION}${typeof FAMILIA_VERSION !== 'undefined' && FAMILIA_VERSION === APP_VERSION ? '' : ' · ⚠️ a medio actualizar: cierra la app y ábrela otra vez'}</p>`;

  main.querySelectorAll('[data-tema-op]').forEach((b) => b.onclick = () => {
    try { localStorage.setItem(TEMA_LS, b.dataset.temaOp); } catch (e) { /* da igual */ }
    render();
    toast(`Tema: ${TEMAS.find((t) => t.id === b.dataset.temaOp).nombre}`);
  });
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
