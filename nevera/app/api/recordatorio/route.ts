import { timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { enviar, textoLista } from "@/lib/push";
import { credenciales } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function igual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Fila = { endpoint: string; clave_p256dh: string; clave_auth: string; casa: string; lista: string[] };

// Lo llama Supabase (pg_cron) al inicio de cada hora: envía el recordatorio de las casas
// que lo tienen programado para esta hora. Ver supabase/recordatorio.sql.
export async function POST(req: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || !igual(req.headers.get("x-cron-secret") ?? "", secreto)) {
    return new Response("No autorizado", { status: 401 });
  }

  const { url, key } = credenciales();
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("recordatorios_pendientes", { secreto });
  if (error) return new Response("Error", { status: 500 });

  const filas = data as Fila[];
  let enviados = 0;
  await Promise.all(
    filas.map(async (f) => {
      try {
        const sigue = await enviar(
          { endpoint: f.endpoint, p256dh: f.clave_p256dh, auth: f.clave_auth },
          { titulo: `Nevera · ${f.casa}`, cuerpo: textoLista(f.lista), url: "/" }
        );
        if (sigue) enviados++;
        else await sb.rpc("borrar_suscripcion_vencida", { secreto, e: f.endpoint });
      } catch {
        // Un celular que falla no detiene a los demás.
      }
    })
  );
  return Response.json({ enviados, total: filas.length });
}
