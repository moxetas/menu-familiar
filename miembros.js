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

const nutMemo = new Map();
function perRacion(name) {
  const r = recipeFor(name);
  if (!r) return null;
  const k = r.personas || 4;
  const key = `${norm(name)}|${k}|${r.ing.join(';')}`;
  if (!nutMemo.has(key)) {
    const n = nutrition(r, k);
    nutMemo.set(key, { kcal: n.total / k, p: n.p / k, g: n.g / k, h: n.h / k });
  }
  return nutMemo.get(key);
}

function consumo(from, to) {
  const res = Object.fromEntries((state.members || []).map((m) => [m.id, { kcal: 0, p: 0, g: 0, h: 0, days: new Set() }]));
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
          r.days.add(key);
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

const famView = { periodo: 'semana', off: 0 };

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
        </span>
        <span class="member-factor"><strong>${fmtFactor(factorOf(m))}</strong><span>ración</span></span>
      </button>`).join('')}</div>`
    : `<div class="card"><p>Añade a cada persona de casa con su edad, peso, altura y actividad. Así las recetas se ajustan a lo que come cada uno y podrás ver cuánto come cada persona.</p></div>`}
    <button type="button" class="btn" id="add-member">➕ Añadir a alguien</button>

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
  $('#add-member').onclick = () => openMember(null);
  main.querySelectorAll('#per-kind .chip').forEach((b) => b.onclick = () => { famView.periodo = b.dataset.v; famView.off = 0; render(); });
  $('#per-prev')?.addEventListener('click', () => { famView.off--; render(); });
  $('#per-next')?.addEventListener('click', () => { famView.off++; render(); });
  Familia.bind(main);
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
      <div class="hero"><strong>${fmtInt(r.kcal)}</strong><span>kcal ${one ? 'este día' : 'en total'}</span></div>
      ${one ? '' : `<p class="small">Media de <strong>${fmtInt(avg)} kcal</strong> al día, en ${daysWith} ${daysWith === 1 ? 'día' : 'días'} con menú</p>`}
      <div class="meter" role="img" aria-label="${pct} % de lo recomendado para comida y cena">
        <span style="width:${Math.min(100, pct)}%"></span>
      </div>
      <p class="muted small">${pct} % de lo recomendado para comida y cena (≈ ${fmtInt(rec)} kcal al día)</p>
      <div class="macros small-macros">
        <div><strong>${fmtInt(r.p / daysWith)} g</strong><span>proteínas</span></div>
        <div><strong>${fmtInt(r.g / daysWith)} g</strong><span>grasas</span></div>
        <div><strong>${fmtInt(r.h / daysWith)} g</strong><span>hidratos</span></div>
      </div>
      <p class="muted small" style="text-align:center">${one ? 'en este día' : 'media por día'}</p>`
    : '<p class="muted small">No hay comidas suyas en el menú de estas fechas.</p>'}
  </div>`;
}

// ---------- Ficha de cada miembro ----------

function openMember(id) {
  const old = (state.members || []).find((m) => m.id === id);
  const m = old ? { ...old } : { id: uid(), name: '', sexo: 'h', actividad: 'media', racion: 'auto' };
  const draw = () => {
    keep();
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
      <div class="row">
        <button type="button" class="btn primary grow" id="mb-ok">Guardar</button>
        ${old ? '<button type="button" class="btn danger" id="mb-del">Quitar</button>' : ''}
      </div>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#mb-sexo .chip').forEach((b) => b.onclick = () => { m.sexo = b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-act .chip').forEach((b) => b.onclick = () => { m.actividad = b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-rac .chip').forEach((b) => b.onclick = () => { m.racion = b.dataset.v === 'auto' ? 'auto' : +b.dataset.v; draw(); });
    sheet.querySelectorAll('#mb-av .chip').forEach((b) => b.onclick = () => { if (b.dataset.v) m.avatar = b.dataset.v; else delete m.avatar; draw(); });
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
  }
  draw();
}
