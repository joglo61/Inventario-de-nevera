import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";

export function codigoValido(candidato: string | undefined | null): boolean {
  const real = process.env.HOUSE_CODE;
  if (!real || !candidato) return false;
  const a = Buffer.from(candidato);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function haySesion(): Promise<boolean> {
  const c = await cookies();
  return codigoValido(c.get("casa")?.value);
}
