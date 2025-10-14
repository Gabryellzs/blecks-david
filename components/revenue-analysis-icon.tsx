// RevenueAnalysisIcon.jsx
export default function RevenueAnalysisIcon({ size = 24, color = "white" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      stroke={color}
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Moldura do documento */}
      <rect x="60" y="60" width="300" height="400" rx="40" />

      {/* Gráfico de barras */}
      <rect x="100" y="300" width="40" height="100" rx="6" />
      <rect x="160" y="250" width="40" height="150" rx="6" />
      <rect x="220" y="280" width="40" height="120" rx="6" />

      {/* Gráfico de linha */}
      <polyline points="100,220 160,180 220,200 280,140" />

      {/* Lupa com cifrão */}
      <circle cx="360" cy="360" r="80" />
      <line x1="420" y1="420" x2="460" y2="460" />
      <text x="360" y="380" textAnchor="middle" fontSize="60" fontFamily="Arial, sans-serif" fill={color}>
        $
      </text>
    </svg>
  )
}
