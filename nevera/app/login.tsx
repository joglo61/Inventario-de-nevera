"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export default function Login() {
  const [estado, accion, pendiente] = useActionState(entrar, { error: "" });
  return (
    <main className="login">
      <div className="login-icono">🧊</div>
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
