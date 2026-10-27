"use client";

import { useActionState } from "react";
import { entrar } from "./actions";
import { Icono } from "@/lib/iconos";

export default function Login() {
  const [estado, accion, pendiente] = useActionState(entrar, { error: "" });
  return (
    <main className="login">
      <div className="login-icono">
        <Icono n="nevera" size={36} />
      </div>
      <p className="eyebrow">Inventario de casa</p>
      <h1>Nevera</h1>
      <p className="sub">Escribe el código de la casa</p>
      <form action={accion}>
        <input
          name="codigo"
          type="password"
          autoComplete="current-password"
          placeholder="Código"
          autoFocus
          required
        />
        <button type="submit" disabled={pendiente}>
          {pendiente ? "Entrando…" : "Entrar"}
        </button>
        {estado?.error && <p className="error">{estado.error}</p>}
      </form>
    </main>
  );
}
