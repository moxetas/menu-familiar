'use strict';

// Guía de primeros pasos (sale sola la primera vez) y «Añadir desde foto, captura o PDF»:
// la app copia unas instrucciones, la persona adjunta el documento en su app de IA
// (ChatGPT, Claude, Gemini…) y pega aquí la respuesta. La app no envía nada a ningún sitio.

const GUIA_VISTA = 'menu-familiar-guia-vista';

const PROMPT_IA = `Lee el documento adjunto (carta del colegio, cita médica, captura de pantalla, foto de una receta, lista de la compra, menú…) y devuélveme SOLO un bloque de código JSON, sin explicaciones, con esta forma:

{"citas":[{"titulo":"Revisión del pediatra","fecha":"2027-01-15","hora":"10:30","lugar":"Centro de salud","tipo":"medica"}],"compra":["Leche","Huevos"],"platos":["Lentejas estofadas"]}

Reglas:
- "citas": citas, reuniones, tutorías, actos del colegio… "tipo": medica, reunion, colegio u otra. "fecha": AAAA-MM-DD. "hora": HH:MM (vacía si no hay).
- "compra": productos o ingredientes que haya que comprar.
- "platos": nombres de platos o recetas.
- Deja en [] lo que no aparezca.
- No incluyas datos personales (DNI, teléfonos, números de historia clínica…).`;

function abrirGuia() {
  try { localStorage.setItem(GUIA_VISTA, '1'); } catch (e) { /* da igual */ }
  const pasos = [
    ['📖 Tus platos', 'En «Mis platos» escribe los que soléis comer (o pega una lista entera). La app adivina el tipo y les pone color. ¿Sin ideas? Prueba con los ejemplos.'],
    ['📅 La semana en un toque', 'En «Semana» toca «Hacer el menú»: monta comidas y cenas variando pescado, carne, legumbres… Toca cualquier plato para cambiarlo.'],
    ['🛒 La compra sola', 'Desde la semana, «Pasar a la lista de la compra» saca los ingredientes. En «Compra» tachas lo que coges; si compartís, lo veis todos.'],
    ['📌 Citas con aviso', 'Médico, colegio, reuniones… Te avisamos una semana antes y el día de antes.'],
    ['📷 Desde foto o PDF', 'Una carta del cole, una cita, una receta o una lista: con «Desde foto o PDF» se la pasas a tu app de IA y pegas aquí lo que te diga.'],
    ['👨‍👩‍👧 Compartir con la familia', 'En «Familia» crea un código y pásalo: platos, menú, compra y citas iguales en todos los móviles, cifrados.'],
  ];
  openSheet(`
    <div class="sheet-head"><h3>Cómo funciona</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <p class="muted small">Tus datos se guardan solo en tu móvil. Nada de registros.</p>
    <ol class="guia-pasos">${pasos.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join('')}</ol>
    <div class="stack">
      ${state.dishes.length ? '' : '<button type="button" class="btn primary" id="g-ejemplos">Empezar con platos de ejemplo</button>'}
      <button type="button" class="btn" id="g-foto">📷 Añadir desde foto o PDF</button>
      <a class="btn" href="guia.pdf" download="Guia-Menu-familiar.pdf">📄 Descargar esta guía en PDF</a>
      <button type="button" class="btn" data-close>Entendido</button>
    </div>`);
  $('#g-ejemplos')?.addEventListener('click', () => { loadExamples(); closeSheet(); go('platos'); });
  $('#g-foto').onclick = () => { closeSheet(); setTimeout(abrirImportar, 250); };
}

// ---------- Leer lo que se pega ----------

function fechaISO(s) {
  let m = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/.exec(s);
  if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return '';
}

function leerPegado(texto) {
  const out = { citas: [], compra: [], platos: [] };
  const limpio = (s, n = 80) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, n) : '');
  let json;
  const bloque = /```(?:json)?\s*([\s\S]*?)```/i.exec(texto);
  for (const c of [bloque && bloque[1], texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1)]) {
    if (!c) continue;
    try { json = JSON.parse(c); break; } catch (e) { /* siguiente */ }
  }
  if (json && typeof json === 'object') {
    for (const c of Array.isArray(json.citas) ? json.citas : []) {
      const fecha = fechaISO(String(c && c.fecha || ''));
      if (!c || !limpio(c.titulo) || !fecha) continue;
      const hora = /^\d{1,2}:\d{2}$/.test(String(c.hora || '')) ? String(c.hora).padStart(5, '0') : '';
      out.citas.push({ titulo: limpio(c.titulo), fecha, hora, lugar: limpio(c.lugar), tipo: ['medica', 'reunion', 'colegio', 'otra'].includes(c.tipo) ? c.tipo : 'otra' });
    }
    for (const n of Array.isArray(json.compra) ? json.compra : []) if (limpio(n, 60)) out.compra.push(limpio(n, 60));
    for (const n of Array.isArray(json.platos) ? json.platos : []) if (limpio(n, 60)) out.platos.push(limpio(n, 60));
    if (out.citas.length + out.compra.length + out.platos.length) return out;
  }
  // Texto suelto: si hay fecha, una cita; si no, cada línea corta es algo para comprar.
  const lineas = texto.split(/\r?\n/).map((l) => l.replace(/^[-•*·\d.)\s]+/, '').trim()).filter(Boolean);
  const fecha = fechaISO(texto);
  if (fecha) {
    const hora = (/\b(\d{1,2})[:.h](\d{2})\b/.exec(texto) || []).slice(1, 3);
    out.citas.push({ titulo: limpio(lineas.find((l) => /[a-záéíóúñ]{3,}/i.test(l)) || 'Cita'), fecha, hora: hora.length === 2 ? `${hora[0].padStart(2, '0')}:${hora[1]}` : '', lugar: '', tipo: 'otra' });
  } else {
    for (const l of lineas) if (l.length <= 40) out.compra.push(limpio(l, 60));
  }
  return out;
}

// ---------- Ventanas ----------

function abrirImportar() {
  openSheet(`
    <div class="sheet-head"><h3>📷 Añadir desde foto o PDF</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <ol class="guia-pasos">
      <li><strong>Copia las instrucciones</strong><button type="button" class="btn small" id="imp-copiar">Copiar instrucciones</button></li>
      <li><strong>Abre tu app de IA</strong><span>ChatGPT, Claude, Gemini… (la versión gratis vale). Adjunta la foto, la captura o el PDF y pega las instrucciones.</span></li>
      <li><strong>Pega aquí su respuesta</strong><span>También vale el texto de un correo, o el de una foto (en iPhone, mantén el dedo sobre el texto y «Copiar»).</span></li>
    </ol>
    <textarea id="imp-texto" rows="6" placeholder="Pega aquí…"></textarea>
    <p class="muted small">La app no envía nada: la foto solo la ve la IA que tú elijas, con tu cuenta.</p>
    <button type="button" class="btn primary" id="imp-leer">Leer</button>`);
  $('#imp-copiar').onclick = async () => {
    try { await navigator.clipboard.writeText(PROMPT_IA); toast('Instrucciones copiadas'); } catch (e) { $('#imp-texto').value = PROMPT_IA; toast('Cópialas del cuadro'); }
  };
  $('#imp-leer').onclick = () => {
    const r = leerPegado($('#imp-texto').value || '');
    if (!r.citas.length && !r.compra.length && !r.platos.length) { toast('No he encontrado nada. ¿Has pegado la respuesta entera?'); return; }
    revisarImportado(r);
  };
}

function revisarImportado(r) {
  const fila = (k, i, html) => `<li class="imp-fila"><input type="checkbox" checked data-k="${k}" data-i="${i}" aria-label="Añadir">${html}</li>`;
  openSheet(`
    <div class="sheet-head"><h3>Revisa lo encontrado</h3><button type="button" class="close" data-close aria-label="Cerrar">✕</button></div>
    <p class="muted small">Corrige lo que haga falta y desmarca lo que no quieras añadir.</p>
    ${r.citas.length ? `<p><strong>📌 Citas</strong></p><ul class="imp-lista">${r.citas.map((c, i) => fila('citas', i, `<div class="stack grow">
      <input type="text" data-c="${i}" data-f="titulo" value="${esc(c.titulo)}">
      <div class="row"><input type="date" data-c="${i}" data-f="fecha" value="${c.fecha}"><input type="time" data-c="${i}" data-f="hora" value="${c.hora}"></div>
      ${c.lugar ? `<span class="muted small">${esc(c.lugar)}</span>` : ''}</div>`)).join('')}</ul>` : ''}
    ${r.compra.length ? `<p><strong>🛒 A la lista de la compra</strong></p><ul class="imp-lista">${r.compra.map((n, i) => fila('compra', i, `<input type="text" class="grow" data-n="compra-${i}" value="${esc(n)}">`)).join('')}</ul>` : ''}
    ${r.platos.length ? `<p><strong>📖 A Mis platos</strong></p><ul class="imp-lista">${r.platos.map((n, i) => fila('platos', i, `<input type="text" class="grow" data-n="platos-${i}" value="${esc(n)}">`)).join('')}</ul>` : ''}
    <button type="button" class="btn primary" id="imp-ok">Añadir</button>`);
  $('#imp-ok').onclick = () => {
    const sheet = $('#sheet');
    const marcado = (k, i) => sheet.querySelector(`input[data-k="${k}"][data-i="${i}"]`).checked;
    let n = 0;
    r.citas.forEach((c, i) => {
      if (!marcado('citas', i)) return;
      const val = (f) => sheet.querySelector(`[data-c="${i}"][data-f="${f}"]`).value.trim();
      const cita = { id: uid(), titulo: val('titulo') || c.titulo, tipo: c.tipo, fecha: val('fecha') || c.fecha, lugar: c.lugar, para: '', notas: '', avisos: { semana: true, dia: true }, zona: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid' };
      if (val('hora')) cita.hora = val('hora');
      state.citas ||= [];
      state.citas.push(cita);
      n++;
    });
    r.compra.forEach((_, i) => { if (marcado('compra', i)) { const v = sheet.querySelector(`[data-n="compra-${i}"]`).value.trim(); if (v) { addItem(v); n++; } } });
    r.platos.forEach((_, i) => { if (marcado('platos', i)) { const v = sheet.querySelector(`[data-n="platos-${i}"]`).value.trim(); if (v) { addDish(v, guessCat(v)); n++; } } });
    if (!n) { toast('No has marcado nada'); return; }
    save(); closeSheet(); render();
    toast(`Añadido: ${n}`);
  };
}

// Botones de ayuda en Citas, Compra y Familia
function botonesAyuda(main, tab) {
  if (!['citas', 'compra', 'familia'].includes(tab) || main.querySelector('.ayuda-fila')) return;
  const fila = document.createElement('div');
  fila.className = 'row ayuda-fila';
  fila.innerHTML = `<button type="button" class="btn small grow" data-ayuda="foto">📷 Desde foto o PDF</button>${tab === 'familia' ? '<button type="button" class="btn small grow" data-ayuda="guia">❓ Cómo funciona</button>' : ''}`;
  main.prepend(fila);
  fila.querySelector('[data-ayuda="foto"]').onclick = abrirImportar;
  fila.querySelector('[data-ayuda="guia"]')?.addEventListener('click', abrirGuia);
}

// La primera vez (sin platos y sin haber visto la guía), la guía.
function guiaPrimeraVez() {
  let vista = false;
  try { vista = !!localStorage.getItem(GUIA_VISTA); } catch (e) { /* da igual */ }
  if (!vista && !state.dishes.length) setTimeout(abrirGuia, 500);
}
