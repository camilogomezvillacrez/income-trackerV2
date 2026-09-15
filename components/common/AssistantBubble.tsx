"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Bot, X, Camera, ReceiptText, Loader2 } from "lucide-react";
import ChatPanel from "@/components/common/ChatPanel";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { useReceiptStore } from "@/store/receiptStore";
import { resizeForUpload } from "@/lib/imageResize";

const ReceiptConfirmModal = dynamic(() => import("@/components/modals/ReceiptConfirmModal"));

/**
 * Asistente flotante disponible en toda la app: escanea recibos con la cámara
 * y responde preguntas. Vive en el shell, no en una vista, para que siga ahí
 * sin importar en qué pantalla esté el usuario.
 */
export default function AssistantBubble() {
  const { open, scanning, pending, setOpen, setScanning, setPending } = useReceiptStore();
  const setView = useDashboardStore((s) => s.setView);
  const locked = useDashboardStore((s) => s.locked);
  const toast = useToastStore((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a tomar la misma foto
    if (!file) return;

    setOpen(false);
    setScanning(true);
    let previewUrl = "";

    try {
      const small = await resizeForUpload(file);
      previewUrl = URL.createObjectURL(small);

      const form = new FormData();
      form.append("image", small);
      const res = await fetch("/api/receipts/scan", { method: "POST", body: form });

      if (res.status === 401) { window.location.href = "/login"; return; }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error al escanear");

      if (json.error) toast(json.error, "err");
      setPending({ pathname: json.pathname, fields: json.fields, previewUrl });
    } catch {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      toast("No se pudo escanear el recibo", "err");
    } finally {
      setScanning(false);
    }
  }

  if (locked) return null;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: "none" }}
      />

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="ab-backdrop" />
          <div className="ab-panel">
            <div className="ab-head">
              <Bot size={16} color="#4338CA" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Asistente</span>
              <button onClick={() => setOpen(false)} className="ab-close" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="ab-actions">
              <button onClick={() => fileRef.current?.click()} className="ab-action ab-action-main">
                <Camera size={16} />
                Escanear recibo
              </button>
              <button
                onClick={() => { setOpen(false); setView("recibos"); }}
                className="ab-action"
              >
                <ReceiptText size={16} />
                Mis recibos
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <ChatPanel embedded />
            </div>
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="ab-bubble"
        aria-label="Asistente IA"
        disabled={scanning}
      >
        {scanning ? <Loader2 size={24} className="ab-spin" /> : open ? <X size={24} /> : <Bot size={24} />}
      </button>

      {pending && <ReceiptConfirmModal />}

      <style>{`
        .ab-bubble {
          position: fixed;
          right: 18px;
          bottom: 140px;
          z-index: 220;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #4338CA;
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(67,56,202,.45);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* En escritorio no hay FAB verde debajo, la burbuja baja a su sitio natural */
        @media (min-width: 769px) {
          .ab-bubble { bottom: 24px; right: 24px; }
        }
        .ab-spin { animation: ab-rotate 1s linear infinite; }
        @keyframes ab-rotate { to { transform: rotate(360deg); } }

        .ab-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.35);
          z-index: 215;
        }
        .ab-panel {
          position: fixed;
          z-index: 216;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,.18);
          left: 12px;
          right: 12px;
          bottom: 84px;
          top: 64px;
        }
        @media (min-width: 769px) {
          .ab-panel {
            left: auto;
            top: auto;
            right: 24px;
            bottom: 88px;
            width: 380px;
            height: 560px;
          }
        }
        .ab-head {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .ab-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--muted);
          display: flex;
          padding: 0;
        }
        .ab-actions {
          display: flex;
          gap: 8px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .ab-action {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 11px 8px;
          border: 1px solid var(--border);
          border-radius: 9px;
          background: var(--bg);
          color: var(--sub);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-sans);
          cursor: pointer;
        }
        .ab-action-main {
          background: #4338CA;
          border-color: #4338CA;
          color: #fff;
        }
      `}</style>
    </>
  );
}
