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

const MarketingIconNode = memo(({ data, selected }: MarketingIconNodeProps) => {
  // Função para renderizar o ícone correto com base no iconId
  const renderIcon = () => {
    const iconSize = 20
    const customIcon = data.iconId

    switch (data.iconId) {
      case "search":
        return <Search size={iconSize} />
      case "blog":
        return <FileText size={iconSize} />
      case "affiliates":
        return <Users size={iconSize} />
      case "facebook":
        return <Facebook size={iconSize} />
      case "instagram":
        return <Instagram size={iconSize} />
      case "youtube":
        return <Youtube size={iconSize} />
      case "linkedin":
        return <Linkedin size={iconSize} />
      case "email":
        return <Mail size={iconSize} />
      case "webinar":
        return <Video size={iconSize} />
      case "front-end":
      case "back-end":
        return <DollarSign size={iconSize} />
      case "conversation":
        return <MessageCircle size={iconSize} />
      case "order":
        return <ShoppingCart size={iconSize} />
      case "sms":
        return <MessageSquare size={iconSize} />
      case "report":
        return <FileBarChart size={iconSize} />
      case "retargeting":
        return <Target size={iconSize} />
      case "pipeline":
        return <BarChart size={iconSize} />
      case "follow-up":
        return <Clock size={iconSize} />
      case "support":
        return <HelpCircle size={iconSize} />
      case "calendar":
        return <Calendar size={iconSize} />
      case "video":
        return <Video size={iconSize} />
      case "lead":
        return (
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
            <circle cx="12" cy="12" r="10" fill="#b07f33" />
            <circle cx="12" cy="9" r="3" fill="#fff" />
            <path d="M12 12c-2.8 0-5 1.5-5 3.5V18h10v-2.5c0-2-2.2-3.5-5-3.5z" fill="#fff" />
          </svg>
        )
      case "tiktok":
        return (
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        )
      case "upsell":
        return (
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
          </svg>
        )
      case "deal-lost":
        return (
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        )
      case "segment":
        return (
          <svg viewBox="0 0 24 24" width={iconSize} height={iconSize} fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
          </svg>
        )
      default:
        return <div className="h-5 w-5" />
    }
  }

  return (
    <div className="relative">
      <div className={`flex flex-col items-center ${selected ? "scale-110" : ""} transition-transform`}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: data.color,
            boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${data.color}` : `0 0 10px ${data.color}80`,
          }}
        >
          <div className="text-white">{renderIcon()}</div>
        </div>
        <div className="mt-1 text-xs text-center text-white max-w-[80px] whitespace-nowrap overflow-hidden text-ellipsis">
          {data.label}
        </div>
      </div>

      {/* Conectores */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
    </div>
  )
})

MarketingIconNode.displayName = "MarketingIconNode"

export default MarketingIconNode
