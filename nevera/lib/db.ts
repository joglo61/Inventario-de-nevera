import { createClient } from "@supabase/supabase-js";

export type Producto = {
  id: string;
  nombre: string;
  emoji: string;
  categoria: string;
  agotado: boolean;
  agotado_en: string | null;
  orden: number;
};

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de Supabase");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function listarProductos(): Promise<Producto[]> {
  const { data, error } = await db()
    .from("productos")
    .select("*")
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Producto[];
}
