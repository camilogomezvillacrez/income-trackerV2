"use client";

import { Trash2 } from "lucide-react";
import type { Goal } from "@/types";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import Money from "@/components/common/Money";

interface Props {
  goal: Goal;
}

export default function GoalCard({ goal }: Props) {
  const { openModal, setAbonoTarget, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  async function handleDelete() {
    await fetch(`/api/goal/${goal.id}`, { method: "DELETE" });
    toast("Meta eliminada");
    refresh();
  }

  function handleAbono() {
    setAbonoTarget({ goalId: goal.id });
    openModal("abono");
  }

  const barClass = goal.completed ? "var(--green)" : "var(--blue)";

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
          {goal.emoji} {goal.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {goal.completed ? (
            <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>✓ Cumplida</span>
          ) : (
            <button
              onClick={handleAbono}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "11px",
                color: "var(--sub)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              + Abonar
            </button>
          )}
          <button
            onClick={handleDelete}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <Trash2 size={13} color="var(--muted)" />
          </button>
        </div>
      </div>

      <div style={{ height: "6px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
        <div
          style={{
            height: "100%",
            borderRadius: "4px",
            background: barClass,
            width: `${Math.min(goal.pct, 100)}%`,
            transition: "width 0.5s",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)" }}>
        <span><Money value={goal.saved} style={{ fontSize: "10px" }} /> ahorrados</span>
        <span style={{ fontWeight: 600, color: "var(--blue)" }}>{goal.pct}%</span>
        <span>Meta: <Money value={goal.target} style={{ fontSize: "10px" }} /></span>
      </div>

      {!goal.completed && (
        <div style={{ fontSize: "10px", color: "var(--sub)", marginTop: "4px" }}>
          {goal.meses_restantes !== null
            ? `📅 A este ritmo: ${goal.meses_restantes} ${goal.meses_restantes === 1 ? "mes" : "meses"} para cumplirla`
            : "⚠ Sin ahorro mensual suficiente para proyectar"}
        </div>
      )}
    </div>
  );
}
