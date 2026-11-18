'use strict';

// ---------- Datos guardados en el teléfono ----------

const KEY = 'menu-familiar-v1';
const APP_VERSION = 27;
const COMIDAS = { comida: T('Comida'), cena: T('Cena') };
const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

function defaults() {
  return {
    dishes: [],          // { id, name, cat, when: 'ambos' | 'comida' | 'cena', fav }
    plan: {},            // { 'AAAA-MM-DD': { comida: { name, cat, nuevo }, cena: {...} } }
    dismissed: [],       // ideas que no se quieren volver a ver
    shopping: [],        // lista de la compra: { id, name, sec, done, from }
    members: [],         // familia: { id, name, sexo, edad, peso, altura, actividad, racion, avatar, salud }
    agua: {},            // agua bebida: { 'AAAA-MM-DD': { idMiembro: ml } }
    citas: [],           // citas: { id, titulo, tipo, fecha, hora, lugar, para, notas, avisos, zona }
    settings: { meals: ['comida', 'cena'], nuevos: 1, caldoCasero: false },
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.dishes)) {
      const d = defaults();
      return { ...d, ...s, settings: { ...d.settings, ...s.settings } };
    }
  } catch (e) { /* sin datos guardados */ }
  return defaults();
}

let state = load();
function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast(T('No se ha podido guardar en este teléfono')); }
}
// Guarda en el teléfono y, si el móvil comparte con la familia, envía el cambio
function save() {
  saveLocal();
  Familia.changed();
  Avisos.actualizar();   // avisos con la app cerrada (solo si la familia los usa)
}

// ---------- Utilidades ----------

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const norm = (s) => s.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const uid = () => Math.random().toString(36).slice(2, 10);
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const cap = (s) => s.charAt(0).toLocaleUpperCase('es') + s.slice(1);

function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function monday(offsetWeeks) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  return d;
}
function weekDays(offset) {
  const start = monday(offset);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
}
const fmtDay = new Intl.DateTimeFormat(LOCALE, { weekday: 'long' });
const fmtShort = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

// Gana la palabra que sale antes en el nombre; si empiezan igual, la más larga.
// Dentro de la carne, el tipo (cerdo, cordero, conejo) se mira en todo el nombre: «Solomillo de cerdo» → cerdo.
function guessCat(name) {
  // Un plato de las ideas escrito en otro idioma («Linseneintopf») tiene ya su tipo
  const idea = CATALOGO.find((c) => norm(c[0]) === norm(platoEnEspanol(name)));
  if (idea) return idea[1];
  const n = norm(name);
  let best = 'otros', pos = Infinity, len = 0;
  for (const [cat, words] of [...PALABRAS, ...Object.entries(trRecetas()?.palabras || {})]) {
    for (const w of words) {
      const i = n.indexOf(norm(w));
      if (i >= 0 && (i < pos || (i === pos && w.length > len))) { best = cat; pos = i; len = w.length; }
    }
  }
  // «Pimientos rellenos de carne», «Berenjenas rellenas de carne»: manda lo del relleno si es carne
  const rel = n.indexOf('rellen');
  if (rel >= 0 && !CARNES.includes(best)) {
    const resto = n.slice(rel);
    for (const [cat, words] of PALABRAS) if (CARNES.includes(cat) && words.some((w) => resto.includes(norm(w)))) { best = cat; break; }
  }
  if (CARNES.includes(best)) {
    for (const tipo of ['conejo', 'cordero', 'cerdo']) {
      if (PALABRAS.find(([c]) => c === tipo)[1].some((w) => n.includes(norm(w)))) return tipo;
    }
  }
  return best;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

const myNames = () => new Set(state.dishes.map((d) => norm(d.name)));
const fits = (when, meal) => !when || when === 'ambos' || when === meal;

// ---------- Cómo se elige un plato ----------

// Lleva la cuenta de lo que ya hay en la semana para equilibrar los colores
function weekContext(days) {
  const slots = days.length * state.settings.meals.length;
  const scale = slots / 14;
  const target = Object.fromEntries(Object.entries(OBJETIVO_SEMANAL).map(([k, v]) => [k, Math.max(1, Math.round(v * scale))]));
  const lastWeek = new Set();
  const prev = new Date(days[0]); prev.setDate(prev.getDate() - 7);
  for (let i = 0; i < 7; i++) {
    const d = new Date(prev); d.setDate(d.getDate() + i);
    const day = state.plan[iso(d)];
    if (day) Object.values(day).forEach((p) => p && lastWeek.add(norm(p.name)));
  }
  return { target, count: {}, used: new Set(), lastWeek, prevCat: null };
}
function addToContext(ctx, p) {
  if (!p) return;
  ctx.count[grupoCat(p.cat)] = (ctx.count[grupoCat(p.cat)] || 0) + 1;
  ctx.used.add(norm(p.name));
  ctx.prevCat = grupoCat(p.cat);
  if (perRacion(p.name)?.roja) ctx.roja = (ctx.roja || 0) + 1;
}

function score(cand, meal, ctx, sameDayCat) {
  let s = Math.random() * 3;
  const c = ctx.count[grupoCat(cand.cat)] || 0;
  const t = ctx.target[grupoCat(cand.cat)] ?? 1;
  if (c < t) s += 1.5; else s -= (c - t + 1) * 2.5;
  if (ctx.used.has(norm(cand.name))) s -= 8;
  if (ctx.lastWeek.has(norm(cand.name))) s -= 1.5;
  if (grupoCat(cand.cat) === ctx.prevCat) s -= 3;
  if (grupoCat(cand.cat) === grupoCat(sameDayCat)) s -= 2;
  if (cand.fav) s += 0.8;
  s -= healthPenalty(cand.name, ctx);
  return s;
}

function best(cands, meal, ctx, sameDayCat) {
  let top = null, topScore = -Infinity;
  for (const c of cands) {
    if (!fits(c.when, meal)) continue;
    const s = score(c, meal, ctx, sameDayCat);
    if (s > topScore) { top = c; topScore = s; }
  }
  return top;
}

function pickMine(meal, ctx, sameDayCat, exclude) {
  const d = best(state.dishes.filter((x) => !exclude || norm(x.name) !== exclude), meal, ctx, sameDayCat);
  return d ? { name: d.name, cat: d.cat } : null;
}

function catalogFree() {
  const mine = myNames();
  const no = new Set(state.dismissed.map(norm));
  return CATALOGO.map(([name, cat, when]) => ({ name, cat, when })).filter((c) => !mine.has(norm(c.name)) && !no.has(norm(c.name)));
}

function pickNew(meal, ctx, sameDayCat, exclude) {
  const d = best(catalogFree().filter((x) => !exclude || norm(x.name) !== exclude), meal, ctx, sameDayCat);
  return d ? { name: d.name, cat: d.cat, nuevo: true } : null;
}

// Rellena la semana: solo los huecos vacíos, o toda si redo es true
function fillWeek(days, redo) {
  const meals = state.settings.meals;
  const ctx = weekContext(days);
  const fresh = [];
  if (!redo) days.forEach((d) => meals.forEach((m) => addToContext(ctx, state.plan[iso(d)]?.[m])));
  ctx.prevCat = null;
  for (const d of days) {
    const key = iso(d);
    const day = (state.plan[key] ||= {});
    let sameDayCat = null;
    for (const m of meals) {
      if (!redo && day[m]) { sameDayCat = day[m].cat; ctx.prevCat = grupoCat(day[m].cat); continue; }
      const p = pickMine(m, ctx, sameDayCat);
      if (!p) continue;
      day[m] = { ...p, ...pickWho(day[m]), ...(day[m]?.mas ? { mas: day[m].mas } : {}) };
      addToContext(ctx, p);
      sameDayCat = p.cat;
      fresh.push([key, m]);
    }
  }
  // Algún plato nuevo de vez en cuando
  let n = Math.min(state.settings.nuevos, fresh.length);
  if (!state.dishes.length) n = 0;
  for (const [key, m] of shuffle(fresh).slice(0, n)) {
    const day = state.plan[key];
    const other = meals.find((x) => x !== m);
    const ctx2 = weekContext(days);
    days.forEach((d) => meals.forEach((mm) => { if (!(iso(d) === key && mm === m)) addToContext(ctx2, state.plan[iso(d)]?.[mm]); }));
    ctx2.prevCat = null;
    const p = pickNew(m, ctx2, other ? day[other]?.cat : null);
    if (p) day[m] = { ...p, ...pickWho(day[m]), ...(day[m]?.mas ? { mas: day[m].mas } : {}) };
  }
  save();
  return fresh.length;
}

// Contexto para cambiar un solo hueco, sin contar lo que hay en él
function slotContext(key, meal) {
  const days = weekDays(view.week);
  const ctx = weekContext(days);
  days.forEach((d) => state.settings.meals.forEach((m) => { if (!(iso(d) === key && m === meal)) addToContext(ctx, state.plan[iso(d)]?.[m]); }));
  ctx.prevCat = null;
  const other = state.settings.meals.find((m) => m !== meal);
  return { ctx, sameDayCat: other ? state.plan[key]?.[other]?.cat : null };
}

// ---------- Pantallas ----------

const view = { tab: 'semana', week: 0, filter: 'todas', idea: null };

// Una sola vez: los platos que estaban en «Carne» pasan a su tipo (cerdo, cordero, conejo…) o a lo que sean
// según lo que va primero en el nombre («Huevos con jamón» → huevos). Se comparte con la familia.
function separarCarnes() {
  if (state.settings.carnesSeparadas || !state.dishes.length) return;
  const cambios = {};
  for (const d of state.dishes) {
    if (d.cat !== 'carne') continue;
    const g = guessCat(d.name);
    if (g !== 'carne' && g !== 'otros') { d.cat = g; cambios[norm(d.name)] = g; }
  }
  for (const day of Object.values(state.plan)) {
    for (const slot of Object.values(day || {})) {
      for (const x of [slot, ...((slot && slot.mas) || [])]) if (x && cambios[norm(x.name || '')]) x.cat = cambios[norm(x.name)];
    }
  }
  state.settings.carnesSeparadas = true;
  save();
}

function render() {
  separarCarnes();
  document.querySelectorAll('#tabs button').forEach((b) => {
    if (b.dataset.tab === view.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const main = $('#view');
  const actions = $('#actions');
  actions.innerHTML = '';
  // Si se sigue en la misma pestaña, las que tienen un campo para escribir solo redibujan la lista,
  // para no borrar lo que se está tecleando ni cerrar el teclado
  aplicarTema(view.tab);
  const same = main.dataset.tab === view.tab;
  main.dataset.tab = view.tab;
  if (view.tab === 'semana') renderWeek(main, actions);
  else if (view.tab === 'compra') renderShopping(main, actions, same);
  else if (view.tab === 'platos') renderDishes(main, same);
  else if (view.tab === 'familia') renderFamily(main);
  else if (view.tab === 'citas') renderCitas(main);
  else if (view.tab === 'ajustes') renderAjustes(main);
  else renderIdeas(main);
  botonesAyuda(main, view.tab);
}

function legend(counts) {
  return `<div class="legend">${CATEGORIAS.map((c) => {
    const n = counts[c.id] || 0;
    return `<span class="legend-item c-${c.id} ${n ? '' : 'low'}"><span class="dot"></span>${esc(c.nombre)} <b>${n}</b></span>`;
  }).join('')}</div>`;
}

function renderWeek(main, actions) {
  const days = weekDays(view.week);
  const meals = state.settings.meals;
  const todayKey = iso(new Date());
  const first = days[0], last = days[6];
  const label = view.week === 0 ? T('Esta semana') : view.week === 1 ? T('La semana que viene') : view.week === -1 ? T('La semana pasada') : T('Semana del {d}', { d: fmtShort.format(first) });

  actions.innerHTML = `<button type="button" class="pill-btn" id="share">${T('Compartir')}</button>`;

  const counts = {};
  let filled = 0;
  days.forEach((d) => meals.forEach((m) => {
    const list = dishesOf(state.plan[iso(d)]?.[m]);
    if (list.length) filled++;
    list.forEach((p) => { counts[p.cat] = (counts[p.cat] || 0) + 1; });
  }));

  let html = `
    <div class="week-nav">
      <button type="button" class="round" id="prev" aria-label="${T('Semana anterior')}">‹</button>
      <div style="text-align:center"><strong>${label}</strong><div class="muted small">${fmtShort.format(first)} – ${fmtShort.format(last)}</div></div>
      <button type="button" class="round" id="next" aria-label="${T('Semana siguiente')}">›</button>
    </div>`;

  if (!state.dishes.length) {
    html += `
      <div class="card empty-state">
        <div class="big">🍽️</div>
        <p><strong>${T('Primero, vuestros platos de siempre')}</strong></p>
        <p class="muted">${T('Apunta lo que coméis normalmente y la app os montará la semana por colores, con alguna idea nueva de vez en cuando.')}</p>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn primary" id="go-dishes">${T('Añadir mis platos')}</button>
          <button type="button" class="btn" id="examples">${T('Probar con ejemplos')}</button>
        </div>
        ${Familia.active ? '' : `<p class="muted small">${T('¿Alguien de casa ya usa la app?')}</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn" id="join-family">👨‍👩‍👧 ${T('Tengo un código de familia')}</button></div>`}
      </div>`;
  } else {
    html += `
      <div class="row">
        <button type="button" class="btn primary grow" id="fill">${filled ? T('Rellenar huecos') : '🎲 ' + T('Hacer el menú')}</button>
        ${filled ? `<button type="button" class="btn grow" id="redo">${T('Rehacer semana')}</button>` : ''}
      </div>
      ${filled ? legend(counts) : ''}
      ${filled && healthMembers().length ? `<p class="muted small">${T('Para {quien}: 🧂 mucha sal · 🧈 grasa saturada · 🦐 purinas · 🥓 embutido · ⛔ no apto. Toca la comida para ver cómo arreglarlo.', { quien: esc(healthMembers().map((m) => m.name).join(T(' y '))) })}</p>` : ''}
      ${filled ? `<div class="row">
        <button type="button" class="pill-btn" id="to-shop">🛒 ${T('Pasar a la lista de la compra')}</button>
        <button type="button" class="pill-btn" id="clear-week">🗑️ ${T('Limpiar semana')}</button>
      </div>` : ''}`;
  }

  html += days.map((d) => {
    const key = iso(d);
    return `<section class="day ${key === todayKey ? 'today' : ''}">
      <div class="day-head"><strong>${fmtDay.format(d)}</strong><span class="muted small">${fmtShort.format(d)}</span></div>
      ${citasDelDia(key)}
      ${meals.map((m) => {
        const list = dishesOf(state.plan[key]?.[m]);
        const p = list[0];
        if (!p) return `<button type="button" class="slot empty" data-key="${key}" data-meal="${m}"><span class="slot-meal">${COMIDAS[m]}</span><span class="slot-name">+ ${T('Elegir plato')}</span><span></span></button>`;
        return `<button type="button" class="slot c-${p.cat}" data-key="${key}" data-meal="${m}">
          <span class="slot-meal">${COMIDAS[m]}</span>
          <span class="slot-name"><span class="slot-main">${esc(nombrePlato(p.name))}${p.nuevo ? `<span class="tag-new">✨ ${T('Nuevo')}</span>` : ''}${slotHealth(list)}</span>${list.slice(1).map((x) => `<span class="slot-more"><span class="dot c-${x.cat}"></span>${esc(nombrePlato(x.name))}${x.nuevo ? ' ✨' : ''}</span>`).join('')}</span>
          <span class="slot-icons ${list.length > 1 ? 'varios' : ''}" aria-hidden="true">${list.slice(0, 3).map((x, i) => `<span class="slot-ico ${i ? 'acomp' : ''}">${dibujo(x.name, x.cat)}</span>`).join('')}</span>
        </button>`;
      }).join('')}
    </section>`;
  }).join('');

  main.innerHTML = html;

  $('#prev').onclick = () => { view.week--; render(); };
  $('#next').onclick = () => { view.week++; render(); };
  $('#share').onclick = () => shareWeek(days);
  $('#go-dishes')?.addEventListener('click', () => go('platos'));
  $('#examples')?.addEventListener('click', loadExamples);
  $('#join-family')?.addEventListener('click', Familia.openJoin);
  $('#to-shop')?.addEventListener('click', () => { const w = view.week; go('compra'); openFromMenu(w); });
  $('#fill')?.addEventListener('click', () => { fillWeek(days, false); render(); toast(T('Menú listo. Toca un plato para cambiarlo.')); });
  $('#clear-week')?.addEventListener('click', () => {
    if (!confirm(T('¿Borrar todos los platos del {a} al {b}? Se borrarán también en los demás móviles de la familia.', { a: fmtShort.format(first), b: fmtShort.format(last) }))) return;
    days.forEach((d) => { delete state.plan[iso(d)]; });
    save(); render(); toast(T('Semana limpia'));
  });
  $('#redo')?.addEventListener('click', () => {
    if (!confirm(T('¿Rehacer toda la semana? Se cambiarán todos los platos.'))) return;
    fillWeek(days, true); render(); toast(T('Semana nueva'));
  });
  main.querySelectorAll('.slot').forEach((b) => b.addEventListener('click', () => openMeal(b.dataset.key, b.dataset.meal)));
  main.querySelectorAll('[data-cita-sem]').forEach((b) => b.addEventListener('click', () => { go('citas'); openCita(b.dataset.citaSem); }));
}

function loadExamples() {
  const ej = ['Lentejas estofadas', 'Tortilla de patatas', 'Merluza en salsa verde', 'Pollo asado con patatas', 'Macarrones con tomate',
    'Crema de calabacín', 'Albóndigas en salsa', 'Salmón al horno con limón', 'Ensalada mixta', 'Garbanzos con espinacas',
    'Paella mixta', 'Revuelto de setas', 'Pechuga a la plancha con ensalada', 'Judías verdes con patata', 'Pizza casera',
    'Lomo a la plancha con pimientos', 'Calamares a la romana', 'Hamburguesas caseras'];
  const byName = Object.fromEntries(CATALOGO.map((c) => [c[0], c]));
  ej.forEach((n) => { const c = byName[n]; addDish(c[0], c[1], c[2] || 'ambos'); });
  save();
  toast(T('Cargados 18 platos de ejemplo. Puedes borrarlos cuando quieras.'));
  render();
}

async function shareWeek(days) {
  const meals = state.settings.meals;
  const lines = [T('Menú del {a} al {b}', { a: fmtShort.format(days[0]), b: fmtShort.format(days[6]) }), ''];
  for (const d of days) {
    const day = state.plan[iso(d)] || {};
    const parts = meals.map((m) => { const l = dishesOf(day[m]); return l.length ? l.map((x) => `${CAT[x.cat]?.emoji || ''} ${nombrePlato(x.name)}`).join(' + ') : '—'; });
    lines.push(`${cap(fmtDay.format(d))}: ${parts.join('  /  ')}`);
  }
  const text = lines.join('\n');
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast(T('Menú copiado. Ya puedes pegarlo en WhatsApp.'));
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast(T('No se ha podido compartir'));
  }
}

// ---------- Hoja para cambiar un plato del menú ----------

// Una comida del menú guarda el primer plato arriba y los demás en «mas».
// Cada plato puede llevar para (quién come), inv (invitados) y n (personas, si no hay miembros).
function dishesOf(slot) {
  if (!slot || !slot.name) return [];
  const { mas, ...main } = slot;
  return [main, ...(Array.isArray(mas) ? mas : [])].filter((d) => d && d.name);
}
function slotFrom(list) {
  if (!list.length) return null;
  const [first, ...rest] = list;
  const s = { ...first };
  delete s.mas;
  if (rest.length) s.mas = rest;
  return s;
}
const pickWho = (x) => Object.fromEntries(['para', 'inv', 'n'].filter((k) => x && x[k] != null).map((k) => [k, x[k]]));

// Pone el plato en la posición i de esa comida (o lo quita si dish es null). Al cambiar un plato se conserva quién come.
function setDish(key, meal, i, dish) {
  const list = dishesOf(state.plan[key]?.[meal]);
  if (dish) list[i] = { ...dish, ...pickWho(list[i]) };
  else list.splice(i, 1);
  state.plan[key] ||= {};
  const s = slotFrom(list);
  if (s) state.plan[key][meal] = s; else delete state.plan[key][meal];
  save();
}

// Aviso en la semana si algún plato de la comida no le va bien a quien tiene plan de salud
function slotHealth(list) {
  const icons = [...new Set(list.map((x) => healthIcons(x.name, x)).join('').match(/⛔|🧂|🧈|🦐|🥓/gu) || [])];
  const txt = icons.includes('⛔') ? '⛔' : icons.join('');
  return txt ? `<span class="slot-health">${txt}</span>` : '';
}

// ---------- Hoja de una comida: sus platos y quién come cada uno ----------

function openMeal(key, meal) {
  const d = new Date(key + 'T12:00:00');
  const list = dishesOf(state.plan[key]?.[meal]);
  if (!list.length) { openPicker(key, meal, 0); return; }
  openSheet(`
    <div class="sheet-head"><h3>${fmtDay.format(d)} · ${COMIDAS[meal]}</h3><button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button></div>
    ${list.map((p, i) => `
      <div class="meal-dish c-${p.cat}" data-i="${i}">
        <div class="md-head">
          ${dibujo(p.name, p.cat)}
          <div class="md-title">
            <strong>${esc(nombrePlato(p.name))}</strong>${p.nuevo ? `<span class="tag-new">✨ ${T('Nuevo')}</span>` : ''}
            <span class="muted small">${esc(whoText(p))}</span>
          </div>
        </div>
        ${healthLines(p.name, p)}
        ${p.nuevo ? `<div class="notice">
          <p class="small"><strong>${T('Es una idea nueva.')}</strong> ${T('Si os gusta, guárdala con vuestros platos.')}</p>
          <div class="row"><button type="button" class="btn primary small" data-keep="${i}">${T('Guardar en mis platos')}</button><button type="button" class="btn small" data-nope="${i}">${T('No me la sugieras más')}</button></div>
        </div>` : ''}
        <div class="md-who">${whoPicker(p, `w${i}`)}</div>
        <div class="row">
          <button type="button" class="btn small grow" data-recipe="${i}">📖 ${T('Receta')}</button>
          <button type="button" class="btn small grow" data-change="${i}">🔄 ${T('Cambiar')}</button>
          <button type="button" class="btn small danger" data-remove="${i}">${T('Quitar')}</button>
        </div>
      </div>`).join('')}
    <button type="button" class="btn" id="add-dish">➕ ${T('Añadir otro plato')}</button>
  `);
  const sheet = $('#sheet');
  const commit = () => { state.plan[key] ||= {}; state.plan[key][meal] = slotFrom(list); save(); render(); openMeal(key, meal); };
  list.forEach((p, i) => bindWho(sheet.querySelector(`.meal-dish[data-i="${i}"] .md-who`), p, `w${i}`, commit));
  sheet.querySelectorAll('[data-recipe]').forEach((b) => b.onclick = () => {
    const p = list[+b.dataset.recipe];
    openRecipe(p.name, { dish: p, onChange: () => { state.plan[key][meal] = slotFrom(list); save(); render(); }, back: () => openMeal(key, meal) });
  });
  sheet.querySelectorAll('[data-change]').forEach((b) => b.onclick = () => openPicker(key, meal, +b.dataset.change));
  sheet.querySelectorAll('[data-remove]').forEach((b) => b.onclick = () => {
    setDish(key, meal, +b.dataset.remove, null);
    render();
    if (dishesOf(state.plan[key]?.[meal]).length) openMeal(key, meal); else closeSheet();
  });
  sheet.querySelectorAll('[data-keep]').forEach((b) => b.onclick = () => {
    const p = list[+b.dataset.keep];
    addDish(p.name, p.cat, CATALOGO.find((c) => c[0] === p.name)?.[2] || 'ambos');
    delete p.nuevo;
    commit();
    toast(T('Guardado en tus platos'));
  });
  sheet.querySelectorAll('[data-nope]').forEach((b) => b.onclick = () => {
    const i = +b.dataset.nope;
    state.dismissed.push(list[i].name);
    const { ctx, sameDayCat } = slotContext(key, meal);
    const other = pickMine(meal, ctx, sameDayCat, norm(list[i].name));
    setDish(key, meal, i, other);
    render();
    if (dishesOf(state.plan[key]?.[meal]).length) openMeal(key, meal); else closeSheet();
    toast(T('Vale, no la volveré a sugerir'));
  });
  $('#add-dish').onclick = () => openPicker(key, meal, list.length);
}

// Elegir un plato para la posición i de una comida (si i es el final, se añade otro)
function openPicker(key, meal, i) {
  const d = new Date(key + 'T12:00:00');
  const current = dishesOf(state.plan[key]?.[meal]);
  const cur = current[i];
  let filter = cur?.cat || 'todas';
  const put = (dish) => {
    if (current.some((x, j) => j !== i && norm(x.name) === norm(dish.name))) { toast(T('Ese plato ya está en esta comida')); return; }
    setDish(key, meal, i, dish); render(); openMeal(key, meal);
  };
  const title = cur ? T('Cambiar «{nombre}»', { nombre: nombrePlato(cur.name) }) : current.length ? T('Añadir otro plato') : `${cap(fmtDay.format(d))} · ${COMIDAS[meal]}`;

  const draw = () => {
    const list = state.dishes
      .filter((x) => (filter === 'todas' || x.cat === filter))
      .sort((a, b) => nombrePlato(a.name).localeCompare(nombrePlato(b.name), LOCALE));
    openSheet(`
      <div class="sheet-head">
        ${current.length ? '<button type="button" class="close" id="pk-back" aria-label="' + T('Volver') + '">‹</button>' : ''}
        <h3>${esc(title)}</h3>
        <button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button>
      </div>
      <div class="row">
        <button type="button" class="btn grow" id="random">🎲 ${T('Otro mío')}</button>
        <button type="button" class="btn grow" id="new">✨ ${T('Idea nueva')}</button>
      </div>
      <form class="row" id="free">
        <input type="text" class="grow" id="free-name" placeholder="${T('Escribir otro plato…')}" autocomplete="off" enterkeyhint="done">
        <button type="submit" class="btn">${T('Poner')}</button>
      </form>
      <div class="chips">${chip('todas', T('Todos'), filter)}${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, filter)).join('')}</div>
      <div class="pick-list">${list.length ? list.map((x) => `<button type="button" class="dish c-${x.cat}" data-id="${x.id}"><span class="dot"></span><span class="name">${esc(nombrePlato(x.name))}</span>${x.fav ? '⭐' : ''}</button>`).join('') : `<p class="muted small">${T('No tienes platos de este tipo todavía.')}</p>`}</div>
    `);
    const sheet = $('#sheet');
    $('#pk-back')?.addEventListener('click', () => openMeal(key, meal));
    sheet.querySelectorAll('.chip').forEach((b) => b.onclick = () => { filter = b.dataset.v; draw(); });
    sheet.querySelectorAll('.dish').forEach((b) => b.onclick = () => {
      const x = state.dishes.find((y) => y.id === b.dataset.id);
      put({ name: x.name, cat: x.cat });
    });
    $('#random').onclick = () => {
      const { ctx, sameDayCat } = slotContext(key, meal);
      const n = pickMine(meal, ctx, sameDayCat, cur && norm(cur.name));
      n ? put(n) : toast(T('Añade más platos para poder variar'));
    };
    $('#new').onclick = () => {
      const { ctx, sameDayCat } = slotContext(key, meal);
      const n = pickNew(meal, ctx, sameDayCat, cur && norm(cur.name));
      n ? put(n) : toast(T('Ya conoces todas las ideas que tengo'));
    };
    $('#free').onsubmit = (e) => {
      e.preventDefault();
      const name = platoEnEspanol($('#free-name').value.trim());
      if (!name) return;
      const existing = state.dishes.find((x) => norm(x.name) === norm(name));
      const dish = existing || addDish(name, guessCat(name), 'ambos');
      put({ name: dish.name, cat: dish.cat });
      if (!existing) toast(T('Añadido a tus platos como {tipo}', { tipo: minus(CAT[dish.cat].nombre) }));
    };
  };
  draw();
}

function chip(v, label, current) {
  return `<button type="button" class="chip ${v !== 'todas' ? 'c-' + v : ''}" data-v="${v}" aria-pressed="${v === current}">${esc(label)}</button>`;
}

// ---------- Mis platos ----------

function addDish(name, cat, when) {
  name = platoEnEspanol(name);
  const ex = state.dishes.find((x) => norm(x.name) === norm(name));
  if (ex) return ex;
  const d = { id: uid(), name: cap(name.trim()), cat, when: when || 'ambos', fav: false };
  const ing = catalogIngredients(name);
  if (ing) d.ingredients = ing;
  state.dishes.push(d);
  return d;
}

function renderDishes(main, same) {
  // El formulario de arriba solo se dibuja al entrar en la pestaña; el resto se redibuja con cada cambio
  if (!same || !$('#add')) {
    const cat = view.newCat || 'auto';
    main.innerHTML = `
      <form class="card" id="add">
        <label class="field">${T('Añadir un plato')}
          <input type="text" id="add-name" placeholder="${T('Ej.: Lentejas con chorizo')}" autocomplete="off" enterkeyhint="done">
        </label>
        <div class="chips" id="add-cats">${chip('auto', '🪄 ' + T('Adivinar'), cat)}${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, cat)).join('')}</div>
        <div class="row">
          <button type="submit" class="btn primary grow">${T('Añadir')}</button>
          <button type="button" class="btn grow" id="bulk">${T('Pegar una lista')}</button>
        </div>
      </form>
      <div class="region" id="dish-region"></div>`;
    const pressCat = (v) => main.querySelectorAll('#add-cats .chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === v));
    main.querySelectorAll('#add-cats .chip').forEach((b) => b.onclick = () => { view.newCat = b.dataset.v; pressCat(b.dataset.v); });
    $('#add').onsubmit = (e) => {
      e.preventDefault();
      const name = platoEnEspanol($('#add-name').value.trim());
      if (!name) return;
      if (state.dishes.some((x) => norm(x.name) === norm(name))) { toast(T('Ese plato ya está')); return; }
      const c = (view.newCat || 'auto') === 'auto' ? guessCat(name) : view.newCat;
      addDish(name, c, 'ambos');
      save();
      view.newCat = 'auto';
      pressCat('auto');
      $('#add-name').value = '';
      render();
      $('#add-name').focus();
      toast(`${CAT[c].emoji} ${T('Añadido a {tipo}', { tipo: CAT[c].nombre })}`);
    };
    $('#bulk').onclick = openBulk;
  }

  const groups = CATEGORIAS.map((c) => ({ c, items: state.dishes.filter((d) => d.cat === c.id).sort((a, b) => nombrePlato(a.name).localeCompare(nombrePlato(b.name), LOCALE)) }));
  const meals = state.settings.meals.length === 2 ? 'ambas' : state.settings.meals[0];
  const sinReceta = state.dishes.filter((d) => !recipeFor(d.name)).length;
  const region = $('#dish-region');
  region.innerHTML = `
    <p class="muted small">${state.dishes.length ? `${T('{n} platos. Toca uno para ver su receta.', { n: state.dishes.length })}${sinReceta ? ` <strong>${T('{n} sin receta todavía', { n: sinReceta })}</strong>: ${T('tócalos para escribirla.')}` : ''}` : T('Todavía no hay platos. Puedes escribirlos uno a uno o pegar una lista entera.')}</p>
    ${groups.filter((g) => g.items.length).map((g) => `
      <section class="group c-${g.c.id}">
        <div class="group-head"><span class="dot"></span>${g.c.emoji} ${esc(g.c.nombre)} <span class="count">${g.items.length}</span></div>
        <div class="tiles">${g.items.map((d) => `
          <button type="button" class="tile c-${d.cat}" data-id="${d.id}">
            ${dibujo(d.name, d.cat)}
            <span class="tile-name">${esc(nombrePlato(d.name))}</span>
            ${d.fav ? `<span class="tile-fav" aria-label="${T('Favorito')}">⭐</span>` : ''}
            ${recipeFor(d.name) ? '' : `<span class="tile-badge">${T('sin receta')}</span>`}
            ${healthIcons(d.name) ? `<span class="tile-health" aria-label="${T('Con moderación para quien tiene plan de salud')}">${healthIcons(d.name)}</span>` : ''}
          </button>`).join('')}</div>
      </section>`).join('')}`;

  region.querySelectorAll('.tile').forEach((b) => b.onclick = () => {
    const d = state.dishes.find((x) => x.id === b.dataset.id);
    if (d) openRecipe(d.name);
  });
}

function openBulk() {
  openSheet(`
    <div class="sheet-head"><h3>${T('Pegar una lista')}</h3><button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button></div>
    <p class="muted small">${T('Un plato por línea. La app adivina el color de cada uno; luego puedes corregirlo tocando el plato.')}</p>
    <textarea id="bulk-text" placeholder="${esc(T('Lentejas\nTortilla de patatas\nMerluza a la plancha\nPollo al horno')).replace(/\n/g, '&#10;')}"></textarea>
    <button type="button" class="btn primary" id="bulk-ok">${T('Añadir todos')}</button>
  `);
  $('#bulk-ok').onclick = () => {
    const lines = $('#bulk-text').value.split(/\n|,(?![^(]*\))/).map((l) => l.replace(/^[\s\-•*·\d.)]+/, '').trim()).filter(Boolean);
    let added = 0;
    for (const line of lines) {
      // Admite "Plato · Tipo", que es como sale al compartir la lista
      const [escrito, tipo] = line.split(/\s+[·|]\s+/);
      const name = platoEnEspanol(escrito);
      const forced = tipo && CATEGORIAS.find((c) => norm(c.nombre) === norm(tipo.replace(/^\S+\s/, '')) || norm(c.nombre) === norm(tipo));
      if (state.dishes.some((x) => norm(x.name) === norm(name))) continue;
      addDish(name, forced ? forced.id : guessCat(name), 'ambos');
      added++;
    }
    save();
    closeSheet();
    render();
    toast(added ? T('Añadidos {n} platos. Revisa los colores.', { n: added }) : T('No había platos nuevos'));
  };
  setTimeout(() => $('#bulk-text')?.focus(), 250);
}

function openDish(id) {
  const d = state.dishes.find((x) => x.id === id);
  if (!d) return;
  const draw = () => {
    openSheet(`
      <div class="sheet-head"><h3>${T('Editar plato')}</h3><button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button></div>
      <label class="field">${T('Nombre')}<input type="text" id="ed-name" value="${esc(nombrePlato(d.name))}" autocomplete="off"></label>
      <label class="field">${T('Tipo')}</label>
      <div class="chips" id="ed-cat">${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, d.cat)).join('')}</div>
      <label class="field">${T('Cuándo')}</label>
      <div class="chips" id="ed-when">${chip('ambos', T('Comida o cena'), d.when)}${chip('comida', T('Solo comida'), d.when)}${chip('cena', T('Solo cena'), d.when)}</div>
      <div class="chips"><button type="button" class="chip" id="ed-fav" aria-pressed="${!!d.fav}">⭐ ${T('Favorito (sale más a menudo)')}</button></div>
      <label class="field">${T('Ingredientes')} <span class="muted small" style="font-weight:400">${T('para la lista de la compra')}</span>
        <textarea id="ed-ing" class="short" placeholder="${T('Uno por línea o separados por comas')}">${esc((d.ingredients || []).join('\n'))}</textarea>
      </label>
      <div class="row">
        <button type="button" class="btn primary grow" id="ed-ok">${T('Guardar')}</button>
        <button type="button" class="btn" id="ed-recipe">📖 ${T('Receta')}</button>
        <button type="button" class="btn danger" id="ed-del">${T('Borrar')}</button>
      </div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#ed-cat .chip').forEach((b) => b.onclick = () => { d.cat = b.dataset.v; keepName(); draw(); });
    sheet.querySelectorAll('#ed-when .chip').forEach((b) => b.onclick = () => { d.when = b.dataset.v; keepName(); draw(); });
    $('#ed-fav').onclick = () => { d.fav = !d.fav; keepName(); draw(); };
    $('#ed-ok').onclick = () => { keepName(); save(); closeSheet(); render(); };
    $('#ed-recipe').onclick = () => { keepName(); save(); render(); openRecipe(d.name); };
    $('#ed-del').onclick = () => {
      if (!confirm(T('¿Borrar «{nombre}»?', { nombre: d.name }))) return;
      state.dishes = state.dishes.filter((x) => x.id !== d.id);
      save(); closeSheet(); render();
    };
  };
  const keepName = () => {
    const t = $('#ed-ing');
    if (t) { const list = parseList(t.value); if (list.length) d.ingredients = list; else delete d.ingredients; }
    let v = $('#ed-name')?.value.trim();
    if (!v) return;
    if (v === nombrePlato(d.name)) v = d.name;   // sin tocar el nombre traducido, se queda el de siempre
    v = platoEnEspanol(v);
    const old = d.name;
    d.name = v;
    // Actualiza el menú para que el color y el nombre coincidan
    Object.values(state.plan).forEach((day) => Object.values(day).forEach((p) => { if (p && norm(p.name) === norm(old)) { p.name = d.name; p.cat = d.cat; } }));
  };
  draw();
}

async function exportList() {
  const text = state.dishes
    .slice().sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, LOCALE))
    .map((d) => `${nombrePlato(d.name)} · ${CAT[d.cat].nombre}`).join('\n');
  if (!text) { toast(T('Todavía no hay platos')); return; }
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast(T('Lista copiada. En otro móvil, pégala en «Pegar una lista».'));
  } catch (e) {
    if (e && e.name !== 'AbortError') toast(T('No se ha podido compartir'));
  }
}

// ---------- Ideas ----------

function renderIdeas(main) {
  const free = catalogFree();
  if (!view.idea || !free.some((c) => c.name === view.idea.name)) view.idea = shuffle(free)[0] || null;
  const i = view.idea;
  const mineCount = {};
  state.dishes.forEach((d) => { mineCount[d.cat] = (mineCount[d.cat] || 0) + 1; });
  const scarce = CATEGORIAS.filter((c) => c.id !== 'otros' && (mineCount[c.id] || 0) < 2);

  main.innerHTML = `
    <p class="muted">${T('Platos caseros que no están en tu lista. Si te gusta alguno, guárdalo o ponlo directamente en el menú.')}</p>
    ${i ? `
      <div class="card idea c-${i.cat}">
        <div class="big">${CAT[i.cat].emoji}</div>
        <div class="title">${esc(nombrePlato(i.name))}</div>
        <div class="muted small">${esc(CAT[i.cat].nombre)}${i.when ? ` · ${T('mejor para {comida}', { comida: minus(COMIDAS[i.when]) })}` : ''}</div>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn primary" id="i-save">${T('Me gusta, guardar')}</button>
          <button type="button" class="btn" id="i-week">${T('Ponerlo en el menú')}</button>
        </div>
        <div class="row" style="justify-content:center">
          <button type="button" class="pill-btn" id="i-recipe">📖 ${T('Receta')}</button>
          <button type="button" class="pill-btn" id="i-next">🎲 ${T('Otra idea')}</button>
          <button type="button" class="pill-btn" id="i-no">${T('No me gusta')}</button>
        </div>
      </div>` : `<div class="card empty-state"><div class="big">🎉</div><p>${T('Ya has visto todas las ideas que tengo.')}</p></div>`}
    <h2>${T('Por tipo')}</h2>
    <div class="chips" id="i-cats">${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, i?.cat)).join('')}</div>
    ${scarce.length && state.dishes.length ? `<p class="muted small">${T('Tienes pocos platos de: {tipos}. Prueba a mirar ideas de esos tipos.', { tipos: scarce.map((c) => minus(c.nombre)).join(', ') })}</p>` : ''}
  `;
  if (!i) return;
  $('#i-recipe').onclick = () => openRecipe(i.name);
  $('#i-next').onclick = () => { view.idea = shuffle(free.filter((c) => c.name !== i.name))[0] || i; render(); };
  $('#i-no').onclick = () => { state.dismissed.push(i.name); save(); view.idea = null; render(); toast(T('Vale, no la volveré a sugerir')); };
  $('#i-save').onclick = () => { addDish(i.name, i.cat, i.when || 'ambos'); save(); view.idea = null; render(); toast(T('Guardado en tus platos')); };
  $('#i-week').onclick = () => putInWeek(i);
  main.querySelectorAll('#i-cats .chip').forEach((b) => b.onclick = () => {
    const opts = free.filter((c) => c.cat === b.dataset.v && c.name !== i.name);
    if (!opts.length) { toast(T('No me quedan más ideas de ese tipo')); return; }
    view.idea = shuffle(opts)[0];
    render();
  });
}

function putInWeek(i) {
  const days = weekDays(view.week < 0 ? 0 : view.week);
  const today = iso(new Date());
  const meals = state.settings.meals;
  openSheet(`
    <div class="sheet-head"><h3>${T('¿Cuándo?')}</h3><button type="button" class="close" data-close aria-label="${T('Cerrar')}">✕</button></div>
    <p class="muted small">${esc(nombrePlato(i.name))}</p>
    <div class="pick-list">
      ${days.filter((d) => iso(d) >= today).flatMap((d) => meals.filter((m) => fits(i.when, m)).map((m) => {
        const l = dishesOf(state.plan[iso(d)]?.[m]);
        const p = l[0];
        return `<button type="button" class="dish ${p ? 'c-' + p.cat : 'c-otros'}" data-key="${iso(d)}" data-meal="${m}">
          <span class="name">${cap(fmtDay.format(d))} · ${COMIDAS[m]}</span><span class="badge">${p ? T('junto a {platos}', { platos: esc(l.map((x) => nombrePlato(x.name)).join(' + ')) }) : T('libre')}</span></button>`;
      })).join('')}
    </div>
  `);
  $('#sheet').querySelectorAll('.dish').forEach((b) => b.onclick = () => {
    // Si esa comida ya tiene platos, la idea se añade como otro plato
    const n = dishesOf(state.plan[b.dataset.key]?.[b.dataset.meal]).length;
    setDish(b.dataset.key, b.dataset.meal, n, { name: i.name, cat: i.cat, nuevo: true });
    closeSheet();
    view.idea = null;
    go('semana');
    toast(T('Puesto en el menú'));
  });
}

// ---------- Hoja inferior, pestañas y arranque ----------

function openSheet(html) {
  const sheet = $('#sheet');
  $('#toast').classList.remove('show');
  sheet.innerHTML = `<div class="grabber"></div>${html}`;
  sheet.classList.add('open');
  sheet.removeAttribute('inert');
  sheet.setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('open');
  sheet.querySelectorAll('[data-close]').forEach((b) => b.onclick = closeSheet);
}
function closeSheet() {
  const sheet = $('#sheet');
  sheet.classList.remove('open');
  sheet.setAttribute('inert', '');
  sheet.setAttribute('aria-hidden', 'true');
  $('#scrim').classList.remove('open');
  Familia.retry();
}
$('#scrim').onclick = closeSheet;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

function go(tab) {
  view.tab = tab;
  try { localStorage.setItem(KEY + '-tab', tab); } catch (e) { /* da igual */ }
  render();
  window.scrollTo(0, 0);
}
document.querySelectorAll('#tabs button').forEach((b) => b.onclick = () => go(b.dataset.tab));
try { view.tab = localStorage.getItem(KEY + '-tab') || 'semana'; } catch (e) { /* da igual */ }
// Al tocar un aviso de cita, la app se abre en la pestaña Citas
if (location.hash === '#citas') { view.tab = 'citas'; history.replaceState(null, '', location.pathname); }

// Textos fijos de index.html
$('#title').textContent = T('Menú familiar');
document.title = T('Menú familiar');
document.querySelectorAll('#tabs button').forEach((b) => { b.lastChild.textContent = T(b.lastChild.textContent.trim()); });

if (!IDIOMA) {
  // La primera vez se pregunta el idioma; al elegirlo, la app se vuelve a abrir ya traducida
  pantallaIdioma();
} else {
idiomaParaAvisos();
render();
Familia.start();
// Avisos con la app cerrada: los móviles con el sistema de antes se pasan al nuevo, y se pone al día la cola
actualizarAvisosDeAntes().then(() => Avisos.actualizar(false, 4000));
guiaPrimeraVez();
// Recordatorio de citas al abrir la app y al volver a ella
setTimeout(comprobarAvisos, 800);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(comprobarAvisos, 800); });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
