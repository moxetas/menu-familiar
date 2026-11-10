# Menú familiar

App para planificar las comidas de la semana en casa, por colores. Se instala en el iPhone desde Safari, sin pasar por la App Store.

- **Mis platos**: cuadrícula con un dibujo cuqui de cada plato, agrupada por tipo. Se pueden escribir uno a uno o pegar una lista entera; la app adivina el tipo y le pone su color. Los que no tienen receta llevan la etiqueta «sin receta» y la app propone empezar con la receta más parecida del catálogo.
- **Semana**: con un toque monta la comida y la cena de los siete días, procurando variar (unas 3 veces pescado, 2 carne, 2 legumbres…) y sin repetir tipo dos veces seguidas. Toca cualquier plato para cambiarlo. Cada comida puede tener varios platos («➕ Añadir otro plato») y en cada uno se elige quién lo come y si hay invitados.
- **Ideas**: cada semana mete por su cuenta algún plato nuevo (marcado con ✨). Si os gusta, lo guardas; si no, no vuelve a salir.
- **Recetas**: cada idea del catálogo trae su receta para 4 personas, con cantidades, pasos y tiempo. Las calorías se calculan por ingrediente (y proteínas, grasas e hidratos por persona) con la tabla de alimentos de `recetas.js`. Se puede cambiar el número de personas, adaptar una receta «a nuestra manera» o escribir la de un plato propio.
- **Familia**: ficha de cada persona (edad, sexo, peso, altura y actividad). Con ella se calcula lo que necesita al día (fórmula de Mifflin-St Jeor en adultos y tablas de la EFSA en niños) y su ración respecto a la estándar de las recetas (2.000 kcal). También muestra lo que come cada uno en comida y cena por día, semana, mes y año.
- **Plan de salud**: en la ficha de cada persona se pueden poner las indicaciones de su médico (sal máxima, agua, proteína, grasa saturada, purinas, carne roja por semana, ultraprocesados y si toma IECA o ARA-II). Hay un botón con el plan de poliquistosis renal. Con eso la app:
  - avisa en la semana, en Mis platos y en cada receta de los platos con mucha sal (🧂), grasa saturada (🧈), purinas (🦐) o embutido (🥓), y explica cómo arreglarlo;
  - aconseja cuánta carne o pescado tomar para no pasarse de proteína;
  - marca como no aptos (⛔) la sal de régimen y los sustitutos de sal con cloruro potásico, y avisa si se apuntan en la compra;
  - hace el menú automático sin pasar de su máximo de carne roja y evitando los platos más salados;
  - muestra su sal, proteína, grasa saturada y carne roja por día, semana, mes y año, y lleva la cuenta del agua de cada día.

  La sal se calcula con el sodio de los ingredientes (tabla en `recetas.js`), sin contar la que se añada al cocinar. En Ajustes se puede indicar que en casa se usa caldo casero sin sal.
- **Citas**: citas médicas, reuniones, colegio… con día, hora, sitio, para quién y notas. Salen también en la Semana y se comparten con la familia. Avisan una semana antes y un día antes:
  - **en el móvil, aunque la app esté cerrada**: en cada móvil hay que pulsar «Activar avisos» (iPhone/iPad con iOS 16.4 o posterior, abriendo la app desde la pantalla de inicio). Los envía cada hora `.github/workflows/avisos.yml`, que necesita el secreto `FAMILIA_CODIGO` con el código de familia (Settings → Secrets and variables → Actions);
  - **dentro de la app**: al abrirla sale un recordatorio de las citas que tocan.
- **Ajustes**: temas (9 fotos para la cabecera, cada una con su color, «Según la pestaña» o el clásico; se guarda en cada móvil), qué planificar, ideas nuevas por semana, caldo casero, compartir la lista de platos y ayuda.
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

Los platos se guardan en el teléfono. Si se activa «Familia», también en la base de datos de Firebase del proyecto, en `/familias/<código>/menu-c`, **cifrados de extremo a extremo**: cada dato se cifra en el móvil (AES-GCM) con una clave que sale del código de familia, así que en Firebase solo hay textos cifrados y ni el dueño de la base de datos ni nadie sin el código puede leer platos, menús, citas, miembros ni la lista de la compra. Los datos de antes del cifrado (en la raíz de la familia) se pasan solos a cifrados al abrir la versión 17 y se borran una semana después.

El servicio de avisos (`.github/scripts/avisos.mjs`) descifra las citas con el secreto `FAMILIA_CODIGO`, guarda solo una huella de la fecha de cada cita y no escribe en los registros (que son públicos) ningún dato de las citas.

## Guía y «Desde foto o PDF»

- La primera vez (sin platos) se abre «Cómo funciona»; se puede volver a abrir en **Familia → ❓ Cómo funciona**. La guía para compartir está en [`guia.pdf`](guia.pdf).
- **📷 Desde foto o PDF** (en Citas, Compra y Familia): la app copia unas instrucciones, la persona adjunta la foto o el PDF en su propia app de IA (ChatGPT, Claude, Gemini…) y pega aquí la respuesta. La app la lee (JSON o texto suelto), deja revisarla y añade citas, cosas para la compra y platos. La app no envía nada a ningún sitio.

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
| `ajustes.js` | Pestaña Ajustes y temas. Las fotos de los temas están en `temas/`. |
| `citas.js` | Pestaña Citas, recordatorio al abrir la app y activación de los avisos del móvil (Web Push). |
| `.github/scripts/avisos.mjs` | Servicio que envía los avisos de las citas; lo ejecuta cada hora `.github/workflows/avisos.yml`. |
| `guia.js` | Guía de primeros pasos y «Desde foto o PDF» (instrucciones para la IA, lectura de la respuesta y revisión). |
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
