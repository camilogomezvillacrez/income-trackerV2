"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import { useDashboardStore } from "@/store/dashboardStore";

/*
 * Pantalla de carga al entrar: logo con animación mientras
 * llegan los datos del dashboard, luego se desvanece.
 */
export default function SplashScreen() {
  const data = useDashboardStore((s) => s.data);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (data && !fading) {
      setFading(true);
      const t = setTimeout(() => setVisible(false), 450);
      return () => clearTimeout(t);
    }
  }, [data, fading]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        background: "var(--bg, #F7F6F2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.45s ease",
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="splash-logo">
        <Logo size={72} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--text, #1F2A24)", fontFamily: "var(--font-sans)" }}>
          Mis Finanzas
        </div>
        <div style={{ fontSize: "12px", color: "var(--muted, #8A9188)", marginTop: "2px", fontFamily: "var(--font-sans)" }}>
          Cargando tus datos…
        </div>
      </div>
      <div className="splash-dots">
        <span /><span /><span />
      </div>

      <style>{`
        .splash-logo {
          animation: splash-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                     splash-float 2.2s ease-in-out 0.6s infinite;
        }
        @keyframes splash-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes splash-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        .splash-dots { display: flex; gap: 7px; }
        .splash-dots span {
          width: 8px; height: 8px; border-radius: 50%;
          background: #4A7C59;
          animation: splash-dot 1.2s ease-in-out infinite;
        }
        .splash-dots span:nth-child(2) { animation-delay: 0.15s; }
        .splash-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes splash-dot {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
