import type { NarrationProvider } from "./NarrationProvider";

export const mockProvider: NarrationProvider = {
  async narrate(graph, repoLabel) {
    return {
      summary: `Mock narration for ${repoLabel} — ${graph.nodes.length} files, ${graph.edges.length} import relationships. This is placeholder data for local testing without calling Gemini.`,
      nodeNarrations: graph.nodes.map((n) => ({
        nodeId: n.id,
        description: `Mock description for ${n.id}.`,
      })),
    };
  },
};
