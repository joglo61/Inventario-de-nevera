import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { credenciales } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lista de lo que falta, para atajos: header "Authorization: Bearer <clave de la casa>".
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return new Response("No autorizado", { status: 401 });

  const { url, key } = credenciales();
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("lista_por_token", { t: token });
  // 28000: la clave no es de ninguna casa (ver lista_por_token en multi-casa.sql).
  if (error?.code === "28000") return new Response("No autorizado", { status: 401 });
  if (error) return new Response("Error", { status: 500 });

  const items = data as { nombre: string; emoji: string; categoria: string; nota: string | null }[];
  if (searchParams.get("formato") === "json") {
    return Response.json({ total: items.length, items });
  }
  const texto = items.map((p) => `${p.emoji} ${p.nombre}${p.nota ? ` · ${p.nota}` : ""}`).join("\n");
  return new Response(texto, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
