import { describe, it, expect } from "vitest";
import { detectGroups } from "./detectGroups";

describe("detectGroups", () => {
  it("groups files under a recognized container with multiple qualifying packages", () => {
    const paths = [
      "apps/palette-ai/page.tsx",
      "apps/palette-ai/layout.tsx",
      "apps/hisaab/page.tsx",
      "apps/hisaab/layout.tsx",
    ];

    const result = detectGroups(paths);

    expect(result.groups).toHaveLength(2);
    expect(result.groups.map((g) => g.id).sort()).toEqual([
      "apps/hisaab",
      "apps/palette-ai",
    ]);
    expect(result.ungroupedPaths).toEqual([]);
  });

  it("does not group a container with only one distinct package", () => {
    const paths = ["apps/palette-ai/page.tsx", "apps/palette-ai/layout.tsx"];

    const result = detectGroups(paths);

    expect(result.groups).toEqual([]);
    expect(result.ungroupedPaths.sort()).toEqual(paths.sort());
  });

  it("releases a qualifying container's group back to ungrouped if it has too few files", () => {
    const paths = [
      "packages/ui/index.ts",
      "packages/ui/button.tsx",
      "packages/tailwind-config/index.ts", // only 1 file
    ];

    const result = detectGroups(paths);

    expect(result.groups.map((g) => g.id)).toEqual(["packages/ui"]);
    expect(result.ungroupedPaths).toEqual([
      "packages/tailwind-config/index.ts",
    ]);
  });

  it("leaves a loose file directly inside a container ungrouped, not counted as its own package", () => {
    const paths = [
      "apps/README.md",
      "apps/palette-ai/page.tsx",
      "apps/palette-ai/layout.tsx",
      "apps/hisaab/page.tsx",
      "apps/hisaab/layout.tsx",
    ];

    const result = detectGroups(paths);

    expect(result.ungroupedPaths).toContain("apps/README.md");
    expect(result.groups.map((g) => g.id).sort()).toEqual([
      "apps/hisaab",
      "apps/palette-ai",
    ]);
  });

  it("leaves files outside any recognized container ungrouped entirely", () => {
    const paths = ["src/core/parser/types.ts", "package.json"];

    const result = detectGroups(paths);

    expect(result.groups).toEqual([]);
    expect(result.ungroupedPaths.sort()).toEqual(paths.sort());
  });
});
