"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import ChatPanel from "@/components/common/ChatPanel";
import { useDashboardStore } from "@/store/dashboardStore";

/**
 * Chat con la IA disponible en toda la app. Vive en el shell, no en una vista,
 * para que siga ahí sin importar en qué pantalla esté el usuario.
 * El escaneo de recibos está en la pestaña Recibos, no aquí.
 */
export default function AssistantBubble() {
  const [open, setOpen] = useState(false);
  const locked = useDashboardStore((s) => s.locked);

  if (locked) return null;

  return (
    <>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="ab-backdrop" />
          <div className="ab-panel">
            <div className="ab-head">
              <Bot size={16} color="#4338CA" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Asistente IA</span>
              <button onClick={() => setOpen(false)} className="ab-close" aria-label="Cerrar">
                <X size={18} />
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
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>

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
      `}</style>
    </>
  );
}
