"use client";

import { useState } from "react";
import { SUGERIDOS } from "@/lib/sugeridos";

const NUEVA = "__nueva__";

export default function Formulario({
  categorias,
  existentes,
  onCerrar,
  onGuardar,
}: {
  categorias: string[];
  existentes: string[];
  onCerrar: () => void;
  onGuardar: (nombre: string, emoji: string, categoria: string, cerrar: boolean) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [emoji, setEmoji] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "Otros");
  const [categoriaNueva, setCategoriaNueva] = useState("");
  const [añadidos, setAñadidos] = useState<string[]>([]);

  const ocultos = new Set([...existentes, ...añadidos].map((n) => n.toLowerCase()));
  const sugeridos = SUGERIDOS.filter((s) => !ocultos.has(s.nombre.toLowerCase()));

  return (
    <div className="fondo" onClick={onCerrar}>
      <div className="hoja" onClick={(e) => e.stopPropagation()}>
        <h3>Agregar productos</h3>

        {sugeridos.length > 0 && (
          <>
            <p className="sub">Toca para agregar</p>
            <div className="sugeridos">
              {sugeridos.map((s) => (
                <button
                  key={s.nombre}
                  type="button"
                  className="pill pill-btn"
                  onClick={() => {
                    setAñadidos((a) => [...a, s.nombre]);
                    onGuardar(s.nombre, s.emoji, s.categoria, false);
                  }}
                >
                  {s.emoji} {s.nombre}
                </button>
              ))}
            </div>
          </>
        )}

        <p className="sub">O crea uno propio</p>
        <form
          className="form-propio"
          onSubmit={(e) => {
            e.preventDefault();
            const cat = categoria === NUEVA ? categoriaNueva : categoria;
            onGuardar(nombre, emoji, cat, true);
          }}
        >
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={40}
            required
          />
          <input
            placeholder="Emoji (opcional)"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
          />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NUEVA}>+ Nueva categoría</option>
          </select>
          {categoria === NUEVA && (
            <input
              placeholder="Nombre de la categoría"
              value={categoriaNueva}
              onChange={(e) => setCategoriaNueva(e.target.value)}
              maxLength={30}
              required
            />
          )}
          <button type="submit" className="btn-prim">
            Agregar
          </button>
        </form>
        <button type="button" className="btn-sec" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
