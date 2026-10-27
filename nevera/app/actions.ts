"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, listarProductos } from "@/lib/db";
import { codigoValido, haySesion } from "@/lib/auth";

const OCASIONALES = "Ocasionales";

function campos(nombre: string, emoji: string, categoria: string) {
  return {
    nombre: nombre.trim().slice(0, 40),
    emoji: emoji.trim().slice(0, 8) || "🛒",
    categoria: categoria.trim().slice(0, 30) || "Otros",
  };
}

function limpiarNota(nota: string) {
  return nota.trim().slice(0, 40) || null;
}

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
  // Los ocasionales no vuelven a la lista: al comprarlos se borran.
  if (!agotado) await db().from("productos").delete().eq("id", id).eq("ocasional", true);
  await db()
    .from("productos")
    // Al comprarlo (desmarcar) la nota se borra; al marcarlo se conserva la que tenga.
    .update(
      agotado ? { agotado, agotado_en: new Date().toISOString() } : { agotado, agotado_en: null, nota: null }
    )
    .eq("id", id);
  revalidatePath("/");
}

export async function limpiarTodo() {
  if (!(await haySesion())) return;
  await db().from("productos").delete().eq("ocasional", true);
  await db()
    .from("productos")
    .update({ agotado: false, agotado_en: null, nota: null })
    .eq("agotado", true);
  revalidatePath("/");
}

export async function agregar(
  nombre: string,
  emoji: string,
  categoria: string,
  ocasional = false,
  nota = ""
) {
  if (!(await haySesion())) return;
  const datos = campos(nombre, emoji, ocasional ? OCASIONALES : categoria);
  if (!datos.nombre) return;
  const productos = await listarProductos();
  const orden = productos.reduce((m, p) => Math.max(m, p.orden), 0) + 1;
  await db().from("productos").insert({
    ...datos,
    orden,
    ocasional,
    agotado: ocasional,
    agotado_en: ocasional ? new Date().toISOString() : null,
    nota: limpiarNota(nota),
  });
  revalidatePath("/");
}

export async function editar(
  id: string,
  nombre: string,
  emoji: string,
  categoria: string,
  nota: string
) {
  if (!(await haySesion())) return;
  const datos = campos(nombre, emoji, categoria);
  if (!datos.nombre) return;
  await db().from("productos").update({ ...datos, nota: limpiarNota(nota) }).eq("id", id);
  revalidatePath("/");
}

export async function anotar(id: string, nota: string) {
  if (!(await haySesion())) return;
  await db().from("productos").update({ nota: limpiarNota(nota) }).eq("id", id);
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
