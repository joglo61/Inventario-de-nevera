import { NextRequest } from "next/server";
import { codigoValido } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (!codigoValido(searchParams.get("codigo"))) {
    return new Response("No autorizado", { status: 401 });
  }

  const { data, error } = await db()
    .from("productos")
    .select("nombre, emoji, categoria, agotado_en")
    .eq("agotado", true)
    .order("orden", { ascending: true });

  if (error) return new Response("Error", { status: 500 });

  if (searchParams.get("formato") === "json") {
    return Response.json({ total: data.length, items: data });
  }

  const texto = data.map((p) => `${p.emoji} ${p.nombre}`).join("\n");
  return new Response(texto, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
