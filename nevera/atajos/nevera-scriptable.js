// Nevera — qué falta en tu casa. Para la app Scriptable (iPhone).
// Funciona al abrirlo, como widget en la pantalla de inicio y con Siri (desde un atajo).
// La primera vez pide la clave de tu casa (app → Integrantes → Casa) y la guarda en el llavero.

const API = "https://inventario-de-nevera.netlify.app/api/lista?formato=json";
const APP = "https://inventario-de-nevera.netlify.app";
const LLAVE = "nevera_clave";

const MENSAJES = {
  "sin-clave": "Abre este script en Scriptable para poner la clave de tu casa.",
  clave: "La clave no es válida. Abre el script en Scriptable para ponerla otra vez.",
  conexion: "Sin conexión a internet.",
  servidor: "La app no respondió. Intenta en un momento.",
};

const linea = (p) => `${p.emoji} ${p.nombre}${p.nota ? " · " + p.nota : ""}`;

async function avisar(titulo, mensaje) {
  const a = new Alert();
  a.title = titulo;
  a.message = mensaje;
  a.addAction("OK");
  await a.present();
}

async function pedirClave() {
  const a = new Alert();
  a.title = "Clave de tu casa";
  a.message = "Cópiala en la app: Integrantes → Casa → Clave para atajos.";
  a.addTextField("Clave");
  a.addAction("Guardar");
  a.addCancelAction("Cancelar");
  if ((await a.present()) === -1) return null;
  const clave = a.textFieldValue(0).trim();
  // Las claves son 32 letras/números: atrapa copias incompletas o con texto de más.
  if (!/^[0-9a-f]{32}$/i.test(clave)) {
    await avisar("Clave incompleta", "Revisa que la copiaste completa, sin espacios.");
    return null;
  }
  Keychain.set(LLAVE, clave);
  return clave;
}

async function cargar(clave) {
  const req = new Request(API);
  req.headers = { Authorization: `Bearer ${clave}` };
  const cuerpo = await req.loadString();
  const estado = req.response.statusCode;
  if (estado === 401) return { error: "clave" };
  if (estado !== 200) return { error: "servidor" };
  return { items: JSON.parse(cuerpo).items };
}

function widget(r) {
  const fondo = Color.dynamic(new Color("#FAFAF9"), new Color("#0C0A09"));
  const tinta = Color.dynamic(new Color("#1C1917"), new Color("#FAFAF9"));
  const suave = Color.dynamic(new Color("#57534E"), new Color("#A8A29E"));
  const oro = Color.dynamic(new Color("#A16207"), new Color("#E0B656"));

  const w = new ListWidget();
  w.backgroundColor = fondo;
  w.url = APP;
  w.setPadding(14, 14, 14, 14);

  const titulo = w.addText("FALTA EN CASA");
  titulo.font = Font.boldSystemFont(11);
  titulo.textColor = oro;
  w.addSpacer(6);

  const texto = (t, color, tamano = 13) => {
    const l = w.addText(t);
    l.font = Font.systemFont(tamano);
    l.textColor = color;
    l.lineLimit = 1;
  };

  if (r.error) {
    const l = w.addText(MENSAJES[r.error]);
    l.font = Font.systemFont(12);
    l.textColor = suave;
  } else if (r.items.length === 0) {
    texto("Todo en orden ✨", tinta, 15);
  } else {
    const max = config.widgetFamily === "large" ? 13 : 5;
    r.items.slice(0, max).forEach((p) => texto(linea(p), tinta));
    if (r.items.length > max) texto(`+${r.items.length - max} más`, suave, 12);
  }

  w.addSpacer();
  w.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);
  return w;
}

let clave = Keychain.contains(LLAVE) ? Keychain.get(LLAVE) : null;
// Desde el widget o Siri no se puede preguntar nada: la clave se pone abriendo el script.
if (!clave && config.runsInApp) clave = await pedirClave();

let r;
if (!clave) r = { error: "sin-clave" };
else {
  try {
    r = await cargar(clave);
  } catch {
    r = { error: "conexion" };
  }
}
if (r.error === "clave") Keychain.remove(LLAVE);

const texto = r.error
  ? MENSAJES[r.error]
  : r.items.length
    ? r.items.map(linea).join("\n")
    : "No falta nada en la casa 🎉";

if (config.runsInWidget) {
  Script.setWidget(widget(r));
} else if (config.runsWithSiri) {
  // Siri lee lo que devuelve el script.
  Script.setShortcutOutput(
    r.items?.length ? `Falta: ${r.items.map((p) => p.nombre).join(", ")}.` : texto
  );
} else {
  const a = new Alert();
  a.title = "Falta en casa";
  a.message = texto;
  a.addAction("Abrir Nevera");
  a.addCancelAction("Cerrar");
  if ((await a.present()) === 0) Safari.open(APP);
  Script.setShortcutOutput(texto);
}
Script.complete();
