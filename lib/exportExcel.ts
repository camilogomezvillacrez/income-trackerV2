/**
 * Pide el Excel al servidor y lo descarga.
 * El archivo se arma en el servidor para no cargar la app del celular.
 */
export async function exportExcel(month: string): Promise<void> {
  const res = await fetch(`/api/export/excel?month=${month}`);

  if (res.status === 401) {
    window.location.href = "/login";
    return;
  }
  if (!res.ok) throw new Error("No se pudo generar el Excel");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mis-finanzas-${month}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
