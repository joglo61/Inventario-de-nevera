import webpush from "web-push";

export type Suscripcion = { endpoint: string; p256dh: string; auth: string };
export type Aviso = { titulo: string; cuerpo: string; url?: string };

let configurado = false;
function configurar() {
  if (configurado) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) throw new Error("Faltan claves VAPID");
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configurado = true;
}

// Devuelve false si el celular ya no acepta avisos (quitó el permiso o desinstaló): hay que borrarla.
export async function enviar(s: Suscripcion, aviso: Aviso): Promise<boolean> {
  configurar();
  try {
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      JSON.stringify(aviso),
      { TTL: 60 * 60 * 12 }
    );
    return true;
  } catch (e) {
    const codigo = (e as { statusCode?: number }).statusCode;
    if (codigo === 404 || codigo === 410) return false;
    throw e;
  }
}

// "Falta: 🥛 Leche · 2, 🍅 Tomate y 3 más"
export function textoLista(items: string[], max = 4) {
  const visibles = items.slice(0, max).join(", ");
  return items.length > max ? `Falta: ${visibles} y ${items.length - max} más` : `Falta: ${visibles}`;
}
