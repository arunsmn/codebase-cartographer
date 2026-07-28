import type { GraphEdge } from "@/core/graph/types";

export type ImportEdge = GraphEdge;
export interface ParseResult {
  edges: ImportEdge[];
  unresolvedImports: string[];
}
