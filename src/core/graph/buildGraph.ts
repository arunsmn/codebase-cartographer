import type { IngestedFile } from "@/core/ingestion/types";
import type { ParseResult } from "@/core/parser/types";
import type { DependencyGraph } from "./types";

export function buildGraph(
  files: IngestedFile[],
  parseResult: ParseResult,
): DependencyGraph {
  return {
    nodes: files.map((file) => ({ id: file.path })),
    edges: parseResult.edges,
  };
}
