"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { listarProductos } from "@/lib/db";
import { esLugarCasa, reasignar } from "@/lib/lugares";
import { enviar } from "@/lib/push";
import { rutaSegura } from "@/lib/ruta";
import { CASA_ACTUAL, sesion, supabase } from "@/lib/supabase";

const OCASIONALES = "Ocasionales";
const UN_ANO = 60 * 60 * 24 * 365;

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

async function recordarCasa(casaId: string) {
  (await cookies()).set(CASA_ACTUAL, casaId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: UN_ANO,
    path: "/",
  });
}

// La casa que se está viendo; las reglas RLS impiden tocar casas ajenas aunque llegue otro id.
async function casaActual() {
  const s = await sesion();
  if (!s?.casa) throw new Error("Sin casa");
  return { sb: s.sb, casaId: s.casa.id, userId: s.user.id };
}

// ---------- Entrar con código por correo ----------

export type EstadoEntrar = { paso: "email" | "codigo"; email: string; error: string };

export async function entrar(prev: EstadoEntrar, fd: FormData): Promise<EstadoEntrar> {
  const sb = await supabase();
  if (prev.paso === "email") {
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { paso: "email", email, error: "Escribe un correo válido" };
    }
    const captchaToken = String(fd.get("captcha") ?? "") || undefined;
    const { error } = await sb.auth.signInWithOtp({ email, options: { captchaToken } });
    if (error) {
      const captcha = /captcha/i.test(error.message);
      return {
        paso: "email",
        email,
        error: captcha
          ? "No pudimos verificar que eres humano. Intenta otra vez."
          : "No se pudo enviar el código. Intenta en un momento.",
      };
    }
    return { paso: "codigo", email, error: "" };
  }

  if (fd.get("cambiar")) return { paso: "email", email: prev.email, error: "" };
  const token = String(fd.get("codigo") ?? "").replace(/\D/g, "");
  const { error } = await sb.auth.verifyOtp({ email: prev.email, token, type: "email" });
  if (error) return { ...prev, error: "Código incorrecto o vencido" };
  redirect(rutaSegura(fd.get("next")));
}

export async function cerrarSesion() {
  const sb = await supabase();
  await sb.auth.signOut();
  (await cookies()).delete(CASA_ACTUAL);
  redirect("/");
}

export async function elegirCasa(casaId: string) {
  await recordarCasa(casaId);
  revalidatePath("/");
}

// ---------- Sticker ----------

export async function activarSticker(sticker: string, fd: FormData) {
  const nombreCasa = String(fd.get("casa") ?? "").trim();
  const miNombre = String(fd.get("nombre") ?? "").trim();
  if (!nombreCasa || !miNombre) redirect(`/sticker/${sticker}?e=faltan`);
  const sb = await supabase();
  const { data, error } = await sb.rpc("activar_sticker", {
    s: sticker,
    nombre_casa: nombreCasa,
    mi_nombre: miNombre,
  });
  if (error) redirect(`/sticker/${sticker}?e=activar`);
  await recordarCasa(data as string);
  redirect("/");
}

export async function pedirAcceso(sticker: string, fd: FormData) {
  const miNombre = String(fd.get("nombre") ?? "").trim();
  if (!miNombre) redirect(`/sticker/${sticker}?e=faltan`);
  const sb = await supabase();
  const { error } = await sb.rpc("pedir_acceso", { s: sticker, mi_nombre: miNombre });
  if (error) redirect(`/sticker/${sticker}?e=pedir`);
  redirect(`/sticker/${sticker}`);
}

// ---------- Integrantes (las reglas RLS solo dejan hacerlo al dueño) ----------

async function cuantosDuenos(casa: Awaited<ReturnType<typeof casaActual>>) {
  const { count } = await casa.sb
    .from("miembros")
    .select("*", { count: "exact", head: true })
    .eq("casa_id", casa.casaId)
    .eq("rol", "dueno")
    .eq("estado", "activo");
  return count ?? 0;
}

async function rolDe(casa: Awaited<ReturnType<typeof casaActual>>, userId: string) {
  const { data } = await casa.sb
    .from("miembros")
    .select("rol")
    .eq("casa_id", casa.casaId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.rol as "dueno" | "miembro" | undefined;
}

function volver(error?: string): never {
  revalidatePath("/integrantes");
  redirect(error ? `/integrantes?e=${error}` : "/integrantes");
}

export async function aprobar(userId: string) {
  const casa = await casaActual();
  await casa.sb
    .from("miembros")
    .update({ estado: "activo" })
    .eq("casa_id", casa.casaId)
    .eq("user_id", userId);
  volver();
}

// Rechazar una solicitud o sacar a alguien de la casa.
export async function quitar(userId: string) {
  const casa = await casaActual();
  if ((await rolDe(casa, userId)) === "dueno" && (await cuantosDuenos(casa)) <= 1) volver("ultimo");
  await casa.sb.from("miembros").delete().eq("casa_id", casa.casaId).eq("user_id", userId);
  volver();
}

export async function cambiarRol(userId: string, rol: "dueno" | "miembro") {
  const casa = await casaActual();
  if (rol === "miembro" && (await cuantosDuenos(casa)) <= 1) volver("ultimo");
  await casa.sb.from("miembros").update({ rol }).eq("casa_id", casa.casaId).eq("user_id", userId);
  volver();
}

// ponytail: el último dueño no puede salir; borrar la casa y liberar el sticker queda para después.
export async function salirDeCasa() {
  const casa = await casaActual();
  if ((await rolDe(casa, casa.userId)) === "dueno" && (await cuantosDuenos(casa)) <= 1) {
    volver("ultimo");
  }
  await casa.sb.from("miembros").delete().eq("casa_id", casa.casaId).eq("user_id", casa.userId);
  (await cookies()).delete(CASA_ACTUAL);
  redirect("/");
}

// Los atajos con la clave anterior dejan de funcionar (útil al sacar a alguien de la casa).
export async function cambiarClave() {
  const casa = await casaActual();
  await casa.sb.rpc("cambiar_clave", { c: casa.casaId });
  volver();
}

// ---------- Recordatorio semanal (ver supabase/recordatorio.sql) ----------

// Día 0–6 (0 = domingo) y hora 0–23; día vacío = apagado. Las reglas RLS solo lo dejan a un dueño.
export async function guardarRecordatorio(fd: FormData) {
  const casa = await casaActual();
  const dia = String(fd.get("dia") ?? "");
  const hora = Number(fd.get("hora"));
  const apagado = dia === "";
  if (!apagado && !(Number.isInteger(Number(dia)) && Number.isInteger(hora))) volver("horario");
  await casa.sb
    .from("casas")
    .update({
      recordatorio_dia: apagado ? null : Number(dia),
      recordatorio_hora: apagado ? null : hora,
    })
    .eq("id", casa.casaId);
  volver();
}

export async function cambiarMiRecordatorio(activo: boolean) {
  const casa = await casaActual();
  await casa.sb.rpc("mi_recordatorio", { c: casa.casaId, activo });
  volver();
}

export async function guardarSuscripcion(endpoint: string, p256dh: string, auth: string) {
  const sb = await supabase();
  revisar(await sb.rpc("guardar_suscripcion", { e: endpoint, p: p256dh, a: auth }));
}

export async function borrarSuscripcion(endpoint: string) {
  const sb = await supabase();
  revisar(await sb.from("suscripciones").delete().eq("endpoint", endpoint));
}

// Manda un aviso a todos mis celulares con avisos activos, para comprobar que llegan.
export async function probarAviso() {
  const casa = await casaActual();
  const { data } = await casa.sb.from("suscripciones").select("endpoint, p256dh, auth");
  if (!data?.length) volver("sin-avisos");
  await Promise.all(
    data.map(async (s) => {
      const sigue = await enviar(s, {
        titulo: "Nevera",
        cuerpo: "Así te llegará el recordatorio de lo que falta 🎉",
        url: "/",
      }).catch(() => true);
      if (!sigue) await casa.sb.from("suscripciones").delete().eq("endpoint", s.endpoint);
    })
  );
  volver("prueba-enviada");
}

export async function renombrarCasa(fd: FormData) {
  const nombre = String(fd.get("nombre") ?? "").trim().slice(0, 40);
  const casa = await casaActual();
  if (nombre) await casa.sb.from("casas").update({ nombre }).eq("id", casa.casaId);
  revalidatePath("/");
  volver();
}

// ---------- Productos ----------

export async function alternar(id: string, agotado: boolean) {
  const { sb, casaId } = await casaActual();
  // Los ocasionales no vuelven a la lista: al comprarlos se borran.
  if (!agotado) {
    revisar(
      await sb.from("productos").delete().eq("id", id).eq("casa_id", casaId).eq("ocasional", true)
    );
  }
  revisar(
    await sb
      .from("productos")
      // Al comprarlo (desmarcar) la nota se borra; al marcarlo se conserva la que tenga.
      .update(
        agotado ? { agotado, agotado_en: new Date().toISOString() } : { agotado, agotado_en: null, nota: null }
      )
      .eq("id", id)
      .eq("casa_id", casaId)
  );
  revalidatePath("/");
}

export async function limpiarTodo() {
  const { sb, casaId } = await casaActual();
  revisar(await sb.from("productos").delete().eq("casa_id", casaId).eq("ocasional", true));
  revisar(
    await sb
      .from("productos")
      .update({ agotado: false, agotado_en: null, nota: null })
      .eq("casa_id", casaId)
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
  const { sb, casaId } = await casaActual();
  const datos = campos(nombre, emoji, ocasional ? OCASIONALES : categoria);
  if (!datos.nombre) return;
  const productos = await listarProductos(sb, casaId);
  const orden = productos.reduce((m, p) => Math.max(m, p.orden), 0) + 1;
  revisar(
    await sb.from("productos").insert({
      ...datos,
      casa_id: casaId,
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
  const { sb, casaId } = await casaActual();
  const datos = campos(nombre, emoji, categoria);
  if (!datos.nombre) return;
  revisar(
    await sb
      .from("productos")
      .update({ ...datos, nota: limpiarNota(nota) })
      .eq("id", id)
      .eq("casa_id", casaId)
  );
  // El lugar es de la categoría: se cambia para todos sus productos.
  if (esLugarCasa(lugar)) {
    revisar(
      await sb
        .from("productos")
        .update({ lugar })
        .eq("casa_id", casaId)
        .eq("categoria", datos.categoria)
        .eq("ocasional", false)
    );
  }
  revalidatePath("/");
}

export async function anotar(id: string, nota: string) {
  const { sb, casaId } = await casaActual();
  revisar(
    await sb.from("productos").update({ nota: limpiarNota(nota) }).eq("id", id).eq("casa_id", casaId)
  );
  revalidatePath("/");
}

// Recibe los ids de un estante en su nuevo orden.
export async function ordenar(ids: string[]) {
  const { sb, casaId } = await casaActual();
  const unicos = [...new Set(ids)].slice(0, 100);
  const { data } = revisar(
    await sb.from("productos").select("id, orden").eq("casa_id", casaId).in("id", unicos)
  );
  if (!data || data.length !== unicos.length) return;
  const valores = reasignar(data.map((p) => p.orden));
  // ponytail: un update por producto y sin transacción; basta para estantes de pocos productos.
  await Promise.all(
    unicos.map(async (id, i) =>
      revisar(
        await sb.from("productos").update({ orden: valores[i] }).eq("id", id).eq("casa_id", casaId)
      )
    )
  );
  revalidatePath("/");
}

export async function eliminar(id: string) {
  const { sb, casaId } = await casaActual();
  revisar(await sb.from("productos").delete().eq("id", id).eq("casa_id", casaId));
  revalidatePath("/");
}
