"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

interface Props {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function ModalBase({ title, children, maxWidth = 480 }: Props) {
  const closeModal = useDashboardStore((s) => s.closeModal);

  /*
   * Alto del teclado, para que la tarjeta quepa en lo que se ve.
   *
   * Ninguna unidad de CSS conoce el teclado de iOS: vh, svh y dvh miden la
   * pantalla entera, asi que un maxHeight en vh deja los campos de abajo
   * tapados y sin nada que desplazar. visualViewport es la unica que lo sabe.
   *
   * Se usa SOLO para el alto de la tarjeta y el hueco inferior del overlay.
   * No toca el scroll ni el alto del body: si la medida saliera mal, lo peor
   * que pasa es que la tarjeta quede algo corta o algo alta.
   */
  const [vp, setVp] = useState<{ h: number; kb: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const h = Math.round(vv.height);
      // Tope de seguridad: una lectura absurda no puede empujar la tarjeta
      // fuera de la pantalla.
      const kb = Math.max(0, Math.min(window.innerHeight - h, window.innerHeight * 0.6));
      setVp({ h, kb: Math.round(kb) });
    };
    update();
    // Solo "resize": es donde cambia el teclado. Escuchar "scroll" fue lo que
    // en su momento se peleo con el desplazamiento del usuario.
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

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
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        paddingBottom: `${16 + (vp?.kb ?? 0)}px`,
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: "14px",
          padding: "24px",
          width: "100%",
          maxWidth,
          maxHeight: vp ? `${vp.h - 32}px` : "90vh",
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
