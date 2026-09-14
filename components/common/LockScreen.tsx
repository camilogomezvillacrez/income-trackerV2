"use client";

import { useEffect, useRef, useState } from "react";
import { ScanFace } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import Logo from "./Logo";
import { useDashboardStore } from "@/store/dashboardStore";
import { markActive } from "@/hooks/useDashboard";
import { logout } from "@/lib/clientAuth";

async function fetchOptions(): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
  const res = await fetch("/api/auth/webauthn/authenticate/options", { method: "POST" });
  if (res.status === 401) { window.location.href = "/login"; return null; }
  return res.ok ? res.json() : null;
}

/*
 * Pantalla opaca que tapa la app bloqueada. Las opciones de WebAuthn se
 * piden por adelantado: Safari exige que Face ID se lance directo desde el
 * toque, sin esperar a la red entre medio.
 */
export default function LockScreen({ email }: { email: string }) {
  const setLocked = useDashboardStore((s) => s.setLocked);
  const options = useRef<PublicKeyCredentialRequestOptionsJSON | null>(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  async function unlock() {
    if (!options.current) options.current = await fetchOptions();
    if (!options.current) { setError("No se pudo preparar Face ID"); return; }

    setBusy(true);
    setError("");
    try {
      const response = await startAuthentication({ optionsJSON: options.current });
      const res = await fetch("/api/auth/webauthn/authenticate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo verificar");
      markActive();
      setLocked(false);
    } catch (e) {
      // Cancelado por el usuario: sin mensaje; cualquier otro fallo sí se muestra
      if ((e as Error).name !== "NotAllowedError") setError((e as Error).message);
      options.current = await fetchOptions();
    }
    setBusy(false);
  }

  // Prepara el reto y prueba a lanzar Face ID sin toque (iOS lo permite en
  // la carga; si no, queda el botón).
  const tried = useRef(false);
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    fetchOptions().then((o) => {
      options.current = o;
      if (o) unlock();
    });
  }, []);

  return (
    <div className="lock-screen">
      <Logo size={72} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Mis Finanzas</div>
        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{email}</div>
      </div>

      <button onClick={unlock} disabled={busy} className="lock-btn">
        <ScanFace size={20} />
        {busy ? "Verificando…" : "Desbloquear con Face ID"}
      </button>

      {error && <p style={{ fontSize: "12px", color: "var(--red)", textAlign: "center", maxWidth: "280px" }}>{error}</p>}

      <button onClick={logout} className="lock-link">Usar contraseña</button>

      <style>{`
        .lock-screen {
          position: fixed; inset: 0; z-index: 600;
          background: var(--bg, #F7F6F2);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 18px; padding: 16px; font-family: var(--font-sans);
        }
        .lock-btn {
          display: flex; align-items: center; gap: 10px; margin-top: 12px;
          background: #4A7C59; color: #fff; border: none; border-radius: 12px;
          padding: 14px 22px; font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: var(--font-sans); box-shadow: 0 5px 16px rgba(74,124,89,.35);
        }
        .lock-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .lock-link {
          background: none; border: none; color: var(--muted); font-size: 12.5px;
          cursor: pointer; font-family: var(--font-sans); padding: 8px;
        }
      `}</style>
    </div>
  );
}
