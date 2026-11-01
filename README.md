# Menú familiar

App para planificar las comidas de la semana en casa, por colores. Se instala en el iPhone desde Safari, sin pasar por la App Store.

- **Mis platos**: cuadrícula con un dibujo cuqui de cada plato, agrupada por tipo. Se pueden escribir uno a uno o pegar una lista entera; la app adivina el tipo y le pone su color. Los que no tienen receta llevan la etiqueta «sin receta» y la app propone empezar con la receta más parecida del catálogo.
- **Semana**: con un toque monta la comida y la cena de los siete días, procurando variar (unas 3 veces pescado, 2 carne, 2 legumbres…) y sin repetir tipo dos veces seguidas. Toca cualquier plato para cambiarlo. Cada comida puede tener varios platos («➕ Añadir otro plato») y en cada uno se elige quién lo come y si hay invitados.
- **Ideas**: cada semana mete por su cuenta algún plato nuevo (marcado con ✨). Si os gusta, lo guardas; si no, no vuelve a salir.
- **Recetas**: cada idea del catálogo trae su receta para 4 personas, con cantidades, pasos y tiempo. Las calorías se calculan por ingrediente (y proteínas, grasas e hidratos por persona) con la tabla de alimentos de `recetas.js`. Se puede cambiar el número de personas, adaptar una receta «a nuestra manera» o escribir la de un plato propio.
- **Familia**: ficha de cada persona (edad, sexo, peso, altura y actividad). Con ella se calcula lo que necesita al día (fórmula de Mifflin-St Jeor en adultos y tablas de la EFSA en niños) y su ración respecto a la estándar de las recetas (2.000 kcal). También muestra lo que come cada uno en comida y cena por día, semana, mes y año.
- **Compra**: lista de la compra ordenada por secciones del súper. Se escribe a mano o se sacan los ingredientes de los platos del menú de la semana (quitando lo que ya hay en casa). Tocar una cosa la tacha; con «Familia» activado, lo que tacha uno lo ven los demás al momento.
- **Familia**: conecta los móviles de casa con un código. Platos y menús son los mismos en todos, y lo que cambia uno lo ven los demás al momento. Sin cobertura sigue funcionando y se pone al día al volver la conexión.
- **Compartir**: manda el menú de la semana por WhatsApp.

| Color | Tipo |
| --- | --- |
| 🔵 Azul | Pescado |
| 🔴 Rojo | Carne |
| 🟠 Naranja | Pollo y pavo |
| 🟢 Verde | Verdura |
| 🟤 Marrón | Legumbres |
| 🟡 Amarillo | Pasta y arroz |
| 🟣 Morado | Huevos |
| ⚪ Gris | Otros |

Los platos se guardan en el teléfono. Si se activa «Familia», también en la base de datos de Firebase del proyecto, en `/familias/<código>`.

## Instalarla en el iPhone

1. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama **main**, carpeta **/ (root)**, **Save**.
2. Al cabo de uno o dos minutos estará en `https://moxetas.github.io/menu-familiar/`.
3. Ábrela en **Safari**, toca **Compartir → Añadir a pantalla de inicio**.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la app. |
| `styles.css` | Diseño y colores, con modo claro y oscuro. |
| `platos.js` | Tipos de plato, palabras para adivinar el tipo y lista de ideas. Para añadir ideas basta con escribir otra línea. |
| `app.js` | Pantallas y lógica del menú. |
| `compra.js` | Lista de la compra. Las secciones del súper, las palabras para adivinarlas y los ingredientes de las ideas están en `platos.js`. |
| `recetas.js` | Tabla de alimentos (kcal y nutrientes por 100 g), recetas del catálogo y pantalla de receta. Para añadir una receta basta con otra entrada en `RECETAS`. |
| `miembros.js` | Miembros de la familia, raciones, quién come cada plato, consumo y pestaña Familia. |
| `dibujos.js` | Dibujos de los platos (SVG) y palabras para elegir el de cada uno. |
| `familia.js` | Sincronización entre móviles con Firebase Realtime Database (dirección de la base de datos al principio del archivo). |
| `sw.js` | Guarda la app en el teléfono para que abra sin cobertura. |

## Reglas de Firebase

En **Realtime Database → Reglas** tiene que estar esto, para que solo quien conoce el código de familia pueda leer o cambiar sus datos:

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "familias": {
      "$codigo": {
        ".read": "$codigo.length >= 20",
        ".write": "$codigo.length >= 20"
      }
    }
  }
}
```
