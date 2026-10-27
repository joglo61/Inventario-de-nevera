// Muestra el recordatorio semanal y abre la app al tocarlo.
self.addEventListener("push", (e) => {
  const aviso = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(aviso.titulo || "Nevera", {
      body: aviso.cuerpo || "",
      icon: "/icon",
      data: { url: aviso.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
      return abierta ? abierta.focus() : self.clients.openWindow(url);
    })
  );
});
