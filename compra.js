'use strict';

// ---------- Lista de la compra ----------
// Cada cosa de la lista: { id, name, sec (sección del súper), done (ya en el carro), from: [platos para los que hace falta] }
// Se comparte con la familia igual que los platos y el menú.

const SEC = Object.fromEntries(SECCIONES.map((s) => [s.id, s]));
let ingrIndex = null;

// Ingredientes conocidos de un plato del catálogo de ideas
function catalogIngredients(name) {
  ingrIndex ||= Object.fromEntries(Object.entries(INGREDIENTES).map(([k, v]) => [norm(k), v]));
  const v = ingrIndex[norm(name)];
  return v ? v.split(/\s*,\s*/).map(cap) : null;
}

// Los ingredientes que ha apuntado la familia y, si no hay, los del catálogo
function ingredientsFor(name) {
  const d = state.dishes.find((x) => norm(x.name) === norm(name));
  if (d?.recipe?.ing?.length) return recipeShoppingNames(d.recipe);
  if (d?.ingredients?.length) return d.ingredients;
  return catalogIngredients(name) || [];
}

// "leche, pan" o una cosa por línea
function parseList(text) {
  return String(text).split(/\n|,(?![^(]*\))/)
    .map((l) => l.replace(/^[\s\-•*·]+/, '').trim())
    .filter(Boolean)
    .map(cap);
}

function guessSection(name) {
  const n = norm(name);
  for (const [sec, words] of PALABRAS_COMPRA) if (words.some((w) => n.includes(norm(w)))) return sec;
  return 'otros';
}

function addItem(name, from) {
  const key = norm(name);
  let it = state.shopping.find((x) => norm(x.name) === key);
  if (it) {
    if (it.done) { it.done = false; delete it.from; }
  } else {
    it = { id: uid(), name: cap(name.trim()), sec: guessSection(name), done: false };
    state.shopping.push(it);
  }
  if (from) {
    it.from = it.from || [];
    if (!it.from.includes(from)) it.from.push(from);
  }
  return it;
}

const byName = (a, b) => a.name.localeCompare(b.name, 'es');

function renderShopping(main, actions, same) {
  const pending = state.shopping.filter((i) => !i.done);
  const done = state.shopping.filter((i) => i.done).sort(byName);
  if (pending.length) actions.innerHTML = '<button type="button" class="pill-btn" id="share-list">Compartir</button>';
  $('#share-list')?.addEventListener('click', shareList);

  // El campo de arriba solo se dibuja al entrar en la pestaña, para no borrar lo que se escribe
  if (!same || !$('#shop-add')) {
    main.innerHTML = `
      <form class="card" id="shop-add">
        <label class="field">Añadir a la lista
          <input type="text" id="shop-name" placeholder="Ej.: leche, pan, tomates" autocomplete="off" enterkeyhint="done">
        </label>
        <div class="row">
          <button type="submit" class="btn primary grow">Añadir</button>
          <button type="button" class="btn grow" id="from-menu">🍽️ Sacar del menú</button>
        </div>
      </form>
      <div class="region" id="shop-list"></div>`;
    $('#shop-add').onsubmit = (e) => {
      e.preventDefault();
      const names = parseList($('#shop-name').value);
      if (!names.length) return;
      names.forEach((n) => addItem(n));
      save();
      $('#shop-name').value = '';
      render();
      $('#shop-name').focus();
      toast(names.length === 1 ? `${SEC[guessSection(names[0])].emoji} Apuntado` : `Apuntadas ${names.length} cosas`);
    };
    $('#from-menu').onclick = () => openFromMenu(view.week);
  }

  const groups = SECCIONES
    .map((s) => ({ s, items: pending.filter((i) => (SEC[i.sec] ? i.sec : 'otros') === s.id).sort(byName) }))
    .filter((g) => g.items.length);
  const list = $('#shop-list');
  list.innerHTML = `
    ${!state.shopping.length ? `
      <div class="card empty-state">
        <div class="big">🛒</div>
        <p><strong>La lista está vacía</strong></p>
        <p class="muted">Escribe lo que haga falta, o saca los ingredientes de los platos del menú.</p>
      </div>` : ''}
    ${pending.length ? `<p class="muted small">${pending.length} por comprar. Toca una cosa para tacharla.</p>` : (done.length ? '<p class="muted small">¡Todo comprado! 🎉</p>' : '')}
    ${groups.map((g) => `
      <section class="group">
        <div class="group-head">${g.s.emoji} ${esc(g.s.nombre)} <span class="count">${g.items.length}</span></div>
        ${g.items.map(itemRow).join('')}
      </section>`).join('')}
    ${done.length ? `
      <section class="group">
        <div class="group-head">✅ En el carro <span class="count">${done.length}</span></div>
        ${done.map(itemRow).join('')}
        <button type="button" class="btn small" id="clear-done">Quitar lo comprado de la lista</button>
      </section>` : ''}
  `;

  list.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = () => {
    const it = state.shopping.find((x) => x.id === b.dataset.toggle);
    if (!it) return;
    it.done = !it.done;
    save();
    render();
  });
  list.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => openItem(b.dataset.edit));
  $('#clear-done')?.addEventListener('click', () => {
    state.shopping = state.shopping.filter((i) => !i.done);
    save();
    render();
    toast('Lista limpia');
  });
}

function itemRow(i) {
  return `<div class="item ${i.done ? 'done' : ''}">
    <button type="button" class="item-main" data-toggle="${i.id}" aria-pressed="${!!i.done}">
      <span class="tick" aria-hidden="true">${i.done ? '✓' : ''}</span>
      <span class="item-text">
        <span class="item-name">${esc(i.name)}</span>
        ${i.from?.length && !i.done ? `<span class="item-from">para ${esc(i.from.join(', '))}</span>` : ''}
      </span>
    </button>
    <button type="button" class="item-edit" data-edit="${i.id}" aria-label="Cambiar ${esc(i.name)}">⋯</button>
  </div>`;
}

function openItem(id) {
  const it = state.shopping.find((x) => x.id === id);
  if (!it) return;
  let sec = SEC[it.sec] ? it.sec : 'otros';
  const draw = () => {
    const name = $('#it-name')?.value ?? it.name;
    openSheet(`
      <div class="sheet-head"><h3>Cambiar</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <label class="field">Nombre<input type="text" id="it-name" value="${esc(name)}" autocomplete="off" placeholder="Ej.: 2 kg de naranjas"></label>
      <label class="field">Sección del súper</label>
      <div class="chips" id="it-sec">${SECCIONES.map((s) => chip(s.id, `${s.emoji} ${s.nombre}`, sec)).join('')}</div>
      <div class="row">
        <button type="button" class="btn primary grow" id="it-ok">Guardar</button>
        <button type="button" class="btn danger" id="it-del">Borrar</button>
      </div>
    `);
    $('#sheet').querySelectorAll('#it-sec .chip').forEach((b) => b.onclick = () => { sec = b.dataset.v; draw(); });
    $('#it-ok').onclick = () => {
      const v = $('#it-name').value.trim();
      if (v) it.name = cap(v);
      it.sec = sec;
      save(); closeSheet(); render();
    };
    $('#it-del').onclick = () => {
      state.shopping = state.shopping.filter((x) => x.id !== it.id);
      save(); closeSheet(); render();
    };
  };
  draw();
}

// Saca los ingredientes de los platos del menú
function openFromMenu(week) {
  let wk = week > 0 ? week : 0;
  const off = new Set();    // ingredientes desmarcados porque ya los hay en casa
  const draw = () => {
    const today = iso(new Date());
    const days = weekDays(wk).filter((d) => wk > 0 || iso(d) >= today);
    const dishes = [];
    const seen = new Map();
    for (const d of days) {
      for (const m of state.settings.meals) {
        const p = state.plan[iso(d)]?.[m];
        if (!p) continue;
        const k = norm(p.name);
        if (seen.has(k)) seen.get(k).n++;
        else { const e = { name: p.name, cat: p.cat, n: 1 }; seen.set(k, e); dishes.push(e); }
      }
    }
    const have = new Set(state.shopping.filter((i) => !i.done).map((i) => norm(i.name)));
    const chosen = new Map();
    const body = dishes.map((e) => {
      const ing = ingredientsFor(e.name);
      const mine = state.dishes.find((x) => norm(x.name) === norm(e.name));
      const title = `<div class="from-title"><span class="dot"></span>${esc(e.name)}${e.n > 1 ? ` <span class="muted">×${e.n}</span>` : ''}</div>`;
      if (!ing.length) {
        return `<div class="from-dish c-${e.cat}">${title}
          ${mine
            ? `<p class="muted small">Todavía no tiene ingredientes. Apúntalos una vez y servirán para siempre:</p>
               <form class="row" data-ingr-form="${mine.id}">
                 <input type="text" class="grow" placeholder="Ej.: lentejas, chorizo, zanahoria" autocomplete="off">
                 <button type="submit" class="btn small">Guardar</button>
               </form>`
            : '<p class="muted small">Guarda este plato en «Mis platos» para poder apuntar sus ingredientes.</p>'}
        </div>`;
      }
      return `<div class="from-dish c-${e.cat}">${title}
        <div class="chips">${ing.map((x) => {
          const k = norm(x);
          if (have.has(k)) return `<span class="chip have">✓ ${esc(x)}</span>`;
          const on = !off.has(k);
          if (on) {
            if (!chosen.has(k)) chosen.set(k, { name: x, from: [] });
            chosen.get(k).from.push(e.name);
          }
          return `<button type="button" class="chip" data-ing="${esc(k)}" aria-pressed="${on}">${esc(x)}</button>`;
        }).join('')}</div>
      </div>`;
    }).join('');

    const weeks = [0, 1];
    if (wk > 1) weeks.push(wk);
    const label = (w) => (w === 0 ? 'Lo que queda de esta semana' : w === 1 ? 'La semana que viene' : `Semana del ${fmtShort.format(weekDays(w)[0])}`);

    openSheet(`
      <div class="sheet-head"><h3>Sacar del menú</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
      <div class="chips" id="fm-week">${weeks.map((w) => chip(String(w), label(w), String(wk))).join('')}</div>
      ${dishes.length
        ? `<p class="muted small">Quita lo que ya tengáis en casa tocándolo. Lo que tiene ✓ ya está en la lista.</p>${body}`
        : '<p class="muted">No hay platos en el menú para esos días. Haz el menú en la pestaña Semana.</p>'}
      <button type="button" class="btn primary" id="fm-ok" ${chosen.size ? '' : 'disabled'}>${chosen.size ? `Añadir ${chosen.size} ${chosen.size === 1 ? 'cosa' : 'cosas'} a la lista` : 'Nada que añadir'}</button>
    `);
    const sheet = $('#sheet');
    sheet.querySelectorAll('#fm-week .chip').forEach((b) => b.onclick = () => { wk = Number(b.dataset.v); draw(); });
    sheet.querySelectorAll('[data-ing]').forEach((b) => b.onclick = () => {
      const k = b.dataset.ing;
      if (off.has(k)) off.delete(k); else off.add(k);
      draw();
    });
    sheet.querySelectorAll('[data-ingr-form]').forEach((f) => f.onsubmit = (e) => {
      e.preventDefault();
      const d = state.dishes.find((x) => x.id === f.dataset.ingrForm);
      const list = parseList(f.querySelector('input').value);
      if (!d || !list.length) return;
      d.ingredients = list;
      save();
      draw();
    });
    $('#fm-ok').onclick = () => {
      for (const { name, from } of chosen.values()) from.forEach((f) => addItem(name, f));
      save();
      closeSheet();
      go('compra');
      toast(`Añadidas ${chosen.size} cosas a la lista`);
    };
  };
  draw();
}

async function shareList() {
  const pending = state.shopping.filter((i) => !i.done);
  const lines = ['🛒 Lista de la compra'];
  for (const s of SECCIONES) {
    const items = pending.filter((i) => (SEC[i.sec] ? i.sec : 'otros') === s.id).sort(byName);
    if (!items.length) continue;
    lines.push('', `${s.emoji} ${s.nombre}`, ...items.map((i) => `• ${i.name}`));
  }
  const text = lines.join('\n');
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    toast('Lista copiada. Ya puedes pegarla en WhatsApp.');
  } catch (e) {
    if (e && e.name !== 'AbortError') toast('No se ha podido compartir');
  }
}
