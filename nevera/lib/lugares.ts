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

// ponytail: el lugar se adivina por palabras de la categoría; si las categorías propias
// caen mal en "Alacena", agregar una columna "lugar" a productos.
export function lugarDe(p: Producto): IdLugar {
  if (p.ocasional) return "tablero";
  const c = p.categoria.toLowerCase();
  if (/l[aá]cte|huevo|carne|pollo|pescad|verdura|fruta|bebida|nevera|congel/.test(c)) return "nevera";
  if (/despensa|grano|enlatad|cereal|snack|dulce/.test(c)) return "despensa";
  if (/personal|ba[ñn]o|higiene/.test(c)) return "bano";
  if (/hogar|limpieza|lavader|ropa/.test(c)) return "lavadero";
  return "alacena";
}

// En la nevera, frutas y verduras van en el cajón de abajo.
export const esCajon = (categoria: string) => /verdura|fruta/i.test(categoria);
