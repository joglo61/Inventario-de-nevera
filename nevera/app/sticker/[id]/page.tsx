import { redirect } from "next/navigation";
import { activarSticker, pedirAcceso } from "../../actions";
import { Icono } from "@/lib/iconos";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  faltan: "Completa los campos.",
  activar: "No se pudo activar. Puede que otra persona lo haya activado primero.",
  pedir: "No se pudo enviar la solicitud. Intenta otra vez.",
};

export default async function Sticker({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { id } = await params;
  const error = ERRORES[(await searchParams).e ?? ""];
  const sb = await supabase();
  if (!(await sb.auth.getUser()).data.user) redirect(`/entrar?next=/sticker/${encodeURIComponent(id)}`);

  const { data } = await sb.rpc("estado_sticker", { s: id });
  const info = (data?.[0] ?? { estado: "invalido" }) as { estado: string; casa_nombre: string | null };

  return (
    <main className="login">
      <div className="login-icono">
        <Icono n="nevera" size={36} />
      </div>

      {info.estado === "libre" && (
        <>
          <p className="eyebrow">Sticker nuevo</p>
          <h1>Activa tu casa</h1>
          <p className="sub">Quedarás como dueño y podrás aprobar a quien quiera unirse.</p>
          <form action={activarSticker.bind(null, id)}>
            <input name="casa" placeholder="Nombre de la casa (ej. Casa García)" aria-label="Nombre de la casa" maxLength={40} required />
            <input name="nombre" placeholder="Tu nombre" aria-label="Tu nombre" maxLength={40} required />
            <button type="submit">Activar</button>
          </form>
        </>
      )}

      {info.estado === "ajena" && (
        <>
          <p className="eyebrow">{info.casa_nombre}</p>
          <h1>Pide acceso</h1>
          <p className="sub">Un dueño de la casa tiene que aprobarte.</p>
          <form action={pedirAcceso.bind(null, id)}>
            <input name="nombre" placeholder="Tu nombre" aria-label="Tu nombre" maxLength={40} required />
            <button type="submit">Pedir acceso</button>
          </form>
        </>
      )}

      {info.estado === "pendiente" && (
        <>
          <p className="eyebrow">{info.casa_nombre}</p>
          <h1>Solicitud enviada</h1>
          <p className="sub">Cuando un dueño te apruebe, toca el sticker otra vez.</p>
        </>
      )}

      {info.estado === "miembro" && (
        <>
          <p className="eyebrow">{info.casa_nombre}</p>
          <h1>Ya eres de la casa</h1>
          {/* <a> y no <Link>: /t es un desvío y necesita carga completa */}
          <a className="boton" href={`/t/${encodeURIComponent(id)}`}>
            Abrir
          </a>
        </>
      )}

      {info.estado === "invalido" && (
        <>
          <h1>Sticker no válido</h1>
          <p className="sub">Este sticker no está registrado.</p>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
