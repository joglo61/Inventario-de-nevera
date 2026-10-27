import { NextResponse, type NextRequest } from "next/server";
import { CASA_ACTUAL, supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lo que abre el sticker NFC. Si eres de la casa, entras directo; si no, a activar o pedir acceso.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ir = (ruta: string) => NextResponse.redirect(new URL(ruta, req.url));
  const sb = await supabase();
  if (!(await sb.auth.getUser()).data.user) return ir(`/entrar?next=/t/${encodeURIComponent(id)}`);

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
