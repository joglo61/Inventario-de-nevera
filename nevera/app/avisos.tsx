"use client";

import { useEffect, useState } from "react";
import { borrarSuscripcion, guardarSuscripcion } from "./actions";

type Estado = "cargando" | "instalar" | "no-soportado" | "bloqueado" | "apagado" | "activo";

// La clave pública VAPID viene en base64url; el navegador la pide en bytes.
function aBytes(b64: string) {
  const relleno = "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Activar o quitar los avisos en ESTE celular (cada dispositivo se activa por separado).
export default function Avisos({ clavePublica }: { clavePublica: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const instalada =
        matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      // En iPhone los avisos solo existen con la app instalada en la pantalla de inicio.
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return setEstado(ios && !instalada ? "instalar" : "no-soportado");
      }
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.register("/sw.js");
      setEstado((await reg.pushManager.getSubscription()) ? "activo" : "apagado");
    })().catch(() => setEstado("no-soportado"));
  }, []);

  async function activar() {
    setOcupado(true);
    setError("");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setEstado("bloqueado");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: aBytes(clavePublica),
      });
      const { endpoint, keys } = sub.toJSON();
      await guardarSuscripcion(endpoint!, keys!.p256dh, keys!.auth);
      setEstado("activo");
    } catch {
      setError("No se pudieron activar los avisos. Intenta otra vez.");
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setOcupado(true);
    setError("");
    try {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) {
        await borrarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("apagado");
    } catch {
      setError("No se pudieron quitar los avisos. Intenta otra vez.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="avisos">
      {estado === "instalar" && (
        <p className="ayuda">
          En iPhone, primero instala la app: en Safari toca Compartir → “Agregar a inicio”, ábrela desde ese
          ícono, entra con tu correo y activa los avisos desde ahí.
        </p>
      )}
      {estado === "no-soportado" && <p className="ayuda">Este navegador no permite avisos.</p>}
      {estado === "bloqueado" && (
        <p className="ayuda">
          Los avisos están bloqueados para esta app. Actívalos en los ajustes del celular → Notificaciones.
        </p>
      )}
      {estado === "apagado" && (
        <button type="button" className="mini prim" onClick={activar} disabled={ocupado}>
          {ocupado ? "Activando…" : "Activar avisos en este celular"}
        </button>
      )}
      {estado === "activo" && (
        <div className="fila-aviso">
          <span className="ok">✓ Avisos activos en este celular</span>
          <button type="button" className="mini" onClick={desactivar} disabled={ocupado}>
            Quitar
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
