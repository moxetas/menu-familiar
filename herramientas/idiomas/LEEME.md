# Traducciones de Menú familiar

Los textos de la app están en español dentro del código, envueltos en `T('…')` (ver `i18n.js`).
Cada idioma tiene su archivo `lang/<idioma>.js`, que se genera desde estos JSON.

Para añadir o cambiar textos:

1. En el código, envuelve el texto nuevo en `T('…')` (con `{n}`, `{nombre}`… para lo que cambia).
2. `node herramientas/idiomas/extract.mjs . herramientas/idiomas/textos.json` saca la lista de textos en español.
3. Pon la traducción de cada texto, en el mismo orden, en `en.json`, `de.json`, `pl.json`, `ro.json`, `ru.json`, `fr.json` y `ar.json`.
4. `node herramientas/idiomas/check.mjs de lang` (y así con cada idioma) comprueba que no falte ninguno y escribe `lang/de.js`.

Si a un idioma le falta un texto, la app lo enseña en español.
Las recetas y las ideas de platos (`recetas.js`, `platos.js`) todavía están solo en español.
