import { listarProductos } from "@/lib/db";
import { Icono } from "@/lib/iconos";
import { sesion } from "@/lib/supabase";
import { cerrarSesion } from "./actions";
import Login from "./login";
import Nevera from "./nevera";

export const dynamic = "force-dynamic";

export default async function Home() {
  const s = await sesion();
  if (!s) return <Login />;

  if (!s.casa) {
    const { count } = await s.sb
      .from("miembros")
      .select("*", { count: "exact", head: true })
      .eq("user_id", s.user.id)
      .eq("estado", "pendiente");
    return (
      <main className="login">
        <div className="login-icono">
          <Icono n="nevera" size={36} />
        </div>
        <h1>Aún no tienes casa</h1>
        <p className="sub">
          {count
            ? "Tu solicitud está esperando que un dueño la apruebe. Cuando lo haga, toca el sticker otra vez."
            : "Acerca tu celular al sticker NFC de la nevera para activar tu casa o pedir acceso."}
        </p>
        <form action={cerrarSesion}>
          <button className="btn-sec">Cerrar sesión</button>
        </form>
      </main>
    );
  }

  const casaId = s.casa.id;
  const [productos, { data: yo }] = await Promise.all([
    listarProductos(s.sb, casaId),
    s.sb.from("miembros").select("rol").eq("casa_id", casaId).eq("user_id", s.user.id).single(),
  ]);
  let solicitudes = 0;
  if (yo?.rol === "dueno") {
    const { count } = await s.sb
      .from("miembros")
      .select("*", { count: "exact", head: true })
      .eq("casa_id", casaId)
      .eq("estado", "pendiente");
    solicitudes = count ?? 0;
  }

  return <Nevera inicial={productos} casa={s.casa} casas={s.casas} solicitudes={solicitudes} />;
}
