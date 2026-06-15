"use client";

import { Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ToastContainer from "@/components/common/Toast";
import { useDashboard } from "@/hooks/useDashboard";
import { useDashboardStore } from "@/store/dashboardStore";

import ResumenView from "@/views/ResumenView";
import MovimientosView from "@/views/MovimientosView";
import MetasView from "@/views/MetasView";
import CategoriasView from "@/views/CategoriasView";
import CategoriaDetailView from "@/views/CategoriaDetailView";
import ConfiguracionView from "@/views/ConfiguracionView";

import RegisterModal from "@/components/modals/RegisterModal";
import EditModal from "@/components/modals/EditModal";
import DeleteModal from "@/components/modals/DeleteModal";
import GoalModal from "@/components/modals/GoalModal";
import AbonoModal from "@/components/modals/AbonoModal";
import MonthReportModal from "@/components/modals/MonthReportModal";

import { useEffect } from "react";

export default function DashboardShell({ userEmail }: { userEmail: string }) {
  const setUserEmail = useDashboardStore((s) => s.setUserEmail);

  useEffect(() => { setUserEmail(userEmail); }, [userEmail]);

  useDashboard();

  const { view, modal, openModal, reportMonth } = useDashboardStore();

  const isCatDetail = view.startsWith("cat-");
  const showFab = view === "resumen" || view === "movimientos";

  return (
    <>
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
            {view === "cats"          && <CategoriasView />}
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
          .shell-bottom-nav { display: flex; }
          .shell-fab        { display: flex; }
          .shell-main       { padding: 12px; height: 100%; overflow-y: auto; }
        }

        .shell-fab {
          position: fixed;
          bottom: calc(92px + env(safe-area-inset-bottom, 0px));
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
