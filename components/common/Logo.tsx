/* eslint-disable @next/next/no-img-element */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Mis Finanzas"
      width={size}
      height={size}
      style={{
        display: "block",
        flexShrink: 0,
        // La imagen tiene fondo blanco: multiply lo funde con cualquier fondo claro
        mixBlendMode: "multiply",
      }}
    />
  );
}
