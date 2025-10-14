// BrainAIIcon.jsx
export default function BrainAIIcon({ size = 24, color = "white" }) {
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
      {/* Metade esquerda - cérebro */}
      <path
        d="M80 260 
               Q60 200 100 140 
               Q140 80 200 100 
               Q240 120 220 160 
               Q180 200 220 240 
               Q260 280 220 320 
               Q180 360 220 400 
               Q240 440 200 460 
               Q140 480 100 420 
               Q60 360 80 300 Z"
      />

      {/* Chip central */}
      <rect x="220" y="200" width="140" height="120" rx="10" ry="10" />
      <rect x="240" y="220" width="100" height="80" />
      <text x="290" y="270" textAnchor="middle" fontSize="40" fontWeight="bold" fill={color} stroke="none">
        AI
      </text>

      {/* Conexões do chip */}
      <line x1="360" y1="220" x2="400" y2="220" />
      <circle cx="400" cy="220" r="10" />

      <line x1="360" y1="260" x2="420" y2="260" />
      <circle cx="420" cy="260" r="10" />

      <line x1="360" y1="300" x2="400" y2="300" />
      <circle cx="400" cy="300" r="10" />

      <line x1="290" y1="320" x2="290" y2="370" />
      <circle cx="290" cy="370" r="10" />

      <line x1="290" y1="200" x2="290" y2="150" />
      <circle cx="290" cy="150" r="10" />
    </svg>
  )
}
