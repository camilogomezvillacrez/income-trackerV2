"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useKeyboardViewport } from "@/hooks/useKeyboardViewport";

interface Props {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function ModalBase({ title, children, maxWidth = 480 }: Props) {
  const closeModal = useDashboardStore((s) => s.closeModal);
  const kb = useKeyboardViewport(true);

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
        left: 0,
        right: 0,
        // Con el teclado abierto nos ceñimos al área visible; si no, pantalla completa
        top: kb ? kb.top : 0,
        height: kb ? kb.height : "100%",
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
          maxHeight: "100%",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
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
