import type { Producto } from "./db";
import type { NombreIcono } from "./iconos";

export type IdLugar = "nevera" | "despensa" | "bano" | "lavadero" | "alacena" | "tablero";

export const LUGARES: { id: IdLugar; nombre: string; icono: NombreIcono }[] = [
  { id: "nevera", nombre: "Nevera", icono: "nevera" },
  { id: "despensa", nombre: "Despensa", icono: "despensa" },
  { id: "bano", nombre: "Baño", icono: "bano" },
  { id: "lavadero", nombre: "Lavadero", icono: "lavadero" },
  { id: "alacena", nombre: "Alacena", icono: "alacena" },
  { id: "tablero", nombre: "Ocasionales", icono: "nota" },
];

// Los lugares que se pueden elegir; "tablero" es solo para ocasionales.
export const LUGARES_CASA = LUGARES.filter((l) => l.id !== "tablero");

export function esLugarCasa(x: unknown): x is IdLugar {
  return LUGARES_CASA.some((l) => l.id === x);
}

// Para categorías sin lugar elegido (las de antes): se adivina por el nombre.
export function lugarPorNombre(categoria: string): IdLugar {
  const c = categoria.toLowerCase();
  if (/l[aá]cte|huevo|carne|pollo|pescad|verdura|fruta|bebida|nevera|congel/.test(c)) return "nevera";
  if (/despensa|grano|enlatad|cereal|snack|dulce/.test(c)) return "despensa";
  if (/personal|ba[ñn]o|higiene/.test(c)) return "bano";
  if (/hogar|limpieza|lavader|ropa/.test(c)) return "lavadero";
  return "alacena";
}

export function lugarDe(p: Producto): IdLugar {
  if (p.ocasional) return "tablero";
  return esLugarCasa(p.lugar) ? p.lugar : lugarPorNombre(p.categoria);
}

// En la nevera, frutas y verduras van en el cajón de abajo.
export const esCajon = (categoria: string) => /verdura|fruta/i.test(categoria);

// Valores de orden para un estante reordenado: los mismos que tenía, ordenados y sin repetidos
// (dos productos agregados a la vez pueden quedar con el mismo orden).
export function reasignar(ordenes: number[]): number[] {
  const v = [...ordenes].sort((a, b) => a - b);
  for (let i = 1; i < v.length; i++) if (v[i] <= v[i - 1]) v[i] = v[i - 1] + 1;
  return v;
}
