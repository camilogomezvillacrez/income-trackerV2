"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ScanFace } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";

const noopSubscribe = () => () => {};

async function fetchOptions(): Promise<PublicKeyCredentialCreationOptionsJSON | null> {
  const res = await fetch("/api/auth/webauthn/register/options", { method: "POST" });
  return res.ok ? res.json() : null;
}

export default function FaceIdPanel() {
  const { hasPasskey, setHasPasskey } = useDashboardStore();
  const toast = useToastStore((s) => s.show);
  const [busy, setBusy] = useState(false);
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => typeof window.PublicKeyCredential !== "undefined",
    () => true,
  );

  // Opciones pedidas de antemano: Safari exige lanzar Face ID directo desde el toque
  const options = useRef<PublicKeyCredentialCreationOptionsJSON | null>(null);
  useEffect(() => {
    if (!hasPasskey) fetchOptions().then((o) => { options.current = o; });
  }, [hasPasskey]);

  async function enable() {
    if (!options.current) options.current = await fetchOptions();
    if (!options.current) { toast("No se pudo preparar Face ID", "err"); return; }

    setBusy(true);
    try {
      const response = await startRegistration({ optionsJSON: options.current });
      const res = await fetch("/api/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo activar");
      setHasPasskey(true);
      toast("✓ Face ID activado");
    } catch (e) {
      if ((e as Error).name !== "NotAllowedError") toast((e as Error).message, "err");
      options.current = await fetchOptions();
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const res = await fetch("/api/auth/webauthn/credentials", { method: "DELETE" });
    if (res.ok) { setHasPasskey(false); toast("Face ID desactivado"); }
    else toast("No se pudo desactivar", "err");
    setBusy(false);
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <ScanFace size={16} color="#4A7C59" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Face ID</span>
        {hasPasskey && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--green)", background: "var(--bg)", borderRadius: "20px", padding: "2px 8px" }}>
            Activado
          </span>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
        {hasPasskey
          ? "La sesión dura 30 días. La app se bloquea al abrirla de nuevo después de cerrarla y tras 3 minutos sin usarla; se abre con Face ID."
          : "Sin Face ID, tras 3 minutos sin usar la app tienes que volver a iniciar sesión. Actívalo en cada dispositivo donde uses la app."}
      </p>

      {!supported ? (
        <p style={{ fontSize: "12px", color: "var(--amber)" }}>Este navegador no admite Face ID / passkeys.</p>
      ) : hasPasskey ? (
        <button
          onClick={disable}
          disabled={busy}
          style={{ width: "100%", background: "none", color: "var(--red)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          Desactivar Face ID
        </button>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#4A7C59", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--font-sans)" }}
        >
          <ScanFace size={15} /> {busy ? "Activando…" : "Activar Face ID"}
        </button>
      )}
    </div>
  );
}
