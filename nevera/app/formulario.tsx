"use client";

import { useState } from "react";
import { SUGERIDOS } from "@/lib/sugeridos";
import type { Producto } from "@/lib/db";

const NUEVA = "__nueva__";

export type Datos = {
  nombre: string;
  emoji: string;
  categoria: string;
  ocasional: boolean;
  nota: string;
};

export default function Formulario({
  producto,
  categorias,
  existentes,
  onCerrar,
  onGuardar,
}: {
  producto?: Producto;
  categorias: string[];
  existentes: string[];
  onCerrar: () => void;
  onGuardar: (datos: Datos, cerrar: boolean) => void;
}) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [emoji, setEmoji] = useState(producto?.emoji ?? "");
  const [categoria, setCategoria] = useState(producto?.categoria ?? categorias[0] ?? "Otros");
  const [categoriaNueva, setCategoriaNueva] = useState("");
  const [ocasional, setOcasional] = useState(false);
  const [nota, setNota] = useState(producto?.nota ?? "");
  const [añadidos, setAñadidos] = useState<string[]>([]);

  const ocultos = new Set([...existentes, ...añadidos].map((n) => n.toLowerCase()));
  const sugeridos = producto ? [] : SUGERIDOS.filter((s) => !ocultos.has(s.nombre.toLowerCase()));
  const conCategoria = !ocasional && !producto?.ocasional;

  return (
    <div className="fondo" onClick={onCerrar}>
      <div className="hoja" onClick={(e) => e.stopPropagation()}>
        <h3>{producto ? "Editar producto" : "Agregar productos"}</h3>

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
                    onGuardar({ ...s, ocasional: false, nota: "" }, false);
                  }}
                >
                  {s.emoji} {s.nombre}
                </button>
              ))}
            </div>
          </>
        )}

        {!producto && <p className="sub">O crea uno propio</p>}
        <form
          className="form-propio"
          onSubmit={(e) => {
            e.preventDefault();
            const cat = categoria === NUEVA ? categoriaNueva : categoria;
            onGuardar({ nombre, emoji, categoria: cat, ocasional, nota }, true);
          }}
        >
          <label className="campo">
            Nombre
            <input
              placeholder="Ej. Bombillos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={40}
              required
            />
          </label>
          <label className="campo">
            Emoji (opcional)
            <input
              placeholder="Ej. 💡"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
            />
          </label>
          <label className="campo">
            Cantidad o nota (opcional)
            <input
              placeholder="Ej. 2 paquetes, deslactosada"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              maxLength={40}
            />
          </label>
          {!producto && (
            <label className="casilla">
              <input
                type="checkbox"
                checked={ocasional}
                onChange={(e) => setOcasional(e.target.checked)}
              />
              Compra ocasional (se borra al comprarla)
            </label>
          )}
          {conCategoria && (
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={NUEVA}>+ Nueva categoría</option>
            </select>
          )}
          {conCategoria && categoria === NUEVA && (
            <input
              placeholder="Nombre de la categoría"
              value={categoriaNueva}
              onChange={(e) => setCategoriaNueva(e.target.value)}
              maxLength={30}
              required
            />
          )}
          <button type="submit" className="btn-prim">
            {producto ? "Guardar" : "Agregar"}
          </button>
        </form>
        <button type="button" className="btn-sec" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
