// types/funnel.ts

export type FunnelNodeKind =
  | "traffic"
  | "landing"
  | "checkout"
  | "email"
  | "webinar"
  | "upsell"
  | "retention"
  | "other"

// Dados que vão para dentro de cada card/nozinho do funil
export interface FunnelNodeData {
  title: string
  subtitle?: string
  kind: FunnelNodeKind
  ctaLabel?: string
}

// Nó completo do funil (sem se preocupar ainda com ReactFlow)
export interface FunnelNode {
  id: string
  data: FunnelNodeData
  position: { x: number; y: number }
}

// Conexão entre nós
export interface FunnelEdge {
  id: string
  source: string
  target: string
}
