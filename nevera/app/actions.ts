"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, listarProductos } from "@/lib/db";
import { codigoValido, haySesion } from "@/lib/auth";

export async function entrar(_: unknown, formData: FormData) {
  const codigo = String(formData.get("codigo") ?? "").trim();
  if (!codigoValido(codigo)) return { error: "Código incorrecto" };
  const c = await cookies();
  c.set("casa", codigo, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  revalidatePath("/");
  return { error: "" };
}

export async function alternar(id: string, agotado: boolean) {
  if (!(await haySesion())) return;
  await db()
    .from("productos")
    .update({ agotado, agotado_en: agotado ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/");
}

export async function limpiarTodo() {
  if (!(await haySesion())) return;
  await db()
    .from("productos")
    .update({ agotado: false, agotado_en: null })
    .eq("agotado", true);
  revalidatePath("/");
}

export async function agregar(nombre: string, emoji: string, categoria: string) {
  if (!(await haySesion())) return;
  const limpio = nombre.trim().slice(0, 40);
  if (!limpio) return;
  const productos = await listarProductos();
  const orden = productos.reduce((m, p) => Math.max(m, p.orden), 0) + 1;
  await db().from("productos").insert({
    nombre: limpio,
    emoji: emoji.trim().slice(0, 8) || "🛒",
    categoria: categoria.trim().slice(0, 30) || "Otros",
    orden,
  });
  revalidatePath("/");
}

export async function eliminar(id: string) {
  if (!(await haySesion())) return;
  await db().from("productos").delete().eq("id", id);
  revalidatePath("/");
}

export async function leer() {
  if (!(await haySesion())) return [];
  return listarProductos();
}
