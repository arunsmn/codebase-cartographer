import type { DependencyGraph } from "@/core/graph/types";
import type { NarrationResult } from "./types";

export interface NarrationProvider {
  narrate(graph: DependencyGraph, repoLabel: string): Promise<NarrationResult>;
}
