// Evita redirigir a otro sitio con ?next=...: solo rutas internas. Los navegadores tratan "\"
// como "/", así que "/\otro.com" saldría del sitio igual que "//otro.com".
export function rutaSegura(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : "/";
}
