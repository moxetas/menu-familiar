// Envía los avisos de las citas: una semana antes y un día antes.
// Lo ejecuta cada hora .github/workflows/avisos.yml. Necesita el secreto FAMILIA_CODIGO (el código de familia de la app).
//
// Lee de Firebase el documento de la familia (/familias/<código>):
//   citas    → las citas apuntadas en la app
//   push     → los móviles que han activado los avisos (suscripciones Web Push)
//   vapid    → las claves para firmar los avisos (las crea el primer móvil que los activa)
//   avisados → qué avisos ya se han enviado de cada cita (lo escribe este script)
//   servidor → cuándo pasó este script por última vez (lo enseña la app)

export const FIREBASE_DB = 'https://menu-familiar-a2424-default-rtdb.europe-west1.firebasedatabase.app';
const DIA = 864e5;
const AVISOS = { semana: 7 * DIA, dia: DIA };

// Fecha y hora de una zona horaria («2026-11-14», «10:30», «Europe/Madrid») → milisegundos UTC
export function horaEnZona(fecha, hora, zona) {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = (hora || '09:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const offset = (t) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: zona, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
  };
  let t = guess - offset(guess);
  const o2 = offset(t);
  if (guess - o2 !== t) t = guess - o2;
  return t;
}

const TIPOS = { medica: '🩺', reunion: '💼', colegio: '🏫', otra: '📌' };

export function textoAviso(cita, tipo, ahora, nombres = {}) {
  const zona = cita.zona || 'Europe/Madrid';
  const t = horaEnZona(cita.fecha, cita.hora, zona);
  const fmtDia = new Intl.DateTimeFormat('es-ES', { timeZone: zona, weekday: 'long', day: 'numeric', month: 'long' });
  const dias = Math.round((Date.UTC(...cita.fecha.split('-').map((n, i) => (i === 1 ? n - 1 : +n))) - Date.UTC(...new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(new Date(ahora)).split('-').map((n, i) => (i === 1 ? n - 1 : +n)))) / DIA);
  const cuando = dias <= 0 ? 'hoy' : dias === 1 ? 'mañana' : dias === 7 ? 'dentro de una semana' : `dentro de ${dias} días`;
  const quien = cita.para && nombres[cita.para] ? ` · ${nombres[cita.para]}` : '';
  return {
    title: `${TIPOS[cita.tipo] || '📌'} ${cita.titulo}`,
    body: `${cuando[0].toUpperCase()}${cuando.slice(1)}, ${fmtDia.format(new Date(t))}${cita.hora ? ` a las ${cita.hora}` : ''}${cita.lugar ? ` · ${cita.lugar}` : ''}${quien}`,
    tag: `cita-${cita.id || ''}-${tipo}`,
    url: './#citas',
  };
}

// Decide qué avisos tocan ahora. Devuelve { enviar: [{ id, cita, tipo }], avisados (actualizado) }.
export function avisosQueTocan(data, ahora) {
  const avisados = JSON.parse(JSON.stringify(data.avisados || {}));
  const enviar = [];
  for (const [id, cita] of Object.entries(data.citas || {})) {
    if (!cita || !cita.fecha || !cita.titulo) continue;
    const t = horaEnZona(cita.fecha, cita.hora, cita.zona || 'Europe/Madrid');
    if (t <= ahora) { delete avisados[id]; continue; }           // ya pasó: se limpia
    const firma = `${cita.fecha}|${cita.hora || ''}`;
    let hecho = avisados[id];
    if (!hecho || hecho.firma !== firma) hecho = { firma };          // cita nueva o cambiada de fecha: avisos desde cero
    for (const [tipo, ms] of Object.entries(AVISOS)) {
      if (hecho[tipo] || cita.avisos?.[tipo] === false || ahora < t - ms) continue;
      // El de la semana no se manda si ya falta poco (la cita se apuntó tarde): ya llegará el del día antes
      if (tipo === 'semana' && t - ahora < 2 * DIA) { hecho[tipo] = 'no hacía falta'; continue; }
      enviar.push({ id, cita: { ...cita, id }, tipo });
      hecho[tipo] = ahora;
    }
    avisados[id] = hecho;
  }
  for (const id of Object.keys(avisados)) if (!data.citas?.[id]) delete avisados[id];
  return { enviar, avisados };
}

async function firebase(code, path, method = 'GET', body) {
  const res = await fetch(`${FIREBASE_DB}/familias/${code}/${path}.json`, method === 'GET' ? {} : { method, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Firebase ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function run({ code, ahora = Date.now(), send, db = firebase }) {
  const data = (await db(code, '')) || {};
  const nombres = Object.fromEntries(Object.entries(data.members || {}).map(([id, m]) => [id, m.name]));
  const { enviar, avisados } = avisosQueTocan(data, ahora);
  const subs = Object.entries(data.push || {});
  let enviados = 0;
  const caducados = new Set();
  for (const { cita, tipo } of enviar) {
    const aviso = textoAviso(cita, tipo, ahora, nombres);
    for (const [subId, sub] of subs) {
      if (caducados.has(subId)) continue;
      if (sub.soloDe && cita.para && cita.para !== sub.soloDe) continue;
      try {
        await send({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(aviso), data.vapid);
        enviados++;
      } catch (e) {
        // 404/410: el móvil ya no acepta avisos (app borrada o avisos desactivados)
        if (e.statusCode === 404 || e.statusCode === 410) caducados.add(subId);
        else console.log(`No se pudo avisar a ${sub.dispositivo || subId}: ${e.statusCode || ''} ${e.body || e.message}`);
      }
    }
    console.log(`Aviso «${tipo}» de «${cita.titulo}» (${cita.fecha} ${cita.hora || ''}) → ${subs.length} móviles`);
  }
  const cambios = { avisados, servidor: { ultimaVez: ahora, enviados, moviles: subs.length - caducados.size } };
  for (const id of caducados) cambios[`push/${id}`] = null;
  await db(code, '', 'PATCH', cambios);
  return { enviar, enviados, caducados: [...caducados] };
}

// Ejecutado directamente (desde GitHub Actions)
if (import.meta.url === `file://${process.argv[1]}`) {
  const code = (process.env.FAMILIA_CODIGO || '').trim();
  if (!code) {
    console.log('::warning::Falta el secreto FAMILIA_CODIGO. Ponlo en GitHub: Settings → Secrets and variables → Actions.');
    process.exit(0);
  }
  const webpush = (await import('web-push')).default;
  const send = async (sub, payload, vapid) => {
    if (!vapid?.publicKey || !vapid?.privateKey) throw new Error('Aún no hay claves de avisos (se crean al activar los avisos en un móvil)');
    return webpush.sendNotification(sub, payload, {
      vapidDetails: { subject: 'https://moxetas.github.io/menu-familiar/', publicKey: vapid.publicKey, privateKey: vapid.privateKey },
      TTL: 12 * 3600,
      urgency: 'high',
    });
  };
  const r = await run({ code, send });
  console.log(`Listo: ${r.enviar.length} avisos, ${r.enviados} envíos${r.caducados.length ? `, ${r.caducados.length} móviles dados de baja` : ''}.`);
}
