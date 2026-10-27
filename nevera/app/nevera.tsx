"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agregar, alternar, anotar, editar, eliminar, limpiarTodo, ordenar } from "./actions";
import type { Producto } from "@/lib/db";
import { Icono } from "@/lib/iconos";
import {
  LUGARES,
  esCajon,
  lugarDe,
  lugarPorNombre,
  reasignar,
  type IdLugar,
} from "@/lib/lugares";
import Formulario from "./formulario";
import Tema from "./tema";

type Cambio =
  | { tipo: "alternar"; id: string; agotado: boolean }
  | { tipo: "limpiar" }
  | { tipo: "nota"; id: string; nota: string | null }
  | { tipo: "ordenar"; ids: string[] };

// Debe reflejar lo que hacen las actions: los ocasionales se borran al comprarlos.
function reducir(lista: Producto[], c: Cambio): Producto[] {
  switch (c.tipo) {
    case "limpiar":
      return lista.filter((p) => !p.ocasional).map((p) => ({ ...p, agotado: false, nota: null }));
    case "alternar":
      return lista
        .filter((p) => !(p.id === c.id && p.ocasional && !c.agotado))
        .map((p) =>
          p.id === c.id ? { ...p, agotado: c.agotado, nota: c.agotado ? p.nota : null } : p
        );
    case "nota":
      return lista.map((p) => (p.id === c.id ? { ...p, nota: c.nota } : p));
    case "ordenar": {
      const valores = reasignar(lista.filter((p) => c.ids.includes(p.id)).map((p) => p.orden));
      const nuevo = new Map(c.ids.map((id, i) => [id, valores[i]]));
      return lista
        .map((p) => (nuevo.has(p.id) ? { ...p, orden: nuevo.get(p.id)! } : p))
        .sort((a, b) => a.orden - b.orden);
    }
  }
}

const conNota = (p: Producto) => `${p.emoji} ${p.nombre}${p.nota ? ` · ${p.nota}` : ""}`;

export default function Nevera({ inicial }: { inicial: Producto[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [productos, aplicar] = useOptimistic(inicial, reducir);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<null | "nuevo" | Producto>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 15000);
    return () => clearInterval(t);
  }, [router]);

  const agotados = productos.filter((p) => p.agotado);

  // Lugar de la casa → estantes (una categoría por estante).
  const lugares = useMemo(() => {
    const m = new Map<IdLugar, Map<string, Producto[]>>();
    for (const p of productos) {
      const l = lugarDe(p);
      if (!m.has(l)) m.set(l, new Map());
      const estantes = m.get(l)!;
      if (!estantes.has(p.categoria)) estantes.set(p.categoria, []);
      estantes.get(p.categoria)!.push(p);
    }
    return LUGARES.filter((l) => m.has(l.id)).map((l) => ({
      ...l,
      estantes: [...m.get(l.id)!.entries()].sort(
        (a, b) => Number(esCajon(a[0])) - Number(esCajon(b[0]))
      ),
    }));
  }, [productos]);

  const categorias = [...new Set(productos.filter((p) => !p.ocasional).map((p) => p.categoria))];

  function lugarDeCategoria(categoria: string): IdLugar {
    const p = productos.find((p) => !p.ocasional && p.categoria === categoria);
    return p ? lugarDe(p) : lugarPorNombre(categoria);
  }

  // Aplica el cambio en pantalla y lo guarda; si falla, avisa y la pantalla vuelve a como estaba.
  function enviar(cambio: Cambio | null, guardar: () => Promise<unknown>) {
    iniciar(async () => {
      if (cambio) aplicar(cambio);
      try {
        await guardar();
      } catch {
        mostrar("No se pudo guardar. Revisa la conexión e intenta otra vez.", 4000);
      }
    });
  }

  function tocar(p: Producto) {
    if (editando) return setForm(p);
    if (p.ocasional && !confirm(`¿Ya compraste ${p.nombre}? Se quitará de la lista.`)) return;
    enviar({ tipo: "alternar", id: p.id, agotado: !p.agotado }, () => alternar(p.id, !p.agotado));
  }

  function limpiar() {
    enviar({ tipo: "limpiar" }, limpiarTodo);
  }

  function borrar(p: Producto) {
    if (!confirm(`¿Quitar ${p.nombre}?`)) return;
    enviar(null, () => eliminar(p.id));
  }

  function ponerNota(p: Producto) {
    const n = prompt(`Nota para ${p.nombre} (cantidad, marca…)`, p.nota ?? "");
    if (n === null) return;
    const nota = n.trim().slice(0, 40);
    enviar({ tipo: "nota", id: p.id, nota: nota || null }, () => anotar(p.id, nota));
  }

  // Mueve un producto un puesto dentro de su estante.
  function mover(lista: Producto[], i: number, paso: -1 | 1) {
    const ids = lista.map((p) => p.id);
    [ids[i], ids[i + paso]] = [ids[i + paso], ids[i]];
    enviar({ tipo: "ordenar", ids }, () => ordenar(ids));
  }

  async function compartir() {
    if (agotados.length === 0) return mostrar("No hay nada por comprar");
    const texto = agotados.map((p) => `• ${conNota(p)}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "Mercado", text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        mostrar("Lista copiada");
      }
    } catch {}
  }

  function mostrar(t: string, ms = 2000) {
    setAviso(t);
    setTimeout(() => setAviso(""), ms);
  }

  return (
    <main className={`app ${editando ? "modo-editar" : ""}`}>
      <header className="top">
        <div>
          <p className="eyebrow">Inventario de casa</p>
          <h1>Nevera</h1>
          <p className="sub">
            {agotados.length === 0
              ? "Todo en orden"
              : `${agotados.length} por comprar`}
          </p>
        </div>
        <div className="top-acciones">
          <Tema />
          <button
            className={`chip ${editando ? "chip-on" : ""}`}
            onClick={() => setEditando(!editando)}
          >
            <Icono n={editando ? "check" : "editar"} size={16} />
            {editando ? "Listo" : "Editar"}
          </button>
        </div>
      </header>

      {agotados.length > 0 && !editando && (
        <section className="ticket">
          <div className="ticket-cabeza">
            <h2>Lista de mercado</h2>
            <span className="ticket-total">{agotados.length} ítems</span>
          </div>
          <ul>
            {agotados.map((p) => (
              <li key={p.id}>
                <button className="ticket-item" onClick={() => ponerNota(p)}>
                  <span aria-hidden="true">{p.emoji}</span>
                  <span className="ticket-nombre">{p.nombre}</span>
                  <span className="ticket-puntos" aria-hidden="true" />
                  <span className={`ticket-nota ${p.nota ? "" : "vacia"}`}>
                    {p.nota ?? "+ nota"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="ticket-pie">Toca un producto para anotar cantidad o marca</p>
        </section>
      )}

      {lugares.map((l, i) => {
        const faltan = l.estantes.reduce((n, [, ps]) => n + ps.filter((p) => p.agotado).length, 0);
        return (
          <section
            key={l.id}
            className={`lugar lugar-${l.id}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <header className="lugar-cabeza">
              <span className="lugar-icono">
                <Icono n={l.icono} />
              </span>
              <h2>{l.nombre}</h2>
              {faltan > 0 && l.id !== "tablero" && (
                <span className="lugar-faltan">{faltan} por comprar</span>
              )}
            </header>
            {l.estantes.map(([cat, lista]) => (
              <div key={cat} className={`estante ${esCajon(cat) ? "cajon" : ""}`}>
                {cat.toLowerCase() !== l.nombre.toLowerCase() && <h3>{cat}</h3>}
                <div className="grid">
                  {lista.map((p, i) => (
                    <div key={p.id} className="celda">
                      <button
                        className={`card ${p.agotado ? "agotado" : ""} ${editando ? "editando" : ""}`}
                        onClick={() => tocar(p)}
                        aria-pressed={p.agotado}
                      >
                        <span className="emoji">{p.emoji}</span>
                        <span className="nombre">{p.nombre}</span>
                        {p.nota && <span className="nota">{p.nota}</span>}
                        {p.agotado && !p.ocasional && <span className="badge">Se acabó</span>}
                      </button>
                      {editando && (
                        <button
                          className="borrar"
                          onClick={() => borrar(p)}
                          aria-label={`Quitar ${p.nombre}`}
                        >
                          <Icono n="cerrar" size={14} />
                        </button>
                      )}
                      {editando && lista.length > 1 && (
                        <div className="flechas">
                          <button
                            onClick={() => mover(lista, i, -1)}
                            disabled={i === 0}
                            aria-label={`Mover ${p.nombre} antes`}
                          >
                            <Icono n="izq" size={16} />
                          </button>
                          <button
                            onClick={() => mover(lista, i, 1)}
                            disabled={i === lista.length - 1}
                            aria-label={`Mover ${p.nombre} después`}
                          >
                            <Icono n="der" size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      {form && (
        <Formulario
          producto={form === "nuevo" ? undefined : form}
          categorias={categorias}
          lugarDeCategoria={lugarDeCategoria}
          existentes={productos.map((p) => p.nombre)}
          onCerrar={() => setForm(null)}
          onGuardar={(d, cerrar) => {
            if (cerrar) setForm(null);
            enviar(null, () =>
              form === "nuevo"
                ? agregar(d.nombre, d.emoji, d.categoria, d.lugar, d.ocasional, d.nota)
                : editar(form.id, d.nombre, d.emoji, d.categoria, d.lugar, d.nota)
            );
          }}
        />
      )}

      <nav className="barra">
        <div className="barra-capsula">
          <button className="barra-btn" onClick={() => setForm("nuevo")}>
            <Icono n="mas" />
            Producto
          </button>
          <button className="barra-btn" onClick={limpiar} disabled={agotados.length === 0}>
            <Icono n="check" />
            Ya compré
          </button>
          <button className="barra-btn prim" onClick={compartir}>
            <Icono n="compartir" />
            Compartir
          </button>
        </div>
      </nav>

      {aviso && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}
    </main>
  );
}
