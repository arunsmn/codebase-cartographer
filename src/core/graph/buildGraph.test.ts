import { describe, it, expect } from "vitest";
import { buildGraph } from "./buildGraph";
import type { IngestedFile } from "@/core/ingestion/types";
import type { ParseResult } from "@/core/parser/types";

describe("buildGraph", () => {
  it("includes every ingested file as a node, even ones with no edges", () => {
    const files: IngestedFile[] = [
      { path: "src/a.ts", content: "" },
      { path: "src/isolated.ts", content: "" },
    ];
    const parseResult: ParseResult = { edges: [], unresolvedImports: [] };

    const result = buildGraph(files, parseResult);

    expect(result.nodes.map((n) => n.id).sort()).toEqual([
      "src/a.ts",
      "src/isolated.ts",
    ]);
  });

  it("carries parsed edges through unchanged", () => {
    const files: IngestedFile[] = [{ path: "src/a.ts", content: "" }];
    const parseResult: ParseResult = {
      edges: [{ from: "src/a.ts", to: "src/b.ts" }],
      unresolvedImports: [],
    };

    const result = buildGraph(files, parseResult);

    expect(result.edges).toEqual([{ from: "src/a.ts", to: "src/b.ts" }]);
  });
});
