"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db, listarProductos } from "@/lib/db";
import { codigoValido, haySesion } from "@/lib/auth";
import { esLugarCasa, reasignar } from "@/lib/lugares";

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

// Si Supabase falla, la action lanza error para que la pantalla lo avise y deshaga el cambio.
function revisar<T extends { error: { message: string } | null }>(r: T): T {
  if (r.error) throw new Error(r.error.message);
  return r;
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
  if (!agotado) revisar(await db().from("productos").delete().eq("id", id).eq("ocasional", true));
  revisar(
    await db()
      .from("productos")
      // Al comprarlo (desmarcar) la nota se borra; al marcarlo se conserva la que tenga.
      .update(
        agotado ? { agotado, agotado_en: new Date().toISOString() } : { agotado, agotado_en: null, nota: null }
      )
      .eq("id", id)
  );
  revalidatePath("/");
}

export async function limpiarTodo() {
  if (!(await haySesion())) return;
  revisar(await db().from("productos").delete().eq("ocasional", true));
  revisar(
    await db()
      .from("productos")
      .update({ agotado: false, agotado_en: null, nota: null })
      .eq("agotado", true)
  );
  revalidatePath("/");
}

export async function agregar(
  nombre: string,
  emoji: string,
  categoria: string,
  lugar: string,
  ocasional = false,
  nota = ""
) {
  if (!(await haySesion())) return;
  const datos = campos(nombre, emoji, ocasional ? OCASIONALES : categoria);
  if (!datos.nombre) return;
  const productos = await listarProductos();
  const orden = productos.reduce((m, p) => Math.max(m, p.orden), 0) + 1;
  revisar(
    await db().from("productos").insert({
      ...datos,
      orden,
      ocasional,
      lugar: !ocasional && esLugarCasa(lugar) ? lugar : null,
      agotado: ocasional,
      agotado_en: ocasional ? new Date().toISOString() : null,
      nota: limpiarNota(nota),
    })
  );
  revalidatePath("/");
}

export async function editar(
  id: string,
  nombre: string,
  emoji: string,
  categoria: string,
  lugar: string,
  nota: string
) {
  if (!(await haySesion())) return;
  const datos = campos(nombre, emoji, categoria);
  if (!datos.nombre) return;
  revisar(await db().from("productos").update({ ...datos, nota: limpiarNota(nota) }).eq("id", id));
  // El lugar es de la categoría: se cambia para todos sus productos.
  if (esLugarCasa(lugar)) {
    revisar(
      await db()
        .from("productos")
        .update({ lugar })
        .eq("categoria", datos.categoria)
        .eq("ocasional", false)
    );
  }
  revalidatePath("/");
}

export async function anotar(id: string, nota: string) {
  if (!(await haySesion())) return;
  revisar(await db().from("productos").update({ nota: limpiarNota(nota) }).eq("id", id));
  revalidatePath("/");
}

// Recibe los ids de un estante en su nuevo orden.
export async function ordenar(ids: string[]) {
  if (!(await haySesion())) return;
  const unicos = [...new Set(ids)].slice(0, 100);
  const { data } = revisar(await db().from("productos").select("id, orden").in("id", unicos));
  if (!data || data.length !== unicos.length) return;
  const valores = reasignar(data.map((p) => p.orden));
  // ponytail: un update por producto y sin transacción; basta para estantes de pocos productos.
  await Promise.all(
    unicos.map(async (id, i) =>
      revisar(await db().from("productos").update({ orden: valores[i] }).eq("id", id))
    )
  );
  revalidatePath("/");
}

export async function eliminar(id: string) {
  if (!(await haySesion())) return;
  revisar(await db().from("productos").delete().eq("id", id));
  revalidatePath("/");
}

export async function leer() {
  if (!(await haySesion())) return [];
  return listarProductos();
}
