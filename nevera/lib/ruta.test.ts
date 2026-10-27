// Correr con: node --experimental-strip-types lib/ruta.test.ts
import assert from "node:assert";
import { rutaSegura } from "./ruta.ts";

const sitio = "https://inventario-de-nevera.vercel.app";
const destino = (next: unknown) => new URL(rutaSegura(next), sitio).host;

assert.equal(rutaSegura("/sticker/abc"), "/sticker/abc");
for (const malo of ["//evil.com", "/\evil.com", "/\/evil.com", "https://evil.com", null, 42]) {
  assert.equal(destino(malo), "inventario-de-nevera.vercel.app", `se escapa con ${String(malo)}`);
}
console.log("rutaSegura: ok");
