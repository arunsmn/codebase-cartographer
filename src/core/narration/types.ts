export interface NodeNarration {
  nodeId: string;
  description: string;
}

export interface NarrationResult {
  summary: string;
  nodeNarrations: NodeNarration[];
}
