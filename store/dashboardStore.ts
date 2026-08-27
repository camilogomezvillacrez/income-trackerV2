"use client";

import { create } from "zustand";
import type { DashboardData, ViewType, ModalType, MovTab } from "@/types";
import { currentMonth } from "@/lib/utils";

interface EditTarget   { tipo: "ingreso" | "gasto"; id: number; }
interface DeleteTarget { tipo: "ingreso" | "gasto"; id: number; desc: string; amount: number; }
interface AbonoTarget  { goalId: number; }

interface DashboardStore {
  data: DashboardData | null;
  loading: boolean;
  activeMonth: string;
  view: ViewType;
  modal: ModalType;
  editTarget: EditTarget | null;
  deleteTarget: DeleteTarget | null;
  abonoTarget: AbonoTarget | null;
  debtTarget: number | null;
  editDebtId: number | null;
  userEmail: string;
  movTab: MovTab;
  privacyMode: boolean;
  lastKnownMonth: string;
  reportMonth: string | null;

  setUserEmail: (e: string) => void;
  setView: (v: ViewType) => void;
  setMovTab: (t: MovTab) => void;
  togglePrivacy: () => void;
  openReport: (month: string) => void;
  closeReport: () => void;
  navigateMovimientos: (tab: MovTab) => void;
  openModal: (m: ModalType) => void;
  closeModal: () => void;
  setEditTarget: (t: EditTarget | null) => void;
  setDeleteTarget: (t: DeleteTarget | null) => void;
  setAbonoTarget: (t: AbonoTarget | null) => void;
  setDebtTarget: (id: number | null) => void;
  setEditDebtId: (id: number | null) => void;
  setMonth: (m: string) => void;
  setData: (d: DashboardData) => void;
  setLoading: (l: boolean) => void;
  /** background = sondeo automático; no renueva la sesión del usuario. */
  refresh: (background?: boolean) => Promise<void>;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  data: null,
  loading: true,
  activeMonth: currentMonth(),
  view: "resumen",
  modal: null,
  editTarget: null,
  deleteTarget: null,
  abonoTarget: null,
  debtTarget: null,
  editDebtId: null,
  userEmail: "",
  movTab: "todos",
  privacyMode: false,
  lastKnownMonth: currentMonth(),
  reportMonth: null,

  setUserEmail: (e) => set({ userEmail: e }),
  openReport: (month) => set({ reportMonth: month }),
  closeReport: () => set({ reportMonth: null }),
  setView: (v) => set({ view: v }),
  setMovTab: (t) => set({ movTab: t }),
  togglePrivacy: () => set((s) => ({ privacyMode: !s.privacyMode })),
  navigateMovimientos: (tab) => set({ view: "movimientos", movTab: tab }),
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null, editTarget: null, deleteTarget: null, abonoTarget: null, debtTarget: null, editDebtId: null }),
  setEditTarget: (t) => set({ editTarget: t }),
  setDeleteTarget: (t) => set({ deleteTarget: t }),
  setAbonoTarget: (t) => set({ abonoTarget: t }),
  setDebtTarget: (id) => set({ debtTarget: id }),
  setEditDebtId: (id) => set({ editDebtId: id }),
  setMonth: (m) => set({ activeMonth: m }),
  setData: (d) => set({ data: d, loading: false }),
  setLoading: (l) => set({ loading: l }),

  refresh: async (background = false) => {
    const month = get().activeMonth;
    set({ loading: true });
    const res = await fetch(`/api/dashboard?month=${month}`, {
      headers: background ? { "x-bg-poll": "1" } : undefined,
    });
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data: DashboardData = await res.json();
    // No sobreescribir activeMonth — el usuario controla qué mes ve
    set({ data, loading: false });
  },
}));

// ── Toast store ───────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: "ok" | "err"; }
interface ToastStore {
  toasts: Toast[];
  show: (msg: string, type?: "ok" | "err") => void;
  remove: (id: number) => void;
}
let _tid = 0;
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (msg, type = "ok") => {
    const id = ++_tid;
    set((s) => ({ toasts: [...s.toasts, { id, msg, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
