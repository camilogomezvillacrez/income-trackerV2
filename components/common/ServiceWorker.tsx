"use client";

import { useEffect } from "react";

/** Registra /sw.js solo en producción (en dev cachearía código viejo). */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
