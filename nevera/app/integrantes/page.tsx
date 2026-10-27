import Link from "next/link";
import { redirect } from "next/navigation";
import {
  aprobar,
  cambiarClave,
  cambiarRol,
  cerrarSesion,
  quitar,
  renombrarCasa,
  salirDeCasa,
} from "../actions";
import Confirmar from "../confirmar";
import { Icono } from "@/lib/iconos";
import { sesion } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Miembro = {
  user_id: string;
  nombre: string;
  email: string;
  rol: "dueno" | "miembro";
  estado: "pendiente" | "activo";
};

const ERRORES: Record<string, string> = {
  ultimo: "La casa necesita al menos un dueño. Nombra otro dueño primero.",
};

export default async function Integrantes({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const s = await sesion();
  if (!s) redirect("/entrar?next=/integrantes");
  if (!s.casa) redirect("/");
  const error = ERRORES[(await searchParams).e ?? ""];

  // La clave solo se la da la base de datos a un dueño; a los demás les llega vacía.
  const [{ data }, { data: clave }] = await Promise.all([
    s.sb
      .from("miembros")
      .select("user_id, nombre, email, rol, estado")
      .eq("casa_id", s.casa.id)
      .order("creado_en"),
    s.sb.rpc("clave_de_casa", { c: s.casa.id }),
  ]);
  const miembros = (data ?? []) as Miembro[];
  const yo = miembros.find((m) => m.user_id === s.user.id);
  const esDueno = yo?.rol === "dueno";
  const pendientes = miembros.filter((m) => m.estado === "pendiente");
  const activos = miembros.filter((m) => m.estado === "activo");

  return (
    <main className="app pagina">
      <header className="top">
        <div>
          <p className="eyebrow">{s.casa.nombre}</p>
          <h1>Integrantes</h1>
        </div>
        <Link href="/" className="chip">
          <Icono n="izq" size={16} />
          Volver
        </Link>
      </header>

      {error && <p className="error bloque">{error}</p>}

      {esDueno && pendientes.length > 0 && (
        <section className="tarjeta">
          <h2>Solicitudes</h2>
          <ul className="personas">
            {pendientes.map((m) => (
              <li key={m.user_id}>
                <div className="persona">
                  <strong>{m.nombre || "Sin nombre"}</strong>
                  <span>{m.email}</span>
                </div>
                <div className="persona-acciones">
                  <form action={aprobar.bind(null, m.user_id)}>
                    <button className="mini prim">Aprobar</button>
                  </form>
                  <form action={quitar.bind(null, m.user_id)}>
                    <Confirmar pregunta={`¿Rechazar a ${m.nombre || m.email}?`} className="mini">
                      Rechazar
                    </Confirmar>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tarjeta">
        <h2>En la casa</h2>
        <ul className="personas">
          {activos.map((m) => (
            <li key={m.user_id}>
              <div className="persona">
                <strong>
                  {m.nombre || "Sin nombre"}
                  {m.user_id === s.user.id && " (tú)"}
                </strong>
                <span>
                  {m.rol === "dueno" ? "Dueño" : "Miembro"} · {m.email}
                </span>
              </div>
              {esDueno && m.user_id !== s.user.id && (
                <div className="persona-acciones">
                  <form action={cambiarRol.bind(null, m.user_id, m.rol === "dueno" ? "miembro" : "dueno")}>
                    <button className="mini">{m.rol === "dueno" ? "Quitar dueño" : "Hacer dueño"}</button>
                  </form>
                  <form action={quitar.bind(null, m.user_id)}>
                    <Confirmar pregunta={`¿Sacar a ${m.nombre || m.email} de la casa?`} className="mini peligro">
                      Sacar
                    </Confirmar>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {esDueno && (
        <section className="tarjeta">
          <h2>Casa</h2>
          <form action={renombrarCasa} className="fila">
            <input name="nombre" defaultValue={s.casa.nombre} aria-label="Nombre de la casa" maxLength={40} required />
            <button className="mini prim">Guardar</button>
          </form>
          {clave && (
            <>
              <p className="ayuda">
                Clave para atajos (/api/lista): <code>{clave}</code>
              </p>
              <form action={cambiarClave} className="fila-sola">
                <Confirmar
                  pregunta="¿Cambiar la clave? Los atajos con la clave actual dejarán de funcionar y tendrás que poner la nueva."
                  className="mini"
                >
                  Cambiar clave
                </Confirmar>
              </form>
              <p className="ayuda">Si sacas a alguien de la casa, cámbiala para que su atajo deje de ver tu lista.</p>
            </>
          )}
        </section>
      )}

      <section className="acciones-pie">
        <form action={salirDeCasa}>
          <Confirmar pregunta="¿Salir de esta casa? Tendrás que pedir acceso otra vez." className="btn-sec peligro">
            Salir de la casa
          </Confirmar>
        </form>
        <form action={cerrarSesion}>
          <button className="btn-sec">Cerrar sesión</button>
        </form>
      </section>
    </main>
  );
}
