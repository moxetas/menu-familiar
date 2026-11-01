'use strict';

// ---------- Miembros de la familia, raciones y consumo ----------
//
// Cada miembro: { id, name, sexo: 'h'|'m', edad, peso, altura, actividad: 'baja'|'media'|'alta', racion: 'auto'|número, avatar }
// Con esos datos se calcula cuánto necesita al día (kcal) y su «ración»: cuántas raciones estándar come.
// Una ración estándar es la de las recetas «para 4 personas», pensada para un adulto de unas 2.000 kcal al día.

const RACION_BASE = 2000;
const COMIDA_Y_CENA = 0.6;   // comida y cena suelen ser el 60 % de lo que se come en el día

const ACTIVIDAD = {
  baja: { f: 1.4, label: 'Poca', help: 'Casi todo el día sentado' },
  media: { f: 1.6, label: 'Normal', help: 'Camina a diario o hace algo de ejercicio' },
  alta: { f: 1.85, label: 'Mucha', help: 'Trabajo físico o deporte casi a diario' },
};

// Niños y adolescentes: kcal al día con actividad normal (EFSA, aproximado). [desde la edad, niño, niña]
const NINOS = [[1, 950, 900], [3, 1250, 1150], [5, 1450, 1350], [7, 1700, 1550], [9, 1950, 1800], [11, 2200, 2000], [13, 2550, 2200], [15, 2850, 2300], [17, 3000, 2350]];

function needKcal(m) {
  const edad = +m.edad || 0;
  const hombre = m.sexo !== 'm';
  const act = (ACTIVIDAD[m.actividad] || ACTIVIDAD.media).f;
  if (edad && edad < 18) {
    let row = NINOS[0];
    for (const r of NINOS) if (edad >= r[0]) row = r;
    return Math.round(((hombre ? row[1] : row[2]) * act) / 1.6 / 10) * 10;
  }
  // Adultos: fórmula de Mifflin-St Jeor. Sin peso o altura, se usan valores típicos.
  const peso = +m.peso || (hombre ? 80 : 65);
  const alt = +m.altura || (hombre ? 175 : 162);
  const a = edad || 40;
  const basal = 10 * peso + 6.25 * alt - 5 * a + (hombre ? 5 : -161);
  return Math.round((basal * act) / 10) * 10;
}

function factorOf(m) {
  if (m.racion && m.racion !== 'auto') return +m.racion;
  return Math.min(1.8, Math.max(0.35, Math.round((needKcal(m) / RACION_BASE) * 20) / 20));
}

function avatarOf(m) {
  if (m.avatar) return m.avatar;
  const e = +m.edad;
  const h = m.sexo !== 'm';
  if (e && e < 3) return '👶';
  if (e && e < 13) return h ? '👦' : '👧';
  if (e && e >= 65) return h ? '👴' : '👵';
  return h ? '👨' : '👩';
}

const fmtFactor = (f) => `×${String(Math.round(f * 100) / 100).replace('.', ',')}`;
const fmtInt = (n) => Math.round(n).toLocaleString('es-ES');

// ---------- Quién come cada plato ----------

// Un plato del menú puede llevar: para (ids de los que comen; sin él, comen todos), inv (invitados) y n (personas, si no hay miembros)
function dinersOf(dish) {
  const members = state.members || [];
  if (!members.length) {
    const n = +dish.n || 4;
    return { people: [], extra: n, raciones: n };
  }
  const ids = Array.isArray(dish.para) ? dish.para : members.map((m) => m.id);
  const people = members.filter((m) => ids.includes(m.id)).map((m) => ({ m, f: factorOf(m) }));
  const extra = +dish.inv || 0;
  return { people, extra, raciones: people.reduce((t, x) => t + x.f, 0) + extra };
}

function whoText(dish) {
  const { people, extra, raciones } = dinersOf(dish);
  if (!(state.members || []).length) return `${extra} ${extra === 1 ? 'persona' : 'personas'}`;
  if (!people.length && !extra) return 'Nadie';
  const all = people.length === state.members.length;
  const names = all ? 'Todos' : people.map((x) => x.m.name).join(', ');
  return `${names}${extra ? ` + ${extra} ${extra === 1 ? 'invitado' : 'invitados'}` : ''} · ${fmtNum(raciones)} raciones`;
}

// Selector de quién come: botones con cada miembro y un contador de invitados (o de personas, si no hay miembros)
function whoPicker(dish, prefix) {
  const members = state.members || [];
  if (!members.length) {
    return `<div class="servings"><span>Personas</span>
      <button type="button" class="round" data-${prefix}="less" aria-label="Menos personas">−</button>
      <strong>${+dish.n || 4}</strong>
      <button type="button" class="round" data-${prefix}="more" aria-label="Más personas">+</button></div>`;
  }
  const ids = Array.isArray(dish.para) ? dish.para : members.map((m) => m.id);
  return `<div class="chips">${members.map((m) => `<button type="button" class="chip" data-${prefix}-m="${m.id}" aria-pressed="${ids.includes(m.id)}">${avatarOf(m)} ${esc(m.name)}</button>`).join('')}</div>
    <div class="servings"><span>Invitados</span>
      <button type="button" class="round" data-${prefix}="less" aria-label="Menos invitados">−</button>
      <strong>${+dish.inv || 0}</strong>
      <button type="button" class="round" data-${prefix}="more" aria-label="Más invitados">+</button></div>`;
}

// Conecta los botones de whoPicker. change() se llama tras cada cambio.
function bindWho(root, dish, prefix, change) {
  const members = state.members || [];
  root.querySelectorAll(`[data-${prefix}-m]`).forEach((b) => b.onclick = () => {
    const ids = new Set(Array.isArray(dish.para) ? dish.para : members.map((m) => m.id));
    const id = b.getAttribute(`data-${prefix}-m`);
    if (ids.has(id)) ids.delete(id); else ids.add(id);
    // Si comen todos, se quita la lista: así los miembros nuevos también cuentan
    if (members.every((m) => ids.has(m.id))) delete dish.para; else dish.para = [...ids];
    change();
  });
  root.querySelectorAll(`[data-${prefix}]`).forEach((b) => b.onclick = () => {
    const d = b.getAttribute(`data-${prefix}`) === 'more' ? 1 : -1;
    if (members.length) { const v = Math.max(0, Math.min(30, (+dish.inv || 0) + d)); if (v) dish.inv = v; else delete dish.inv; }
    else dish.n = Math.max(1, Math.min(30, (+dish.n || 4) + d));
    change();
  });
}

// ---------- Calorías que come cada uno ----------

// Lo que lleva una ración estándar de un plato: calorías, nutrientes, sal y marcas
const nutMemo = new Map();
function perRacion(name) {
  const r = recipeFor(name);
  if (!r) return null;
  const k = r.personas || 4;
  const key = `${norm(name)}|${k}|${r.ing.join(';')}|${state.settings?.caldoCasero ? 'casero' : ''}`;
  if (!nutMemo.has(key)) {
    const n = nutrition(r, k);
    nutMemo.set(key, {
      kcal: n.total / k, p: n.p / k, g: n.g / k, h: n.h / k,
      sal: (n.na * 2.5) / 1000 / k, sat: n.satSinAceite / k, satTotal: n.sat / k, grasos: n.grasos,
      salConCaldoCasero: n.gCaldo ? ((n.na - n.naCaldo + n.gCaldo * 0.4) * 2.5) / 1000 / k : null,
      roja: n.roja / k >= 40,
      embutidos: n.embutidos, procesados: n.procesados, purinas: n.purinas, potasio: n.potasio, salados: n.salados,
      // Lo que aporta cada ingrediente a una ración (peso en gramos; la grasa saturada sin contar el aceite de oliva)
      rows: n.rows.filter((r) => r.g != null && r.food).map((r) => ({
        name: cleanName(r.name),
        peso: r.g / k,
        kcal: (r.kcal || 0) / k,
        p: (r.g * r.food.p) / 100 / k,
        g: (r.g * r.food.g) / 100 / k,
        h: (r.g * r.food.h) / 100 / k,
        sal: (r.g * r.food.na * 2.5) / 100000 / k,
        sat: /^aceite/.test(r.food.key) ? 0 : (r.g * r.food.sat) / 100 / k,
      })),
    });
  }
  return nutMemo.get(key);
}

// ---------- Plan de salud de cada miembro ----------
// m.salud = { activo, nombre, sal (g/día), agua (l/día), protMin, protMax (g/día), satBaja, urico, rojaMax (veces/semana), procesados, ieca, nota }

const PLAN_RENAL = { activo: true, nombre: 'Poliquistosis renal', sal: 5, agua: 3, protMin: 65, protMax: 80, satBaja: true, urico: true, rojaMax: 2, procesados: true, ieca: true };
const healthMembers = () => (state.members || []).filter((m) => m.salud?.activo);
const fmt1 = (n) => String(Math.round(n * 10) / 10).replace('.', ',');

// Avisos de un plato para un miembro que come f raciones. lvl: stop (no apto), warn (con moderación), info
function healthNotes(m, name, f) {
  const s = m.salud;
  const t = perRacion(name);
  if (!s?.activo || !t) return [];
  const notes = [];
  if (t.potasio.length) notes.push({ lvl: 'stop', icon: '⛔', short: 'sal de régimen', text: `Lleva ${t.potasio.join(', ')}: es cloruro potásico${s.ieca ? ' y, con su IECA, puede subir el potasio peligrosamente' : ''}. No usar.` });
  const sal = t.sal * f;
  const muchaSal = s.sal && sal > s.sal * 0.3;
  if (muchaSal) {
    const tips = salTips(t, f);
    notes.push({ lvl: 'warn', icon: '🧂', short: `${fmt1(sal)} g sal`, text: `Mucha sal: ${fmt1(sal)} g, de sus ${s.sal} g al día${t.salados.length ? `, sobre todo por ${t.salados.slice(0, 3).join(', ').toLowerCase()}` : ''}.${tips.length ? ` Para bajarla: ${tips.join('; ')}.` : ''}` });
  }
  const sat = t.sat * f;
  if (s.satBaja && sat > 7) {
    const tips = satTips(t);
    notes.push({ lvl: 'warn', icon: '🧈', short: 'grasa saturada', text: `Bastante grasa saturada: ${fmt1(sat)} g sin contar el aceite de oliva${t.grasos.length ? `, sobre todo de ${t.grasos.slice(0, 3).join(', ').toLowerCase()}` : ''}.${tips.length ? ` Para bajarla: ${tips.join('; ')}.` : ''}` });
  }
  if (s.urico && t.purinas.length) notes.push({ lvl: 'warn', icon: '🦐', short: 'purinas', text: `Purinas altas (${t.purinas.slice(0, 3).join(', ').toLowerCase()}): mejor de vez en cuando, por el ácido úrico.` });
  // La proteína depende de cuánto se sirva: se da como consejo de cantidad, no como aviso del plato
  const p = t.p * f;
  const porComida = s.protMax ? Math.round(s.protMax * 0.4) : 0;
  if (porComida && p > porComida * 1.15) {
    const r = porComida / p;
    const parte = r >= 0.6 ? 'algo menos de lo normal' : r >= 0.4 ? 'la mitad' : 'un tercio';
    notes.push({ lvl: 'info', icon: '🍖', short: `${fmtInt(p)} g proteína`, text: `Proteína: ${fmtInt(p)} g en su ración. Para quedarse en ${s.protMin || 0}–${s.protMax} g al día (unos ${porComida} g por comida), que tome ${parte} de la carne, el pescado o el huevo y complete con verdura, ensalada, arroz, pasta o pan.` });
  }
  if ((s.sal || s.satBaja) && t.embutidos.length && !muchaSal) notes.push({ lvl: 'warn', icon: '🥓', short: 'embutido', text: `Lleva embutido o curado (${t.embutidos.slice(0, 3).join(', ').toLowerCase()}): sal y grasa.` });
  if (s.rojaMax != null && t.roja) notes.push({ lvl: 'info', icon: '🥩', short: 'carne roja', text: `Carne roja: cuenta para su máximo de ${s.rojaMax} a la semana.` });
  if (s.procesados && t.procesados.length) notes.push({ lvl: 'info', icon: '🏭', short: 'ultraprocesado', text: `Ultraprocesados: ${t.procesados.slice(0, 3).join(', ').toLowerCase()}. Mejor la versión casera o la que no lleve fosfatos (E-338 a E-452).` });
  return notes;
}

// Lo peor de un plato para los miembros con plan de salud que lo comen: 'stop', 'warn' o ''
function healthLevel(name, dish) {
  let lvl = '';
  const eaters = dish ? dinersOf(dish).people : healthMembers().map((m) => ({ m, f: factorOf(m) }));
  for (const { m, f } of eaters) {
    if (!m.salud?.activo) continue;
    for (const n of healthNotes(m, name, f)) {
      if (n.lvl === 'stop') return 'stop';
      if (n.lvl === 'warn') lvl = 'warn';
    }
  }
  return lvl;
}
const healthIcon = (lvl) => (lvl === 'stop' ? '⛔' : lvl === 'warn' ? '⚠️' : '');

// Los motivos de aviso de un plato, como iconos: «🧂🧈». ⛔ si no es apto.
function healthIcons(name, dish) {
  const eaters = dish ? dinersOf(dish).people : healthMembers().map((m) => ({ m, f: factorOf(m) }));
  const icons = new Set();
  for (const { m, f } of eaters) {
    if (!m.salud?.activo) continue;
    for (const n of healthNotes(m, name, f)) {
      if (n.lvl === 'stop') return '⛔';
      if (n.lvl === 'warn') icons.add(n.icon);
    }
  }
  return [...icons].join('');
}

// Una línea corta por cada miembro con plan de salud: «Para Alberto: 🧂 1,8 g sal · 🥩 carne roja»
function healthLines(name, dish) {
  return dinersOf(dish).people.filter(({ m }) => m.salud?.activo).map(({ m, f }) => {
    const notes = healthNotes(m, name, f);
    const t = perRacion(name);
    const body = notes.length
      ? notes.map((n) => `${n.icon} ${n.short}`).join(' · ')
      : `✅ bien${t ? ` (${fmt1(t.sal * f)} g de sal)` : ''}`;
    return `<p class="health-line"><strong>Para ${esc(m.name)}:</strong> ${body}</p>`;
  }).join('');
}

// Qué cambiar para que un plato lleve menos sal o menos grasa saturada
function salTips(t, f) {
  const n = t.salados.map(norm).join(' | ');
  const tips = [];
  if (/caldo/.test(n)) tips.push(`caldo casero sin sal o agua${t.salConCaldoCasero != null ? ` (se quedaría en ${fmt1(t.salConCaldoCasero * f)} g; si ya lo hacéis así, activadlo en Mis platos → Ajustes)` : ''}`);
  if (/jamon|chorizo|morcilla|panceta|tocino|bacon|lacon|salchicha/.test(n)) tips.push('la mitad de embutido, o nada');
  if (/queso|parmesano|quesito/.test(n)) tips.push('menos queso, o queso fresco');
  if (/bacalao/.test(n)) tips.push('desalar bien el bacalao (48 h cambiando el agua)');
  if (/garbanzo|lenteja|atun|maiz/.test(n)) tips.push('enjuagar las conservas o usar legumbre seca');
  if (/anchoa|aceituna|caviar|soja|mostaza|tinta/.test(n)) tips.push('usarlo solo como detalle');
  if (/tomate frito/.test(n)) tips.push('tomate triturado natural en vez de tomate frito');
  if (/\bpan\b|pan de|pan rallado/.test(n)) tips.push('pan sin sal');
  return tips;
}
function satTips(t) {
  const n = t.grasos.map(norm).join(' | ');
  const tips = [];
  if (/nata/.test(n)) tips.push('nata ligera o leche evaporada');
  if (/mantequilla|bechamel/.test(n)) tips.push('aceite de oliva en vez de mantequilla');
  if (/pollo|muslo|alita|gallina/.test(n)) tips.push('quitar la piel del pollo');
  if (/queso|parmesano|mozzarella|quesito/.test(n)) tips.push('menos queso');
  if (/chorizo|morcilla|panceta|tocino|bacon|jamon|lacon|salchicha/.test(n)) tips.push('menos embutido');
  if (/carne picada/.test(n)) tips.push('carne picada magra, o mitad de pavo');
  if (/secreto|costilla|carriller/.test(n)) tips.push('un corte más magro, como lomo o solomillo');
  if (/coco/.test(n)) tips.push('leche de coco ligera');
  if (/masa/.test(n)) tips.push('masa casera con aceite de oliva');
  return tips;
}

// El menú automático evita lo que no conviene a quien tiene plan de salud
function healthPenalty(name, ctx) {
  const hm = healthMembers();
  if (!hm.length) return 0;
  const t = perRacion(name);
  if (!t) return 0;
  let pen = 0;
  for (const m of hm) {
    const s = m.salud;
    const f = factorOf(m);
    if (t.potasio.length) pen += 50;
    if (s.sal && t.sal * f > s.sal * 0.3) pen += 2;
    if (s.urico && t.purinas.length) pen += 1;
    if (s.satBaja && t.sat * f > 7) pen += 1;
    if (s.rojaMax != null && t.roja && (ctx?.roja || 0) >= s.rojaMax) pen += 8;
  }
  return pen;
}

// ---------- Agua ----------
const todayKey = () => iso(new Date());
const aguaDe = (m, key = todayKey()) => +(state.agua?.[key]?.[m.id] || 0);
function addAgua(m, ml) {
  const key = todayKey();
  state.agua ||= {};
  state.agua[key] ||= {};
  const v = Math.max(0, aguaDe(m, key) + ml);
  if (v) state.agua[key][m.id] = v; else delete state.agua[key][m.id];
  save();
}

function consumo(from, to) {
  const res = Object.fromEntries((state.members || []).map((m) => [m.id, { kcal: 0, p: 0, g: 0, h: 0, sal: 0, sat: 0, roja: 0, purinas: 0, days: new Set(), dishes: new Map() }]));
  const sinReceta = new Set();
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = iso(d);
    const day = state.plan[key];
    if (!day) continue;
    for (const meal of Object.keys(day)) {
      for (const dish of dishesOf(day[meal])) {
        const pr = perRacion(dish.name);
        if (!pr) { sinReceta.add(dish.name); continue; }
        for (const { m, f } of dinersOf(dish).people) {
          const r = res[m.id];
          r.kcal += pr.kcal * f; r.p += pr.p * f; r.g += pr.g * f; r.h += pr.h * f;
          r.sal += pr.sal * f; r.sat += pr.sat * f;
          if (pr.roja) r.roja++;
          if (pr.purinas.length) r.purinas++;
          r.days.add(key);
          // Desglose por plato: cuántas veces, en qué comidas y cuántas raciones en total
          const dk = norm(dish.name);
          const e = r.dishes.get(dk) || { name: dish.name, cat: dish.cat, veces: 0, raciones: 0, comidas: new Set(), kcal: 0, p: 0, g: 0, h: 0, sal: 0, sat: 0 };
          e.veces++; e.raciones += f; e.comidas.add(meal);
          for (const n of ['kcal', 'p', 'g', 'h', 'sal', 'sat']) e[n] += pr[n] * f;
          r.dishes.set(dk, e);
        }
      }
    }
  }
  return { res, sinReceta: [...sinReceta] };
}

const PERIODOS = { dia: 'Día', semana: 'Semana', mes: 'Mes', ano: 'Año' };
const fmtMonth = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
const fmtLong = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

function periodRange(kind, off) {
  const t = new Date(); t.setHours(12, 0, 0, 0);
  if (kind === 'dia') {
    const d = new Date(t); d.setDate(d.getDate() + off);
    const label = off === 0 ? 'Hoy' : off === -1 ? 'Ayer' : off === 1 ? 'Mañana' : cap(fmtLong.format(d));
    return { from: d, to: new Date(d), label, days: 1 };
  }
  if (kind === 'semana') {
    const from = monday(off); const to = new Date(from); to.setDate(to.getDate() + 6);
    const label = off === 0 ? 'Esta semana' : off === -1 ? 'La semana pasada' : off === 1 ? 'La semana que viene' : `Semana del ${fmtShort.format(from)}`;
    return { from, to, label, days: 7 };
  }
  if (kind === 'mes') {
    const from = new Date(t.getFullYear(), t.getMonth() + off, 1, 12);
    const to = new Date(t.getFullYear(), t.getMonth() + off + 1, 0, 12);
    return { from, to, label: cap(fmtMonth.format(from)), days: to.getDate() };
  }
  const y = t.getFullYear() + off;
  const from = new Date(y, 0, 1, 12); const to = new Date(y, 11, 31, 12);
  return { from, to, label: String(y), days: Math.round((to - from) / 864e5) + 1 };
}

// ---------- Pestaña Familia ----------

const famView = { periodo: 'semana', off: 0, open: null, nut: 'kcal', dish: null };

// Nutrientes del desglose: [nombre, cómo se escribe el valor]
const fmtG = (v) => `${v >= 10 ? fmtInt(v) : fmt1(v)} g`;
const NUTRIENTES = {
  kcal: ['Calorías', (v) => `${fmtInt(v)} kcal`],
  p: ['Proteína', fmtG],
  g: ['Grasas', fmtG],
  h: ['Hidratos', fmtG],
  sal: ['Sal', (v) => `${v < 0.1 && v > 0 ? '<0,1' : fmt1(v)} g`],
  sat: ['Grasa saturada', fmtG],
};

// De dónde sale cada nutriente: por plato y, al tocar uno, por ingrediente
function breakdown(m, r, range) {
  const nut = famView.nut;
  const [label, fmt] = NUTRIENTES[nut];
  const dishes = [...r.dishes.entries()].sort((a, b) => b[1][nut] - a[1][nut]);
  const total = r[nut];
  const max = Math.max(...dishes.map(([, e]) => e[nut]), 0.0001);
  const one = range.days === 1;
  const where = (e) => one ? [...e.comidas].map((c) => COMIDAS[c] || c).join(' y ') : `${e.veces} ${e.veces === 1 ? 'vez' : 'veces'}`;
  return `<div class="breakdown">
    <div class="chips" data-nut-row>${Object.entries(NUTRIENTES).map(([k, [l]]) => chip(k, l, nut)).join('')}</div>
    <p class="small"><strong>${fmt(total)}</strong> de ${label.toLowerCase()} ${one ? 'este día' : 'en total'}, en ${r.dishes.size} ${r.dishes.size === 1 ? 'plato' : 'platos'}.${nut === 'sal' ? ' Sin contar la sal que se añada al cocinar.' : ''}${nut === 'sat' ? ' Sin contar el aceite de oliva.' : ''}</p>
    <div class="bd-list">${dishes.map(([dk, e]) => {
      const pct = total ? Math.round((e[nut] / total) * 100) : 0;
      const open = famView.dish === dk;
      return `<div class="bd-item ${open ? 'open' : ''}">
        <button type="button" class="bd-row" data-bd-dish="${esc(dk)}" aria-expanded="${open}">
          <span class="bd-name"><span class="dot c-${e.cat}"></span>${esc(e.name)} <span class="muted">· ${esc(where(e))}</span></span>
          <span class="bd-val">${fmt(e[nut])} <span class="muted">${pct} %</span></span>
          <span class="bd-bar"><span style="width:${Math.max(2, (e[nut] / max) * 100)}%"></span></span>
        </button>
        ${open ? ingredientBreakdown(e, nut, fmt) : ''}
      </div>`;
    }).join('')}</div>
    <p class="muted small">Toca un plato para ver qué ingredientes lo aportan y cuánto ha comido de cada uno.</p>
  </div>`;
}

function ingredientBreakdown(e, nut, fmt) {
  const pr = perRacion(e.name);
  if (!pr) return '';
  const rows = pr.rows.map((x) => ({ ...x, v: x[nut] * e.raciones, peso: x.peso * e.raciones }))
    .filter((x) => x.v > 0.0001 || nut === 'kcal')
    .sort((a, b) => b.v - a.v);
  const total = rows.reduce((t, x) => t + x.v, 0);
  return `<table class="bd-ing">
    <thead><tr><th>Ingrediente</th><th>Comido</th><th>${esc(NUTRIENTES[nut][0])}</th></tr></thead>
    <tbody>${rows.map((x) => `<tr>
      <td>${esc(x.name)}</td>
      <td>${x.peso >= 1000 ? `${fmt1(x.peso / 1000)} kg` : `${fmtInt(x.peso)} g`}</td>
      <td>${fmt(x.v)} <span class="muted">${total ? Math.round((x.v / total) * 100) : 0} %</span></td>
    </tr>`).join('') || '<tr><td colspan="3" class="muted">No lleva.</td></tr>'}</tbody>
  </table>
  <p class="muted small">${fmt1(e.raciones)} ${e.raciones === 1 ? 'ración' : 'raciones'} en total${e.veces > 1 ? `, en ${e.veces} veces` : ''}.</p>`;
}

function renderFamily(main) {
  const members = state.members || [];
  const range = periodRange(famView.periodo, famView.off);
  const { res, sinReceta } = members.length ? consumo(range.from, range.to) : { res: {}, sinReceta: [] };

  main.innerHTML = `
    <h2>¿Quién come en casa?</h2>
    ${members.length ? `<div class="members">${members.map((m) => `
      <button type="button" class="member" data-member="${m.id}">
        <span class="avatar" aria-hidden="true">${avatarOf(m)}</span>
        <span class="member-text">
          <strong>${esc(m.name)}</strong>
          <span class="muted small">${[m.edad ? `${m.edad} años` : '', `≈ ${fmtInt(needKcal(m))} kcal al día`].filter(Boolean).join(' · ')}</span>
          ${m.salud?.activo ? `<span class="health-tag">🩺 ${esc(m.salud.nombre || 'Plan de salud')}</span>` : ''}
        </span>
        <span class="member-factor"><strong>${fmtFactor(factorOf(m))}</strong><span>ración</span></span>
      </button>`).join('')}</div>`
    : `<div class="card"><p>Añade a cada persona de casa con su edad, peso, altura y actividad. Así las recetas se ajustan a lo que come cada uno y podrás ver cuánto come cada persona.</p></div>`}
    <button type="button" class="btn" id="add-member">➕ Añadir a alguien</button>
    ${healthMembers().filter((m) => m.salud.agua).map((m) => {
      const ml = aguaDe(m);
      const goal = m.salud.agua * 1000;
      return `<div class="card water">
        <p><strong>💧 Agua de ${esc(m.name)} hoy</strong></p>
        <div class="hero"><strong>${fmt1(ml / 1000)} l</strong><span>de ${fmt1(m.salud.agua)} l</span></div>
        <div class="meter" role="img" aria-label="${Math.round((ml / goal) * 100)} % del agua de hoy"><span style="width:${Math.min(100, (ml / goal) * 100)}%"></span></div>
        <div class="row">
          <button type="button" class="btn small grow" data-agua="${m.id}" data-ml="250">+ Vaso (250 ml)</button>
          <button type="button" class="btn small grow" data-agua="${m.id}" data-ml="500">+ Botella (500 ml)</button>
          <button type="button" class="btn small" data-agua="${m.id}" data-ml="-250" aria-label="Quitar un vaso">−</button>
        </div>
      </div>`;
    }).join('')}
    ${healthMembers().some((m) => m.salud.ieca) ? `<div class="notice danger-note"><p class="small"><strong>⛔ Nunca sal de régimen ni «sal dietética»</strong> (Diätsalz, sal baja en sodio, sustitutos de sal): son cloruro potásico y, con ${esc(healthMembers().filter((m) => m.salud.ieca).map((m) => m.name).join(' y '))} tomando un IECA, pueden subir el potasio peligrosamente.</p></div>` : ''}

    ${members.length ? `
      <h2>¿Cuánto come cada uno?</h2>
      <div class="chips" id="per-kind">${Object.entries(PERIODOS).map(([k, l]) => chip(k, l, famView.periodo)).join('')}</div>
      <div class="week-nav">
        <button type="button" class="round" id="per-prev" aria-label="Anterior">‹</button>
        <strong style="text-align:center">${esc(range.label)}</strong>
        <button type="button" class="round" id="per-next" aria-label="Siguiente">›</button>
      </div>
      <div class="intake">${members.map((m) => intakeCard(m, res[m.id], range)).join('')}</div>
      <p class="muted small">Cuenta la comida y la cena del menú, con la ración de cada uno. No incluye desayunos ni meriendas, por eso lo recomendado es el 60 % de lo que necesita al día.${sinReceta.length ? ` Sin receta no se pueden contar: ${esc(sinReceta.slice(0, 6).join(', '))}${sinReceta.length > 6 ? '…' : ''}.` : ''}</p>
    ` : ''}

    <h2>Compartir entre móviles</h2>
    ${Familia.card()}
  `;

  main.querySelectorAll('[data-member]').forEach((b) => b.onclick = () => openMember(b.dataset.member));
  main.querySelectorAll('[data-agua]').forEach((b) => b.onclick = () => {
    const m = state.members.find((x) => x.id === b.dataset.agua);
    if (m) { addAgua(m, +b.dataset.ml); render(); }
  });
  $('#add-member').onclick = () => openMember(null);
  main.querySelectorAll('#per-kind .chip').forEach((b) => b.onclick = () => { famView.periodo = b.dataset.v; famView.off = 0; render(); });
  $('#per-prev')?.addEventListener('click', () => { famView.off--; render(); });
  $('#per-next')?.addEventListener('click', () => { famView.off++; render(); });
  main.querySelectorAll('[data-desglose]').forEach((b) => b.onclick = () => {
    famView.open = famView.open === b.dataset.desglose ? null : b.dataset.desglose;
    famView.dish = null;
    render();
  });
  main.querySelectorAll('[data-nut-row] .chip').forEach((b) => b.onclick = () => { famView.nut = b.dataset.v; render(); });
  main.querySelectorAll('[data-bd-dish]').forEach((b) => b.onclick = () => {
    famView.dish = famView.dish === b.dataset.bdDish ? null : b.dataset.bdDish;
    render();
  });
  Familia.bind(main);
}

// Explica las calorías de comida y cena frente a lo que necesita en todo el día
function kcalText(m, avg, one) {
  const need = needKcal(m);
  const rec = need * COMIDA_Y_CENA;
  const resto = need - rec;
  const pre = one ? '' : 'De media al día: ';
  const base = `le tocan unas <strong>${fmtInt(rec)} kcal</strong> entre comida y cena, que son el 60 % de sus ${fmtInt(need)} kcal de todo el día; el resto, unas ${fmtInt(resto)}, es para desayuno y merienda.`;
  if (avg > rec * 1.05) return `${pre}<strong>se pasa en unas ${fmtInt(avg - rec)} kcal</strong>: ${base} Con un desayuno y una merienda normales, el día acabaría en unas ${fmtInt(avg + resto)} kcal.`;
  if (avg < rec * 0.85) return `${pre}<strong>le faltan unas ${fmtInt(rec - avg)} kcal</strong>: ${base} Puede servirse algo más o tomar un desayuno o una merienda más completos.`;
  return `${pre}<strong>va bien</strong>: ${base}`;
}

function intakeCard(m, r, range) {
  const daysWith = r.days.size;
  const avg = daysWith ? r.kcal / daysWith : 0;
  const rec = needKcal(m) * COMIDA_Y_CENA;
  const pct = daysWith ? Math.round((avg / rec) * 100) : 0;
  const one = range.days === 1;
  return `<div class="intake-card">
    <div class="intake-head"><span class="avatar small" aria-hidden="true">${avatarOf(m)}</span><strong>${esc(m.name)}</strong></div>
    ${daysWith ? `
      <div class="hero"><strong>${fmtInt(r.kcal)}</strong><span>kcal en comida y cena${one ? '' : ', en total'}</span></div>
      ${one ? '' : `<p class="small">Media de <strong>${fmtInt(avg)} kcal</strong> al día, en ${daysWith} ${daysWith === 1 ? 'día' : 'días'} con menú</p>`}
      <div class="meter" role="img" aria-label="${pct} % de lo que le toca para comida y cena">
        <span style="width:${Math.min(100, pct)}%"></span>
      </div>
      <p class="small">${kcalText(m, avg, one)}</p>
      <div class="macros small-macros">
        <div><strong>${fmtInt(r.p / daysWith)} g</strong><span>proteínas</span></div>
        <div><strong>${fmtInt(r.g / daysWith)} g</strong><span>grasas</span></div>
        <div><strong>${fmtInt(r.h / daysWith)} g</strong><span>hidratos</span></div>
      </div>
      <p class="muted small" style="text-align:center">${one ? 'en este día' : 'media por día'}</p>
      ${m.salud?.activo ? healthIntake(m, r, range, daysWith) : ''}
      <button type="button" class="btn small" data-desglose="${m.id}" aria-expanded="${famView.open === m.id}">${famView.open === m.id ? 'Ocultar el desglose' : '📊 Ver de dónde sale'}</button>
      ${famView.open === m.id ? breakdown(m, r, range) : ''}`
    : '<p class="muted small">No hay comidas suyas en el menú de estas fechas.</p>'}
  </div>`;
}

function healthIntake(m, r, range, daysWith) {
  const s = m.salud;
  const sal = r.sal / daysWith;
  const prot = r.p / daysWith;
  const weeks = range.days / 7;
  const row = (icon, label, value, extra) => `<div class="hrow"><span>${icon}</span><span>${label}</span><strong>${value}</strong>${extra ? `<span class="muted small hextra">${extra}</span>` : ''}</div>`;
  return `<div class="health-intake">
    <p class="small"><strong>🩺 Su plan${s.nombre ? `: ${esc(s.nombre)}` : ''}</strong> <span class="muted">(media por día en comida y cena)</span></p>
    ${s.sal ? row('🧂', 'Sal', `${fmt1(sal)} g`, `máximo ${s.sal} g en todo el día · sin contar la que se añada al cocinar`) : ''}
    ${s.sal ? `<div class="meter" role="img" aria-label="${Math.round((sal / s.sal) * 100)} % de su máximo de sal"><span style="width:${Math.min(100, (sal / s.sal) * 100)}%"></span></div>` : ''}
    ${s.protMax ? row('🍖', 'Proteína', `${fmtInt(prot)} g`, `objetivo ${s.protMin || 0}–${s.protMax} g en todo el día; el desayuno y la merienda suelen sumar 15–20 g`) : ''}
    ${s.satBaja ? row('🧈', 'Grasa saturada', `${fmt1(r.sat / daysWith)} g`, 'cuanto menos, mejor para el colesterol') : ''}
    ${s.rojaMax != null ? row('🥩', 'Carne roja', `${r.roja} ${r.roja === 1 ? 'vez' : 'veces'}`, range.days >= 7 ? `máximo ${s.rojaMax} a la semana${weeks > 1 ? ` (${fmt1(r.roja / weeks)} por semana)` : ''}` : `máximo ${s.rojaMax} a la semana`) : ''}
    ${s.urico ? row('🦐', 'Platos con purinas altas', `${r.purinas}`, 'con moderación por el ácido úrico') : ''}
  </div>`;
}

// ---------- Ficha de cada miembro ----------

function openMember(id) {
  const old = (state.members || []).find((m) => m.id === id);
  const m = old ? { ...old } : { id: uid(), name: '', sexo: 'h', actividad: 'media', racion: 'auto' };
  // Cada botón guarda primero lo escrito en los campos (keep) y luego cambia lo suyo y redibuja
  const draw = () => {
    openSheet(`
      <div class="sheet-head"><h3>${old ? esc(old.name) : 'Nueva persona'}</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <label class="field">Nombre<input type="text" id="mb-name" value="${esc(m.name || '')}" placeholder="Ej.: Ana" autocomplete="off"></label>
      <div class="chips" id="mb-sexo">${chip('h', 'Hombre / niño', m.sexo)}${chip('m', 'Mujer / niña', m.sexo)}</div>
      <div class="row">
        <label class="field grow">Edad<input type="number" id="mb-edad" value="${m.edad || ''}" min="0" max="110" inputmode="numeric" placeholder="años"></label>
        <label class="field grow">Peso<input type="number" id="mb-peso" value="${m.peso || ''}" min="2" max="250" inputmode="decimal" placeholder="kg"></label>
        <label class="field grow">Altura<input type="number" id="mb-alt" value="${m.altura || ''}" min="40" max="230" inputmode="numeric" placeholder="cm"></label>
      </div>
      <label class="field">Actividad física</label>
      <div class="chips" id="mb-act">${Object.entries(ACTIVIDAD).map(([k, a]) => chip(k, a.label, m.actividad || 'media')).join('')}</div>
      <p class="muted small">${esc((ACTIVIDAD[m.actividad] || ACTIVIDAD.media).help)}.</p>
      <div class="notice" id="mb-sum">${summary()}</div>
      <label class="field">Ración</label>
      <div class="chips" id="mb-rac">${[['auto', `Automática (${autoFactor()})`], ['0.5', '½'], ['0.75', '¾'], ['1', '1'], ['1.25', '1¼'], ['1.5', '1½'], ['2', '2']].map(([v, l]) => chip(v, l, String(m.racion || 'auto'))).join('')}</div>
      <label class="field">Dibujo</label>
      <div class="chips" id="mb-av">${chip('', 'Automático', m.avatar || '')}${['👨', '👩', '👦', '👧', '🧒', '👶', '👴', '👵', '🧑'].map((a) => chip(a, a, m.avatar || '')).join('')}</div>
      <label class="field">🩺 Salud</label>
      <div class="chips"><button type="button" class="chip" id="mb-salud" aria-pressed="${!!m.salud?.activo}">Tiene indicaciones de su médico</button></div>
      ${m.salud?.activo ? `
        <button type="button" class="btn small" id="mb-renal">Rellenar con el plan de poliquistosis renal</button>
        <label class="field">Enfermedad o plan<input type="text" id="sl-nombre" value="${esc(m.salud.nombre || '')}" placeholder="Ej.: Poliquistosis renal"></label>
        <div class="row">
          <label class="field grow">Sal máx. (g/día)<input type="number" id="sl-sal" value="${m.salud.sal ?? ''}" min="0" max="15" step="0.5" inputmode="decimal"></label>
          <label class="field grow">Agua (l/día)<input type="number" id="sl-agua" value="${m.salud.agua ?? ''}" min="0" max="6" step="0.5" inputmode="decimal"></label>
        </div>
        <div class="row">
          <label class="field grow">Proteína mín. (g/día)<input type="number" id="sl-pmin" value="${m.salud.protMin ?? ''}" min="0" max="250" inputmode="numeric"></label>
          <label class="field grow">Proteína máx. (g/día)<input type="number" id="sl-pmax" value="${m.salud.protMax ?? ''}" min="0" max="250" inputmode="numeric"></label>
        </div>
        <label class="field">Carne roja, máximo de veces a la semana<input type="number" id="sl-roja" value="${m.salud.rojaMax ?? ''}" min="0" max="14" inputmode="numeric" placeholder="Sin límite"></label>
        <div class="chips" id="sl-flags">
          <button type="button" class="chip" data-flag="satBaja" aria-pressed="${!!m.salud.satBaja}">🧈 Poca grasa saturada (colesterol)</button>
          <button type="button" class="chip" data-flag="urico" aria-pressed="${!!m.salud.urico}">🦐 Pocas purinas (ácido úrico)</button>
          <button type="button" class="chip" data-flag="procesados" aria-pressed="${!!m.salud.procesados}">🏭 Pocos ultraprocesados</button>
          <button type="button" class="chip" data-flag="ieca" aria-pressed="${!!m.salud.ieca}">💊 Toma IECA o ARA-II</button>
        </div>
        ${m.salud.ieca ? '<p class="small danger-text">⛔ Con IECA o ARA-II, nunca sal de régimen ni sustitutos de sal: son cloruro potásico. La app avisará si aparecen.</p>' : ''}
        <label class="field">Notas<input type="text" id="sl-nota" value="${esc(m.salud.nota || '')}" placeholder="Ej.: medicación, revisiones…"></label>
        <p class="muted small">Estos límites son los de su médico. La app solo los usa para avisar y para ayudar a planificar.</p>` : ''}
      <div class="row">
        <button type="button" class="btn primary grow" id="mb-ok">Guardar</button>
        ${old ? '<button type="button" class="btn danger" id="mb-del">Quitar</button>' : ''}
      </div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#mb-sexo .chip').forEach((b) => b.onclick = () => { keep(); m.sexo = b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-act .chip').forEach((b) => b.onclick = () => { keep(); m.actividad = b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-rac .chip').forEach((b) => b.onclick = () => { keep(); m.racion = b.dataset.v === 'auto' ? 'auto' : +b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-av .chip').forEach((b) => b.onclick = () => { keep(); if (b.dataset.v) m.avatar = b.dataset.v; else delete m.avatar; draw(); });
    $('#mb-salud').onclick = () => { keep(); if (m.salud?.activo) m.salud = { ...m.salud, activo: false }; else m.salud = { ...(m.salud || {}), activo: true }; draw(); };
    $('#mb-renal')?.addEventListener('click', () => { keep(); m.salud = { ...PLAN_RENAL, nota: m.salud?.nota || '' }; draw(); toast('Plan de poliquistosis renal puesto. Revisa que coincide con lo de su médico.'); });
    sheet.querySelectorAll('#sl-flags .chip').forEach((b) => b.onclick = () => { keep(); m.salud[b.dataset.flag] = !m.salud[b.dataset.flag]; draw(); });
    // Al escribir no se redibuja la hoja (se perdería el siguiente toque): solo se actualiza el cálculo
    ['#mb-edad', '#mb-peso', '#mb-alt'].forEach((s) => { $(s).oninput = () => {
      keep();
      $('#mb-sum').innerHTML = summary();
      const auto = $('#mb-rac .chip[data-v="auto"]');
      if (auto) auto.textContent = `Automática (${autoFactor()})`;
    }; });
    $('#mb-ok').onclick = () => {
      keep();
      if (!m.name) { toast('Ponle un nombre'); return; }
      state.members ||= [];
      const i = state.members.findIndex((x) => x.id === m.id);
      if (i >= 0) state.members[i] = m; else state.members.push(m);
      save(); closeSheet(); render();
      toast(old ? 'Guardado' : `${m.name} añadido a la familia`);
    };
    $('#mb-del')?.addEventListener('click', () => {
      if (!confirm(`¿Quitar a ${old.name}? Los menús ya hechos se quedan como están.`)) return;
      state.members = state.members.filter((x) => x.id !== m.id);
      save(); closeSheet(); render();
    });
  };
  function autoFactor() { return fmtFactor(Math.min(1.8, Math.max(0.35, Math.round((needKcal(m) / RACION_BASE) * 20) / 20))); }
  function summary() {
    const f = factorOf(m);
    const cmp = Math.abs(f - 1) < 0.05 ? 'lo mismo' : f > 1 ? 'algo más' : 'algo menos';
    return `<p>Necesita unas <strong>${fmtInt(needKcal(m))} kcal al día</strong>. Come <strong>${fmtFactor(f)}</strong> ración${m.racion && m.racion !== 'auto' ? ' (puesta a mano)' : ''}: ${cmp} que la ración estándar de las recetas.</p>`;
  }
  // Guarda lo escrito en los campos antes de redibujar
  function keep() {
    const v = (s) => $(s)?.value;
    if ($('#mb-name')) m.name = v('#mb-name').trim();
    const num = (s, key) => { const x = parseFloat(String(v(s) || '').replace(',', '.')); if (x > 0) m[key] = x; else delete m[key]; };
    if ($('#mb-edad')) { num('#mb-edad', 'edad'); num('#mb-peso', 'peso'); num('#mb-alt', 'altura'); }
    if ($('#sl-sal') && m.salud) {
      const n = (s) => { const x = parseFloat(String(v(s) || '').replace(',', '.')); return Number.isFinite(x) && x >= 0 ? x : null; };
      const set = (key, val) => { if (val == null) delete m.salud[key]; else m.salud[key] = val; };
      set('sal', n('#sl-sal')); set('agua', n('#sl-agua')); set('protMin', n('#sl-pmin')); set('protMax', n('#sl-pmax')); set('rojaMax', n('#sl-roja'));
      m.salud.nombre = v('#sl-nombre').trim();
      m.salud.nota = v('#sl-nota').trim();
    }
  }
  draw();
}
