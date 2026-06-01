"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { currentMonth } from "@/lib/utils";

export function useDashboard() {
  const { refresh, activeMonth } = useDashboardStore();

  // Recarga cuando cambia el mes seleccionado
  useEffect(() => {
    refresh();
  }, [activeMonth]);

  // Auto-refresco cada 60 segundos
  useEffect(() => {
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Detecta cambio de mes calendario → avanza automáticamente
  // Solo si el usuario está viendo el mes que acaba de terminar
  useEffect(() => {
    const check = () => {
      const cm = currentMonth();
      const { activeMonth, lastKnownMonth, setMonth } = useDashboardStore.getState();

      if (cm !== lastKnownMonth) {
        // Nuevo mes detectado
        useDashboardStore.setState({ lastKnownMonth: cm });

        // Avanzar solo si el usuario estaba en el mes anterior (no navegando historial)
        if (activeMonth === lastKnownMonth) {
          setMonth(cm);
        }
      }
    };

    // Verificar cada 30 segundos (relevante cerca del cambio de mes)
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);
}
