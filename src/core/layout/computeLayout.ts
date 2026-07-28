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

const NODE_HEIGHT = 56;
const MIN_NODE_WIDTH = 180;
const MAX_NODE_WIDTH = 320;
const PRIMARY_CHAR_WIDTH = 7.8;
const SECONDARY_CHAR_WIDTH = 6.6;
const HORIZONTAL_PADDING = 32;
const NODE_SEPARATION = 40;
const RANK_SEPARATION = 100;

function estimateNodeWidth(filePath: string): number {
  const lastSlash = filePath.lastIndexOf("/");
  const basename = lastSlash === -1 ? filePath : filePath.slice(lastSlash + 1);
  const dirname = lastSlash === -1 ? "" : filePath.slice(0, lastSlash);

  const estimated =
    Math.max(
      basename.length * PRIMARY_CHAR_WIDTH,
      dirname.length * SECONDARY_CHAR_WIDTH,
    ) + HORIZONTAL_PADDING;

  return Math.min(MAX_NODE_WIDTH, Math.max(MIN_NODE_WIDTH, estimated));
}

export function computeLayout(graph: DependencyGraph): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: "LR",
    nodesep: NODE_SEPARATION,
    ranksep: RANK_SEPARATION,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of graph.nodes) {
    g.setNode(node.id, {
      width: estimateNodeWidth(node.id),
      height: NODE_HEIGHT,
    });
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
