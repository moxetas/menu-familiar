'use strict';

// ---------- Dibujos cuquis de los platos ----------
// Cada dibujo es un SVG de 100×100 con cara sonriente. Se elige por palabras del nombre del plato
// y, si no encaja ninguna, por el tipo de plato.

const LINEA = '#4a3428';

function cara(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="-11" cy="4.5" rx="3.6" ry="2.2" fill="#ff8fa3" opacity=".75"/>
    <ellipse cx="11" cy="4.5" rx="3.6" ry="2.2" fill="#ff8fa3" opacity=".75"/>
    <circle cx="-6.5" cy="0" r="2.7" fill="${LINEA}"/><circle cx="6.5" cy="0" r="2.7" fill="${LINEA}"/>
    <circle cx="-5.6" cy="-1" r="1" fill="#fff"/><circle cx="7.4" cy="-1" r="1" fill="#fff"/>
    <path d="M-3 4.2 Q0 7.2 3 4.2" stroke="${LINEA}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  </g>`;
}

// Silueta: dibuja las formas primero en grueso y oscuro y luego encima con su color, para que quede solo el contorno de fuera
function silueta(formas, color) {
  return `<g fill="${LINEA}" stroke="${LINEA}" stroke-width="5" stroke-linejoin="round">${formas}</g><g fill="${color}">${formas}</g>`;
}

const S = `stroke="${LINEA}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

const DIBUJOS = {
  pez: () => `
    <path d="M68 50 L90 34 Q85 50 90 66 Z" fill="#5aa8e0" ${S}/>
    <path d="M38 30 Q48 16 60 31" fill="#5aa8e0" ${S}/>
    <ellipse cx="44" cy="51" rx="30" ry="21" fill="#86cdf5" ${S}/>
    <path d="M50 60 q7 5 12 -1" fill="none" ${S}/>
    ${cara(33, 50)}`,

  gamba: () => `
    <path d="M24 44 Q10 30 16 14 M30 40 Q26 24 36 14" fill="none" ${S}/>
    <g transform="rotate(-15 50 50)">
      <path d="M72 50 L90 37 L87 50 L90 63 Z" fill="#ff8a65" ${S}/>
      <rect x="14" y="34" width="62" height="32" rx="16" fill="#ffa07a" ${S}/>
      <path d="M50 37 q-4 13 0 26 M60 37 q-4 13 0 26 M69 39 q-3 11 0 22" fill="none" stroke="#e8805a" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    ${cara(31, 55, 0.95)}`,

  pulpo: () => `
    ${silueta(`<path d="M24 58 Q22 18 50 18 Q78 18 76 58 Z"/>
      <circle cx="29" cy="62" r="8"/><circle cx="43" cy="65" r="8"/><circle cx="57" cy="65" r="8"/><circle cx="71" cy="62" r="8"/>`, '#f6a5c8')}
    <circle cx="36" cy="28" r="3" fill="#fbd0e2"/><circle cx="62" cy="26" r="2.2" fill="#fbd0e2"/>
    ${cara(50, 42)}`,

  filete: () => `
    <path d="M12 50 C10 32 33 21 54 23 C77 25 91 40 87 59 C83 77 58 83 37 79 C21 76 13 65 12 50 Z" fill="#f6d5c8" ${S}/>
    <path d="M21 51 C20 37 37 30 54 31 C72 32 81 44 78 58 C75 70 56 74 40 71 C28 68 22 61 21 51 Z" fill="#e8836f"/>
    <path d="M52 39 q10 2 16 10 M30 62 q6 4 12 3" fill="none" stroke="#f6b3a3" stroke-width="3" stroke-linecap="round"/>
    <circle cx="33" cy="44" r="7" fill="#fff6e6" ${S}/>
    ${cara(55, 57)}`,

  hamburguesa: () => `
    <rect x="18" y="66" width="64" height="14" rx="7" fill="#f6b962" ${S}/>
    <rect x="16" y="55" width="68" height="13" rx="6.5" fill="#8a5a3b" ${S}/>
    <path d="M18 56 L82 56 L76 63 L62 57 L48 64 L34 57 L22 62 Z" fill="#ffd35c" ${S}/>
    <path d="M14 53 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="${LINEA}" stroke-width="8" stroke-linecap="round"/>
    <path d="M14 53 q6 -6 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="#7fd36e" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M17 50 Q17 22 50 22 Q83 22 83 50 Z" fill="#f6b962" ${S}/>
    <ellipse cx="36" cy="30" rx="2.2" ry="1.3" fill="#fff6e0"/><ellipse cx="52" cy="27" rx="2.2" ry="1.3" fill="#fff6e0"/><ellipse cx="66" cy="32" rx="2.2" ry="1.3" fill="#fff6e0"/>
    ${cara(50, 40, 0.9)}`,

  muslo: () => `
    <g transform="rotate(-35 50 50)">
      <rect x="60" y="45" width="24" height="10" rx="4" fill="#fff6e6" ${S}/>
      <circle cx="86" cy="44" r="6" fill="#fff6e6" ${S}/><circle cx="86" cy="56" r="6" fill="#fff6e6" ${S}/>
      <rect x="60" y="46.5" width="24" height="7" fill="#fff6e6"/>
      <ellipse cx="40" cy="50" rx="26" ry="21" fill="#f2a95e" ${S}/>
      <path d="M26 40 q8 -6 18 -4" fill="none" stroke="#ffd29a" stroke-width="4" stroke-linecap="round"/>
    </g>
    ${cara(36, 58)}`,

  brocoli: () => `
    <rect x="41" y="52" width="18" height="30" rx="8" fill="#bfe8a6" ${S}/>
    ${silueta(`<circle cx="32" cy="42" r="15"/><circle cx="50" cy="30" r="16"/><circle cx="68" cy="42" r="15"/><circle cx="40" cy="52" r="13"/><circle cx="60" cy="52" r="13"/>`, '#6cc35e')}
    <circle cx="44" cy="26" r="3" fill="#8fd77f"/><circle cx="27" cy="38" r="2.5" fill="#8fd77f"/><circle cx="70" cy="37" r="2.5" fill="#8fd77f"/>
    ${cara(50, 44)}`,

  ensalada: () => `
    ${silueta(`<circle cx="32" cy="48" r="11"/><circle cx="46" cy="40" r="12"/><circle cx="62" cy="42" r="12"/><circle cx="72" cy="50" r="9"/>`, '#7fd36e')}
    <circle cx="54" cy="46" r="7" fill="#ff6b5e" ${S}/>
    <circle cx="38" cy="47" r="5" fill="#ffd35c" ${S}/>
    <path d="M16 52 Q16 84 50 84 Q84 84 84 52 Z" fill="#fff8ee" ${S}/>
    ${cara(50, 68)}`,

  sopa: () => `
    <path d="M38 34 q-5 -6 0 -12 t0 -12 M50 32 q-5 -6 0 -12 t0 -12 M62 34 q-5 -6 0 -12 t0 -12" fill="none" stroke="#c9b8aa" stroke-width="3" stroke-linecap="round"/>
    <path d="M16 50 Q16 84 50 84 Q84 84 84 50 Z" fill="#fff8ee" ${S}/>
    <ellipse cx="50" cy="50" rx="34" ry="7" fill="#ffb86b" ${S}/>
    <circle cx="40" cy="49" r="2" fill="#7fd36e"/><circle cx="58" cy="51" r="2" fill="#7fd36e"/>
    ${cara(50, 67)}`,

  olla: () => `
    <path d="M36 30 q-5 -6 0 -11 t0 -10 M64 30 q-5 -6 0 -11 t0 -10" fill="none" stroke="#c9b8aa" stroke-width="3" stroke-linecap="round"/>
    <rect x="10" y="48" width="12" height="8" rx="4" fill="#d9674e" ${S}/><rect x="78" y="48" width="12" height="8" rx="4" fill="#d9674e" ${S}/>
    <rect x="18" y="40" width="64" height="42" rx="12" fill="#f08a6c" ${S}/>
    <rect x="16" y="36" width="68" height="9" rx="4.5" fill="#d9674e" ${S}/>
    <rect x="44" y="28" width="12" height="8" rx="4" fill="#d9674e" ${S}/>
    ${cara(50, 62)}`,

  paella: () => `
    <ellipse cx="12" cy="58" rx="7" ry="4" fill="#3f3f46" ${S}/><ellipse cx="88" cy="58" rx="7" ry="4" fill="#3f3f46" ${S}/>
    <ellipse cx="50" cy="58" rx="38" ry="20" fill="#3f3f46" ${S}/>
    <ellipse cx="50" cy="56" rx="33" ry="15.5" fill="#ffd35c"/>
    <path d="M26 52 q4 -6 10 -2" fill="none" stroke="#ff8a65" stroke-width="5" stroke-linecap="round"/>
    <path d="M64 50 q4 -6 10 -2" fill="none" stroke="#ff8a65" stroke-width="5" stroke-linecap="round"/>
    <path d="M70 62 l10 2 l-6 6 Z" fill="#fff07a" ${S}/>
    <circle cx="32" cy="64" r="2.4" fill="#6cc35e"/><circle cx="62" cy="66" r="2.4" fill="#6cc35e"/><circle cx="40" cy="48" r="2.4" fill="#e8604c"/>
    ${cara(50, 57, 0.9)}`,

  pasta: () => `
    <path d="M26 50 C26 30 40 34 42 44 C44 30 58 28 58 44 C60 32 76 34 74 50" fill="none" stroke="${LINEA}" stroke-width="10" stroke-linecap="round"/>
    <path d="M26 50 C26 30 40 34 42 44 C44 30 58 28 58 44 C60 32 76 34 74 50" fill="none" stroke="#ffd35c" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="40" r="8" fill="#e8604c" ${S}/>
    <path d="M58 30 q8 -6 12 0 q-6 6 -12 0 Z" fill="#6cc35e" ${S}/>
    <path d="M16 52 Q16 84 50 84 Q84 84 84 52 Z" fill="#eaf4ff" ${S}/>
    ${cara(50, 68)}`,

  huevo: () => `
    <path d="M22 50 C14 30 34 16 50 22 C64 12 88 24 82 44 C92 60 74 82 54 76 C38 88 14 74 22 50 Z" fill="#ffffff" ${S}/>
    <circle cx="50" cy="49" r="17" fill="#ffc23d" ${S}/>
    <circle cx="44" cy="42" r="3.5" fill="#ffe08a"/>
    ${cara(50, 51, 0.85)}`,

  tortilla: () => `
    <path d="M14 52 L14 62 Q14 80 50 80 Q86 80 86 62 L86 52 Z" fill="#e3a83f" ${S}/>
    <ellipse cx="50" cy="52" rx="36" ry="18" fill="#f7c95c" ${S}/>
    <circle cx="34" cy="48" r="3" fill="#e9b04a"/><circle cx="64" cy="46" r="2.5" fill="#e9b04a"/><circle cx="58" cy="58" r="2" fill="#e9b04a"/>
    ${cara(50, 52)}`,

  pizza: () => `
    <path d="M18 26 Q50 14 82 26 L52 86 Q50 90 48 86 Z" fill="#ffd35c" ${S}/>
    <path d="M18 26 Q50 14 82 26 L78 34 Q50 24 22 34 Z" fill="#e8a35a" ${S}/>
    <circle cx="38" cy="44" r="6" fill="#e8604c" ${S}/><circle cx="62" cy="44" r="5" fill="#e8604c" ${S}/><circle cx="51" cy="68" r="4.5" fill="#e8604c" ${S}/>
    ${cara(50, 54, 0.85)}`,

  sandwich: () => `
    <path d="M14 72 L50 20 L86 72 Z" fill="#f7d9a0" ${S}/>
    <path d="M14 72 L86 72 L84 80 L16 80 Z" fill="#f4a3a8" ${S}/>
    <path d="M12 72 q6 -5 12 0 t12 0 t12 0 t12 0 t12 0 t12 0" fill="none" stroke="#7fd36e" stroke-width="4" stroke-linecap="round"/>
    ${cara(50, 54)}`,

  fajita: () => `
    <path d="M24 50 q6 -10 12 -2 q6 -12 14 -2 q8 -10 14 2 q6 -6 10 4" fill="none" stroke="${LINEA}" stroke-width="9" stroke-linecap="round"/>
    <path d="M24 50 q6 -10 12 -2 q6 -12 14 -2 q8 -10 14 2 q6 -6 10 4" fill="none" stroke="#7fd36e" stroke-width="5" stroke-linecap="round"/>
    <circle cx="42" cy="46" r="4" fill="#e8604c" ${S}/><circle cx="60" cy="47" r="3.5" fill="#ffd35c" ${S}/>
    <path d="M14 76 Q50 18 86 76 Z" fill="#f7d38a" ${S}/>
    ${cara(50, 62)}`,

  empanada: () => `
    <path d="M12 70 Q50 12 88 70 Z" fill="#f2b866" ${S}/>
    <path d="M18 66 q4 -8 8 -6 q2 -9 8 -8 q3 -9 9 -8 q5 -8 10 0 q6 -1 9 8 q6 -1 8 8 q5 -1 7 8" fill="none" stroke="#d9963f" stroke-width="3" stroke-linecap="round"/>
    ${cara(50, 58)}`,

  plato: () => `
    <ellipse cx="50" cy="72" rx="40" ry="10" fill="#ffffff" ${S}/>
    <path d="M18 70 Q18 30 50 30 Q82 30 82 70 Z" fill="#d6e2ee" ${S}/>
    <circle cx="50" cy="26" r="5" fill="#d6e2ee" ${S}/>
    <path d="M30 48 q4 -8 12 -10" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".8"/>
    ${cara(50, 56)}`,
};

// Palabras del nombre → dibujo. Se miran en orden.
const DIBUJO_POR_PALABRA = [
  ['pizza', ['pizza']],
  ['hamburguesa', ['hamburguesa']],
  ['sandwich', ['sandwich', 'tosta', 'bocadillo', 'montadito']],
  ['fajita', ['fajita', 'burrito', 'taco', 'wrap', 'quesadilla']],
  ['paella', ['paella', 'arroz', 'fideua', 'risotto']],
  ['pasta', ['pasta', 'macarr', 'espagueti', 'spaghetti', 'lasana', 'canelon', 'noqui', 'tallarin', 'fideo', 'cuscus']],
  ['gamba', ['gamba', 'langostino', 'marisco', 'mejill', 'almeja', 'zarzuela', 'cigala']],
  ['pulpo', ['pulpo', 'calamar', 'sepia', 'chipir', 'chopito']],
  ['tortilla', ['tortilla']],
  ['huevo', ['huevo', 'revuelto', 'frittata', 'shakshuka']],
  ['sopa', ['crema', 'sopa', 'pure', 'gazpacho', 'salmorejo', 'vichyssoise', 'caldo']],
  ['muslo', ['pollo', 'pavo', 'alita', 'muslo', 'pechuga']],
  ['ensalada', ['ensalada', 'hummus']],
  ['olla', ['lenteja', 'garbanzo', 'alubia', 'fabada', 'cocido', 'potaje', 'estofado', 'guiso', 'marmitako', 'judion', 'carrillada', 'ragu', 'callos', 'riojana']],
  ['empanada', ['empanada', 'croqueta', 'quiche', 'crepe', 'hojaldre']],
  ['filete', ['carne', 'ternera', 'cerdo', 'lomo', 'filete', 'chuleta', 'costilla', 'solomillo', 'secreto', 'conejo', 'albondiga', 'cordero', 'entrecot']],
  ['pez', ['merluza', 'bacalao', 'salmon', 'dorada', 'lubina', 'sardina', 'boqueron', 'rape', 'atun', 'bonito', 'trucha', 'emperador', 'caballa', 'lenguado', 'pescad']],
  ['brocoli', ['verdura', 'brocoli', 'menestra', 'pisto', 'judias verdes', 'espinaca', 'coliflor', 'berenjena', 'pimiento', 'alcachofa', 'calabac', 'escalivada', 'wok', 'parrillada']],
];
const DIBUJO_POR_TIPO = { pescado: 'pez', carne: 'filete', ave: 'muslo', verdura: 'brocoli', legumbres: 'olla', pasta: 'pasta', huevos: 'huevo', otros: 'plato' };

// Gana la palabra que sale antes en el nombre (en español lo principal va delante: «Pollo al curry con arroz», «Arroz con pollo»)
function dibujoDe(name, cat) {
  const n = norm(name);
  let best = null, pos = Infinity;
  for (const [d, words] of DIBUJO_POR_PALABRA) {
    for (const w of words) {
      const i = n.indexOf(w);
      if (i >= 0 && i < pos) { best = d; pos = i; }
    }
  }
  return best || DIBUJO_POR_TIPO[cat] || 'plato';
}

function dibujo(name, cat) {
  return `<svg class="cute" viewBox="0 0 100 100" aria-hidden="true">${DIBUJOS[dibujoDe(name, cat)]()}</svg>`;
}
