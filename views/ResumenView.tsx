"use client";

import dynamic from "next/dynamic";
import KPICards from "@/components/dashboard/KPICards";
import MetasCard from "@/components/dashboard/MetasCard";
import RecordatoriosCard from "@/components/dashboard/RecordatoriosCard";
import ExcelButton from "@/components/common/ExcelButton";
import CategoryBars from "@/components/dashboard/CategoryBars";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import TransactionRow from "@/components/transactions/TransactionRow";
import { useDashboardStore } from "@/store/dashboardStore";
import { Download, ChevronRight } from "lucide-react";
import { exportCSV } from "@/lib/exportCSV";

// Charts must be client-only (no SSR)
const ComboChart  = dynamic(() => import("@/components/dashboard/charts/ComboChart"),  { ssr: false });
const DonutChart  = dynamic(() => import("@/components/dashboard/charts/DonutChart"),  { ssr: false });
const WeeklyChart = dynamic(() => import("@/components/dashboard/charts/WeeklyChart"), { ssr: false });

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: action ? "12px" : "14px" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function ResumenView() {
  const { data, loading, setView } = useDashboardStore();

  return (
    <div>
      <RecordatoriosCard />

      <KPICards />

      {/* Metas — salieron de la barra de abajo y viven aqui */}
      <MetasCard />

      {/* Charts row 1 */}
      <div className="charts-row">
        <Panel title="Ingresos vs Gastos · Balance">
          <div style={{ height: "180px" }}>
            <ComboChart />
          </div>
        </Panel>
        <Panel
          title="Distribución de gastos"
          action={
            <button
              onClick={() => setView("cats")}
              style={{ display: "flex", alignItems: "center", gap: "2px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "#4A7C59", padding: "4px 0" }}
            >
              Ver todas <ChevronRight size={13} />
            </button>
          }
        >
          <div style={{ height: "180px" }}>
            <DonutChart />
          </div>
        </Panel>
      </div>

      {/* Charts row 2 */}
      <div className="charts-row">
        <Panel
          title="Por categoría"
          action={
            <div style={{ display: "flex", gap: "6px" }}>
            <ExcelButton />
            <button
              onClick={() => data && exportCSV(data)}
              style={{
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <Download size={12} /> CSV
            </button>
            </div>
          }
        >
          <CategoryBars />
        </Panel>
        <Panel title="Gasto por día de la semana">
          <div style={{ height: "140px" }}>
            <WeeklyChart />
          </div>
        </Panel>
      </div>

      {/* AI */}
      <AIRecommendations />

      {/* Recent */}
      <Panel title="Últimos movimientos">
        {loading && !data ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="sk" style={{ height: "44px", marginBottom: "8px", borderRadius: "8px" }} />
          ))
        ) : (
          (data?.recent ?? []).map((r) => <TransactionRow key={`${r.tipo}-${r.id}`} r={r} />)
        )}
        {data?.recent.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "20px 0" }}>
            Sin movimientos este mes
          </div>
        )}
      </Panel>

      <style>{`
        .charts-row {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        @media (max-width: 768px) {
          .charts-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
