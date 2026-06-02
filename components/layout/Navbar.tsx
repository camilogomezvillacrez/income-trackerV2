"use client";

import { PieChart, Eye, EyeOff, LogOut } from "lucide-react";
import MonthNav from "./MonthNav";
import { useDashboardStore } from "@/store/dashboardStore";

export default function Navbar() {
  const { openModal, userEmail, view, setView, privacyMode, togglePrivacy } = useDashboardStore();

  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "??";

  const isConfig = view === "configuracion";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav
      style={{
        background: "var(--white)",
        borderBottom: "1px solid var(--border)",
        padding: "0 16px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 200,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PieChart size={14} color="#fff" />
        </div>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Mis Finanzas</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <MonthNav />

        {/* Ocultar valores */}
        <button
          onClick={togglePrivacy}
          title={privacyMode ? "Mostrar valores" : "Ocultar valores"}
          style={{ background: "none", border: "none", cursor: "pointer", color: privacyMode ? "var(--text)" : "var(--muted)", display: "flex", alignItems: "center", padding: "4px", borderRadius: "7px" }}
        >
          {privacyMode ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>

        {/* Registrar — solo desktop */}
        <button
          onClick={() => openModal("registro")}
          className="nav-reg-btn"
          style={{ background: "var(--text)", color: "#fff", fontSize: "12px", padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}
        >
          + Registrar
        </button>

        {/* Avatar — toca para ir a Configuración */}
        <button
          onClick={() => setView(isConfig ? "resumen" : "configuracion")}
          title={isConfig ? "Volver al resumen" : `${userEmail} · Configuración`}
          style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: isConfig ? "var(--text)" : "#4A7C59",
            color: "#fff", fontSize: "11px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, border: "none", cursor: "pointer",
            outline: isConfig ? "2px solid var(--text)" : "none",
            outlineOffset: "2px",
            transition: "background 0.15s",
          }}
        >
          {initials}
        </button>

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", padding: "6px", borderRadius: "7px" }}
        >
          <LogOut size={17} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) { .nav-reg-btn { display: none !important; } }
      `}</style>
    </nav>
  );
}
