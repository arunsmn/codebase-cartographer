import { describe, it, expect } from "vitest";
import { buildCollapsedGraph } from "./buildCollapsedGraph";
import type { DependencyGraph } from "./types";
import type { FileGroup } from "./detectGroups";

describe("buildCollapsedGraph", () => {
  const graph: DependencyGraph = {
    nodes: [
      { id: "apps/palette-ai/a.ts" },
      { id: "apps/palette-ai/b.ts" },
      { id: "apps/hisaab/c.ts" },
      { id: "src/shared.ts" },
    ],
    edges: [
      { from: "apps/palette-ai/a.ts", to: "apps/palette-ai/b.ts" }, // internal to one group
      { from: "apps/palette-ai/a.ts", to: "apps/hisaab/c.ts" }, // between two groups
      { from: "apps/palette-ai/b.ts", to: "apps/hisaab/c.ts" }, // same two groups, different files
      { from: "src/shared.ts", to: "apps/palette-ai/a.ts" }, // ungrouped file into a group
    ],
  };

  const groups: FileGroup[] = [
    {
      id: "apps/palette-ai",
      filePaths: ["apps/palette-ai/a.ts", "apps/palette-ai/b.ts"],
    },
    { id: "apps/hisaab", filePaths: ["apps/hisaab/c.ts"] },
  ];

  it("collapses grouped files into single group nodes when nothing is expanded", () => {
    const result = buildCollapsedGraph(graph, groups, new Set());

    const nodeIds = result.nodes.map((n) => n.id).sort();
    expect(nodeIds).toEqual([
      "apps/hisaab",
      "apps/palette-ai",
      "src/shared.ts",
    ]);
  });

  it("hides an edge entirely when both endpoints collapse into the same group", () => {
    const result = buildCollapsedGraph(graph, groups, new Set());

    const selfEdges = result.edges.filter((e) => e.from === e.to);
    expect(selfEdges).toEqual([]);
  });

  it("deduplicates multiple file-level edges into one group-to-group edge", () => {
    const result = buildCollapsedGraph(graph, groups, new Set());

    const groupToGroupEdges = result.edges.filter(
      (e) => e.from === "apps/palette-ai" && e.to === "apps/hisaab",
    );
    expect(groupToGroupEdges).toHaveLength(1);
  });

  it("redirects an edge from an ungrouped file into a collapsed group", () => {
    const result = buildCollapsedGraph(graph, groups, new Set());

    expect(result.edges).toContainEqual({
      from: "src/shared.ts",
      to: "apps/palette-ai",
    });
  });

  it("shows real files instead of a group node when that group is expanded", () => {
    const result = buildCollapsedGraph(
      graph,
      groups,
      new Set(["apps/palette-ai"]),
    );

    const nodeIds = result.nodes.map((n) => n.id).sort();
    expect(nodeIds).toEqual([
      "apps/hisaab",
      "apps/palette-ai/a.ts",
      "apps/palette-ai/b.ts",
      "src/shared.ts",
    ]);

    const paletteAiNode = result.nodes.find(
      (n) => n.id === "apps/palette-ai/a.ts",
    );
    expect(paletteAiNode?.isGroup).toBe(false);
  });

  it("marks collapsed nodes as groups with the correct file count", () => {
    const result = buildCollapsedGraph(graph, groups, new Set());

    const hisaabNode = result.nodes.find((n) => n.id === "apps/hisaab");
    expect(hisaabNode?.isGroup).toBe(true);
    expect(hisaabNode?.fileCount).toBe(1);
  });
});
