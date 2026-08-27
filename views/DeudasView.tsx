"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Debt, DebtPerson } from "@/types";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import Money from "@/components/common/Money";

/** Agrupa las deudas por persona y calcula los totales de cada una. */
function groupByPerson(debts: Debt[]): DebtPerson[] {
  const map = new Map<string, DebtPerson>();

  for (const d of debts) {
    const key = d.person.trim();
    if (!map.has(key)) {
      map.set(key, { person: key, me_deben: 0, debo: 0, neto: 0, debts: [] });
    }
    const entry = map.get(key)!;
    entry.debts.push(d);
    if (!d.completed) {
      if (d.type === "me_deben") entry.me_deben += d.pending;
      else entry.debo += d.pending;
    }
  }

  for (const e of map.values()) e.neto = e.me_deben - e.debo;

  // Primero quien tenga saldo pendiente, de mayor a menor
  return Array.from(map.values()).sort(
    (a, b) => b.me_deben + b.debo - (a.me_deben + a.debo)
  );
}

function DueBadge({ debt }: { debt: Debt }) {
  if (debt.completed || debt.days_left === null || !debt.due_date) return null;

  const n = debt.days_left;
  let text: string;
  let color: string;
  let bg: string;

  if (n < 0) {
    const abs = Math.abs(n);
    text = `Vencida hace ${abs} ${abs === 1 ? "día" : "días"}`;
    color = "var(--red)";
    bg = "var(--red-bg)";
  } else if (n === 0) {
    text = "Vence hoy";
    color = "var(--amber)";
    bg = "var(--amber-bg)";
  } else if (n <= 7) {
    text = `Vence en ${n} ${n === 1 ? "día" : "días"}`;
    color = "var(--amber)";
    bg = "var(--amber-bg)";
  } else {
    const [, m, day] = debt.due_date.split("-");
    text = `Vence ${day}/${m}`;
    color = "var(--muted)";
    bg = "var(--bg)";
  }

  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        color,
        background: bg,
        padding: "2px 7px",
        borderRadius: "10px",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function DebtRow({ debt }: { debt: Debt }) {
  const { openModal, setDebtTarget, setEditDebtId, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const esMia = debt.type === "debo";
  const color = esMia ? "var(--red)" : "var(--green)";

  async function handleDelete() {
    const ok = window.confirm(
      `¿Borrar esta deuda de ${debt.person}? También se borran sus abonos.`
    );
    if (!ok) return;
    await fetch(`/api/debt/${debt.id}`, { method: "DELETE" });
    toast("Deuda eliminada");
    refresh();
  }

  return (
    <div style={{ padding: "11px 0", borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "7px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12.5px", color: "var(--text)", fontWeight: 500, marginBottom: "3px" }}>
            {debt.description || (esMia ? "Deuda" : "Préstamo")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10.5px", color: "var(--muted)" }}>{debt.date}</span>
            <DueBadge debt={debt} />
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {debt.completed ? (
            <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 700 }}>✓ Saldada</span>
          ) : (
            <>
              <Money value={debt.pending} color={color} style={{ fontSize: "14px", fontWeight: 700 }} />
              {debt.paid > 0 && (
                <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "1px" }}>
                  de <Money value={debt.amount} style={{ fontSize: "10px" }} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Barra de avance — solo si ya hay abonos */}
      {!debt.completed && debt.paid > 0 && (
        <div
          style={{
            height: "5px",
            background: "var(--bg)",
            borderRadius: "3px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: `${debt.pct}%`,
              height: "100%",
              background: color,
              borderRadius: "3px",
              transition: "width .3s",
            }}
          />
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {!debt.completed && (
          <button
            onClick={() => {
              setDebtTarget(debt.id);
              openModal("abono-deuda");
            }}
            style={{
              background: color,
              color: "#fff",
              border: "none",
              borderRadius: "7px",
              padding: "6px 13px",
              fontSize: "11.5px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            {esMia ? "Pagar" : "Registrar abono"}
          </button>
        )}
        <button
          onClick={() => {
            setEditDebtId(debt.id);
            openModal("deuda");
          }}
          aria-label="Editar deuda"
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            padding: "5px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Pencil size={13} color="var(--muted)" />
        </button>
        <button
          onClick={handleDelete}
          aria-label="Borrar deuda"
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            padding: "5px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={13} color="var(--muted)" />
        </button>
      </div>
    </div>
  );
}

function PersonCard({ group }: { group: DebtPerson }) {
  const [open, setOpen] = useState(true);
  const [verSaldadas, setVerSaldadas] = useState(false);

  const activas = group.debts.filter((d) => !d.completed);
  const saldadas = group.debts.filter((d) => d.completed);

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
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "9px",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-sans)",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#EEF2FF",
            color: "#4338CA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "13px",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {group.person.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>
            {group.person}
          </div>
          <div style={{ fontSize: "11px", color: "var(--muted)" }}>
            {activas.length > 0
              ? `${activas.length} ${activas.length === 1 ? "pendiente" : "pendientes"}`
              : "Todo saldado"}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {group.me_deben > 0 && (
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
              te debe{" "}
              <Money value={group.me_deben} color="var(--green)" style={{ fontSize: "12.5px", fontWeight: 700 }} />
            </div>
          )}
          {group.debo > 0 && (
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>
              le debes{" "}
              <Money value={group.debo} color="var(--red)" style={{ fontSize: "12.5px", fontWeight: 700 }} />
            </div>
          )}
        </div>

        <span style={{ color: "var(--muted)", display: "flex", flexShrink: 0 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: "10px" }}>
          {activas.map((d) => (
            <DebtRow key={d.id} debt={d} />
          ))}

          {saldadas.length > 0 && (
            <>
              <button
                onClick={() => setVerSaldadas((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: "11px",
                  padding: "9px 0 0",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {verSaldadas ? "Ocultar" : "Ver"} {saldadas.length}{" "}
                {saldadas.length === 1 ? "saldada" : "saldadas"}
              </button>
              {verSaldadas && saldadas.map((d) => <DebtRow key={d.id} debt={d} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeudasView() {
  const { data, openModal, setEditDebtId } = useDashboardStore();
  const debts = data?.debts ?? [];
  const groups = groupByPerson(debts);

  const totalMeDeben = groups.reduce((a, g) => a + g.me_deben, 0);
  const totalDebo = groups.reduce((a, g) => a + g.debo, 0);

  function nueva() {
    setEditDebtId(null);
    openModal("deuda");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Deudas</h2>
        <button
          onClick={nueva}
          style={{
            background: "var(--text)",
            color: "#fff",
            fontSize: "12px",
            padding: "7px 14px",
            borderRadius: "7px",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Plus size={14} /> Nueva
        </button>
      </div>

      {/* Totales */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <div style={{ background: "var(--green-bg)", borderRadius: "10px", padding: "13px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600, marginBottom: "3px" }}>
            🤝 Te deben
          </div>
          <Money value={totalMeDeben} color="var(--green)" style={{ fontSize: "17px", fontWeight: 700 }} />
        </div>
        <div style={{ background: "var(--red-bg)", borderRadius: "10px", padding: "13px 14px" }}>
          <div style={{ fontSize: "11px", color: "var(--red)", fontWeight: 600, marginBottom: "3px" }}>
            💸 Debes
          </div>
          <Money value={totalDebo} color="var(--red)" style={{ fontSize: "17px", fontWeight: 700 }} />
        </div>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🤝</div>
          <p style={{ fontSize: "13px", color: "var(--sub)", marginBottom: "4px" }}>
            No tienes deudas anotadas.
          </p>
          <p style={{ fontSize: "12px" }}>Anota lo que debes y lo que te deben, por persona.</p>
        </div>
      ) : (
        groups.map((g) => <PersonCard key={g.person} group={g} />)
      )}
    </div>
  );
}
