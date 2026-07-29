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
const GROUP_NODE_HEIGHT = 64;
const MIN_NODE_WIDTH = 300;
const MAX_NODE_WIDTH = 320;
const PRIMARY_CHAR_WIDTH = 8.6;
const SECONDARY_CHAR_WIDTH = 6.6;
const HORIZONTAL_PADDING = 40;
const NODE_SEPARATION = 40;
const RANK_SEPARATION = 100;

function isGroupLikeId(path: string): boolean {
  const lastSlash = path.lastIndexOf("/");
  const basename = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  return !basename.includes(".");
}

function estimateNodeWidth(path: string): number {
  const lastSlash = path.lastIndexOf("/");
  const basename = lastSlash === -1 ? path : path.slice(lastSlash + 1);
  const dirname = lastSlash === -1 ? "" : path.slice(0, lastSlash);
  const looksLikeGroup = isGroupLikeId(path);

  const primaryText = looksLikeGroup ? path : basename;
  // Group boxes also need to fit their file-count line; "999" covers any
  // realistic count without needing the real number at layout time.
  const secondaryText = looksLikeGroup
    ? "999 files · click to expand"
    : dirname;

  const estimated =
    Math.max(
      primaryText.length * PRIMARY_CHAR_WIDTH,
      secondaryText.length * SECONDARY_CHAR_WIDTH,
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
    const height = isGroupLikeId(node.id) ? GROUP_NODE_HEIGHT : NODE_HEIGHT;
    g.setNode(node.id, { width: estimateNodeWidth(node.id), height });
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
