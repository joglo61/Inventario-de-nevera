import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const CASA_ACTUAL = "casa_actual";

export function credenciales() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de Supabase");
  return { url, key };
}

// Cliente que actúa como el usuario que entró: las reglas RLS deciden qué puede ver.
export async function supabase() {
  const c = await cookies();
  const { url, key } = credenciales();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => c.getAll(),
      setAll: (lista) => {
        // En un Server Component no se pueden escribir cookies; el middleware renueva la sesión.
        try {
          lista.forEach(({ name, value, options }) => c.set(name, value, options));
        } catch {}
      },
    },
  });
}

export type Casa = { id: string; nombre: string };

// Usuario, sus casas (solo donde está activo, por RLS) y la casa que está viendo.
export async function sesion() {
  const sb = await supabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("casas").select("id, nombre").order("creado_en");
  const casas: Casa[] = data ?? [];
  const elegida = (await cookies()).get(CASA_ACTUAL)?.value;
  const casa = casas.find((c) => c.id === elegida) ?? casas[0] ?? null;
  return { sb, user, casas, casa };
}
