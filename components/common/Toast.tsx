"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useToastStore } from "@/store/dashboardStore";

function ToastItem({ msg, type, id }: { msg: string; type: "ok" | "err"; id: number }) {
  const [visible, setVisible] = useState(false);
  const remove = useToastStore((s) => s.remove);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => remove(id), 300);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`toast ${type} ${visible ? "show" : ""}`}
    >
      {type === "ok" ? <Check size={14} /> : <X size={14} />}
      {msg}
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} />
      ))}
    </div>
  );
}
