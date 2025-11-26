// lib/funnel-layout.ts
import dagre from "dagre"
import type { Node, Edge } from "reactflow"

const nodeWidth = 260
const nodeHeight = 140

// direction: "LR" = left → right (horizontal), "TB" = top → bottom (vertical)
export function layoutElements(
  nodes: Node[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction }) // 👈 aqui definimos horizontal

  // Registra cada nó no grafo
  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  // Registra cada conexão no grafo
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  // Dagre calcula as posições
  dagre.layout(g)

  // Aplica as posições calculadas nos nós
  const laidOutNodes = nodes.map((node) => {
    const pos = g.node(node.id)

    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: laidOutNodes, edges }
}
