"use client";

import { useEffect, useRef, useState } from "react";
import { ScanFace } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

/*
 * Pantalla de bloqueo con Face ID. Dos usos:
 * - "unlock": la app quedó inactiva; la sesión existe y solo se renueva.
 * - "login":  no hay sesión (p. ej. se perdió la cookie); Face ID la crea.
 * Las opciones de WebAuthn se piden por adelantado: Safari exige que Face ID
 * se lance directo desde el toque, sin esperar a la red entre medio; si no,
 * muestra su propia hoja de confirmación antes de Face ID.
 */
const ENDPOINTS = {
  unlock: "/api/auth/webauthn/authenticate",
  login:  "/api/auth/webauthn/login",
};

interface Props {
  mode: "unlock" | "login";
  email?: string;
  onSuccess: () => void;
  onUsePassword: () => void;
}

/** Error que ya viene con un mensaje pensado para el usuario (del servidor). */
class VerifyError extends Error {}

/** Nunca se muestra el texto técnico del navegador ni de la librería. */
function friendlyError(e: unknown): string {
  if (e instanceof VerifyError) return e.message;
  const err = e as { name?: string; code?: string; message?: string };
  // Cancelado por el usuario, o reemplazado por un intento más nuevo: sin mensaje
  if (
    err?.name === "NotAllowedError" ||
    err?.name === "AbortError" ||
    err?.code === "ERROR_CEREMONY_ABORTED" ||
    /abort/i.test(err?.message ?? "")
  ) {
    return "";
  }
  return "No se pudo usar Face ID. Toca Desbloquear para intentarlo de nuevo.";
}

export default function LockScreen({ mode, email, onSuccess, onUsePassword }: Props) {
  const base = ENDPOINTS[mode];
  const options = useRef<PublicKeyCredentialRequestOptionsJSON | null>(null);
  // Cada intento tiene su número: solo el más reciente puede cambiar la pantalla
  const attemptRef = useRef(0);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  /** diag: motivo del intento fallido anterior, para verlo en los logs del servidor. */
  async function fetchOptions(diag?: string): Promise<PublicKeyCredentialRequestOptionsJSON | null> {
    try {
      const qs = diag ? `?diag=${encodeURIComponent(diag.slice(0, 160))}` : "";
      const res = await fetch(`${base}/options${qs}`, { method: "POST" });
      if (res.ok) return await res.json();
      // Sin sesión o la cuenta ya no tiene Face ID: solo queda la contraseña
      if (res.status === 400 || res.status === 401) onUsePassword();
    } catch {
      setError("Sin conexión. Revisa tu red e intenta de nuevo.");
    }
    return null;
  }

  async function unlock() {
    const attempt = ++attemptRef.current;
    const isCurrent = () => attempt === attemptRef.current;

    if (!options.current) options.current = await fetchOptions();
    if (!options.current || !isCurrent()) return;

    const optionsJSON = options.current;
    setBusy(true);
    setError("");
    let diag = "";
    try {
      let response;
      const t0 = performance.now();
      try {
        // Si había otro intento en curso, la librería lo cancela (y ese falla en silencio)
        response = await startAuthentication({ optionsJSON });
      } catch (first) {
        // iOS a veces rechaza al instante el primer intento tras abrir la app,
        // sin llegar a mostrar Face ID. Un rechazo tan rápido no puede ser que
        // el usuario canceló: se reintenta una vez dentro del mismo toque.
        const elapsed = Math.round(performance.now() - t0);
        if ((first as Error).name !== "NotAllowedError" || elapsed > 1000 || !isCurrent()) throw first;
        diag = `retry:${(first as Error).name}:${elapsed}ms:${(first as Error).message}`;
        response = await startAuthentication({ optionsJSON });
      }
      if (!isCurrent()) return;

      const res = await fetch(`${base}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.unknownCredential) { onUsePassword(); return; }
        throw new VerifyError(body.error ?? "No se pudo verificar tu Face ID");
      }
      onSuccess();
    } catch (e) {
      // Un intento más nuevo ya tomó el control: este no toca la pantalla
      if (!isCurrent()) return;
      setError(friendlyError(e));
      const err = e as { name?: string; message?: string };
      options.current = await fetchOptions(`${diag ? diag + "|" : ""}fail:${err?.name}:${err?.message}`);
    } finally {
      if (isCurrent()) setBusy(false);
    }
  }

  // Face ID se lanza solo al abrir. iOS siempre antepone su hoja "Usar llave
  // de acceso" en apps web (haya toque o no), así que esperar al botón solo
  // añadía un toque. "Desbloquear" queda de respaldo si se cierra la hoja.
  const prepared = useRef(false);
  useEffect(() => {
    if (prepared.current) return;
    prepared.current = true;
    fetchOptions().then((o) => {
      options.current = o;
      if (o) unlock();
    });
  }, []);

  // Al volver de otra app iOS corta el intento pendiente: se lanza de nuevo
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && prepared.current) unlock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div className="lock-screen" role="dialog" aria-modal="true" aria-labelledby="lock-title">
      <div aria-hidden className="lock-deco">
        <span style={{ width: "320px", height: "320px", background: "radial-gradient(circle, rgba(74,124,89,0.20), transparent 70%)", top: "-80px", right: "-60px" }} />
        <span style={{ width: "380px", height: "380px", background: "radial-gradient(circle, rgba(74,124,89,0.16), transparent 70%)", bottom: "-120px", left: "-100px" }} />
      </div>

      <div className="lock-body">
        <div className="lock-icon">
          <ScanFace size={44} strokeWidth={1.6} />
        </div>

        <h1 id="lock-title" className="lock-title">Mis Finanzas está bloqueada</h1>
        <p className="lock-sub">Usa Face ID para desbloquear</p>
        {email && <p className="lock-email">{email}</p>}

        {/* Nunca se deshabilita: si un intento se queda colgado, otro toque lo reemplaza */}
        <button onClick={unlock} className="lock-btn">
          {busy ? "Verificando…" : "Desbloquear"}
        </button>

        <p className="lock-error" aria-live="polite">{error}</p>
      </div>

      <button onClick={onUsePassword} className="lock-link">Usar contraseña</button>

      <style>{`
        .lock-screen {
          position: fixed; inset: 0; z-index: 600;
          background: linear-gradient(165deg, #DCEBDA 0%, #F4F6F1 45%, #C9DECB 100%);
          display: flex; flex-direction: column; align-items: center;
          padding: max(24px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));
          font-family: var(--font-sans);
        }
        .lock-deco { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .lock-deco span { position: absolute; border-radius: 50%; display: block; }

        .lock-body {
          margin: auto; width: 100%; max-width: 340px;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          position: relative; z-index: 1;
          animation: lock-rise 0.45s ease-out both;
        }
        .lock-icon {
          width: 104px; height: 104px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: #4A7C59;
          background: rgba(255, 255, 255, 0.7);
          box-shadow: 0 10px 30px rgba(58, 94, 68, 0.18), inset 0 0 0 1px rgba(74, 124, 89, 0.18);
          margin-bottom: 28px;
        }
        .lock-title {
          font-size: 23px; font-weight: 700; letter-spacing: -0.02em;
          color: var(--text); line-height: 1.25;
        }
        .lock-sub { font-size: 14px; color: #4A7C59; font-weight: 500; margin-top: 8px; }
        .lock-email { font-size: 12px; color: var(--muted); margin-top: 4px; }

        .lock-btn {
          margin-top: 32px; min-width: 220px;
          background: #4A7C59; color: #fff; border: none; border-radius: 14px;
          padding: 15px 28px; font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: var(--font-sans);
          box-shadow: 0 6px 18px rgba(74, 124, 89, 0.35);
          transition: transform 0.12s ease, opacity 0.15s ease;
        }
        .lock-btn:active { transform: scale(0.97); }

        .lock-error { min-height: 18px; margin-top: 14px; font-size: 12.5px; color: var(--red); max-width: 300px; }

        .lock-link {
          position: relative; z-index: 1;
          background: none; border: none; color: var(--muted);
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: var(--font-sans); padding: 10px;
        }

        @keyframes lock-rise {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) { .lock-body { animation: none; } }
      `}</style>
    </div>
  );
}
