"use client";

import { Repeat, Plus, Pencil, Trash2, Pause, Play } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";
import { CAT_META } from "@/constants/categories";

export default function GastosFijosPanel() {
  const { data, openModal, setEditDebtId, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const fijos = data?.fixed_expenses ?? [];
  const activos = fijos.filter((f) => f.active);
  const totalMes = activos.reduce((a, f) => a + f.amount, 0);

  function nuevo() {
    setEditDebtId(null);
    openModal("fijo");
  }

  async function togglePausa(id: number, active: number) {
    await fetch(`/api/fixed/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: active ? 0 : 1 }),
    });
    toast(active ? "Gasto fijo pausado" : "Gasto fijo activado");
    refresh();
  }

  async function borrar(id: number, name: string) {
    const ok = window.confirm(
      `¿Borrar el gasto fijo "${name}"? Los gastos que ya registraste NO se borran.`
    );
    if (!ok) return;
    await fetch(`/api/fixed/${id}`, { method: "DELETE" });
    toast("Gasto fijo eliminado");
    refresh();
  }

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "20px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Repeat size={16} color="var(--amber)" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>
          Gastos fijos
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
        Arriendo, internet, suscripciones… Se guardan una sola vez y cada mes te
        aparecen en el Resumen para registrarlos con un toque.
      </p>

      {activos.length > 0 && (
        <div
          style={{
            background: "var(--bg)",
            borderRadius: "8px",
            padding: "10px 12px",
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "11.5px", color: "var(--muted)" }}>
            Total mensual ({activos.length})
          </span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
            {fmt(totalMes)}
          </span>
        </div>
      )}

      {fijos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "22px 10px", color: "var(--muted)" }}>
          <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>🔄</div>
          <p style={{ fontSize: "12.5px", color: "var(--sub)" }}>Aún no tienes gastos fijos.</p>
        </div>
      ) : (
        fijos.map((f) => {
          const meta = CAT_META[f.category] ?? CAT_META.General;
          return (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 0",
                borderTop: "1px solid var(--border)",
                opacity: f.active ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: meta.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {meta.emoji}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text)" }}>
                  {f.name}
                </div>
                <div style={{ fontSize: "10.5px", color: "var(--muted)" }}>
                  día {f.day_of_month} ·{" "}
                  {!f.active ? (
                    <span style={{ fontWeight: 600 }}>pausado</span>
                  ) : f.registered ? (
                    <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ registrado este mes</span>
                  ) : (
                    <span style={{ color: "var(--amber)", fontWeight: 600 }}>pendiente</span>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  flexShrink: 0,
                }}
              >
                {fmt(f.amount)}
              </span>

              <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                <button
                  onClick={() => { setEditDebtId(f.id); openModal("fijo"); }}
                  aria-label="Editar"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "5px" }}
                >
                  <Pencil size={13} color="var(--muted)" />
                </button>
                <button
                  onClick={() => togglePausa(f.id, f.active)}
                  aria-label={f.active ? "Pausar" : "Activar"}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "5px" }}
                >
                  {f.active
                    ? <Pause size={13} color="var(--muted)" />
                    : <Play size={13} color="var(--green)" />}
                </button>
                <button
                  onClick={() => borrar(f.id, f.name)}
                  aria-label="Borrar"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "5px" }}
                >
                  <Trash2 size={13} color="var(--muted)" />
                </button>
              </div>
            </div>
          );
        })
      )}

      <button
        onClick={nuevo}
        style={{
          width: "100%",
          marginTop: "14px",
          background: "var(--text)",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "11px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
        }}
      >
        <Plus size={15} /> Nuevo gasto fijo
      </button>
    </div>
  );
}
