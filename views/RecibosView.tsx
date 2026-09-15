"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageUp, Loader2, Search, Trash2, X, FileSpreadsheet, Building2 } from "lucide-react";
import Money from "@/components/common/Money";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { useReceiptStore, scanReceipt } from "@/store/receiptStore";
import { monthLabel } from "@/lib/utils";
import { exportExcel } from "@/lib/exportExcel";
import { groupByCompany } from "@/lib/receiptGroups";
import type { Receipt } from "@/types";

type Orden = "empresa" | "fecha";

export default function RecibosView() {
  const activeMonth = useDashboardStore((s) => s.activeMonth);
  const scanning = useReceiptStore((s) => s.scanning);
  const saved = useReceiptStore((s) => s.saved);
  const toast = useToastStore((s) => s.show);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [onlyMonth, setOnlyMonth] = useState(false);
  const [orden, setOrden] = useState<Orden>("empresa");
  const [detail, setDetail] = useState<Receipt | null>(null);
  const [exporting, setExporting] = useState(false);

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

  // Se espera a que deje de escribir: cada tecla no dispara una consulta.
  // `saved` recarga la lista cuando se confirma un recibo nuevo.
  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q, saved]);

  const groups = useMemo(() => groupByCompany(receipts), [receipts]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto
    if (file) scanReceipt(file);
  }

  async function downloadExcel() {
    setExporting(true);
    try {
      await exportExcel(activeMonth);
    } catch {
      toast("No se pudo generar el Excel", "err");
    } finally {
      setExporting(false);
    }
  }

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
      {/* capture abre la cámara directo; sin capture el celular deja elegir de la galería */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
      <input ref={galleryRef} type="file" accept="image/*" onChange={onFile} hidden />

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)" }}>Recibos</h2>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            {receipts.length} {receipts.length === 1 ? "recibo" : "recibos"} · {groups.length} {groups.length === 1 ? "empresa" : "empresas"} · <Money value={total} />
          </span>
        </div>
        <button onClick={downloadExcel} disabled={exporting} style={{ ...btnGhost, marginLeft: "auto" }}>
          {exporting ? <Loader2 size={14} className="rv-spin" /> : <FileSpreadsheet size={14} />} Excel
        </button>
      </div>

      {/* Escaneo: lo que antes estaba en la burbuja */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
        <button onClick={() => cameraRef.current?.click()} disabled={scanning} style={{ ...btnScan, opacity: scanning ? 0.7 : 1 }}>
          {scanning ? <Loader2 size={16} className="rv-spin" /> : <Camera size={16} />}
          {scanning ? "Leyendo recibo…" : "Tomar foto"}
        </button>
        <button onClick={() => galleryRef.current?.click()} disabled={scanning} style={{ ...btnGhost, justifyContent: "center", padding: "12px", opacity: scanning ? 0.7 : 1 }}>
          <ImageUp size={16} /> Subir de galería
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Search size={14} style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar empresa, NIT, correo o teléfono…"
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

      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "var(--bg)", padding: "3px", borderRadius: "8px", width: "fit-content" }}>
        {(["empresa", "fecha"] as Orden[]).map((o) => (
          <button
            key={o}
            onClick={() => setOrden(o)}
            style={{ padding: "6px 12px", border: "none", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", background: orden === o ? "var(--white)" : "transparent", color: orden === o ? "var(--text)" : "var(--muted)", boxShadow: orden === o ? "0 1px 2px rgba(0,0,0,.08)" : "none" }}
          >
            {o === "empresa" ? "Por empresa" : "Por fecha"}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontSize: "12px", color: "var(--muted)", padding: "24px", textAlign: "center" }}>Cargando…</p>
      ) : receipts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 16px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px" }}>
          <div style={{ fontSize: "30px", marginBottom: "8px" }}>🧾</div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
            {q || onlyMonth ? "Sin resultados" : "Todavía no has escaneado recibos"}
          </p>
          <p style={{ fontSize: "11px", color: "var(--muted)" }}>
            Toma la foto y la IA saca la empresa, el NIT, el valor y los datos de contacto.
          </p>
        </div>
      ) : orden === "empresa" ? (
        <div style={{ display: "grid", gap: "14px" }}>
          {groups.map((g) => (
            <section key={g.key}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 2px 6px" }}>
                <Building2 size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.proveedor}
                  </p>
                  <p style={{ fontSize: "10px", color: "var(--muted)" }}>
                    {g.nit ? `NIT ${g.nit} · ` : ""}{g.items.length} {g.items.length === 1 ? "factura" : "facturas"}
                  </p>
                </div>
                <Money value={g.total} style={{ fontSize: "12.5px", fontWeight: 700 }} />
              </div>
              <div style={{ display: "grid", gap: "6px" }}>
                {g.items.map((r) => <ReceiptRow key={r.id} r={r} hideCompany onClick={() => setDetail(r)} />)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {receipts.map((r) => <ReceiptRow key={r.id} r={r} onClick={() => setDetail(r)} />)}
        </div>
      )}

      {detail && <DetailSheet receipt={detail} onClose={() => setDetail(null)} onDelete={() => remove(detail)} />}

      <style>{`
        .rv-spin { animation: rv-rotate 1s linear infinite; }
        @keyframes rv-rotate { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ReceiptRow({ r, hideCompany = false, onClick }: { r: Receipt; hideCompany?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={rowStyle}>
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
          {hideCompany ? (r.fecha ?? "Sin fecha") : (r.proveedor ?? "Sin proveedor")}
        </p>
        <p style={{ fontSize: "10.5px", color: "var(--muted)", marginTop: "2px" }}>
          {hideCompany ? "" : `${r.fecha ?? "sin fecha"}${r.nit ? ` · NIT ${r.nit}` : ""}`}
        </p>
        {r.categoria && (
          <span style={{ fontSize: "9.5px", color: "var(--sub)", background: "var(--bg)", padding: "2px 7px", borderRadius: "8px", display: "inline-block", marginTop: "4px" }}>
            {r.categoria}
          </span>
        )}
      </div>
      <Money value={r.valor ?? 0} style={{ fontSize: "13px", fontWeight: 600 }} />
    </button>
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
  justifyContent: "center",
  gap: "7px",
  padding: "12px",
  border: "none",
  borderRadius: "8px",
  background: "#4338CA",
  color: "#fff",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
