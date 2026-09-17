"use client";

import { create } from "zustand";
import { useToastStore } from "@/store/dashboardStore";
import { resizeForUpload } from "@/lib/imageResize";
import type { ExpenseMatch, ReceiptFields } from "@/types";

interface PendingScan {
  pathname: string;
  fields: ReceiptFields | null;
  /** Vista previa local: la foto ya está en el navegador, no hay que volver a bajarla. */
  previewUrl: string;
  /** Gastos ya registrados que podrían ser este mismo recibo. */
  matches: ExpenseMatch[];
}

interface ReceiptStore {
  scanning: boolean;
  pending: PendingScan | null;
  /** Sube cada vez que se guarda un recibo, para que la lista se recargue. */
  saved: number;
  setScanning: (v: boolean) => void;
  setPending: (p: PendingScan | null) => void;
  markSaved: () => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  scanning: false,
  pending: null,
  saved: 0,
  setScanning: (scanning) => set({ scanning }),
  setPending: (pending) => set({ pending }),
  markSaved: () => set((s) => ({ saved: s.saved + 1 })),
}));

/**
 * Sube la foto y deja el resultado en `pending`. Vive fuera de la vista: si el
 * usuario cambia de pantalla mientras la IA lee, el modal de confirmación
 * (montado en el shell) igual aparece.
 */
export async function scanReceipt(file: File): Promise<void> {
  const { setScanning, setPending } = useReceiptStore.getState();
  const toast = useToastStore.getState().show;

  setScanning(true);
  let previewUrl = "";

  try {
    const small = await resizeForUpload(file);
    previewUrl = URL.createObjectURL(small);

    const form = new FormData();
    form.append("image", small);
    const res = await fetch("/api/receipts/scan", { method: "POST", body: form });

    if (res.status === 401) { window.location.href = "/login"; return; }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Error al escanear");

    if (json.error) toast(json.error, "err");
    setPending({ pathname: json.pathname, fields: json.fields, matches: json.matches ?? [], previewUrl });
  } catch {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    toast("No se pudo escanear el recibo", "err");
  } finally {
    setScanning(false);
  }
}
