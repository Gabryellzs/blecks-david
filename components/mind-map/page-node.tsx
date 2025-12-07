"use client"

import { memo } from "react"
import { Handle, Position } from "reactflow"

interface PageNodeProps {
  data: {
    label: string
    description?: string
    pageType?: string // ex: "about", "content", "members", "analysis", "landing", "sales"...
    hasCallToAction?: boolean
  }
  selected: boolean
}

type PageVariant =
  | "landing"
  | "sales"
  | "checkout"
  | "thankyou"
  | "webinar"
  | "blog"
  | "comparison"
  | "affiliates"
  | "members"
  | "faq"
  | "about"
  | "contact"
  | "content"
  | "analysis"
  | "email"
  | "campaign"
  | "social"
  | "ideation"
  | "research"
  | "outline"
  | "draft"
  | "review"
  | "feedback"
  | "finalization"
  | "publish"
  | "default"

interface PageConfig {
  header: string
  accent: string
  variant: PageVariant
}

// normaliza o pageType que vem do data
function normalizeType(raw?: string): string {
  if (!raw) return "default"
  return raw.toLowerCase().trim().replace(/\s+/g, "-")
}

const PAGE_CONFIG: Record<string, PageConfig> = {
  // ========= PÁGINAS PRINCIPAIS =========
  landing: {
    header: "LEAD CAPTURE",
    accent: "#26A7FF",
    variant: "landing",
  },
  "sales-page": {
    header: "SALES PAGE",
    accent: "#FF7A00",
    variant: "sales",
  },
  sales: {
    header: "SALES PAGE",
    accent: "#FF7A00",
    variant: "sales",
  },
  checkout: {
    header: "CHECKOUT",
    accent: "#0BBF72",
    variant: "checkout",
  },
  agradecimento: {
    header: "THANK YOU",
    accent: "#8B5CF6",
    variant: "thankyou",
  },

  // ========= CONTEÚDO =========
  webinar: {
    header: "WEBINAR",
    accent: "#26A7FF",
    variant: "webinar",
  },
  blog: {
    header: "BLOG CONTENT",
    accent: "#F97316",
    variant: "blog",
  },
  comparacao: {
    header: "COMPARISON",
    accent: "#6366F1",
    variant: "comparison",
  },
  affiliates: {
    header: "AFFILIATES",
    accent: "#22C55E",
    variant: "affiliates",
  },
  content: {
    header: "CONTENT CREATION",
    accent: "#26A7FF",
    variant: "content",
  },
  analysis: {
    header: "MARKETING ANALYSIS",
    accent: "#0EA5E9",
    variant: "analysis",
  },

  // ========= INSTITUCIONAIS =========
  about: {
    header: "ABOUT",
    accent: "#0EA5E9",
    variant: "about",
  },
  members: {
    header: "MEMBERS",
    accent: "#22C55E",
    variant: "members",
  },
  faq: {
    header: "FAQ / SUPPORT",
    accent: "#FACC15",
    variant: "faq",
  },
  contato: {
    header: "CONTACT",
    accent: "#26A7FF",
    variant: "contact",
  },

  // ========= FLUXOS E MKT =========
  email: {
    header: "EMAIL SERIES",
    accent: "#0EA5E9",
    variant: "email",
  },
  campaign: {
    header: "CAMPAIGN",
    accent: "#F97316",
    variant: "campaign",
  },
  "midia-social": {
    header: "SOCIAL MEDIA",
    accent: "#3B82F6",
    variant: "social",
  },

  // ========= ETAPAS DE ESCRITA =========
  ideacao: {
    header: "IDEATION",
    accent: "#FACC15",
    variant: "ideation",
  },
  pesquisa: {
    header: "RESEARCH",
    accent: "#38BDF8",
    variant: "research",
  },
  estruturacao: {
    header: "OUTLINE",
    accent: "#22C55E",
    variant: "outline",
  },
  rascunho: {
    header: "DRAFT",
    accent: "#A855F7",
    variant: "draft",
  },
  revisao: {
    header: "REVIEW",
    accent: "#EC4899",
    variant: "review",
  },
  feedback: {
    header: "FEEDBACK",
    accent: "#FB7185",
    variant: "feedback",
  },
  finalizacao: {
    header: "FINALIZATION",
    accent: "#22C55E",
    variant: "finalization",
  },
  publicacao: {
    header: "PUBLISH",
    accent: "#0EA5E9",
    variant: "publish",
  },

  // fallback
  default: {
    header: "PAGE",
    accent: "#26A7FF",
    variant: "default",
  },
}

function getConfig(pageType?: string): PageConfig {
  const slug = normalizeType(pageType)
  return PAGE_CONFIG[slug] ?? PAGE_CONFIG.default
}

const PageNode = memo(({ data, selected }: PageNodeProps) => {
  const config = getConfig(data.pageType)

  const showButton = data.hasCallToAction ?? true

  const getButtonText = () => {
    const slug = normalizeType(data.pageType)

    if (slug === "checkout") return "BUY NOW"
    if (slug === "sales" || slug === "sales-page") return "BUY NOW"
    if (slug === "analysis") return "VIEW REPORT"
    if (slug === "email") return "VIEW FLOW"
    if (slug === "campaign") return "VIEW CAMPAIGN"
    if (slug === "publicacao") return "PUBLISH"
    return "CALL TO ACTION"
  }

  // ====== CORPO ESPECÍFICO POR VARIANT ======
  const renderBody = () => {
    switch (config.variant) {
      case "landing":
        return (
          <>
            {/* hero + formulário */}
            <div className="mt-1 space-y-2">
              <div className="h-12 w-full rounded-md bg-[#E5F4FF]" />
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-100" />
                <div className="h-2 w-10/12 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-1">
                <div className="h-6 w-full rounded-md bg-white shadow-inner border border-slate-200" />
                <div className="h-6 w-full rounded-md bg-white shadow-inner border border-slate-200" />
              </div>
            </div>
          </>
        )

      case "sales":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-10 w-full rounded-md bg-[#E5F4FF]" />
            <div className="space-y-1.5">
              <div className="h-2 w-11/12 rounded-full bg-slate-100" />
              <div className="h-2 w-10/12 rounded-full bg-slate-100" />
              <div className="h-2 w-9/12 rounded-full bg-slate-100" />
              <div className="h-2 w-8/12 rounded-full bg-slate-100" />
            </div>
          </div>
        )

      case "checkout":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-8 w-full rounded-md border border-slate-200 bg-slate-50" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-6 rounded-md bg-white border border-slate-200" />
              <div className="h-6 rounded-md bg-white border border-slate-200" />
              <div className="h-6 rounded-md bg-white border border-slate-200 col-span-2" />
            </div>
            <div className="h-6 w-24 rounded-md bg-slate-900/5 border border-dashed border-slate-300 mx-auto" />
          </div>
        )

      case "thankyou":
        return (
          <div className="mt-3 space-y-2 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400 bg-emerald-50">
              <div className="h-4 w-4 rounded-full border-[3px] border-emerald-400 border-t-transparent animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-9/12 mx-auto rounded-full bg-slate-100" />
              <div className="h-2 w-7/12 mx-auto rounded-full bg-slate-100" />
            </div>
          </div>
        )

      case "webinar":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-16 w-full rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-7 w-11 rounded-md border border-[#26A7FF] bg-[#E5F4FF] flex items-center justify-center">
                <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-[#26A7FF]" />
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span className="h-2 w-12 rounded-full bg-slate-100" />
              <span className="h-2 w-10 rounded-full bg-slate-100" />
            </div>
          </div>
        )

      case "blog":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-10 w-full rounded-md bg-slate-50 border border-slate-200" />
            <div className="space-y-1.5">
              <div className="h-2 w-9/12 rounded-full bg-slate-100" />
              <div className="h-2 w-11/12 rounded-full bg-slate-100" />
              <div className="h-2 w-10/12 rounded-full bg-slate-100" />
            </div>
          </div>
        )

      case "comparison":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="grid grid-cols-2 gap-[3px] text-[8px]">
              <div className="h-3 rounded-sm bg-slate-50 border border-slate-200" />
              <div className="h-3 rounded-sm bg-slate-50 border border-slate-200" />
              <div className="h-3 rounded-sm bg-slate-50 border border-slate-200" />
              <div className="h-3 rounded-sm bg-slate-50 border border-slate-200" />
            </div>
            <div className="h-2 w-16 rounded-full bg-slate-100" />
          </div>
        )

      case "affiliates":
        return (
          <div className="mt-1 space-y-2">
            <div className="flex justify-between text-[8px] text-slate-500">
              <div className="space-y-1">
                <div className="h-2 w-10 rounded-full bg-slate-100" />
                <div className="h-2 w-12 rounded-full bg-slate-100" />
              </div>
              <div className="h-8 w-12 rounded-md bg-emerald-50 border border-emerald-200" />
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100" />
          </div>
        )

      case "about":
        return (
          <div className="mt-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-100" />
              <div className="space-y-1">
                <div className="h-2 w-16 rounded-full bg-slate-100" />
                <div className="h-2 w-12 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="h-2 w-11/12 rounded-full bg-slate-100" />
            <div className="h-2 w-9/12 rounded-full bg-slate-100" />
          </div>
        )

      case "members":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-16 w-full rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-7 w-7 rounded-full border border-slate-300 flex items-center justify-center">
                <div className="h-3 w-3 rounded-[4px] border border-slate-400 border-b-0" />
              </div>
            </div>
            <div className="h-2 w-10/12 rounded-full bg-slate-100" />
          </div>
        )

      case "faq":
        return (
          <div className="mt-1 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1"
              >
                <div className="h-3 w-3 rounded-full border border-slate-300" />
                <div className="h-2 w-20 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )

      case "contact":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-5 w-full rounded-md bg-white border border-slate-200" />
            <div className="h-5 w-full rounded-md bg-white border border-slate-200" />
            <div className="h-10 w-full rounded-md bg-white border border-slate-200" />
          </div>
        )

      case "content":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-16 w-full rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-7 w-11 rounded-md border border-[#26A7FF] bg-[#E5F4FF] flex items-center justify-center">
                <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-[#26A7FF]" />
              </div>
            </div>
            <div className="h-2 w-10/12 rounded-full bg-slate-100" />
          </div>
        )

      case "analysis":
        return (
          <div className="mt-1 space-y-2">
            <div className="flex h-14 w-full items-end gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 pb-1">
              <div className="h-4 w-2 rounded-sm bg-slate-200" />
              <div className="h-6 w-2 rounded-sm bg-[#26A7FF]" />
              <div className="h-3 w-2 rounded-sm bg-slate-200" />
              <div className="h-7 w-2 rounded-sm bg-[#0EA5E9]" />
              <div className="h-5 w-2 rounded-sm bg-slate-200" />
            </div>
            <div className="h-2 w-9/12 rounded-full bg-slate-100" />
          </div>
        )

      case "email":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center">
              <div className="h-6 w-9 rounded-md border border-[#26A7FF] bg-[#E5F4FF]" />
            </div>
            <div className="space-y-1">
              <div className="h-2 w-9/12 rounded-full bg-slate-100" />
              <div className="h-2 w-7/12 rounded-full bg-slate-100" />
            </div>
          </div>
        )

      case "campaign":
        return (
          <div className="mt-1 space-y-2">
            <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-50" />
            <div className="flex justify-between text-[8px] text-slate-500">
              <div className="space-y-1">
                <div className="h-2 w-10 rounded-full bg-slate-100" />
                <div className="h-2 w-12 rounded-full bg-slate-100" />
              </div>
              <div className="h-7 w-10 rounded-md bg-[#E5F4FF]" />
            </div>
          </div>
        )

      case "social":
        return (
          <div className="mt-1 flex justify-center">
            <div className="h-16 w-10 rounded-[10px] border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1">
              <div className="h-2 w-5 rounded-full bg-slate-200" />
              <div className="h-2 w-6 rounded-full bg-slate-200" />
              <div className="h-2 w-4 rounded-full bg-slate-200" />
            </div>
          </div>
        )

      case "ideation":
        return (
          <div className="mt-1 grid grid-cols-3 gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-5 rounded-[3px] bg-amber-50 border border-amber-100"
              />
            ))}
          </div>
        )

      case "research":
        return (
          <div className="mt-1 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <div className="h-2 w-9/12 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )

      case "outline":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-2 w-8/12 rounded-full bg-slate-100" />
            <div className="h-2 w-7/12 rounded-full bg-slate-100 ml-3" />
            <div className="h-2 w-6/12 rounded-full bg-slate-100 ml-3" />
          </div>
        )

      case "draft":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-8 w-full rounded-md border border-slate-200 bg-slate-50" />
            <div className="h-2 w-9/12 rounded-full bg-slate-100" />
            <div className="h-2 w-7/12 rounded-full bg-slate-100" />
          </div>
        )

      case "review":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1">
              <div className="h-4 w-4 rounded-full bg-slate-200" />
              <div className="h-2 w-16 rounded-full bg-slate-100" />
            </div>
            <div className="h-2 w-9/12 rounded-full bg-slate-100" />
          </div>
        )

      case "feedback":
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-5 w-9/12 rounded-full bg-slate-100" />
            <div className="flex gap-1.5">
              <div className="h-5 flex-1 rounded-md bg-slate-50 border border-slate-200" />
              <div className="h-5 flex-1 rounded-md bg-slate-50 border border-slate-200" />
            </div>
          </div>
        )

      case "finalization":
        return (
          <div className="mt-1 space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full border border-emerald-400" />
                <div className="h-2 w-9/12 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        )

      case "publish":
        return (
          <div className="mt-2 space-y-2 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[#E5F4FF] border border-[#26A7FF]">
              <div className="h-0 w-0 border-b-[10px] border-b-[#26A7FF] border-x-[6px] border-x-transparent" />
            </div>
            <div className="h-2 w-9/12 mx-auto rounded-full bg-slate-100" />
          </div>
        )

      default:
        return (
          <div className="mt-1 space-y-1.5">
            <div className="h-10 w-full rounded-md bg-slate-50 border border-slate-200" />
            <div className="h-2 w-10/12 rounded-full bg-slate-100" />
          </div>
        )
    }
  }

  return (
    <div
      className={[
        "relative",
        "w-[210px] rounded-xl border bg-white shadow-md",
        "text-[11px] text-slate-800",
        "transition-all duration-150",
        selected
          ? "border-[var(--accent-color)] shadow-[0_0_0_1px_rgba(38,167,255,0.5)]"
          : "border-slate-200",
      ].join(" ")}
      style={
        {
          // pra poder usar a cor de destaque em alguns detalhes se quiser
          ["--accent-color" as any]: config.accent,
        } as React.CSSProperties
      }
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-100 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        </div>

        <span className="rounded-full bg-white px-2 py-[2px] text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">
          {config.header}
        </span>
      </div>

      {/* CONTEÚDO */}
      <div className="px-3 pb-3 pt-2 space-y-2">
        {/* Título + descrição */}
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold leading-snug">
            {data.label || "Página"}
          </p>
          {data.description && (
            <p className="text-[10px] leading-snug text-slate-500">
              {data.description}
            </p>
          )}
        </div>

        {/* Layout específico */}
        {renderBody()}

        {/* CTA */}
        {showButton && (
          <div className="mt-2">
            <button
              className="flex h-7 w-full items-center justify-center rounded-md text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_4px_10px_rgba(38,167,255,0.45)]"
              style={{ backgroundColor: config.accent }}
            >
              {getButtonText()}
            </button>
          </div>
        )}
      </div>

      {/* HANDLES */}

      <Handle
        type="target"
        position={Position.Left}
        className="h-3 w-3 -left-3 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#26A7FF] shadow-[0_0_10px_rgba(38,167,255,0.8)]"
      />

      <Handle
        type="source"
        position={Position.Right}
        className="h-3 w-3 -right-3 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#26A7FF] shadow-[0_0_10px_rgba(38,167,255,0.8)]"
      />

      <Handle
        type="target"
        position={Position.Top}
        className="h-3 w-3 top-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[#26A7FF] shadow-[0_0_10px_rgba(38,167,255,0.8)]"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-3 w-3 bottom-[-7px] left-1/2 -translate-x-1/2 rounded-full border-2 border-white bg-[#26A7FF] shadow-[0_0_10px_rgba(38,167,255,0.8)]"
      />
    </div>
  )
})

PageNode.displayName = "PageNode"

export default PageNode
