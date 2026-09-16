"use client";

import { Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ToastContainer from "@/components/common/Toast";
import SplashScreen from "@/components/common/SplashScreen";
import LockScreen from "@/components/common/LockScreen";
import { useDashboard, markActive } from "@/hooks/useDashboard";
import { isUnlockedThisLaunch, logout, markUnlocked } from "@/lib/clientAuth";
import { useDashboardStore } from "@/store/dashboardStore";
import { useReceiptStore } from "@/store/receiptStore";
import { writeCache } from "@/lib/dashboardCache";
import type { DashboardData } from "@/types";

import ResumenView from "@/views/ResumenView";

import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

// Solo Resumen va en la carga inicial; el resto se descarga al abrirse.
const MovimientosView     = dynamic(() => import("@/views/MovimientosView"));
const MetasView           = dynamic(() => import("@/views/MetasView"));
const DeudasView          = dynamic(() => import("@/views/DeudasView"));
const CategoriasView      = dynamic(() => import("@/views/CategoriasView"));
const CategoriaDetailView = dynamic(() => import("@/views/CategoriaDetailView"));
const ConfiguracionView   = dynamic(() => import("@/views/ConfiguracionView"));
const RecibosView         = dynamic(() => import("@/views/RecibosView"));
const CategoriasAdminView = dynamic(() => import("@/views/CategoriasAdminView"));
const AssistantBubble     = dynamic(() => import("@/components/common/AssistantBubble"));
const ReceiptConfirmModal = dynamic(() => import("@/components/modals/ReceiptConfirmModal"));

const loadRegisterModal = () => import("@/components/modals/RegisterModal");
const RegisterModal    = dynamic(loadRegisterModal);
const EditModal        = dynamic(() => import("@/components/modals/EditModal"));
const DeleteModal      = dynamic(() => import("@/components/modals/DeleteModal"));
const GoalModal        = dynamic(() => import("@/components/modals/GoalModal"));
const AbonoModal       = dynamic(() => import("@/components/modals/AbonoModal"));
const DebtModal        = dynamic(() => import("@/components/modals/DebtModal"));
const DebtAbonoModal   = dynamic(() => import("@/components/modals/DebtAbonoModal"));
const FixedModal       = dynamic(() => import("@/components/modals/FixedModal"));
const MonthReportModal = dynamic(() => import("@/components/modals/MonthReportModal"));

interface Props {
  userEmail: string;
  hasPasskey: boolean;
  initiallyLocked: boolean;
  /** Datos del mes que ya vinieron en el HTML (null si esta bloqueada). */
  initialData: DashboardData | null;
}

export default function DashboardShell({ userEmail, hasPasskey, initiallyLocked, initialData }: Props) {
  // Estado de sesión cargado antes del primer render: la caché local se lee
  // con el email correcto y la app bloqueada nunca llega a mostrar datos.
  // Solo en el navegador: en el servidor el store es compartido entre usuarios.
  // Además de la inactividad, con Face ID se bloquea cada arranque en frío
  // (la app se cerró desde la multitarea): no hay marca de esta apertura.
  useState(() => {
    if (typeof window === "undefined") return;
    const locked = initiallyLocked || (hasPasskey && !isUnlockedThisLaunch());
    if (!locked) markUnlocked();
    useDashboardStore.setState({ userEmail, hasPasskey, locked });
  });

  /*
   * Los datos que vinieron en el HTML se siembran en cuanto hidrata.
   *
   * En un efecto y no durante el render: el servidor pinta el splash con el
   * store vacio, asi que sembrarlos antes daria un desajuste de hidratacion.
   * Igual se ahorra el viaje de red entero, que es lo que costaba.
   */
  useEffect(() => {
    if (!initialData) return;
    const { data, activeMonth } = useDashboardStore.getState();
    if (!data && initialData.current_month === activeMonth) {
      useDashboardStore.setState({ data: initialData, loading: false });
      // Sin esto la copia del telefono no se refresca al arrancar, y es la que
      // pinta al desbloquear con Face ID y cuando no hay red.
      writeCache(userEmail, activeMonth, initialData);
    }
  }, [initialData, userEmail]);

  // Hasta hidratar se usa el valor del servidor, así el HTML y la hidratación coinciden
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useDashboard();

  // El modal de registro es el más usado: se precarga en cuanto la app está quieta
  useEffect(() => {
    const t = setTimeout(loadRegisterModal, 1500);
    return () => clearTimeout(t);
  }, []);

  const { view, modal, openModal, reportMonth } = useDashboardStore();
  const storeLocked = useDashboardStore((s) => s.locked);
  const receiptPending = useReceiptStore((s) => s.pending);
  const locked = mounted ? storeLocked : initiallyLocked;

  const isCatDetail = view.startsWith("cat-");
  const showFab = view === "resumen" || view === "movimientos";

  return (
    <>
      {locked ? (
        <LockScreen
          mode="unlock"
          email={userEmail}
          onSuccess={() => { markActive(); markUnlocked(); useDashboardStore.getState().setLocked(false); }}
          onUsePassword={() => logout("/login?password=1")}
        />
      ) : (
        <SplashScreen />
      )}
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
            {view === "recibos"       && <RecibosView />}
            {view === "configuracion" && <ConfiguracionView />}
            {view === "categorias-admin" && <CategoriasAdminView />}
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
      {/* En el shell y no en Recibos: si cambias de pantalla mientras la IA lee, igual aparece */}
      {receiptPending       && <ReceiptConfirmModal />}

      {/* Asistente flotante (solo chat): vive en el shell para estar en todas las vistas */}
      <AssistantBubble />

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
