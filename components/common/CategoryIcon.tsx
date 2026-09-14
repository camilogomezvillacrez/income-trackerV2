"use client";

import { CATEGORY_ICONS } from "@/constants/categoryIcons";

interface Props {
  /** "emoji:🍔" o "icon:ShoppingCart" */
  icon: string;
  color: string;
  size?: number;
  shape?: "circle" | "rounded";
}

/**
 * Ícono de categoría. Los de línea van en el color de la categoría sobre un
 * tinte muy suave; los emoji, sobre el gris neutro (ya traen su propio color).
 */
export default function CategoryIcon({ icon, color, size = 40, shape = "circle" }: Props) {
  const isEmoji = icon.startsWith("emoji:");
  const value = icon.slice(icon.indexOf(":") + 1);
  const Line = isEmoji ? undefined : CATEGORY_ICONS[value]?.Icon;

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: shape === "circle" ? "50%" : Math.round(size * 0.28),
        background: isEmoji || !Line ? "var(--icon-bg)" : `${color}1F`,
        color,
        display: "grid",
        placeItems: "center",
        fontSize: Math.round(size * 0.48),
        lineHeight: 1,
      }}
    >
      {isEmoji ? value : Line ? <Line size={Math.round(size * 0.5)} strokeWidth={1.8} /> : "🏷️"}
    </span>
  );
}
