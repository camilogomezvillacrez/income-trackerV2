"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Search, Trash2, X, FileSpreadsheet } from "lucide-react";
import Money from "@/components/common/Money";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { useReceiptStore } from "@/store/receiptStore";
import { monthLabel } from "@/lib/utils";
import { exportExcel } from "@/lib/exportExcel";
import type { Receipt } from "@/types";

export default function RecibosView() {
  const activeMonth = useDashboardStore((s) => s.activeMonth);
  const setOpen = useReceiptStore((s) => s.setOpen);
  const toast = useToastStore((s) => s.show);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyMonth, setOnlyMonth] = useState(false);
  const [detail, setDetail] = useState<Receipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (onlyMonth) params.set("month", activeMonth);

      const res = await fetch(`/api/receipts?${params}`);
      if (res.status === 401) { window.location.href = "/login"; return; }
      const json = await res.json();
      setReceipts(json.receipts ?? []);
    } catch {
      toast("No se pudieron cargar los recibos", "err");
    } finally {
      setLoading(false);
    }
  }, [q, onlyMonth, activeMonth, toast]);

  // Se espera a que deje de escribir: cada tecla no dispara una consulta
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  async function remove(r: Receipt) {
    if (!confirm(`¿Borrar el recibo de ${r.proveedor ?? "este proveedor"}?\n\nEl gasto seguirá en tus movimientos.`)) return;
    const res = await fetch(`/api/receipts/${r.id}`, { method: "DELETE" });
    if (!res.ok) { toast("No se pudo borrar", "err"); return; }
    setDetail(null);
    toast("Recibo borrado");
    load();
  }

  const total = receipts.reduce((sum, r) => sum + (r.valor ?? 0), 0);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)" }}>Recibos</h2>
        <span style={{ fontSize: "11px", color: "var(--muted)" }}>
          {receipts.length} {receipts.length === 1 ? "recibo" : "recibos"} · <Money value={total} />
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={() => exportExcel(activeMonth)} style={btnGhost}>
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button onClick={() => setOpen(true)} style={btnScan}>
            <Camera size={14} /> Escanear
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por proveedor, NIT, correo o teléfono…"
            style={{ width: "100%", padding: "10px 12px 10px 32px", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", fontFamily: "var(--font-sans)", background: "var(--white)", color: "var(--text)", outline: "none" }}
          />
        </div>
        <button
          onClick={() => setOnlyMonth(!onlyMonth)}
          style={{ ...btnGhost, background: onlyMonth ? "#EEF2FF" : "var(--white)", color: onlyMonth ? "#4338CA" : "var(--sub)", borderColor: onlyMonth ? "#C7D2FE" : "var(--border)", whiteSpace: "nowrap" }}
        >
          {monthLabel(activeMonth)}
        </button>
      </div>

      {loading ? (
        <p style={{ fontSize: "12px", color: "var(--muted)", padding: "24px", textAlign: "center" }}>Cargando…</p>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <div style={{ fontSize: "30px", marginBottom: "8px" }}>🧾</div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
            {q || onlyMonth ? "Sin resultados" : "Todavía no has escaneado recibos"}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "14px" }}>
            Toma la foto y la IA saca el proveedor, el NIT, el valor y los datos de contacto.
          </p>
          <button onClick={() => setOpen(true)} style={{ ...btnScan, margin: "0 auto" }}>
            <Camera size={14} /> Escanear recibo
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {receipts.map((r) => (
            <button key={r.id} onClick={() => setDetail(r)} style={rowStyle}>
              <Image
                src={`/api/receipts/${r.id}/image`}
                alt=""
                width={44}
                height={56}
                unoptimized
                style={{ objectFit: "cover", width: "44px", height: "56px", borderRadius: "6px", background: "var(--bg)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.proveedor ?? "Sin proveedor"}
                </p>
                <p style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "2px" }}>
                  {r.fecha ?? "sin fecha"}{r.nit ? ` · NIT ${r.nit}` : ""}
                </p>
                {r.categoria && (
                  <span style={{ fontSize: "9.5px", color: "var(--sub)", background: "var(--bg)", padding: "2px 7px", borderRadius: "8px", display: "inline-block", marginTop: "4px" }}>
                    {r.categoria}
                  </span>
                )}
              </div>
              <Money value={r.valor ?? 0} style={{ fontSize: "13px", fontWeight: 600 }} />
            </button>
          ))}
        </div>
      )}

      {detail && <DetailSheet receipt={detail} onClose={() => setDetail(null)} onDelete={() => remove(detail)} />}
    </div>
  );
}

function DetailSheet({ receipt, onClose, onDelete }: { receipt: Receipt; onClose: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <div style={{ background: "var(--white)", borderRadius: "14px", width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", flex: 1, minWidth: 0 }}>
            {receipt.proveedor ?? "Recibo"}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
            <X size={19} />
          </button>
        </div>

        <Image
          src={`/api/receipts/${receipt.id}/image`}
          alt="Recibo"
          width={800}
          height={1000}
          unoptimized
          style={{ width: "100%", height: "auto", maxHeight: "44vh", objectFit: "contain", borderRadius: "10px", background: "var(--bg)", marginBottom: "14px" }}
        />

        <dl style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
          <DataRow label="Valor" value={receipt.valor != null ? <Money value={receipt.valor} style={{ fontSize: "13px", fontWeight: 600 }} /> : "—"} />
          <DataRow label="Fecha" value={receipt.fecha ?? "—"} />
          <DataRow label="NIT" value={receipt.nit ?? "—"} />
          <DataRow label="Categoría" value={receipt.categoria ?? "—"} />
          <DataRow label="Correo" value={receipt.correo ?? "—"} />
          <DataRow label="Teléfono" value={receipt.telefono ?? "—"} />
        </dl>

        <button onClick={onDelete} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "8px", background: "none", color: "var(--red)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          <Trash2 size={14} /> Borrar recibo
        </button>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "baseline", borderBottom: "1px solid var(--border)", paddingBottom: "7px" }}>
      <dt style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", width: "84px", flexShrink: 0 }}>
        {label}
      </dt>
      <dd style={{ fontSize: "12.5px", color: "var(--text)", wordBreak: "break-word", minWidth: 0 }}>{value}</dd>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px",
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  width: "100%",
};

const btnGhost: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "var(--white)",
  color: "var(--sub)",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  textDecoration: "none",
};

const btnScan: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "9px 14px",
  border: "none",
  borderRadius: "8px",
  background: "#4338CA",
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
