import type { DependencyGraph } from "@/core/graph/types";

export function buildNarrationPrompt(
  graph: DependencyGraph,
  repoLabel: string,
): string {
  const nodeList = graph.nodes.map((n) => `- ${n.id}`).join("\n");
  const edgeList = graph.edges
    .map((e) => `- ${e.from} imports ${e.to}`)
    .join("\n");

  return `You are analyzing the internal architecture of a codebase called "${repoLabel}".

Here is the complete, factual list of files in this codebase:
${nodeList}

Here is the complete, factual list of import relationships between them:
${edgeList}

Based only on the file paths and import relationships above, write:
1. A short summary (2-4 sentences) explaining the overall architecture and how data likely flows through the system.
2. For each file, a one-sentence description of its likely role, based on its name, its folder, and what it imports or is imported by.

Do not invent files or relationships that are not listed above. Only reference file paths exactly as given.`;
}
