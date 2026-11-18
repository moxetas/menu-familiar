'use strict';

// ---------- Idiomas ----------
// Los textos de la app están escritos en español dentro del código, envueltos en T('…').
// Cada idioma tiene su archivo en lang/ (lang/de.js…) con la traducción de cada texto: I18N.de['Semana'] = 'Woche'.
// Si a un idioma le falta un texto, sale en español. {n}, {nombre}… se sustituyen al usarlo: T('Hace {n} días', { n: 3 }).
// Solo se carga el archivo del idioma elegido (lo pone index.html antes que el resto).
// Las recetas y las ideas de platos todavía están solo en español.

const IDIOMAS = {
  es: { nombre: 'Español', tag: 'es-ES' },
  de: { nombre: 'Deutsch', tag: 'de-DE' },
  en: { nombre: 'English', tag: 'en-GB' },
  pl: { nombre: 'Polski', tag: 'pl-PL' },
  ro: { nombre: 'Română', tag: 'ro-RO' },
  ru: { nombre: 'Русский', tag: 'ru-RU' },
  fr: { nombre: 'Français', tag: 'fr-FR' },
  ar: { nombre: 'العربية', tag: 'ar-u-nu-latn', dir: 'rtl' },
};
const IDIOMA_LS = 'menu-familiar-idioma';
const I18N = {};

// El idioma elegido en este móvil. Quien ya usaba la app (antes solo había español) sigue en español sin que se le pregunte.
let IDIOMA = (() => {
  try {
    const v = localStorage.getItem(IDIOMA_LS);
    if (IDIOMAS[v]) return v;
    if (localStorage.getItem('menu-familiar-v1')) { localStorage.setItem(IDIOMA_LS, 'es'); return 'es'; }
  } catch (e) { /* sin almacenamiento: se pregunta */ }
  return null;
})();
const LOCALE = IDIOMAS[IDIOMA || 'es'].tag;
document.documentElement.lang = IDIOMA || 'es';
document.documentElement.dir = IDIOMAS[IDIOMA || 'es'].dir || 'ltr';

function T(s, vars) {
  let r = (IDIOMA && I18N[IDIOMA] && I18N[IDIOMA][s]) || s;
  if (vars) for (const k of Object.keys(vars)) r = r.split(`{${k}}`).join(String(vars[k]));
  return r;
}

// El primero de los idiomas del teléfono que tenga la app (de-AT → de); si no, inglés
function idiomaDelTelefono() {
  for (const tag of navigator.languages || [navigator.language || '']) {
    const base = String(tag).toLowerCase().split(/[-_]/)[0];
    if (IDIOMAS[base]) return base;
  }
  return 'en';
}

// Lo que dice la pantalla de elegir idioma, en cada idioma (aún no hay ningún archivo de idioma cargado)
const ELEGIR = {
  es: ['Elige tu idioma', 'Puedes cambiarlo después en Ajustes.'],
  de: ['Wähle deine Sprache', 'Du kannst sie später in den Einstellungen ändern.'],
  en: ['Choose your language', 'You can change it later in Settings.'],
  pl: ['Wybierz język', 'Możesz go później zmienić w Ustawieniach.'],
  ro: ['Alege limba', 'O poți schimba mai târziu din Setări.'],
  ru: ['Выберите язык', 'Его можно изменить позже в Настройках.'],
  fr: ['Choisissez votre langue', 'Vous pourrez la changer plus tard dans Réglages.'],
  ar: ['اختر لغتك', 'يمكنك تغييرها لاحقًا من الإعدادات.'],
};

// Guarda el idioma y vuelve a abrir la app ya traducida
function ponerIdioma(code) {
  try { localStorage.setItem(IDIOMA_LS, code); } catch (e) { /* nada */ }
  location.reload();
}

// La primera vez: pantalla para elegir el idioma (el del teléfono, el primero y marcado)
function pantallaIdioma() {
  const tel = idiomaDelTelefono();
  const [titulo, pista] = ELEGIR[tel];
  document.documentElement.lang = tel;
  document.documentElement.dir = IDIOMAS[tel].dir || 'ltr';
  document.body.classList.add('eligiendo-idioma');
  const orden = [tel, ...Object.keys(IDIOMAS).filter((k) => k !== tel)];
  const main = document.getElementById('view');
  main.innerHTML = `<div class="idioma-pick">
    <div class="big">🍽️</div>
    <h2>${titulo}</h2>
    <div class="idioma-lista">${orden.map((k) => `<button type="button" class="btn ${k === tel ? 'primary' : ''}" lang="${k}" data-idioma="${k}">${IDIOMAS[k].nombre}</button>`).join('')}</div>
    <p class="muted small">${pista}</p>
  </div>`;
  main.querySelectorAll('[data-idioma]').forEach((b) => b.onclick = () => ponerIdioma(b.dataset.idioma));
}

// El service worker no puede leer localStorage: el idioma se le deja en IndexedDB para el texto de los avisos
function idiomaParaAvisos() {
  try {
    const open = indexedDB.open('menu-familiar-avisos', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('kv');
    open.onsuccess = () => { try { open.result.transaction('kv', 'readwrite').objectStore('kv').put(IDIOMA || 'es', 'idioma'); } catch (e) { /* nada */ } };
  } catch (e) { /* nada */ }
}

// Un nombre dentro de una frase, en minúscula («añadido a tus platos como pescado»), salvo en alemán, donde los sustantivos van con mayúscula
const minus = (s) => (IDIOMA === 'de' ? s : s.toLocaleLowerCase(LOCALE));
