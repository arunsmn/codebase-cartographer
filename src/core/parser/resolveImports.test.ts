import { describe, it, expect } from "vitest";
import { resolveImports } from "./resolveImports";
import type { RawFileImports } from "./extractImports";
import type { PathAliasConfig } from "./pathAliases";

describe("resolveImports", () => {
  it("resolves a relative import to a file with an explicit extension", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["./b"] },
      { path: "src/b.ts", specifiers: [] },
    ];

    const result = resolveImports(rawImports, null);

    expect(result.edges).toEqual([{ from: "src/a.ts", to: "src/b.ts" }]);
    expect(result.unresolvedImports).toEqual([]);
  });

  it("resolves a relative import to an index file inside a folder", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["./utils"] },
      { path: "src/utils/index.ts", specifiers: [] },
    ];

    const result = resolveImports(rawImports, null);

    expect(result.edges).toEqual([
      { from: "src/a.ts", to: "src/utils/index.ts" },
    ]);
  });

  it("resolves a parent-directory relative import", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/nested/a.ts", specifiers: ["../shared"] },
      { path: "src/shared.ts", specifiers: [] },
    ];

    const result = resolveImports(rawImports, null);

    expect(result.edges).toEqual([
      { from: "src/nested/a.ts", to: "src/shared.ts" },
    ]);
  });

  it("treats a non-relative specifier as external when there is no alias config", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["zod"] },
    ];

    const result = resolveImports(rawImports, null);

    expect(result.edges).toEqual([]);
    expect(result.unresolvedImports).toEqual(["zod"]);
  });

  it("resolves an aliased import using the provided path alias config", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["@/lib/foo"] },
      { path: "src/lib/foo.ts", specifiers: [] },
    ];
    const aliasConfig: PathAliasConfig = {
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] },
    };

    const result = resolveImports(rawImports, aliasConfig);

    expect(result.edges).toEqual([{ from: "src/a.ts", to: "src/lib/foo.ts" }]);
  });

  it("treats a non-relative specifier as external when it doesn't match any alias pattern", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["octokit"] },
    ];
    const aliasConfig: PathAliasConfig = {
      baseUrl: ".",
      paths: { "@/*": ["./src/*"] },
    };

    const result = resolveImports(rawImports, aliasConfig);

    expect(result.edges).toEqual([]);
    expect(result.unresolvedImports).toEqual(["octokit"]);
  });

  it("treats a relative import as unresolved when the target file was never ingested", () => {
    const rawImports: RawFileImports[] = [
      { path: "src/a.ts", specifiers: ["./missing"] },
    ];

    const result = resolveImports(rawImports, null);

    expect(result.edges).toEqual([]);
    expect(result.unresolvedImports).toEqual(["./missing"]);
  });
});
