"use client";

import { Eye, EyeOff } from "lucide-react";
import MonthNav from "./MonthNav";
import Logo from "@/components/common/Logo";
import { useDashboardStore } from "@/store/dashboardStore";

/*
 * En movil la barra va en dos renglones: el logo centrado arriba (con el ojo y
 * el avatar a los lados) y el selector de mes debajo, a lo ancho. En un solo
 * renglon no caben: para centrar el logo las columnas laterales tienen que
 * medir igual, y el mes pide ~185px contra los 88 de los controles.
 *
 * En escritorio si cabe todo seguido, asi que vuelve a un renglon con el nombre
 * a la izquierda, el mes al centro y las acciones a la derecha.
 *
 * "Cerrar sesion" ya no vive aqui: estaba a 8px del avatar y sin confirmacion.
 * Ahora esta en Configuracion, que es donde se busca.
 */
export default function Navbar() {
  const { openModal, userEmail, view, setView, privacyMode, togglePrivacy } = useDashboardStore();

  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "??";

  const isConfig = view === "configuracion";

  return (
    <header className="nav-root">
      {/* Marca solo en movil: centrada y con aire */}
      <div className="nav-mark">
        <Logo size={34} />
      </div>

      {/* Marca con nombre solo en escritorio */}
      <div className="nav-brand">
        <Logo size={28} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
          Mis Finanzas
        </span>
      </div>

      <div className="nav-month">
        <MonthNav />
      </div>

      <div className="nav-actions">
        <button
          onClick={togglePrivacy}
          aria-label={privacyMode ? "Mostrar valores" : "Ocultar valores"}
          className="nav-icon-btn"
          style={{ color: privacyMode ? "var(--text)" : "var(--muted)" }}
        >
          {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        <button
          onClick={() => openModal("registro")}
          className="nav-reg-btn"
          style={{ background: "var(--text)", color: "#fff", fontSize: "12px", padding: "6px 14px", borderRadius: "7px", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, whiteSpace: "nowrap" }}
        >
          + Registrar
        </button>

        <button
          onClick={() => setView(isConfig ? "resumen" : "configuracion")}
          aria-label={isConfig ? "Volver al resumen" : "Configuración"}
          className="nav-icon-btn"
        >
          <span
            style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: isConfig ? "var(--text)" : "#4A7C59",
              color: "#fff", fontSize: "11px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              outline: isConfig ? "2px solid var(--text)" : "none",
              outlineOffset: "2px",
              transition: "background 0.15s",
            }}
          >
            {initials}
          </span>
        </button>
      </div>

      <style>{`
        .nav-root {
          background: var(--white);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 200;
          padding-top: env(safe-area-inset-top);
          display: grid;
          align-items: center;
          /* Escritorio: un renglon, nombre · mes · acciones */
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas: "brand month actions";
          height: calc(52px + env(safe-area-inset-top));
          padding-inline: 16px;
          column-gap: 12px;
        }

        .nav-mark    { grid-area: mark;    display: none; justify-content: center; }
        .nav-brand   { grid-area: brand;   display: flex; align-items: center; gap: 10px; }
        .nav-month   { grid-area: month;   display: flex; justify-content: center; }
        .nav-actions { grid-area: actions; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

        /* Area de toque de 44px: el icono no crece, crece la zona sensible */
        .nav-icon-btn {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none; cursor: pointer;
          border-radius: 8px; flex-shrink: 0;
          color: var(--muted);
        }

        @media (max-width: 768px) {
          .nav-root {
            /* Movil: dos renglones. Las columnas laterales miden igual (88px,
               el ancho de los dos botones) para que el logo caiga en el centro. */
            grid-template-columns: 88px 1fr 88px;
            grid-template-areas:
              ".     mark  actions"
              "month month month";
            height: auto;
            padding-inline: 8px;
            padding-bottom: 6px;
            row-gap: 2px;
          }
          .nav-mark  { display: flex; }
          .nav-brand { display: none; }
          .nav-reg-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
}
