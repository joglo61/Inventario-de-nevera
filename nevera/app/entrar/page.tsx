import { redirect } from "next/navigation";
import { rutaSegura } from "@/lib/ruta";
import { supabase } from "@/lib/supabase";
import Login from "../login";

export const dynamic = "force-dynamic";

export default async function Entrar({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = rutaSegura((await searchParams).next);
  const sb = await supabase();
  if ((await sb.auth.getUser()).data.user) redirect(next);
  return <Login next={next} titulo="Entra con tu correo para continuar" />;
}
