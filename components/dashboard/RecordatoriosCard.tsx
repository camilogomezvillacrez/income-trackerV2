"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarClock } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { fmt, monthLabel } from "@/lib/utils";

/** Avisa de deudas próximas a vencer y de los gastos fijos del mes. */
export default function RecordatoriosCard() {
  const { data, activeMonth, setView, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const [seleccion, setSeleccion] = useState<Record<number, boolean>>({});
  const [montos, setMontos] = useState<Record<number, string>>({});
  const [guardando, setGuardando] = useState(false);

  // Deudas vencidas o que vencen en 7 días o menos
  const deudas = (data?.debts ?? [])
    .filter((d) => !d.completed && d.days_left !== null && d.days_left <= 7)
    .sort((a, b) => (a.days_left ?? 0) - (b.days_left ?? 0));

  const pendientes = (data?.fixed_expenses ?? []).filter((f) => f.active && !f.registered);

  // Al cambiar de mes o de datos, marcar todos los pendientes por defecto
  useEffect(() => {
    const sel: Record<number, boolean> = {};
    const mon: Record<number, string> = {};
    for (const f of pendientes) {
      sel[f.id] = true;
      mon[f.id] = String(f.amount);
    }
    setSeleccion(sel);
    setMontos(mon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonth, pendientes.length]);

  if (deudas.length === 0 && pendientes.length === 0) return null;

  const marcados = pendientes.filter((f) => seleccion[f.id]);

  async function registrar() {
    if (marcados.length === 0) return;
    setGuardando(true);

    const res = await fetch("/api/fixed/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: activeMonth,
        items: marcados.map((f) => ({
          id: f.id,
          amount: parseFloat(montos[f.id]) || f.amount,
        })),
      }),
    });

    setGuardando(false);

    if (!res.ok) {
      toast("No se pudieron registrar", "err");
      return;
    }

    const j = await res.json().catch(() => ({}));
    toast(
      j.registrados === 1
        ? "✓ Gasto fijo registrado"
        : `✓ ${j.registrados} gastos fijos registrados`
    );
    refresh();
  }

  const total = marcados.reduce(
    (a, f) => a + (parseFloat(montos[f.id]) || f.amount),
    0
  );

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--amber)",
        borderRadius: "10px",
        padding: "14px 16px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Bell size={15} color="var(--amber)" />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
          Recordatorios
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            background: "var(--amber-bg)",
            color: "var(--amber)",
            padding: "2px 7px",
            borderRadius: "10px",
          }}
        >
          {deudas.length + pendientes.length}
        </span>
      </div>

      {/* ── Deudas por vencer ─────────────────────────── */}
      {deudas.map((d) => {
        const vencida = (d.days_left ?? 0) < 0;
        const hoy = d.days_left === 0;
        const color = vencida ? "var(--red)" : "var(--amber)";
        const texto = vencida
          ? `Vencida hace ${Math.abs(d.days_left!)} ${Math.abs(d.days_left!) === 1 ? "día" : "días"}`
          : hoy
            ? "Vence hoy"
            : `Vence en ${d.days_left} ${d.days_left === 1 ? "día" : "días"}`;

        return (
          <button
            key={`d-${d.id}`}
            onClick={() => setView("deudas")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 0",
              background: "none",
              border: "none",
              borderTop: "1px solid var(--border)",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--font-sans)",
            }}
          >
            <span style={{ fontSize: "15px" }}>{vencida ? "⚠️" : "⏰"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12.5px", color: "var(--text)" }}>
                {d.type === "debo" ? `Le debes a ${d.person}` : `${d.person} te debe`}{" "}
                <strong>{fmt(d.pending)}</strong>
              </div>
              <div style={{ fontSize: "10.5px", color, fontWeight: 600 }}>{texto}</div>
            </div>
          </button>
        );
      })}

      {/* ── Gastos fijos pendientes ───────────────────── */}
      {pendientes.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", marginTop: deudas.length ? "4px" : 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <CalendarClock size={13} color="var(--muted)" />
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Gastos fijos de {monthLabel(activeMonth)} · {pendientes.length} sin registrar
            </span>
          </div>

          {pendientes.map((f) => (
            <div
              key={`f-${f.id}`}
              style={{ display: "flex", alignItems: "center", gap: "9px", padding: "5px 0" }}
            >
              <input
                type="checkbox"
                checked={!!seleccion[f.id]}
                onChange={(e) =>
                  setSeleccion((s) => ({ ...s, [f.id]: e.target.checked }))
                }
                style={{ width: "17px", height: "17px", accentColor: "#4A7C59", flexShrink: 0, cursor: "pointer" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", color: "var(--text)", fontWeight: 500 }}>
                  {f.name}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>
                  {f.category} · día {f.day_of_month}
                </div>
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={montos[f.id] ?? ""}
                onChange={(e) => setMontos((m) => ({ ...m, [f.id]: e.target.value }))}
                style={{
                  width: "108px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "7px",
                  padding: "7px 9px",
                  fontSize: "12.5px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text)",
                  outline: "none",
                  textAlign: "right",
                  flexShrink: 0,
                }}
              />
            </div>
          ))}

          <button
            onClick={registrar}
            disabled={guardando || marcados.length === 0}
            style={{
              width: "100%",
              marginTop: "10px",
              background: marcados.length === 0 ? "var(--bg)" : "#4A7C59",
              color: marcados.length === 0 ? "var(--muted)" : "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: guardando || marcados.length === 0 ? "default" : "pointer",
              opacity: guardando ? 0.7 : 1,
              fontFamily: "var(--font-sans)",
            }}
          >
            {guardando
              ? "Registrando…"
              : marcados.length === 0
                ? "Selecciona al menos uno"
                : `Registrar ${marcados.length} · ${fmt(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}
