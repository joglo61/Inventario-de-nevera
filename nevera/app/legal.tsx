import Link from "next/link";
import { Icono } from "@/lib/iconos";

// Marco común de /privacidad y /terminos: se pueden leer sin iniciar sesión.
export const CONTACTO = "juancagarciamartinez@gmail.com";

export default function Documento({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="app pagina">
      <header className="top">
        <div>
          <p className="eyebrow">Nevera</p>
          <h1>{titulo}</h1>
        </div>
        <Link href="/" className="chip">
          <Icono n="izq" size={16} />
          Volver
        </Link>
      </header>
      <article className="tarjeta legal">
        <p className="ayuda">Última actualización: 28 de octubre de 2026.</p>
        {children}
      </article>
    </main>
  );
}
