import type { DependencyGraph, GraphEdge, GraphNode } from "./types";
import type { FileGroup } from "./detectGroups";

export interface CollapsedNode extends GraphNode {
  isGroup: boolean;
  fileCount?: number;
}

export interface CollapsedGraph {
  nodes: CollapsedNode[];
  edges: GraphEdge[];
}

export function buildCollapsedGraph(
  graph: DependencyGraph,
  groups: FileGroup[],
  expandedGroupIds: Set<string>,
): CollapsedGraph {
  const collapsedGroups = groups.filter((g) => !expandedGroupIds.has(g.id));

  const pathToGroupId = new Map<string, string>();
  for (const group of collapsedGroups) {
    for (const path of group.filePaths) {
      pathToGroupId.set(path, group.id);
    }
  }

  function resolveId(path: string): string {
    return pathToGroupId.get(path) ?? path;
  }

  const nodes: CollapsedNode[] = [];

  for (const node of graph.nodes) {
    if (pathToGroupId.has(node.id)) continue; // represented by its collapsed group instead
    nodes.push({ id: node.id, isGroup: false });
  }

  for (const group of collapsedGroups) {
    nodes.push({
      id: group.id,
      isGroup: true,
      fileCount: group.filePaths.length,
    });
  }

  const edgeMap = new Map<string, GraphEdge>();
  for (const edge of graph.edges) {
    const from = resolveId(edge.from);
    const to = resolveId(edge.to);
    if (from === to) continue; // internal edge — both ends collapsed into the same group

    const key = `${from}->${to}`;
    if (!edgeMap.has(key)) edgeMap.set(key, { from, to });
  }

  return { nodes, edges: [...edgeMap.values()] };
}
