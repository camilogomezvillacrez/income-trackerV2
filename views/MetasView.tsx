"use client";

import GoalCard from "@/components/goals/GoalCard";
import { useDashboardStore } from "@/store/dashboardStore";

export default function MetasView() {
  const { data, openModal } = useDashboardStore();
  const goals = data?.goals ?? [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Mis metas</h2>
        <button
          onClick={() => openModal("meta")}
          style={{
            background: "var(--text)",
            color: "#fff",
            fontSize: "12px",
            padding: "6px 14px",
            borderRadius: "7px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
          }}
        >
          + Nueva meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎯</div>
          <p style={{ fontSize: "13px", color: "var(--sub)", marginBottom: "4px" }}>No tienes metas aún.</p>
          <p style={{ fontSize: "12px" }}>Crea tu primera meta y empieza a ahorrar.</p>
        </div>
      ) : (
        goals.map((g) => <GoalCard key={g.id} goal={g} />)
      )}
    </div>
  );
}
