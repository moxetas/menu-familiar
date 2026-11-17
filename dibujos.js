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

// ---------- Más dibujos, uno por tipo de plato ----------
const plato = (cy = 76, rx = 40) => `<ellipse cx="50" cy="${cy}" rx="${rx}" ry="10" fill="#ffffff" ${S}/>`;
// Cuenco con caldo de un color y tropezones (lentejas, garbanzos, alubias, cremas…)
const cuenco = (caldo, bolas = [], vapor = true) => `
  ${vapor ? `<path d="M40 30 q-4 -5 0 -10 t0 -10 M60 30 q-4 -5 0 -10 t0 -10" fill="none" stroke="#c9b8aa" stroke-width="3" stroke-linecap="round"/>` : ''}
  <path d="M14 48 Q14 86 50 86 Q86 86 86 48 Z" fill="#fff8ee" ${S}/>
  <ellipse cx="50" cy="48" rx="36" ry="8" fill="${caldo}" ${S}/>
  ${bolas.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${LINEA}" stroke-width="1.2"/>`).join('')}
  ${cara(50, 68)}`;
const sarten = (arroz, extra = '') => `
  <ellipse cx="12" cy="58" rx="7" ry="4" fill="#3f3f46" ${S}/><ellipse cx="88" cy="58" rx="7" ry="4" fill="#3f3f46" ${S}/>
  <ellipse cx="50" cy="58" rx="38" ry="20" fill="#3f3f46" ${S}/>
  <ellipse cx="50" cy="56" rx="33" ry="15.5" fill="${arroz}"/>
  ${extra}`;

Object.assign(DIBUJOS, {
  albondigas: () => `
    ${plato(74, 42)}
    <ellipse cx="50" cy="70" rx="34" ry="9" fill="#d9573f"/>
    <circle cx="32" cy="62" r="12" fill="#8a5132" ${S}/><circle cx="68" cy="62" r="12" fill="#8a5132" ${S}/>
    <circle cx="50" cy="55" r="15" fill="#9c5c39" ${S}/>
    <circle cx="27" cy="57" r="3" fill="#b77a52"/><circle cx="63" cy="57" r="3" fill="#b77a52"/>
    <path d="M24 70 q8 4 14 0 M62 71 q8 3 14 -1" fill="none" stroke="#e86a4f" stroke-width="3" stroke-linecap="round"/>
    <circle cx="41" cy="46" r="2.4" fill="#6cc35e"/><circle cx="57" cy="44" r="2" fill="#6cc35e"/>
    ${cara(50, 57, 0.75)}`,

  chuleta: () => `
    <rect x="58" y="26" width="30" height="9" rx="4.5" fill="#fff6e6" ${S} transform="rotate(-30 73 30)"/>
    <path d="M16 52 C14 34 30 24 48 28 C62 31 72 42 70 58 C68 74 50 82 34 78 C22 75 17 64 16 52 Z" fill="#fbe1d6" ${S}/>
    <path d="M24 53 C23 41 34 34 47 36 C58 38 63 47 62 57 C60 68 48 72 37 70 C29 68 25 62 24 53 Z" fill="#f2a28b"/>
    <path d="M30 46 q8 -4 16 0" fill="none" stroke="#f8c3b2" stroke-width="3" stroke-linecap="round"/>
    ${cara(43, 57)}`,

  costillas: () => `
    <rect x="22" y="18" width="7" height="22" rx="3.5" fill="#fff6e6" ${S}/><rect x="38" y="15" width="7" height="24" rx="3.5" fill="#fff6e6" ${S}/>
    <rect x="54" y="15" width="7" height="24" rx="3.5" fill="#fff6e6" ${S}/><rect x="70" y="18" width="7" height="22" rx="3.5" fill="#fff6e6" ${S}/>
    <path d="M14 40 Q50 28 86 40 L82 74 Q50 84 18 74 Z" fill="#a4512b" ${S}/>
    <path d="M34 40 L32 76 M50 36 L50 80 M66 40 L68 76" stroke="#7c3a1d" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M22 46 q10 -5 22 -4" fill="none" stroke="#d07a45" stroke-width="3.5" stroke-linecap="round"/>
    ${cara(50, 60)}`,

  asado: () => `
    ${plato(78, 42)}
    <path d="M16 62 C16 40 34 30 52 30 C72 30 84 42 84 60 C84 74 66 78 50 78 C30 78 16 74 16 62 Z" fill="#a95a32" ${S}/>
    <path d="M24 44 q26 -10 54 2" fill="none" stroke="#c97a4a" stroke-width="4" stroke-linecap="round"/>
    <path d="M34 33 L32 77 M54 30 L54 78 M72 35 L74 75" stroke="#fff6e6" stroke-width="2.6"/>
    <path d="M66 26 q4 -10 12 -12 M70 22 l6 2 M68 18 l5 -1" fill="none" stroke="#5fa04e" stroke-width="2.4" stroke-linecap="round"/>
    ${cara(44, 58)}`,

  cerdo: () => `
    <path d="M24 30 L20 14 L38 24 Z M76 30 L80 14 L62 24 Z" fill="#f4a3b5" ${S}/>
    <circle cx="50" cy="52" r="32" fill="#f9bccb" ${S}/>
    <ellipse cx="50" cy="62" rx="14" ry="10" fill="#f28fa7" ${S}/>
    <ellipse cx="45" cy="62" rx="2.5" ry="3.5" fill="${LINEA}"/><ellipse cx="55" cy="62" rx="2.5" ry="3.5" fill="${LINEA}"/>
    <circle cx="38" cy="44" r="3" fill="${LINEA}"/><circle cx="62" cy="44" r="3" fill="${LINEA}"/>
    <circle cx="39" cy="43" r="1" fill="#fff"/><circle cx="63" cy="43" r="1" fill="#fff"/>
    <ellipse cx="29" cy="54" rx="4.5" ry="2.8" fill="#ff8fa3" opacity=".8"/><ellipse cx="71" cy="54" rx="4.5" ry="2.8" fill="#ff8fa3" opacity=".8"/>`,

  conejo: () => `
    <ellipse cx="38" cy="26" rx="8" ry="20" fill="#f2ede6" ${S}/><ellipse cx="62" cy="26" rx="8" ry="20" fill="#f2ede6" ${S}/>
    <ellipse cx="38" cy="27" rx="3.5" ry="13" fill="#f7b8c6"/><ellipse cx="62" cy="27" rx="3.5" ry="13" fill="#f7b8c6"/>
    <ellipse cx="50" cy="60" rx="30" ry="26" fill="#f2ede6" ${S}/>
    <path d="M47 64 l3 3 l3 -3 Z" fill="#f28fa7"/>
    <path d="M50 67 v3 M50 70 q-4 3 -7 0 M50 70 q4 3 7 0" fill="none" stroke="${LINEA}" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="40" cy="56" r="3" fill="${LINEA}"/><circle cx="60" cy="56" r="3" fill="${LINEA}"/>
    <circle cx="41" cy="55" r="1" fill="#fff"/><circle cx="61" cy="55" r="1" fill="#fff"/>
    <ellipse cx="32" cy="66" rx="4.5" ry="2.8" fill="#ff8fa3" opacity=".75"/><ellipse cx="68" cy="66" rx="4.5" ry="2.8" fill="#ff8fa3" opacity=".75"/>`,

  cordero: () => `
    ${silueta(`<circle cx="30" cy="40" r="13"/><circle cx="50" cy="32" r="14"/><circle cx="70" cy="40" r="13"/><circle cx="26" cy="58" r="12"/><circle cx="74" cy="58" r="12"/><circle cx="38" cy="72" r="12"/><circle cx="62" cy="72" r="12"/><circle cx="50" cy="56" r="20"/>`, '#ffffff')}
    <ellipse cx="22" cy="50" rx="9" ry="5" fill="#8c7a6b" ${S} transform="rotate(-20 22 50)"/><ellipse cx="78" cy="50" rx="9" ry="5" fill="#8c7a6b" ${S} transform="rotate(20 78 50)"/>
    <ellipse cx="50" cy="58" rx="17" ry="19" fill="#d8c4b0" ${S}/>
    ${cara(50, 58, 0.85)}`,

  jamon: () => `
    <rect x="66" y="16" width="10" height="24" rx="4" fill="#e8d6bc" ${S} transform="rotate(35 71 28)"/>
    <path d="M30 86 C10 76 12 50 30 38 C42 30 58 30 66 38 C74 46 72 58 64 68 C56 78 46 92 30 86 Z" fill="#b3412f" ${S}/>
    <path d="M30 86 C18 80 18 60 30 50 C40 42 56 44 60 52" fill="none" stroke="#fbe6da" stroke-width="5" stroke-linecap="round"/>
    <path d="M38 64 q8 -6 16 -2" fill="none" stroke="#d96b55" stroke-width="3" stroke-linecap="round"/>
    ${cara(44, 70, 0.85)}`,

  salchichas: () => `
    ${plato(76, 40)}
    <rect x="16" y="46" width="68" height="16" rx="8" fill="#c8553d" ${S} transform="rotate(-8 50 54)"/>
    <rect x="18" y="58" width="64" height="15" rx="7.5" fill="#d8694d" ${S} transform="rotate(6 50 65)"/>
    <path d="M28 51 l3 6 M40 49 l3 6 M60 47 l3 6" stroke="#e8907a" stroke-width="2.4" stroke-linecap="round" transform="rotate(-8 50 54)"/>
    ${cara(50, 65, 0.8)}`,

  polloasado: () => `
    ${plato(80, 42)}
    <rect x="20" y="40" width="12" height="16" rx="5" fill="#fff6e6" ${S} transform="rotate(-35 26 48)"/><rect x="68" y="40" width="12" height="16" rx="5" fill="#fff6e6" ${S} transform="rotate(35 74 48)"/>
    <ellipse cx="50" cy="62" rx="32" ry="20" fill="#e39a4c" ${S}/>
    <ellipse cx="28" cy="58" rx="10" ry="13" fill="#d98a3c" ${S} transform="rotate(-25 28 58)"/><ellipse cx="72" cy="58" rx="10" ry="13" fill="#d98a3c" ${S} transform="rotate(25 72 58)"/>
    <path d="M38 52 q12 -6 24 0" fill="none" stroke="#f3bd7d" stroke-width="4" stroke-linecap="round"/>
    ${cara(50, 66, 0.85)}`,

  pechuga: () => `
    ${plato(74, 42)}
    <path d="M18 60 C16 44 32 38 48 40 C66 42 84 48 82 62 C80 72 62 76 46 74 C30 72 19 70 18 60 Z" fill="#f4d7a4" ${S}/>
    <path d="M30 50 L40 66 M44 46 L54 70 M58 46 L68 68" stroke="#c98f4e" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M70 40 q6 -4 12 0 q-6 4 -12 0 Z" fill="#6cc35e" ${S}/>
    ${cara(50, 59, 0.8)}`,

  salmon: () => `
    ${plato(76, 42)}
    <path d="M14 60 C20 44 46 40 66 44 C80 47 88 54 86 62 C84 70 70 74 50 74 C30 74 12 70 14 60 Z" fill="#fb9a76" ${S}/>
    <path d="M30 50 q-4 10 0 20 M44 46 q-5 13 0 27 M58 46 q-5 13 0 27 M72 50 q-4 10 0 20" fill="none" stroke="#ffd2bf" stroke-width="3" stroke-linecap="round"/>
    <path d="M78 40 l8 -6 M80 46 l9 -2" stroke="#f7d23e" stroke-width="3" stroke-linecap="round"/>
    <circle cx="82" cy="38" r="6" fill="#ffe56b" ${S}/>
    ${cara(50, 60, 0.8)}`,

  sardinas: () => `
    <g transform="rotate(-12 50 40)">
      <path d="M78 40 L92 32 L90 40 L92 48 Z" fill="#7d93a8" ${S}/>
      <path d="M12 40 C20 30 50 28 78 40 C50 52 20 50 12 40 Z" fill="#b9c8d6" ${S}/>
      <path d="M24 38 q20 -4 46 0" fill="none" stroke="#5f7d97" stroke-width="2.5"/>
    </g>
    <g transform="rotate(8 50 66)">
      <path d="M78 66 L92 58 L90 66 L92 74 Z" fill="#7d93a8" ${S}/>
      <path d="M12 66 C20 56 50 54 78 66 C50 78 20 76 12 66 Z" fill="#c9d6e2" ${S}/>
      <path d="M24 64 q20 -4 46 0" fill="none" stroke="#5f7d97" stroke-width="2.5"/>
    </g>
    ${cara(30, 67, 0.7)}`,

  mejillones: () => `
    <path d="M50 82 C20 80 10 50 26 26 C34 16 44 22 48 34 C52 22 62 16 72 26 C88 48 80 80 50 82 Z" fill="#2f2b3a" ${S}/>
    <path d="M50 76 C30 74 22 54 32 36 C38 28 46 34 48 44 C52 34 60 28 68 36 C78 54 70 74 50 76 Z" fill="#f2a05c"/>
    <path d="M36 44 q-4 16 6 26 M64 44 q4 16 -6 26" fill="none" stroke="#e08440" stroke-width="2.5" stroke-linecap="round"/>
    ${cara(50, 58, 0.8)}`,

  calamares: () => `
    ${plato(78, 42)}
    <circle cx="34" cy="58" r="15" fill="none" stroke="${LINEA}" stroke-width="13"/><circle cx="34" cy="58" r="15" fill="none" stroke="#f0c46a" stroke-width="8.5"/>
    <circle cx="64" cy="54" r="15" fill="none" stroke="${LINEA}" stroke-width="13"/><circle cx="64" cy="54" r="15" fill="none" stroke="#f3cf7d" stroke-width="8.5"/>
    <path d="M70 76 l12 -2 l-6 -8 Z" fill="#fff07a" ${S}/>
    ${cara(64, 40, 0.65)}`,

  bogavante: () => `
    <path d="M20 26 q-8 -12 4 -16 q10 4 6 16 Z M80 26 q8 -12 -4 -16 q-10 4 -6 16 Z" fill="#d6402f" ${S}/>
    <path d="M30 30 L40 46 M70 30 L60 46" stroke="${LINEA}" stroke-width="6" stroke-linecap="round"/><path d="M30 30 L40 46 M70 30 L60 46" stroke="#d6402f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="56" rx="17" ry="20" fill="#e2503c" ${S}/>
    <path d="M38 74 L50 90 L62 74 Z" fill="#c63a2a" ${S}/>
    <path d="M36 64 h28 M38 70 h24" stroke="#b8321f" stroke-width="2.4"/>
    ${cara(50, 52, 0.8)}`,

  caviar: () => `
    <ellipse cx="50" cy="68" rx="36" ry="12" fill="#c9ccd3" ${S}/>
    <rect x="14" y="52" width="72" height="16" fill="#c9ccd3"/>
    <path d="M14 52 v16 M86 52 v16" stroke="${LINEA}" stroke-width="2.5"/>
    <ellipse cx="50" cy="52" rx="36" ry="12" fill="#22252b" ${S}/>
    ${[[34, 50], [42, 47], [50, 52], [58, 47], [66, 51], [40, 55], [60, 55], [50, 45]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#3d434d"/><circle cx="${x - 0.8}" cy="${y - 0.8}" r="0.8" fill="#9aa3b2"/>`).join('')}
    ${cara(50, 70, 0.8)}`,

  lentejas: () => cuenco('#9a6b3c', [[30, 47, 2.6, '#6e4523'], [40, 50, 2.6, '#6e4523'], [56, 46, 2.6, '#6e4523'], [64, 50, 2.6, '#6e4523'], [48, 46, 3, '#f28b3b'], [70, 46, 3, '#c0392b']]),
  garbanzos: () => cuenco('#d9a65b', [[30, 47, 4, '#f0d39a'], [42, 50, 4, '#f0d39a'], [56, 46, 4, '#f0d39a'], [68, 49, 4, '#f0d39a'], [48, 45, 3, '#4e9a45']]),
  alubias: () => cuenco('#c8834f', [[30, 47, 4, '#fbf3e4'], [42, 50, 4, '#fbf3e4'], [56, 46, 4, '#fbf3e4'], [68, 49, 4, '#fbf3e4'], [50, 45, 4, '#b8382c']]),
  cremanaranja: () => cuenco('#f59a3c', [[42, 47, 2, '#ffffff'], [50, 48, 2.6, '#6cc35e']]),
  cremaverde: () => cuenco('#8cc152', [[42, 47, 2, '#ffffff'], [56, 48, 2, '#ffffff']]),
  cremaroja: () => cuenco('#e2533c', [[42, 47, 2.4, '#7fd36e'], [56, 48, 2.4, '#f7f2e6']], false),
  hummus: () => cuenco('#e9cf98', [[50, 47, 3, '#c0392b'], [38, 47, 2, '#7fb04a']], false),

  revuelto: () => `
    ${plato(74, 42)}
    ${silueta(`<circle cx="32" cy="60" r="12"/><circle cx="48" cy="54" r="14"/><circle cx="66" cy="60" r="12"/><circle cx="50" cy="66" r="12"/>`, '#ffd85c')}
    <circle cx="36" cy="54" r="3" fill="#a7744b"/><circle cx="62" cy="56" r="3" fill="#a7744b"/><circle cx="54" cy="66" r="2.5" fill="#6cc35e"/>
    ${cara(48, 58, 0.8)}`,

  croquetas: () => `
    ${plato(76, 42)}
    <rect x="16" y="54" width="34" height="18" rx="9" fill="#d8923f" ${S}/>
    <rect x="50" y="54" width="34" height="18" rx="9" fill="#d8923f" ${S}/>
    <rect x="32" y="38" width="36" height="18" rx="9" fill="#e5a24d" ${S}/>
    ${[[24, 60], [38, 66], [58, 60], [74, 66], [40, 44], [58, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#a8641f"/>`).join('')}
    ${cara(50, 47, 0.7)}`,

  lasana: () => `
    <path d="M18 44 L50 32 L82 44 L82 72 L50 84 L18 72 Z" fill="#f5c55a" ${S}/>
    <path d="M18 44 L50 56 L82 44 L50 32 Z" fill="#f7d77a" ${S}/>
    <path d="M18 56 L50 68 L82 56 M18 64 L50 76 L82 64" fill="none" stroke="#d9473a" stroke-width="4"/>
    <path d="M30 42 q6 -4 12 0 M56 40 q6 -4 12 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="42" r="3" fill="#6cc35e"/>
    ${cara(66, 66, 0.7)}`,

  macarrones: () => `
    <path d="M16 52 Q16 84 50 84 Q84 84 84 52 Z" fill="#eaf4ff" ${S}/>
    ${[[30, 44, -30], [44, 40, 20], [58, 44, -15], [70, 42, 35], [38, 50, 60], [62, 50, -50]].map(([x, y, r]) => `<rect x="${x - 8}" y="${y - 4}" width="16" height="8" rx="2" fill="#f2b03a" ${S} transform="rotate(${r} ${x} ${y})"/>`).join('')}
    <path d="M24 50 q26 8 52 0" fill="none" stroke="#d9473a" stroke-width="5" stroke-linecap="round"/>
    ${cara(50, 68)}`,

  arroznegro: () => sarten('#2a2a30', `
    <circle cx="36" cy="52" r="5" fill="none" stroke="#f1e7da" stroke-width="3"/><circle cx="62" cy="50" r="5" fill="none" stroke="#f1e7da" stroke-width="3"/>
    <path d="M68 62 l10 2 l-6 6 Z" fill="#fff07a" ${S}/>
    <g fill="#fff">${cara(50, 58, 0.9).replace(/fill="#4a3428"/g, 'fill="#ffffff"').replace(/stroke="#4a3428"/g, 'stroke="#ffffff"')}</g>`),

  arrozcubana: () => `
    ${plato(78, 42)}
    <path d="M20 72 Q20 42 46 40 Q66 40 68 72 Z" fill="#fdfaf3" ${S}/>
    <path d="M18 74 q20 6 52 0" fill="none" stroke="#d9473a" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 44 C38 36 50 26 58 32 C68 26 80 38 70 46 C74 56 56 58 52 52 C42 56 40 48 48 44 Z" fill="#ffffff" ${S}/>
    <circle cx="58" cy="42" r="7" fill="#ffc23d" ${S}/>
    <path d="M70 70 q12 -4 16 -20 q2 18 -14 24 Z" fill="#f6d55c" ${S}/>
    ${cara(42, 60, 0.8)}`,

  pimientos: () => `
    <path d="M50 22 q-2 -10 8 -12" fill="none" stroke="#3f8f3a" stroke-width="5" stroke-linecap="round"/>
    <path d="M38 26 q12 -8 24 0 q-12 6 -24 0 Z" fill="#4fa548" ${S}/>
    <path d="M24 46 C24 28 40 24 50 30 C60 24 76 28 76 46 C76 64 70 84 50 84 C30 84 24 64 24 46 Z" fill="#e2392f" ${S}/>
    <path d="M34 40 q-4 14 2 30" fill="none" stroke="#f57b6c" stroke-width="4" stroke-linecap="round"/>
    ${cara(52, 56)}`,

  berenjena: () => `
    <path d="M58 26 q4 -12 14 -14" fill="none" stroke="#3f8f3a" stroke-width="5" stroke-linecap="round"/>
    <path d="M48 30 q10 -10 24 -2 q-4 8 -10 8 q-6 4 -14 -6 Z" fill="#4fa548" ${S}/>
    <path d="M52 34 C66 30 78 40 74 56 C70 74 56 88 38 86 C22 84 18 70 26 58 C34 46 40 38 52 34 Z" fill="#7a3f9d" ${S}/>
    <path d="M36 62 q2 -10 10 -16" fill="none" stroke="#a76cc8" stroke-width="4" stroke-linecap="round"/>
    ${cara(48, 64)}`,

  champinon: () => `
    <path d="M38 52 L36 80 Q50 86 64 80 L62 52 Z" fill="#f4ead9" ${S}/>
    <path d="M14 54 C14 30 34 18 50 18 C66 18 86 30 86 54 Q50 62 14 54 Z" fill="#c99566" ${S}/>
    <circle cx="34" cy="36" r="4" fill="#e3bf98"/><circle cx="58" cy="30" r="5" fill="#e3bf98"/><circle cx="70" cy="44" r="3.5" fill="#e3bf98"/>
    ${cara(50, 68, 0.8)}`,

  alcachofa: () => `
    <rect x="46" y="76" width="8" height="12" rx="3" fill="#7da34a" ${S}/>
    ${silueta(`<path d="M50 14 C64 24 76 40 74 58 C72 74 62 80 50 80 C38 80 28 74 26 58 C24 40 36 24 50 14 Z"/>`, '#8cbf5a')}
    <path d="M32 48 Q50 40 68 48 M30 60 Q50 52 70 60 M36 36 Q50 28 64 36" fill="none" stroke="#5d8f36" stroke-width="2.6" stroke-linecap="round"/>
    ${cara(50, 66, 0.8)}`,

  patata: () => `
    <path d="M18 54 C16 36 34 24 54 26 C74 28 86 42 84 58 C82 74 66 82 48 80 C30 78 20 70 18 54 Z" fill="#d9a65b" ${S}/>
    <circle cx="34" cy="44" r="2" fill="#a8743a"/><circle cx="70" cy="48" r="2" fill="#a8743a"/><circle cx="60" cy="70" r="2" fill="#a8743a"/>
    ${cara(50, 56)}`,
});

// Palabras del nombre → dibujo. Gana la que sale antes en el nombre y, si empiezan igual, la más larga
// («pollo asado» antes que «pollo»). Sin acentos.
const DIBUJO_POR_PALABRA = [
  ['pizza', ['pizza']],
  ['hamburguesa', ['hamburguesa', 'burger']],
  ['sandwich', ['sandwich', 'tosta', 'bocadillo', 'montadito', 'tostada']],
  ['fajita', ['fajita', 'burrito', 'taco', 'wrap', 'quesadilla']],
  ['paella', ['paella', 'arroz', 'fideua', 'risotto']],
  ['arroznegro', ['arroz negro']],
  ['arrozcubana', ['arroz a la cubana', 'arroz cubana']],
  ['pasta', ['pasta', 'espagueti', 'spaghetti', 'noqui', 'tallarin', 'fideo', 'cuscus', 'tortellini', 'raviol']],
  ['macarrones', ['macarr']],
  ['lasana', ['lasana', 'canelon', 'musaka']],
  ['gamba', ['gamba', 'langostino', 'marisco', 'almeja', 'zarzuela', 'cigala', 'necora', 'centollo']],
  ['mejillones', ['mejill']],
  ['bogavante', ['bogavante', 'langosta']],
  ['pulpo', ['pulpo', 'sepia', 'chipir', 'chopito']],
  ['calamares', ['calamar']],
  ['caviar', ['caviar', 'huevas']],
  ['tortilla', ['tortilla']],
  ['huevo', ['huevo', 'frittata', 'shakshuka']],
  ['revuelto', ['revuelto', 'huevos revueltos']],
  ['sopa', ['sopa', 'caldo', 'consome']],
  ['cremanaranja', ['crema', 'crema de calabaza', 'crema de zanahoria', 'pure', 'vichyssoise']],
  ['cremaverde', ['crema de calabacin', 'crema de verdura', 'crema de espinaca', 'crema de brocoli', 'crema de guisante', 'pure de verdura']],
  ['cremaroja', ['gazpacho', 'salmorejo']],
  ['muslo', ['pollo', 'pavo', 'alita', 'muslo', 'contramuslo']],
  ['polloasado', ['pollo asado', 'pollo al horno', 'pollo entero', 'pollo a l']],
  ['pechuga', ['pechuga', 'filete de pollo', 'filetes de pollo', 'pavo a la plancha']],
  ['ensalada', ['ensalada']],
  ['hummus', ['hummus', 'humus']],
  ['lentejas', ['lenteja']],
  ['garbanzos', ['garbanzo']],
  ['alubias', ['alubia', 'fabada', 'judion', 'pochas']],
  ['olla', ['cocido', 'potaje', 'estofado', 'guiso', 'marmitako', 'carrillada', 'ragu', 'callos', 'riojana', 'caldereta', 'rabo']],
  ['empanada', ['empanada', 'quiche', 'crepe', 'hojaldre', 'empanadilla']],
  ['croquetas', ['croqueta', 'nugget', 'san jacobo', 'flamenquin']],
  ['filete', ['carne', 'ternera', 'filete', 'entrecot', 'chuleton', 'solomillo', 'cachopo', 'buey', 'vaca', 'escalope']],
  ['albondigas', ['albondiga']],
  ['chuleta', ['chuleta', 'chuletilla']],
  ['costillas', ['costilla', 'costillar']],
  ['asado', ['asado', 'lomo', 'secreto', 'presa', 'pluma', 'cuello', 'paletilla', 'cochinillo', 'lechazo', 'magro', 'codillo', 'pierna']],
  ['cerdo', ['cerdo', 'panceta', 'torrezno']],
  ['jamon', ['jamon']],
  ['salchichas', ['salchicha', 'chorizo', 'butifarra', 'longaniza', 'morcilla', 'perrito']],
  ['conejo', ['conejo', 'liebre']],
  ['cordero', ['cordero', 'cabrito']],
  ['salmon', ['salmon']],
  ['sardinas', ['sardina', 'boqueron', 'anchoa', 'caballa', 'jurel']],
  ['pez', ['merluza', 'bacalao', 'dorada', 'lubina', 'rape', 'atun', 'bonito', 'trucha', 'emperador', 'lenguado', 'pescad', 'mero', 'besugo', 'rodaballo', 'gallo', 'pez']],
  ['brocoli', ['verdura', 'brocoli', 'menestra', 'pisto', 'judias verdes', 'espinaca', 'coliflor', 'calabac', 'escalivada', 'wok', 'parrillada', 'acelga', 'esparrago']],
  ['pimientos', ['pimiento']],
  ['berenjena', ['berenjena']],
  ['champinon', ['champinon', 'seta', 'boletus']],
  ['alcachofa', ['alcachofa']],
  ['patata', ['patata', 'papas', 'pure de patata', 'pure de patatas', 'patatas fritas', 'patatas asadas']],
];
const DIBUJO_POR_TIPO = { pescado: 'pez', carne: 'filete', cerdo: 'cerdo', cordero: 'cordero', conejo: 'conejo', ave: 'muslo', verdura: 'brocoli', legumbres: 'olla', pasta: 'pasta', huevos: 'huevo', otros: 'plato' };

function dibujoDe(name, cat) {
  const n = norm(name);
  let best = null, pos = Infinity, len = 0;
  for (const [d, words] of DIBUJO_POR_PALABRA) {
    for (const w of words) {
      const i = n.indexOf(w);
      if (i >= 0 && (i < pos || (i === pos && w.length > len))) { best = d; pos = i; len = w.length; }
    }
  }
  return best || DIBUJO_POR_TIPO[cat] || 'plato';
}

function dibujo(name, cat) {
  return `<svg class="cute" viewBox="0 0 100 100" aria-hidden="true">${DIBUJOS[dibujoDe(name, cat)]()}</svg>`;
}
