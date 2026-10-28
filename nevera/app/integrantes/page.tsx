import Link from "next/link";
import { redirect } from "next/navigation";
import {
  aprobar,
  cambiarClave,
  cambiarMiRecordatorio,
  cambiarRol,
  cerrarSesion,
  guardarRecordatorio,
  probarAviso,
  quitar,
  renombrarCasa,
  salirDeCasa,
} from "../actions";
import Avisos from "../avisos";
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
  recibe_recordatorio: boolean;
};

const ERRORES: Record<string, string> = {
  ultimo: "La casa necesita al menos un dueño. Nombra otro dueño primero.",
  horario: "Elige una hora válida.",
  "sin-avisos": "Primero activa los avisos en este celular.",
};

const LISTO: Record<string, string> = {
  "prueba-enviada": "Aviso de prueba enviado. Debería llegarte en unos segundos.",
};

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SEMANA = [1, 2, 3, 4, 5, 6, 0]; // en Colombia la semana arranca el lunes
const dosCifras = (n: number) => String(n).padStart(2, "0");
const formatoHora = (h: number, m: number) => `${h % 12 || 12}:${dosCifras(m)} ${h < 12 ? "a. m." : "p. m."}`;
const listaDias = (dias: number[]) =>
  dias.length === 7
    ? "Todos los días"
    : new Intl.ListFormat("es").format(SEMANA.filter((d) => dias.includes(d)).map((d) => DIAS[d]));

export default async function Integrantes({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const s = await sesion();
  if (!s) redirect("/entrar?next=/integrantes");
  if (!s.casa) redirect("/");
  const e = (await searchParams).e ?? "";
  const error = ERRORES[e];
  const listo = LISTO[e];

  // La clave solo se la da la base de datos a un dueño; a los demás les llega vacía.
  const [{ data }, { data: clave }, { data: horario }] = await Promise.all([
    s.sb
      .from("miembros")
      .select("user_id, nombre, email, rol, estado, recibe_recordatorio")
      .eq("casa_id", s.casa.id)
      .order("creado_en"),
    s.sb.rpc("clave_de_casa", { c: s.casa.id }),
    s.sb
      .from("casas")
      .select("recordatorio_dias, recordatorio_hora, recordatorio_minuto")
      .eq("id", s.casa.id)
      .single(),
  ]);
  const dias: number[] = horario?.recordatorio_dias ?? [];
  const hora: number = horario?.recordatorio_hora ?? 8;
  const minuto: number = horario?.recordatorio_minuto ?? 0;
  const programado = dias.length ? `${listaDias(dias)} a las ${formatoHora(hora, minuto)}.` : null;
  const clavePush = process.env.VAPID_PUBLIC_KEY;
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
      {listo && <p className="listo bloque">{listo}</p>}

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

      <section className="tarjeta">
        <h2>Recordatorio</h2>
        <p className="ayuda">Una notificación con lo que falta, en los celulares que tengan los avisos activos.</p>
        <p className="programado">{programado ?? "Apagado"}</p>
        {esDueno ? (
          <form action={guardarRecordatorio} className="horario">
            <fieldset className="dias">
              <legend>Días</legend>
              {SEMANA.map((d) => (
                <label key={d} className="dia">
                  <input type="checkbox" name="dias" value={d} defaultChecked={dias.includes(d)} aria-label={DIAS[d]} />
                  <span aria-hidden="true">{DIAS[d].slice(0, 2)}</span>
                </label>
              ))}
            </fieldset>
            <label className="hora">
              <span>Hora</span>
              <input
                type="time"
                name="hora"
                defaultValue={`${dosCifras(hora)}:${dosCifras(minuto)}`}
                required
                className="hora-grande"
              />
            </label>
            <p className="ayuda">Sin días marcados, el recordatorio queda apagado.</p>
            <button className="mini prim">Guardar horario</button>
          </form>
        ) : (
          !programado && <p className="ayuda">El dueño todavía no lo ha programado.</p>
        )}
        {yo && (
          <div className="fila-aviso">
            <span>{yo.recibe_recordatorio ? "Lo recibes" : "No lo recibes"}</span>
            <form action={cambiarMiRecordatorio.bind(null, !yo.recibe_recordatorio)}>
              <button className="mini">{yo.recibe_recordatorio ? "No quiero recibirlo" : "Quiero recibirlo"}</button>
            </form>
          </div>
        )}
        {clavePush && <Avisos clavePublica={clavePush} />}
        {clavePush && (
          <form action={probarAviso} className="fila-sola">
            <button className="mini">Enviar aviso de prueba</button>
          </form>
        )}
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
