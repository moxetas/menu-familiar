// Comprueba una traducción (mismo número de textos, mismos {huecos}) y escribe lang/<idioma>.js
import fs from 'fs';
const [lang, outDir] = process.argv.slice(2);
const es = JSON.parse(fs.readFileSync(new URL('./textos.json', import.meta.url)));
const tr = JSON.parse(fs.readFileSync(new URL(`./${lang}.json`, import.meta.url)));
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
if (tr.length !== es.length) {
  console.log(`✗ ${lang}: ${tr.length} textos, hacen falta ${es.length}`);
  // Dónde se descuadra: primer texto cuyos huecos no coinciden
  for (let i = 0; i < Math.min(es.length, tr.length); i++) if (vars(es[i]) !== vars(tr[i])) { console.log(`  descuadre hacia ${i}: ${JSON.stringify(es[i])} ↔ ${JSON.stringify(tr[i])}`); break; }
  process.exit(1);
}
let bad = 0;
es.forEach((s, i) => {
  if (vars(s) !== vars(tr[i])) { console.log(`✗ ${i} huecos: ${JSON.stringify(s)} ↔ ${JSON.stringify(tr[i])}`); bad++; }
  if (!tr[i].trim() && s.trim()) { console.log(`✗ ${i} vacío`); bad++; }
  if (/<strong>/.test(s) !== /<strong>/.test(tr[i])) { console.log(`✗ ${i} <strong>`); bad++; }
});
if (bad) process.exit(1);
const obj = Object.fromEntries(es.map((s, i) => [s, tr[i]]));
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/${lang}.js`, `'use strict';\n// Textos de Menú familiar en ${lang}. Cada clave es el texto en español del código (T('…')). Ver i18n.js.\nI18N.${lang} = ${JSON.stringify(obj, null, 1)};\n`);
console.log(`ok ${lang}: ${tr.length}`);
