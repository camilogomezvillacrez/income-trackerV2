"use client";

import { useDashboardStore, useToastStore } from "@/store/dashboardStore";

export default function DeleteModal() {
  const { deleteTarget, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  if (!deleteTarget) return null;

  async function confirmDelete() {
    if (!deleteTarget) return;
    const url =
      deleteTarget.tipo === "ingreso"
        ? `/api/income/${deleteTarget.id}`
        : `/api/expense/${deleteTarget.id}`;
    await fetch(url, { method: "DELETE" });
    closeModal();
    toast("🗑 Eliminado");
    refresh();
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          background: "var(--white)",
          borderRadius: "14px",
          padding: "28px 24px",
          width: "100%",
          maxWidth: "340px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗑️</div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>
          ¿Eliminar este registro?
        </p>
        <small style={{ fontSize: "12px", color: "var(--muted)" }}>
          {deleteTarget.desc} · ${Math.round(deleteTarget.amount).toLocaleString("es-CO")}
        </small>
        <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
          <button
            onClick={closeModal}
            style={{
              flex: 1,
              background: "none",
              color: "var(--sub)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            style={{
              flex: 1,
              background: "var(--red)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
