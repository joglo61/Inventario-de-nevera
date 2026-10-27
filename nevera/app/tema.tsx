"use client";

import { Icono } from "@/lib/iconos";

// El tema se guarda en una cookie por dispositivo; el layout la lee para pintar sin parpadeo.
export default function Tema() {
  function cambiar() {
    const html = document.documentElement;
    const actual =
      html.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const nuevo = actual === "dark" ? "light" : "dark";
    html.dataset.theme = nuevo;
    document.cookie = `tema=${nuevo}; path=/; max-age=31536000; samesite=lax`;
  }
  return (
    <button className="icono-btn" onClick={cambiar} aria-label="Cambiar modo claro u oscuro">
      <Icono n="tema" />
    </button>
  );
}
