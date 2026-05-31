"use client";

import { create } from "zustand";
import type { DashboardData, ViewType, ModalType, Movement } from "@/types";
import { currentMonth } from "@/lib/utils";

interface EditTarget {
  tipo: "ingreso" | "gasto";
  id: number;
}

interface DeleteTarget {
  tipo: "ingreso" | "gasto";
  id: number;
  desc: string;
  amount: number;
}

interface AbonoTarget {
  goalId: number;
}

interface DashboardStore {
  data: DashboardData | null;
  loading: boolean;
  activeMonth: string;
  view: ViewType;
  modal: ModalType;
  editTarget: EditTarget | null;
  deleteTarget: DeleteTarget | null;
  abonoTarget: AbonoTarget | null;
  userEmail: string;

  setUserEmail: (e: string) => void;
  setView: (v: ViewType) => void;
  openModal: (m: ModalType) => void;
  closeModal: () => void;
  setEditTarget: (t: EditTarget | null) => void;
  setDeleteTarget: (t: DeleteTarget | null) => void;
  setAbonoTarget: (t: AbonoTarget | null) => void;
  setMonth: (m: string) => void;
  setData: (d: DashboardData) => void;
  setLoading: (l: boolean) => void;
  refresh: () => Promise<void>;
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
  userEmail: "",

  setUserEmail: (e) => set({ userEmail: e }),
  setView: (v) => set({ view: v }),
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null, editTarget: null, deleteTarget: null, abonoTarget: null }),
  setEditTarget: (t) => set({ editTarget: t }),
  setDeleteTarget: (t) => set({ deleteTarget: t }),
  setAbonoTarget: (t) => set({ abonoTarget: t }),
  setMonth: (m) => set({ activeMonth: m }),
  setData: (d) => set({ data: d, loading: false }),
  setLoading: (l) => set({ loading: l }),

  refresh: async () => {
    const month = get().activeMonth;
    set({ loading: true });
    const res = await fetch(`/api/dashboard?month=${month}`);
    if (res.status === 401) { window.location.href = "/login"; return; }
    const data: DashboardData = await res.json();
    set({ data, loading: false, activeMonth: data.current_month });
  },
}));

// ── Toast store (simple) ──────────────────────────────────────────
interface Toast {
  id: number;
  msg: string;
  type: "ok" | "err";
}

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
