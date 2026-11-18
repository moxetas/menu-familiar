// Comprueba la traducción de platos y recetas de un idioma y escribe lang/recetas-<idioma>.js
// Uso: node check-recetas.mjs <idioma> <carpeta lang>
// Lee rec-<idioma>-a.json { platos, ingredientes, tiempos, unidades, palabras, compra } y rec-<idioma>-b.json [ [pasos de la receta 0], … ]
import fs from 'fs';
const [lang, outDir] = process.argv.slice(2);
const here = (f) => new URL(`./${f}`, import.meta.url);
const es = JSON.parse(fs.readFileSync(here('recetas-es.json')));
const a = JSON.parse(fs.readFileSync(here(`rec-${lang}-a.json`)));
const b = JSON.parse(fs.readFileSync(here(`rec-${lang}-b.json`)));
let bad = 0;
for (const k of ['platos', 'ingredientes', 'tiempos', 'unidades']) {
  if (a[k].length !== es[k].length) { console.log(`✗ ${k}: ${a[k].length} de ${es[k].length}`); bad++; }
  a[k].forEach((x, i) => { if (typeof x !== 'string' || !x.trim()) { console.log(`✗ ${k} ${i} vacío`); bad++; } });
}
if (b.length !== es.pasos.length) { console.log(`✗ pasos: ${b.length} recetas de ${es.pasos.length}`); bad++; }
es.pasos.forEach((p, i) => {
  if (!b[i] || b[i].length !== p.length) { console.log(`✗ receta ${i} (${es.pasosKeys[i]}): ${b[i]?.length} pasos de ${p.length}`); bad++; }
});
for (const k of ['palabras', 'compra']) if (!a[k] || typeof a[k] !== 'object') { console.log(`✗ falta ${k}`); bad++; }
if (bad) process.exit(1);
const zip = (keys, vals) => Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
const out = {
  platos: zip(es.platos, a.platos),
  ingredientes: zip(es.ingredientes, a.ingredientes),
  tiempos: zip(es.tiempos, a.tiempos),
  unidades: zip(es.unidades, a.unidades),
  pasos: zip(es.pasosKeys, b),
  palabras: a.palabras,
  compra: a.compra,
};
fs.writeFileSync(`${outDir}/recetas-${lang}.js`, `'use strict';\n// Platos de las ideas, ingredientes y recetas en ${lang}. Las claves son los textos en español (recetas.js, platos.js). Ver i18n.js.\nRECETAS_I18N.${lang} = ${JSON.stringify(out, null, 1)};\n`);
console.log(`ok ${lang}`);
