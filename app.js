'use strict';

// ---------- Datos guardados en el teléfono ----------

const KEY = 'menu-familiar-v1';
const APP_VERSION = 6;
const COMIDAS = { comida: 'Comida', cena: 'Cena' };
const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));

function defaults() {
  return {
    dishes: [],          // { id, name, cat, when: 'ambos' | 'comida' | 'cena', fav }
    plan: {},            // { 'AAAA-MM-DD': { comida: { name, cat, nuevo }, cena: {...} } }
    dismissed: [],       // ideas que no se quieren volver a ver
    shopping: [],        // lista de la compra: { id, name, sec, done, from }
    settings: { meals: ['comida', 'cena'], nuevos: 1 },
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
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { toast('No se ha podido guardar en este teléfono'); }
}
// Guarda en el teléfono y, si el móvil comparte con la familia, envía el cambio
function save() {
  saveLocal();
  Familia.changed();
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
const fmtDay = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
const fmtShort = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' });

function guessCat(name) {
  const n = norm(name);
  for (const [cat, words] of PALABRAS) if (words.some((w) => n.includes(norm(w)))) return cat;
  return 'otros';
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
  ctx.count[p.cat] = (ctx.count[p.cat] || 0) + 1;
  ctx.used.add(norm(p.name));
  ctx.prevCat = p.cat;
}

function score(cand, meal, ctx, sameDayCat) {
  let s = Math.random() * 3;
  const c = ctx.count[cand.cat] || 0;
  const t = ctx.target[cand.cat] ?? 1;
  if (c < t) s += 1.5; else s -= (c - t + 1) * 2.5;
  if (ctx.used.has(norm(cand.name))) s -= 8;
  if (ctx.lastWeek.has(norm(cand.name))) s -= 1.5;
  if (cand.cat === ctx.prevCat) s -= 3;
  if (cand.cat === sameDayCat) s -= 2;
  if (cand.fav) s += 0.8;
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
      if (!redo && day[m]) { sameDayCat = day[m].cat; ctx.prevCat = day[m].cat; continue; }
      const p = pickMine(m, ctx, sameDayCat);
      if (!p) continue;
      day[m] = p;
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
    if (p) day[m] = p;
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

function render() {
  document.querySelectorAll('#tabs button').forEach((b) => {
    if (b.dataset.tab === view.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  const main = $('#view');
  const actions = $('#actions');
  actions.innerHTML = '';
  // Si se sigue en la misma pestaña, las que tienen un campo para escribir solo redibujan la lista,
  // para no borrar lo que se está tecleando ni cerrar el teclado
  const same = main.dataset.tab === view.tab;
  main.dataset.tab = view.tab;
  if (view.tab === 'semana') renderWeek(main, actions);
  else if (view.tab === 'compra') renderShopping(main, actions, same);
  else if (view.tab === 'platos') renderDishes(main, same);
  else renderIdeas(main);
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
  const label = view.week === 0 ? 'Esta semana' : view.week === 1 ? 'La semana que viene' : view.week === -1 ? 'La semana pasada' : `Semana del ${fmtShort.format(first)}`;

  actions.innerHTML = `<button type="button" class="pill-btn" id="share">Compartir</button>`;

  const counts = {};
  let filled = 0;
  days.forEach((d) => meals.forEach((m) => { const p = state.plan[iso(d)]?.[m]; if (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; filled++; } }));

  let html = `
    <div class="week-nav">
      <button type="button" class="round" id="prev" aria-label="Semana anterior">‹</button>
      <div style="text-align:center"><strong>${label}</strong><div class="muted small">${fmtShort.format(first)} – ${fmtShort.format(last)}</div></div>
      <button type="button" class="round" id="next" aria-label="Semana siguiente">›</button>
    </div>`;

  if (!state.dishes.length) {
    html += `
      <div class="card empty-state">
        <div class="big">🍽️</div>
        <p><strong>Primero, vuestros platos de siempre</strong></p>
        <p class="muted">Apunta lo que coméis normalmente y la app os montará la semana por colores, con alguna idea nueva de vez en cuando.</p>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn primary" id="go-dishes">Añadir mis platos</button>
          <button type="button" class="btn" id="examples">Probar con ejemplos</button>
        </div>
        ${Familia.active ? '' : `<p class="muted small">¿Alguien de casa ya usa la app?</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn" id="join-family">👨‍👩‍👧 Tengo un código de familia</button></div>`}
      </div>`;
  } else {
    html += `
      <div class="row">
        <button type="button" class="btn primary grow" id="fill">${filled ? 'Rellenar huecos' : '🎲 Hacer el menú'}</button>
        ${filled ? '<button type="button" class="btn grow" id="redo">Rehacer semana</button>' : ''}
      </div>
      ${filled ? legend(counts) : ''}
      ${filled ? '<button type="button" class="pill-btn" id="to-shop" style="justify-self:start">🛒 Pasar a la lista de la compra</button>' : ''}`;
  }

  html += days.map((d) => {
    const key = iso(d);
    return `<section class="day ${key === todayKey ? 'today' : ''}">
      <div class="day-head"><strong>${fmtDay.format(d)}</strong><span class="muted small">${fmtShort.format(d)}</span></div>
      ${meals.map((m) => {
        const p = state.plan[key]?.[m];
        if (!p) return `<button type="button" class="slot empty" data-key="${key}" data-meal="${m}"><span class="slot-meal">${COMIDAS[m]}</span><span class="slot-name">+ Elegir plato</span><span></span></button>`;
        return `<button type="button" class="slot c-${p.cat}" data-key="${key}" data-meal="${m}">
          <span class="slot-meal">${COMIDAS[m]}</span>
          <span class="slot-name">${esc(p.name)}${p.nuevo ? '<span class="tag-new">✨ Nuevo</span>' : ''}</span>
          <span class="slot-emoji" aria-label="${esc(CAT[p.cat]?.nombre || '')}">${CAT[p.cat]?.emoji || ''}</span>
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
  $('#fill')?.addEventListener('click', () => { fillWeek(days, false); render(); toast('Menú listo. Toca un plato para cambiarlo.'); });
  $('#redo')?.addEventListener('click', () => {
    if (!confirm('¿Rehacer toda la semana? Se cambiarán todos los platos.')) return;
    fillWeek(days, true); render(); toast('Semana nueva');
  });
  main.querySelectorAll('.slot').forEach((b) => b.addEventListener('click', () => openSlot(b.dataset.key, b.dataset.meal)));
}

function loadExamples() {
  const ej = ['Lentejas estofadas', 'Tortilla de patatas', 'Merluza en salsa verde', 'Pollo asado con patatas', 'Macarrones con tomate',
    'Crema de calabacín', 'Albóndigas en salsa', 'Salmón al horno con limón', 'Ensalada mixta', 'Garbanzos con espinacas',
    'Paella mixta', 'Revuelto de setas', 'Pechuga a la plancha con ensalada', 'Judías verdes con patata', 'Pizza casera',
    'Lomo a la plancha con pimientos', 'Calamares a la romana', 'Hamburguesas caseras'];
  const byName = Object.fromEntries(CATALOGO.map((c) => [c[0], c]));
  ej.forEach((n) => { const c = byName[n]; addDish(c[0], c[1], c[2] || 'ambos'); });
  save();
  toast('Cargados 18 platos de ejemplo. Puedes borrarlos cuando quieras.');
  render();
}

async function shareWeek(days) {
  const meals = state.settings.meals;
  const lines = [`Menú del ${fmtShort.format(days[0])} al ${fmtShort.format(days[6])}`, ''];
  for (const d of days) {
    const day = state.plan[iso(d)] || {};
    const parts = meals.map((m) => day[m] ? `${CAT[day[m].cat]?.emoji || ''} ${day[m].name}` : '—');
    lines.push(`${cap(fmtDay.format(d))}: ${parts.join('  /  ')}`);
  }
  const text = lines.join('\n');
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Menú copiado. Ya puedes pegarlo en WhatsApp.');
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    toast('No se ha podido compartir');
  }
}

// ---------- Hoja para cambiar un plato del menú ----------

function openSlot(key, meal) {
  const d = new Date(key + 'T12:00:00');
  const p = state.plan[key]?.[meal];
  let filter = p?.cat || 'todas';

  const draw = () => {
    const list = state.dishes
      .filter((x) => (filter === 'todas' || x.cat === filter))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    openSheet(`
      <div class="sheet-head"><h3>${fmtDay.format(d)} · ${COMIDAS[meal]}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      ${p ? `<div class="slot c-${p.cat}" style="cursor:default"><span class="slot-meal">Ahora</span><span class="slot-name">${esc(p.name)}</span><span class="slot-emoji">${CAT[p.cat]?.emoji || ''}</span></div>` : ''}
      ${p?.nuevo ? `<div class="notice">
          <p><strong>✨ Es una idea nueva.</strong> Si os gusta, guárdala con vuestros platos.</p>
          <div class="row"><button type="button" class="btn primary small" id="keep">Guardar en mis platos</button><button type="button" class="btn small" id="nope">No me la sugieras más</button></div>
        </div>` : ''}
      <div class="row">
        <button type="button" class="btn grow" id="random">🎲 Otro mío</button>
        <button type="button" class="btn grow" id="new">✨ Idea nueva</button>
        ${p ? '<button type="button" class="btn danger" id="clear">Quitar</button>' : ''}
      </div>
      <form class="row" id="free">
        <input type="text" class="grow" id="free-name" placeholder="Escribir otro plato…" autocomplete="off" enterkeyhint="done">
        <button type="submit" class="btn">Poner</button>
      </form>
      <div class="chips">${chip('todas', 'Todos', filter)}${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, filter)).join('')}</div>
      <div class="pick-list">${list.length ? list.map((x) => `<button type="button" class="dish c-${x.cat}" data-id="${x.id}"><span class="dot"></span><span class="name">${esc(x.name)}</span>${x.fav ? '⭐' : ''}</button>`).join('') : '<p class="muted small">No tienes platos de este tipo todavía.</p>'}</div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('.chip').forEach((b) => b.onclick = () => { filter = b.dataset.v; draw(); });
    sheet.querySelectorAll('.dish').forEach((b) => b.onclick = () => {
      const x = state.dishes.find((y) => y.id === b.dataset.id);
      setSlot(key, meal, { name: x.name, cat: x.cat });
    });
    $('#random').onclick = () => {
      const { ctx, sameDayCat } = slotContext(key, meal);
      const n = pickMine(meal, ctx, sameDayCat, p && norm(p.name));
      n ? setSlot(key, meal, n) : toast('Añade más platos para poder variar');
    };
    $('#new').onclick = () => {
      const { ctx, sameDayCat } = slotContext(key, meal);
      const n = pickNew(meal, ctx, sameDayCat, p && norm(p.name));
      n ? setSlot(key, meal, n) : toast('Ya conoces todas las ideas que tengo');
    };
    $('#clear')?.addEventListener('click', () => setSlot(key, meal, null));
    $('#keep')?.addEventListener('click', () => {
      addDish(p.name, p.cat, CATALOGO.find((c) => c[0] === p.name)?.[2] || 'ambos');
      p.nuevo = false; save(); closeSheet(); render(); toast('Guardado en tus platos');
    });
    $('#nope')?.addEventListener('click', () => {
      state.dismissed.push(p.name);
      const { ctx, sameDayCat } = slotContext(key, meal);
      setSlot(key, meal, pickMine(meal, ctx, sameDayCat, norm(p.name)));
      toast('Vale, no la volveré a sugerir');
    });
    $('#free').onsubmit = (e) => {
      e.preventDefault();
      const name = $('#free-name').value.trim();
      if (!name) return;
      const existing = state.dishes.find((x) => norm(x.name) === norm(name));
      const dish = existing || addDish(name, guessCat(name), 'ambos');
      setSlot(key, meal, { name: dish.name, cat: dish.cat });
      if (!existing) toast(`Añadido a tus platos como ${CAT[dish.cat].nombre.toLowerCase()}`);
    };
  };
  draw();
}

function chip(v, label, current) {
  return `<button type="button" class="chip ${v !== 'todas' ? 'c-' + v : ''}" data-v="${v}" aria-pressed="${v === current}">${esc(label)}</button>`;
}

function setSlot(key, meal, p) {
  state.plan[key] ||= {};
  if (p) state.plan[key][meal] = p; else delete state.plan[key][meal];
  save();
  closeSheet();
  render();
}

// ---------- Mis platos ----------

function addDish(name, cat, when) {
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
        <label class="field">Añadir un plato
          <input type="text" id="add-name" placeholder="Ej.: Lentejas con chorizo" autocomplete="off" enterkeyhint="done">
        </label>
        <div class="chips" id="add-cats">${chip('auto', '🪄 Adivinar', cat)}${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, cat)).join('')}</div>
        <div class="row">
          <button type="submit" class="btn primary grow">Añadir</button>
          <button type="button" class="btn grow" id="bulk">Pegar una lista</button>
        </div>
      </form>
      <div class="region" id="dish-region"></div>`;
    const pressCat = (v) => main.querySelectorAll('#add-cats .chip').forEach((x) => x.setAttribute('aria-pressed', x.dataset.v === v));
    main.querySelectorAll('#add-cats .chip').forEach((b) => b.onclick = () => { view.newCat = b.dataset.v; pressCat(b.dataset.v); });
    $('#add').onsubmit = (e) => {
      e.preventDefault();
      const name = $('#add-name').value.trim();
      if (!name) return;
      if (state.dishes.some((x) => norm(x.name) === norm(name))) { toast('Ese plato ya está'); return; }
      const c = (view.newCat || 'auto') === 'auto' ? guessCat(name) : view.newCat;
      addDish(name, c, 'ambos');
      save();
      view.newCat = 'auto';
      pressCat('auto');
      $('#add-name').value = '';
      render();
      $('#add-name').focus();
      toast(`${CAT[c].emoji} Añadido a ${CAT[c].nombre}`);
    };
    $('#bulk').onclick = openBulk;
  }

  const groups = CATEGORIAS.map((c) => ({ c, items: state.dishes.filter((d) => d.cat === c.id).sort((a, b) => a.name.localeCompare(b.name, 'es')) }));
  const meals = state.settings.meals.length === 2 ? 'ambas' : state.settings.meals[0];
  const region = $('#dish-region');
  region.innerHTML = `
    <p class="muted small">${state.dishes.length ? `${state.dishes.length} platos. Toca uno para cambiar su color, sus ingredientes, marcarlo como favorito o borrarlo.` : 'Todavía no hay platos. Puedes escribirlos uno a uno o pegar una lista entera.'}</p>
    ${groups.filter((g) => g.items.length).map((g) => `
      <section class="group c-${g.c.id}">
        <div class="group-head"><span class="dot"></span>${g.c.emoji} ${esc(g.c.nombre)} <span class="count">${g.items.length}</span></div>
        ${g.items.map((d) => `<button type="button" class="dish c-${d.cat}" data-id="${d.id}"><span class="name">${esc(d.name)}</span>${d.when !== 'ambos' ? `<span class="badge">solo ${d.when}</span>` : ''}${d.fav ? '⭐' : ''}</button>`).join('')}
      </section>`).join('')}
    <h2>Familia</h2>
    ${Familia.card()}
    <h2>Ajustes</h2>
    <div class="card">
      <label class="field">Qué planificar</label>
      <div class="chips" id="set-meals">
        ${chip('ambas', 'Comida y cena', meals)}
        ${chip('comida', 'Solo comida', meals)}
        ${chip('cena', 'Solo cena', meals)}
      </div>
      <label class="field">Ideas nuevas en cada menú semanal</label>
      <div class="chips" id="set-new">${[0, 1, 2, 3].map((n) => chip(String(n), n === 0 ? 'Ninguna' : String(n), String(state.settings.nuevos))).join('')}</div>
      <div class="row">
        <button type="button" class="btn small grow" id="export">Compartir mi lista</button>
        ${state.dismissed.length ? `<button type="button" class="btn small grow" id="undismiss">Recuperar ideas descartadas (${state.dismissed.length})</button>` : ''}
      </div>
    </div>
    <p class="muted small" style="text-align:center">Versión ${APP_VERSION}${typeof FAMILIA_VERSION !== 'undefined' && FAMILIA_VERSION === APP_VERSION ? '' : ' · ⚠️ a medio actualizar: cierra la app y ábrela otra vez'}</p>`;

  Familia.bind(region);
  region.querySelectorAll('.group .dish').forEach((b) => b.onclick = () => openDish(b.dataset.id));
  region.querySelectorAll('#set-meals .chip').forEach((b) => b.onclick = () => {
    state.settings.meals = b.dataset.v === 'ambas' ? ['comida', 'cena'] : [b.dataset.v];
    save(); render();
  });
  region.querySelectorAll('#set-new .chip').forEach((b) => b.onclick = () => { state.settings.nuevos = Number(b.dataset.v); save(); render(); });
  $('#export').onclick = exportList;
  $('#undismiss')?.addEventListener('click', () => { state.dismissed = []; save(); render(); toast('Esas ideas pueden volver a salir'); });
}

function openBulk() {
  openSheet(`
    <div class="sheet-head"><h3>Pegar una lista</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <p class="muted small">Un plato por línea. La app adivina el color de cada uno; luego puedes corregirlo tocando el plato.</p>
    <textarea id="bulk-text" placeholder="Lentejas&#10;Tortilla de patatas&#10;Merluza a la plancha&#10;Pollo al horno"></textarea>
    <button type="button" class="btn primary" id="bulk-ok">Añadir todos</button>
  `);
  $('#bulk-ok').onclick = () => {
    const lines = $('#bulk-text').value.split(/\n|,(?![^(]*\))/).map((l) => l.replace(/^[\s\-•*·\d.)]+/, '').trim()).filter(Boolean);
    let added = 0;
    for (const line of lines) {
      // Admite "Plato · Tipo", que es como sale al compartir la lista
      const [name, tipo] = line.split(/\s+[·|]\s+/);
      const forced = tipo && CATEGORIAS.find((c) => norm(c.nombre) === norm(tipo.replace(/^\S+\s/, '')) || norm(c.nombre) === norm(tipo));
      if (state.dishes.some((x) => norm(x.name) === norm(name))) continue;
      addDish(name, forced ? forced.id : guessCat(name), 'ambos');
      added++;
    }
    save();
    closeSheet();
    render();
    toast(added ? `Añadidos ${added} platos. Revisa los colores.` : 'No había platos nuevos');
  };
  setTimeout(() => $('#bulk-text')?.focus(), 250);
}

function openDish(id) {
  const d = state.dishes.find((x) => x.id === id);
  if (!d) return;
  const draw = () => {
    openSheet(`
      <div class="sheet-head"><h3>Editar plato</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <label class="field">Nombre<input type="text" id="ed-name" value="${esc(d.name)}" autocomplete="off"></label>
      <label class="field">Tipo</label>
      <div class="chips" id="ed-cat">${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, d.cat)).join('')}</div>
      <label class="field">Cuándo</label>
      <div class="chips" id="ed-when">${chip('ambos', 'Comida o cena', d.when)}${chip('comida', 'Solo comida', d.when)}${chip('cena', 'Solo cena', d.when)}</div>
      <div class="chips"><button type="button" class="chip" id="ed-fav" aria-pressed="${!!d.fav}">⭐ Favorito (sale más a menudo)</button></div>
      <label class="field">Ingredientes <span class="muted small" style="font-weight:400">para la lista de la compra</span>
        <textarea id="ed-ing" class="short" placeholder="Uno por línea o separados por comas">${esc((d.ingredients || []).join('\n'))}</textarea>
      </label>
      <div class="row">
        <button type="button" class="btn primary grow" id="ed-ok">Guardar</button>
        <button type="button" class="btn danger" id="ed-del">Borrar</button>
      </div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#ed-cat .chip').forEach((b) => b.onclick = () => { d.cat = b.dataset.v; keepName(); draw(); });
    sheet.querySelectorAll('#ed-when .chip').forEach((b) => b.onclick = () => { d.when = b.dataset.v; keepName(); draw(); });
    $('#ed-fav').onclick = () => { d.fav = !d.fav; keepName(); draw(); };
    $('#ed-ok').onclick = () => { keepName(); save(); closeSheet(); render(); };
    $('#ed-del').onclick = () => {
      if (!confirm(`¿Borrar «${d.name}»?`)) return;
      state.dishes = state.dishes.filter((x) => x.id !== d.id);
      save(); closeSheet(); render();
    };
  };
  const keepName = () => {
    const t = $('#ed-ing');
    if (t) { const list = parseList(t.value); if (list.length) d.ingredients = list; else delete d.ingredients; }
    const v = $('#ed-name')?.value.trim();
    if (!v) return;
    const old = d.name;
    d.name = v;
    // Actualiza el menú para que el color y el nombre coincidan
    Object.values(state.plan).forEach((day) => Object.values(day).forEach((p) => { if (p && norm(p.name) === norm(old)) { p.name = d.name; p.cat = d.cat; } }));
  };
  draw();
}

async function exportList() {
  const text = state.dishes
    .slice().sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, 'es'))
    .map((d) => `${d.name} · ${CAT[d.cat].nombre}`).join('\n');
  if (!text) { toast('Todavía no hay platos'); return; }
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Lista copiada. En otro móvil, pégala en «Pegar una lista».');
  } catch (e) {
    if (e && e.name !== 'AbortError') toast('No se ha podido compartir');
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
    <p class="muted">Platos caseros que no están en tu lista. Si te gusta alguno, guárdalo o ponlo directamente en el menú.</p>
    ${i ? `
      <div class="card idea c-${i.cat}">
        <div class="big">${CAT[i.cat].emoji}</div>
        <div class="title">${esc(i.name)}</div>
        <div class="muted small">${esc(CAT[i.cat].nombre)}${i.when ? ` · mejor para ${i.when}` : ''}</div>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn primary" id="i-save">Me gusta, guardar</button>
          <button type="button" class="btn" id="i-week">Ponerlo en el menú</button>
        </div>
        <div class="row" style="justify-content:center">
          <button type="button" class="pill-btn" id="i-next">🎲 Otra idea</button>
          <button type="button" class="pill-btn" id="i-no">No me gusta</button>
        </div>
      </div>` : '<div class="card empty-state"><div class="big">🎉</div><p>Ya has visto todas las ideas que tengo.</p></div>'}
    <h2>Por tipo</h2>
    <div class="chips" id="i-cats">${CATEGORIAS.map((c) => chip(c.id, `${c.emoji} ${c.nombre}`, i?.cat)).join('')}</div>
    ${scarce.length && state.dishes.length ? `<p class="muted small">Tienes pocos platos de: ${scarce.map((c) => c.nombre.toLowerCase()).join(', ')}. Prueba a mirar ideas de esos tipos.</p>` : ''}
  `;
  if (!i) return;
  $('#i-next').onclick = () => { view.idea = shuffle(free.filter((c) => c.name !== i.name))[0] || i; render(); };
  $('#i-no').onclick = () => { state.dismissed.push(i.name); save(); view.idea = null; render(); toast('Vale, no la volveré a sugerir'); };
  $('#i-save').onclick = () => { addDish(i.name, i.cat, i.when || 'ambos'); save(); view.idea = null; render(); toast('Guardado en tus platos'); };
  $('#i-week').onclick = () => putInWeek(i);
  main.querySelectorAll('#i-cats .chip').forEach((b) => b.onclick = () => {
    const opts = free.filter((c) => c.cat === b.dataset.v && c.name !== i.name);
    if (!opts.length) { toast('No me quedan más ideas de ese tipo'); return; }
    view.idea = shuffle(opts)[0];
    render();
  });
}

function putInWeek(i) {
  const days = weekDays(view.week < 0 ? 0 : view.week);
  const today = iso(new Date());
  const meals = state.settings.meals;
  openSheet(`
    <div class="sheet-head"><h3>¿Cuándo?</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <p class="muted small">${esc(i.name)}</p>
    <div class="pick-list">
      ${days.filter((d) => iso(d) >= today).flatMap((d) => meals.filter((m) => fits(i.when, m)).map((m) => {
        const p = state.plan[iso(d)]?.[m];
        return `<button type="button" class="dish ${p ? 'c-' + p.cat : 'c-otros'}" data-key="${iso(d)}" data-meal="${m}">
          <span class="name">${cap(fmtDay.format(d))} · ${COMIDAS[m]}</span><span class="badge">${p ? esc(p.name) : 'libre'}</span></button>`;
      })).join('')}
    </div>
  `);
  $('#sheet').querySelectorAll('.dish').forEach((b) => b.onclick = () => {
    setSlot(b.dataset.key, b.dataset.meal, { name: i.name, cat: i.cat, nuevo: true });
    view.idea = null;
    go('semana');
    toast('Puesto en el menú');
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

render();
Familia.start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
