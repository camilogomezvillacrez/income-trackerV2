"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";

export function useDashboard() {
  const { refresh, activeMonth } = useDashboardStore();

  useEffect(() => {
    refresh();
  }, [activeMonth]);

  useEffect(() => {
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);
}
