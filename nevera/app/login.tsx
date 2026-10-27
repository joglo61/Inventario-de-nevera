"use client";

import { useActionState } from "react";
import { entrar, type EstadoEntrar } from "./actions";
import { Icono } from "@/lib/iconos";

const INICIAL: EstadoEntrar = { paso: "email", email: "", error: "" };

export default function Login({ next = "/", titulo }: { next?: string; titulo?: string }) {
  const [estado, accion, pendiente] = useActionState(entrar, INICIAL);
  const enCodigo = estado.paso === "codigo";
  return (
    <main className="login">
      <div className="login-icono">
        <Icono n="nevera" size={36} />
      </div>
      <p className="eyebrow">Inventario de casa</p>
      <h1>Nevera</h1>
      <p className="sub">
        {enCodigo
          ? `Te enviamos un código a ${estado.email}`
          : (titulo ?? "Entra con tu correo para ver tu casa")}
      </p>
      <form action={accion}>
        <input type="hidden" name="next" value={next} />
        {enCodigo ? (
          <input
            key="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Código"
            aria-label="Código del correo"
            maxLength={10}
            autoFocus
            required
          />
        ) : (
          <input
            key="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            aria-label="Correo"
            defaultValue={estado.email}
            autoFocus
            required
          />
        )}
        <button type="submit" disabled={pendiente}>
          {pendiente ? "Un momento…" : enCodigo ? "Entrar" : "Enviarme el código"}
        </button>
        {enCodigo && (
          <button type="submit" name="cambiar" value="1" className="enlace" formNoValidate>
            Usar otro correo
          </button>
        )}
        {estado.error && <p className="error">{estado.error}</p>}
      </form>
    </main>
  );
}
