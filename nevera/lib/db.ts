import type { SupabaseClient } from "@supabase/supabase-js";

export type Producto = {
  id: string;
  nombre: string;
  emoji: string;
  categoria: string;
  agotado: boolean;
  agotado_en: string | null;
  orden: number;
  nota: string | null;
  ocasional: boolean;
  lugar: string | null;
};

export async function listarProductos(sb: SupabaseClient, casaId: string): Promise<Producto[]> {
  const { data, error } = await sb
    .from("productos")
    .select("*")
    .eq("casa_id", casaId)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Producto[];
}
