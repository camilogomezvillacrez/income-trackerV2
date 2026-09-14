/*
 * Service worker: guarda en el teléfono los archivos estáticos de Next
 * (JS, CSS, fuentes, imágenes). Llevan hash en el nombre, así que nunca
 * cambian y se pueden servir desde caché sin preguntar a la red.
 * El HTML y la API siempre van a la red (datos y sesión frescos).
 */
const CACHE = "static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Notificaciones push ───────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data?.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || "Mis Finanzas", {
      body: data.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

// Al tocarla: enfoca la app si ya está abierta, si no la abre
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      const win = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (win) return win.focus().then((w) => w?.navigate(url));
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname);
  if (!isStatic) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
  );
});
