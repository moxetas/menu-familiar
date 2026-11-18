# Traducciones de Menú familiar

Los textos de la app están en español dentro del código, envueltos en `T('…')` (ver `i18n.js`).
Cada idioma tiene su archivo `lang/<idioma>.js`, que se genera desde estos JSON.

Para añadir o cambiar textos:

1. En el código, envuelve el texto nuevo en `T('…')` (con `{n}`, `{nombre}`… para lo que cambia).
2. `node herramientas/idiomas/extract.mjs . herramientas/idiomas/textos.json` saca la lista de textos en español.
3. Pon la traducción de cada texto, en el mismo orden, en `en.json`, `de.json`, `pl.json`, `ro.json`, `ru.json`, `fr.json` y `ar.json`.
4. `node herramientas/idiomas/check.mjs de lang` (y así con cada idioma) comprueba que no falte ninguno y escribe `lang/de.js`.

Si a un idioma le falta un texto, la app lo enseña en español.

## Platos de las ideas y recetas

Los nombres de los platos de `platos.js`, los ingredientes y los pasos de `recetas.js` se traducen con `lang/recetas-<idioma>.js`.
En la app se guardan siempre en español (así una familia con móviles en idiomas distintos comparte los mismos platos) y solo se traducen al enseñarlos.

1. Si cambias recetas o ideas, vuelve a sacar la lista en español en `recetas-es.json` (platos, ingredientes, tiempos, unidades, pasos).
2. Pon la traducción en el mismo orden en `rec-<idioma>-a.json` (nombres, ingredientes, tiempos, unidades y las palabras para adivinar el tipo de plato y la sección del súper) y `rec-<idioma>-b.json` (los pasos de cada receta).
3. `node herramientas/idiomas/check-recetas.mjs de lang` comprueba que cuadre (mismo número de pasos en cada receta) y escribe `lang/recetas-de.js`.
