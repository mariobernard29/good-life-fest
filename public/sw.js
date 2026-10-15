/* Service worker del portal: solo notificaciones push (no guarda páginas en caché). */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Good Life Wellness Fest";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || undefined,
      vibrate: [100, 50, 100],
      data: { url: data.url || "/mi-cuenta" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || "/mi-cuenta";
  // Solo rutas del propio sitio.
  const target = new URL(path.startsWith("/") ? path : "/mi-cuenta", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (!open) return self.clients.openWindow(target);
      return open
        .focus()
        .then((w) => (w.url === target ? w : w.navigate(target)))
        .catch(() => self.clients.openWindow(target));
    }),
  );
});
