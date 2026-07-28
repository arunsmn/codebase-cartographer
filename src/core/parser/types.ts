export interface ImportEdge {
  from: string;
  to: string;
}

export interface ParseResult {
  edges: ImportEdge[];
  unresolvedImports: string[];
}
