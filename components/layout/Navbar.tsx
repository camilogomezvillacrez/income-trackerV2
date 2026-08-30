"use client";

import { Eye, EyeOff } from "lucide-react";
import MonthNav from "./MonthNav";
import Logo from "@/components/common/Logo";
import { useDashboardStore } from "@/store/dashboardStore";

/*
 * Un solo renglon: marca a la izquierda, mes al centro, acciones a la derecha.
 * Las columnas laterales miden igual (88px, los dos botones de 44) para que el
 * selector de mes quede centrado de verdad y no desplazado.
 *
 * En movil se oculta el nombre "Mis Finanzas": con el no cabia el resto y el
 * titulo terminaba partiendose en dos lineas. Queda solo el arbol.
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
      <div className="nav-brand">
        <Logo size={34} />
        <span className="nav-wordmark">Mis Finanzas</span>
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
          height: calc(52px + env(safe-area-inset-top));
          padding-inline: 16px;
          column-gap: 12px;
          display: grid;
          align-items: center;
          grid-template-columns: 1fr auto 1fr;
        }

        .nav-brand    { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .nav-wordmark { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; }
        .nav-month    { display: flex; justify-content: center; }
        .nav-actions  { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }

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
            /* Columnas laterales iguales (ojo 44 + avatar 44) para que el mes
               quede centrado. Con 8px de padding la pildora (178px) entra en
               los 198 de la columna central. */
            grid-template-columns: 88px 1fr 88px;
            padding-inline: 8px;
            column-gap: 0;
          }
          .nav-wordmark { display: none; }
          .nav-reg-btn  { display: none !important; }
        }
      `}</style>
    </header>
  );
}
