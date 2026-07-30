import { describe, it, expect } from "vitest";
import { extractRawImports } from "./extractImports";
import type { IngestedFile } from "@/core/ingestion/types";

describe("extractRawImports", () => {
  it("extracts a static import specifier", () => {
    const files: IngestedFile[] = [
      { path: "src/a.ts", content: `import { foo } from "./b";` },
    ];

    const result = extractRawImports(files);

    expect(result).toEqual([{ path: "src/a.ts", specifiers: ["./b"] }]);
  });

  it("extracts a re-export specifier alongside a regular import", () => {
    const files: IngestedFile[] = [
      {
        path: "src/a.ts",
        content: `import { foo } from "./b";\nexport { bar } from "./c";`,
      },
    ];

    const result = extractRawImports(files);

    expect(result[0].specifiers.sort()).toEqual(["./b", "./c"]);
  });

  it("ignores a bare re-export with no source module", () => {
    const files: IngestedFile[] = [
      { path: "src/a.ts", content: `const bar = 1;\nexport { bar };` },
    ];

    const result = extractRawImports(files);

    expect(result[0].specifiers).toEqual([]);
  });

  it("returns an empty specifier list for a file with no imports or exports", () => {
    const files: IngestedFile[] = [
      { path: "src/a.ts", content: `export const x = 1;` },
    ];

    const result = extractRawImports(files);

    expect(result[0].specifiers).toEqual([]);
  });
});
