// Saca todos los textos T('…') de Menú familiar → textos.json (lista en orden de aparición, sin repetir)
import fs from 'fs';
const dir = process.argv[2];
const files = ['platos.js', 'familia.js', 'avisos.js', 'compra.js', 'recetas.js', 'dibujos.js', 'miembros.js', 'citas.js', 'guia.js', 'ajustes.js', 'app.js'];
const out = new Set();
const lit = `'((?:[^'\\\\]|\\\\.)*)'`;
const unq = (s) => Function(`return '${s}'`)();
for (const f of files) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8');
  for (const m of s.matchAll(new RegExp(`\\bT\\(\\s*${lit}`, 'g'))) out.add(unq(m[1]));
  for (const m of s.matchAll(new RegExp(`\\bT\\(\\s*\\w+ \\? ${lit} : ${lit}`, 'g'))) { out.add(unq(m[1])); out.add(unq(m[2])); }
}
// Pestañas y título de index.html (se traducen con T(variable))
for (const x of ['Menú familiar', 'Semana', 'Compra', 'Mis platos', 'Familia', 'Ideas', 'Citas', 'Ajustes']) out.add(x);
const list = [...out];
fs.writeFileSync(process.argv[3], JSON.stringify(list, null, 1));
console.log(list.length, 'textos,', list.join('').length, 'caracteres');
