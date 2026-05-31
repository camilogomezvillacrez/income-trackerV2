import type { DashboardData } from "@/types";

export function exportCSV(data: DashboardData) {
  const rows = [["Tipo", "Fecha", "Categoría", "Subcategoría", "Descripción", "Monto", "Método pago"]];
  (data.all_movs ?? []).forEach((r) => {
    rows.push([
      r.tipo,
      r.date,
      r.category,
      r.subcategory ?? "",
      r.note ?? "",
      String(r.amount),
      r.payment_method ?? "Efectivo",
    ]);
  });
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `finanzas-${data.current_month}.csv`;
  a.click();
}
