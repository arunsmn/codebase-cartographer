import dagre from "@dagrejs/dagre";
import type { DependencyGraph, GraphEdge } from "@/core/graph/types";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: GraphEdge[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 50;
const NODE_SEPARATION = 40;
const RANK_SEPARATION = 80;

export function computeLayout(graph: DependencyGraph): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of graph.edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const nodes: PositionedNode[] = g.nodes().map((id) => {
    const { x, y, width, height } = g.node(id);
    return { id, x, y, width, height };
  });

  return { nodes, edges: graph.edges };
}
