// components/funnel-canvas.tsx
"use client"

import { useState } from "react"
import ReactFlow, { Background, Controls, type Node, type Edge } from "reactflow"
import "reactflow/dist/style.css"

import { FunnelNode } from "./funnel-node"
import { layoutElements } from "@/lib/funnel-layout"

const nodeTypes = {
  funnelNode: FunnelNode,
}

interface FunnelCanvasProps {
  initialNodes: Node[]
  initialEdges: Edge[]
}

export function FunnelCanvas({ initialNodes, initialEdges }: FunnelCanvasProps) {
  const [{ nodes, edges }] = useState(() =>
    layoutElements(
      initialNodes.map((n) => ({ ...n, type: "funnelNode" })),
      initialEdges,
      "LR" // 👈 layout HORIZONTAL
    )
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  )
}
