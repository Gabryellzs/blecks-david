"use client"

import { memo } from "react"
import { Handle, Position } from "reactflow"
import {
  Search,
  FileText,
  Users,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Mail,
  Video,
  DollarSign,
  MessageCircle,
  ShoppingCart,
  MessageSquare,
  FileBarChart,
  Target,
  BarChart,
  Clock,
  HelpCircle,
  Calendar,
} from "lucide-react"

interface MarketingIconNodeProps {
  data: {
    label: string
    color: string
    iconId?: string
  }
  selected: boolean
}

const ICON_SIZE = 16

function renderIcon(iconId?: string) {
  switch (iconId) {
    case "search":
    case "search-2":
      return <Search size={ICON_SIZE} />
    case "blog":
      return <FileText size={ICON_SIZE} />
    case "affiliates":
      return <Users size={ICON_SIZE} />
    case "facebook":
      return <Facebook size={ICON_SIZE} />
    case "instagram":
      return <Instagram size={ICON_SIZE} />
    case "youtube":
      return <Youtube size={ICON_SIZE} />
    case "linkedin":
      return <Linkedin size={ICON_SIZE} />
    case "email":
    case "email-broadcast":
      return <Mail size={ICON_SIZE} />
    case "webinar":
    case "webinar-reg":
      return <Video size={ICON_SIZE} />
    case "front-end":
    case "back-end":
      return <DollarSign size={ICON_SIZE} />
    case "conversation":
    case "conversation-2":
      return <MessageCircle size={ICON_SIZE} />
    case "order":
    case "order-page":
      return <ShoppingCart size={ICON_SIZE} />
    case "sms":
      return <MessageSquare size={ICON_SIZE} />
    case "report":
      return <FileBarChart size={ICON_SIZE} />
    case "retargeting":
      return <Target size={ICON_SIZE} />
    case "pipeline":
      return <BarChart size={ICON_SIZE} />
    case "follow-up":
      return <Clock size={ICON_SIZE} />
    case "support":
      return <HelpCircle size={ICON_SIZE} />
    case "calendar":
      return <Calendar size={ICON_SIZE} />
    case "video":
      return <Video size={ICON_SIZE} />
    case "lead":
      return (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="#b07f33" />
          <circle cx="12" cy="9" r="3" fill="#fff" />
          <path d="M12 12c-2.8 0-5 1.5-5 3.5V18h10v-2.5c0-2-2.2-3.5-5-3.5z" fill="#fff" />
        </svg>
      )
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    case "upsell":
      return (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
        </svg>
      )
    case "deal-lost":
      return (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      )
    case "segment":
      return (
        <svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE} fill="currentColor">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    default:
      return <div className="h-4 w-4" />
  }
}

const MarketingIconNode = memo(({ data, selected }: MarketingIconNodeProps) => {
  const bgColor = data.color || "#0ea5e9"

  return (
    <div className="relative flex flex-col items-center text-xs text-white">
      {/* WRAPPER: CÍRCULO + HANDLES */}
      <div className="relative h-12 w-12">
        {/* Círculo */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-full border-2 border-white/80 shadow-lg transition-all ${
            selected ? "ring-2 ring-cyan-400/80" : ""
          }`}
          style={{
            background: bgColor,
            boxShadow: selected
              ? `0 0 0 2px white, 0 0 0 4px ${bgColor}`
              : `0 0 10px ${bgColor}80`,
          }}
        >
          {renderIcon(data.iconId)}
        </div>

        {/* HANDLES – FORA DO CÍRCULO */}
        {/* Topo */}
        <Handle
          type="target"
          position={Position.Top}
          className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        />
        {/* Direita */}
        <Handle
          type="source"
          position={Position.Right}
          className="absolute top-1/2 -right-2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        />
        {/* Esquerda */}
        <Handle
          type="target"
          position={Position.Left}
          className="absolute top-1/2 -left-2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        />
        {/* Bottom */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-950 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
        />
      </div>

      {/* TEXTO – ABAIXO DOS PONTOS */}
      <div className="mt-5 max-w-[110px] text-center text-[11px] leading-snug">
        {data.label}
      </div>
    </div>
  )
})

MarketingIconNode.displayName = "MarketingIconNode"

export default MarketingIconNode
