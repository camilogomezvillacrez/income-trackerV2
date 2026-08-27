"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { exportExcel } from "@/lib/exportExcel";

interface Props {
  /** "chip" = botón pequeño de encabezado · "full" = botón ancho */
  variant?: "chip" | "full";
  label?: string;
}

export default function ExcelButton({ variant = "chip", label }: Props) {
  const activeMonth = useDashboardStore((s) => s.activeMonth);
  const toast = useToastStore((s) => s.show);
  const [loading, setLoading] = useState(false);

  async function descargar() {
    if (loading) return;
    setLoading(true);
    try {
      await exportExcel(activeMonth);
      toast("📗 Excel descargado");
    } catch {
      toast("No se pudo generar el Excel", "err");
    } finally {
      setLoading(false);
    }
  }

  const icon = loading
    ? <Loader2 size={variant === "full" ? 15 : 12} className="excel-spin" />
    : <FileSpreadsheet size={variant === "full" ? 15 : 12} />;

  if (variant === "full") {
    return (
      <button
        onClick={descargar}
        disabled={loading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "#1D6F42",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "11px 18px",
          fontSize: "13px",
          fontWeight: 600,
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.75 : 1,
          fontFamily: "var(--font-sans)",
          width: "100%",
        }}
      >
        {icon}
        {loading ? "Generando…" : label ?? "Descargar Excel"}
        <style>{`.excel-spin { animation: excel-rot 1s linear infinite; } @keyframes excel-rot { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }

  return (
    <button
      onClick={descargar}
      disabled={loading}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        color: loading ? "var(--muted)" : "#1D6F42",
        fontSize: "11px",
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: "6px",
        cursor: loading ? "default" : "pointer",
        fontFamily: "var(--font-sans)",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
    >
      {icon} {loading ? "…" : label ?? "Excel"}
      <style>{`.excel-spin { animation: excel-rot 1s linear infinite; } @keyframes excel-rot { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
