"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useToastStore } from "@/store/dashboardStore";

type Status = "loading" | "unsupported" | "needs-install" | "denied" | "off" | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

async function currentSubscription() {
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export default function NotificationsPanel() {
  const toast = useToastStore((s) => s.show);
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next: Status;
      if (isIOS() && !isStandalone()) next = "needs-install";
      else if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else next = (await currentSubscription()) ? "on" : "off";
      if (!cancelled) setStatus(next);
    })();
    return () => { cancelled = true; };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      // Tiene que ir directo desde el toque: iOS solo pide permiso con gesto del usuario
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("No se pudo guardar la suscripción");
      setStatus("on");
      toast("✓ Notificaciones activadas");
    } catch (e) {
      toast((e as Error).message || "No se pudieron activar", "err");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    const sub = await currentSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setStatus("off");
    toast("Notificaciones desactivadas");
    setBusy(false);
  }

  async function test() {
    setBusy(true);
    const res = await fetch("/api/push/test", { method: "POST" });
    const { sent } = await res.json().catch(() => ({ sent: 0 }));
    if (!sent) toast("No se entregó ninguna notificación", "err");
    setBusy(false);
  }

  const hint: Partial<Record<Status, string>> = {
    "needs-install": "En iPhone las notificaciones solo funcionan con la app instalada: en Safari toca Compartir → Agregar a inicio y ábrela desde ahí.",
    unsupported: "Este navegador no admite notificaciones push.",
    denied: "Bloqueaste las notificaciones. Actívalas en Ajustes del iPhone → Notificaciones → Mis Finanzas.",
  };

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Bell size={16} color="#4A7C59" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Notificaciones</span>
        {status === "on" && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--green)", background: "var(--bg)", borderRadius: "20px", padding: "2px 8px" }}>
            Activadas
          </span>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
        Recibe un aviso con el ícono de la app cada vez que se registre un gasto automático con Apple Pay. Actívalo en cada dispositivo.
      </p>

      {hint[status] ? (
        <p style={{ fontSize: "12px", color: "var(--amber)", lineHeight: 1.6 }}>{hint[status]}</p>
      ) : status === "on" ? (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={test}
            disabled={busy}
            style={{ flex: 1, background: "#4A7C59", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--font-sans)" }}
          >
            Enviar prueba
          </button>
          <button
            onClick={disable}
            disabled={busy}
            style={{ background: "none", color: "var(--red)", border: "1px solid var(--border)", borderRadius: "8px", padding: "11px 14px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Desactivar
          </button>
        </div>
      ) : (
        <button
          onClick={enable}
          disabled={busy || status === "loading"}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#4A7C59", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy || status === "loading" ? 0.7 : 1, fontFamily: "var(--font-sans)" }}
        >
          <Bell size={15} /> {busy ? "Activando…" : "Activar notificaciones"}
        </button>
      )}
    </div>
  );
}
