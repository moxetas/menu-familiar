# Menú familiar

App para planificar las comidas de la semana en casa, por colores. Se instala en el iPhone desde Safari, sin pasar por la App Store.

- **Mis platos**: apuntas los platos que coméis normalmente, uno a uno o pegando una lista entera. La app adivina el tipo de cada plato y le pone su color; puedes corregirlo.
- **Semana**: con un toque monta la comida y la cena de los siete días, procurando variar (unas 3 veces pescado, 2 carne, 2 legumbres…) y sin repetir tipo dos veces seguidas. Toca cualquier plato para cambiarlo.
- **Ideas**: cada semana mete por su cuenta algún plato nuevo (marcado con ✨). Si os gusta, lo guardas; si no, no vuelve a salir.
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
