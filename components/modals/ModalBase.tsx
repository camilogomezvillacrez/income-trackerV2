"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface Props {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function ModalBase({ title, children, maxWidth = 480 }: Props) {
  const closeModal = useDashboardStore((s) => s.closeModal);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      style={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        /* --app-h es el alto realmente visible (lo publica DashboardShell).
           Con inset:0 el overlay cubre la pantalla entera y centra la tarjeta
           detras del teclado; asi se centra en lo que se ve. */
        height: "var(--app-h, 100dvh)",
        background: "rgba(0,0,0,.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: "14px",
          padding: "24px",
          width: "100%",
          maxWidth,
          /* 90vh medía la pantalla completa e ignoraba el teclado: los campos
             de abajo quedaban detras y no habia nada que desplazar. */
          maxHeight: "calc(var(--app-h, 100dvh) - 32px)",
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{title}</h3>
          <button
            onClick={closeModal}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", lineHeight: 1, padding: "0 2px" }}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
