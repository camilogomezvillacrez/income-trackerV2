"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

interface Props {
  value: number;
  color?: string;
  prefix?: "+" | "-" | "";
  style?: React.CSSProperties;
  className?: string;
}

export default function Money({ value, color, prefix = "", style, className }: Props) {
  const privacy = useDashboardStore((s) => s.privacyMode);

  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-mono)",
        fontVariantNumeric: "tabular-nums",
        color,
        letterSpacing: privacy ? "0.1em" : undefined,
        ...style,
      }}
    >
      {privacy ? `${prefix}••••••` : `${prefix}${fmt(value)}`}
    </span>
  );
}
