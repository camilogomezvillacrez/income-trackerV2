export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mis Finanzas"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="mf-logo-bg" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#5C9A6F" />
          <stop offset="100%" stopColor="#38614A" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#mf-logo-bg)" />
      {/* Barras ascendentes */}
      <rect x="13" y="35" width="9" height="16" rx="3.5" fill="#fff" opacity="0.75" />
      <rect x="27.5" y="27" width="9" height="24" rx="3.5" fill="#fff" opacity="0.88" />
      <rect x="42" y="19" width="9" height="32" rx="3.5" fill="#fff" />
      {/* Moneda */}
      <circle cx="20" cy="19" r="7.5" fill="#F5D77A" stroke="#fff" strokeWidth="1.5" />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="800"
        fill="#6B5310"
        fontFamily="Arial, sans-serif"
      >
        $
      </text>
    </svg>
  );
}
