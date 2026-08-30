"use client";

import { Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ToastContainer from "@/components/common/Toast";
import SplashScreen from "@/components/common/SplashScreen";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStore } from "@/store/dashboardStore";

import ResumenView from "@/views/ResumenView";
import MovimientosView from "@/views/MovimientosView";
import MetasView from "@/views/MetasView";
import DeudasView from "@/views/DeudasView";
import CategoriasView from "@/views/CategoriasView";
import CategoriaDetailView from "@/views/CategoriaDetailView";
import ConfiguracionView from "@/views/ConfiguracionView";
import AsistenteView from "@/views/AsistenteView";

import RegisterModal from "@/components/modals/RegisterModal";
import EditModal from "@/components/modals/EditModal";
import DeleteModal from "@/components/modals/DeleteModal";
import GoalModal from "@/components/modals/GoalModal";
import AbonoModal from "@/components/modals/AbonoModal";
import DebtModal from "@/components/modals/DebtModal";
import DebtAbonoModal from "@/components/modals/DebtAbonoModal";
import FixedModal from "@/components/modals/FixedModal";
import MonthReportModal from "@/components/modals/MonthReportModal";

import { useEffect } from "react";

export default function DashboardShell({ userEmail }: { userEmail: string }) {
  const setUserEmail = useDashboardStore((s) => s.setUserEmail);

  useEffect(() => { setUserEmail(userEmail); }, [userEmail]);

  /*
   * iOS abre el teclado ENCIMA de la pagina: el viewport de layout no se
   * encoge, asi que el shell sigue midiendo la pantalla entera y debajo del
   * contenido queda un hueco muerto (se ve sobre todo en el chat).
   *
   * visualViewport si reporta el alto realmente visible. Se publica en
   * --app-h, que globals.css usa como alto del body en movil, y se marca
   * .kb-open mientras el teclado esta arriba.
   */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty("--app-h", `${Math.round(vv.height)}px`);
        // Umbral generoso: la barra del navegador tambien cambia vv.height.
        root.classList.toggle("kb-open", window.innerHeight - vv.height > 120);
        // Con el shell ya ajustado, el desplazamiento que hizo iOS sobra.
        if (window.scrollY > 0) window.scrollTo(0, 0);
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.removeProperty("--app-h");
      root.classList.remove("kb-open");
    };
  }, []);

  useDashboard();

  const { view, modal, openModal, reportMonth } = useDashboardStore();

  const isCatDetail = view.startsWith("cat-");
  const showFab = view === "resumen" || view === "movimientos";

  return (
    <>
      <SplashScreen />
      <Navbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Desktop sidebar — hidden on mobile via CSS */}
        <div className="shell-sidebar">
          <Sidebar />
        </div>

        {/* Main content — key={view} re-monta el div y dispara la animación en cada cambio */}
        <main className="shell-main">
          <div key={view} className="view-animate">
            {view === "resumen"       && <ResumenView />}
            {view === "movimientos"   && <MovimientosView />}
            {view === "metas"         && <MetasView />}
            {view === "deudas"        && <DeudasView />}
            {view === "cats"          && <CategoriasView />}
            {view === "asistente"     && <AsistenteView />}
            {view === "configuracion" && <ConfiguracionView />}
            {isCatDetail              && <CategoriaDetailView catName={view.slice(4)} />}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — flex-item in body flow, NOT position:fixed */}
      <div className="shell-bottom-nav">
        <BottomNav />
      </div>

      {/* FAB — mobile only, position:fixed above bottom nav */}
      {showFab && (
        <button
          onClick={() => openModal("registro")}
          className="shell-fab"
          aria-label="Registrar movimiento"
        >
          <Plus size={26} />
        </button>
      )}

      {/* Modals */}
      {modal === "registro" && <RegisterModal />}
      {modal === "edit"     && <EditModal />}
      {modal === "del"      && <DeleteModal />}
      {modal === "meta"     && <GoalModal />}
      {modal === "abono"    && <AbonoModal />}
      {modal === "deuda"    && <DebtModal />}
      {modal === "abono-deuda" && <DebtAbonoModal />}
      {modal === "fijo"     && <FixedModal />}
      {reportMonth          && <MonthReportModal month={reportMonth} />}

      <ToastContainer />

      <style>{`
        /* ── Desktop (> 768px) ─────────────────────────── */
        .shell-sidebar     { display: flex; }
        .shell-bottom-nav  { display: none; }
        .shell-fab         { display: none; }
        .shell-main        { flex: 1; overflow-y: auto; padding: 20px; }

        /* ── Mobile (≤ 768px) ──────────────────────────── */
        @media (max-width: 768px) {
          .shell-sidebar    { display: none; }
          .shell-bottom-nav { display: flex; flex-shrink: 0; }
          /* Mientras se escribe, la barra de abajo cede su sitio: en el chat
             son 68px de los ~280 que deja el teclado. */
          .kb-open .shell-bottom-nav { display: none; }
          .kb-open .shell-fab        { display: none; }
          .shell-fab        { display: flex; }
          .shell-main       { padding: 12px; overflow-y: auto; flex: 1; }
        }

        .shell-fab {
          position: fixed;
          bottom: 80px;
          right: 18px;
          z-index: 210;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #4A7C59;
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(74,124,89,.4);
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </>
  );
}
