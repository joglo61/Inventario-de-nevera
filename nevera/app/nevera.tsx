"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregar, alternar, eliminar, limpiarTodo } from "./actions";
import type { Producto } from "@/lib/db";
import Formulario from "./formulario";

type Cambio =
  | { tipo: "alternar"; id: string; agotado: boolean }
  | { tipo: "limpiar" };

export default function Nevera({ inicial }: { inicial: Producto[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [productos, aplicar] = useOptimistic(inicial, (lista, c: Cambio) =>
    c.tipo === "limpiar"
      ? lista.map((p) => ({ ...p, agotado: false }))
      : lista.map((p) => (p.id === c.id ? { ...p, agotado: c.agotado } : p))
  );
  const [editando, setEditando] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15000);
    return () => clearInterval(t);
  }, [router]);

  const agotados = productos.filter((p) => p.agotado);
  const grupos = useMemo(() => {
    const m = new Map<string, Producto[]>();
    for (const p of productos) {
      if (!m.has(p.categoria)) m.set(p.categoria, []);
      m.get(p.categoria)!.push(p);
    }
    return [...m.entries()];
  }, [productos]);

  function tocar(p: Producto) {
    if (editando) return;
    iniciar(async () => {
      aplicar({ tipo: "alternar", id: p.id, agotado: !p.agotado });
      await alternar(p.id, !p.agotado);
    });
  }

  function limpiar() {
    iniciar(async () => {
      aplicar({ tipo: "limpiar" });
      await limpiarTodo();
    });
  }

  function borrar(p: Producto) {
    if (!confirm(`¿Quitar ${p.nombre}?`)) return;
    iniciar(async () => {
      await eliminar(p.id);
    });
  }

  async function compartir() {
    if (agotados.length === 0) return mostrar("No hay nada por comprar");
    const texto = agotados.map((p) => `• ${p.emoji} ${p.nombre}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Mercado", text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        mostrar("Lista copiada");
      }
    } catch {}
  }

  function mostrar(t: string) {
    setAviso(t);
    setTimeout(() => setAviso(""), 2000);
  }

  return (
    <main className="app">
      <header className="top">
        <div>
          <h1>Nevera</h1>
          <p className="sub">
            {agotados.length === 0
              ? "Todo en orden"
              : `${agotados.length} por comprar`}
          </p>
        </div>
        <button
          className={`chip ${editando ? "chip-on" : ""}`}
          onClick={() => setEditando(!editando)}
        >
          {editando ? "Listo" : "Editar"}
        </button>
      </header>

      {agotados.length > 0 && !editando && (
        <section className="resumen">
          <div className="resumen-titulo">Por comprar</div>
          <div className="resumen-items">
            {agotados.map((p) => (
              <span key={p.id} className="pill">
                {p.emoji} {p.nombre}
              </span>
            ))}
          </div>
        </section>
      )}

      {grupos.map(([cat, lista]) => (
        <section key={cat} className="grupo">
          <h2>{cat}</h2>
          <div className="grid">
            {lista.map((p) => (
              <div key={p.id} className="celda">
                <button
                  className={`card ${p.agotado ? "agotado" : ""} ${editando ? "editando" : ""}`}
                  onClick={() => tocar(p)}
                  aria-pressed={p.agotado}
                >
                  <span className="emoji">{p.emoji}</span>
                  <span className="nombre">{p.nombre}</span>
                  {p.agotado && <span className="badge">Se acabó</span>}
                </button>
                {editando && (
                  <button className="borrar" onClick={() => borrar(p)} aria-label="Quitar">
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {nuevo && (
        <Formulario
          categorias={grupos.map(([c]) => c)}
          existentes={productos.map((p) => p.nombre)}
          onCerrar={() => setNuevo(false)}
          onGuardar={(n, e, c, cerrar) => {
            if (cerrar) setNuevo(false);
            iniciar(async () => {
              await agregar(n, e, c);
            });
          }}
        />
      )}

      <div className="barra">
        <button className="btn-sec" onClick={() => setNuevo(true)}>
          + Producto
        </button>
        <button className="btn-sec" onClick={limpiar} disabled={agotados.length === 0}>
          Ya compré
        </button>
        <button className="btn-prim" onClick={compartir}>
          Compartir
        </button>
      </div>

      {aviso && <div className="aviso">{aviso}</div>}
    </main>
  );
}

