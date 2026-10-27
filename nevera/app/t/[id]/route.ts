import { NextResponse } from "next/server";
import { CASA_ACTUAL, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Redirección relativa: en Netlify req.url trae la dirección interna del deploy
// (xxxx--sitio.netlify.app) y el cliente saldría de la dirección donde tiene la sesión.
const ir = (ruta: string) => new NextResponse(null, { status: 307, headers: { Location: ruta } });

// Lo que abre el sticker NFC. Si eres de la casa, entras directo; si no, a activar o pedir acceso.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabase();
  // Después de entrar se vuelve a /sticker (una página), no a /t: /t no recibe formularios.
  if (!(await sb.auth.getUser()).data.user) return ir(`/entrar?next=/sticker/${encodeURIComponent(id)}`);

  const { data } = await sb.rpc("estado_sticker", { s: id });
  const info = data?.[0] as { estado: string; casa_id: string | null } | undefined;
  if (info?.estado !== "miembro" || !info.casa_id) return ir(`/sticker/${encodeURIComponent(id)}`);

  const res = ir("/");
  res.cookies.set(CASA_ACTUAL, info.casa_id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
