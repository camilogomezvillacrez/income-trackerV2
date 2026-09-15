"use client";

import { create } from "zustand";
import type { ReceiptFields } from "@/types";

interface PendingScan {
  pathname: string;
  fields: ReceiptFields | null;
  /** Vista previa local: la foto ya está en el navegador, no hay que volver a bajarla. */
  previewUrl: string;
}

interface ReceiptStore {
  open: boolean;
  scanning: boolean;
  pending: PendingScan | null;
  setOpen: (v: boolean) => void;
  setScanning: (v: boolean) => void;
  setPending: (p: PendingScan | null) => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  open: false,
  scanning: false,
  pending: null,
  setOpen: (open) => set({ open }),
  setScanning: (scanning) => set({ scanning }),
  setPending: (pending) => set({ pending }),
}));
