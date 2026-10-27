"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

type Turnstile = {
  render(el: HTMLElement, opciones: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

// Cloudflare Turnstile. Entrega el token por onToken; `reiniciar` cambia tras cada intento,
// porque cada token sirve una sola vez.
export default function Captcha({
  sitekey,
  reiniciar,
  onToken,
}: {
  sitekey: string;
  reiniciar: unknown;
  onToken: (token: string) => void;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    // ponytail: espera al script revisando cada 100 ms; basta para un solo widget por página.
    function montar() {
      if (cancelado || !caja.current) return;
      if (!window.turnstile) return void setTimeout(montar, 100);
      id.current = window.turnstile.render(caja.current, {
        sitekey,
        theme: "auto",
        language: "es",
        callback: onToken,
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }
    montar();
    return () => {
      cancelado = true;
      if (id.current) window.turnstile?.remove(id.current);
      id.current = null;
    };
  }, [sitekey, onToken]);

  useEffect(() => {
    if (id.current) {
      window.turnstile?.reset(id.current);
      onToken("");
    }
  }, [reiniciar, onToken]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" />
      <div ref={caja} className="captcha" />
    </>
  );
}
