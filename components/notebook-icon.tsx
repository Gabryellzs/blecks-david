// NotebookIcon.jsx
export default function NotebookIcon({ size = 24, color = "white" }) {
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
      {/* Caderno */}
      <rect x="100" y="80" width="240" height="360" rx="20" ry="20" />
      <line x1="140" y1="80" x2="140" y2="440" />
      <rect x="100" y="220" width="60" height="60" rx="8" ry="8" />

      {/* Caneta sobre o caderno */}
      <path d="M280 100 L380 200 L330 250 L230 150 Z" />
      <path d="M380 200 L400 220 L350 270 L330 250 Z" />
      <line x1="230" y1="150" x2="330" y2="250" />
      <line x1="280" y1="100" x2="380" y2="200" />

      {/* Ponta da caneta */}
      <polygon points="330,250 350,270 340,300 310,270" />
    </svg>
  )
}
