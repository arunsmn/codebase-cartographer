import { describe, it, expect } from "vitest";
import { extractPathAliases, applyPathAlias } from "./pathAliases";
import type { IngestedFile } from "@/core/ingestion/types";

describe("extractPathAliases", () => {
  it("returns null when there is no tsconfig.json", () => {
    const files: IngestedFile[] = [{ path: "src/a.ts", content: "" }];
    expect(extractPathAliases(files)).toBeNull();
  });

  it("returns null when tsconfig.json has no paths configured", () => {
    const files: IngestedFile[] = [
      {
        path: "tsconfig.json",
        content: `{ "compilerOptions": { "strict": true } }`,
      },
    ];
    expect(extractPathAliases(files)).toBeNull();
  });

  it("extracts baseUrl and paths from a real tsconfig.json, tolerating comments", () => {
    const files: IngestedFile[] = [
      {
        path: "tsconfig.json",
        content: `{
          // a comment
          "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } }
        }`,
      },
    ];

    const result = extractPathAliases(files);

    expect(result).toEqual({ baseUrl: ".", paths: { "@/*": ["./src/*"] } });
  });
});

describe("applyPathAlias", () => {
  const aliasConfig = { baseUrl: ".", paths: { "@/*": ["./src/*"] } };

  it("resolves a matching alias specifier", () => {
    expect(applyPathAlias("@/lib/env", aliasConfig)).toBe("src/lib/env");
  });

  it("returns null for a specifier that doesn't match any alias pattern", () => {
    expect(applyPathAlias("zod", aliasConfig)).toBeNull();
  });
});
