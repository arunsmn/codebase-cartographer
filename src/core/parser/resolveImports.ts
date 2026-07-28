import path from "node:path";
import type { RawFileImports } from "./extractImports";
import type { ImportEdge, ParseResult } from "./types";

const RESOLUTION_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  "/index.ts",
  "/index.tsx",
  "/index.js",
  "/index.jsx",
];

export function resolveImports(rawImports: RawFileImports[]): ParseResult {
  const knownPaths = new Set(rawImports.map((f) => f.path));
  const edges: ImportEdge[] = [];
  const unresolvedImports: string[] = [];

  for (const file of rawImports) {
    const fileDir = path.posix.dirname(file.path);

    for (const specifier of file.specifiers) {
      if (!specifier.startsWith(".")) {
        // Not a relative path — an external package (e.g. "zod", "react"),
        // not part of this repo's internal graph.
        unresolvedImports.push(specifier);
        continue;
      }

      const resolvedBase = path.posix.normalize(
        path.posix.join(fileDir, specifier),
      );
      const match = RESOLUTION_SUFFIXES.map(
        (suffix) => `${resolvedBase}${suffix}`,
      ).find((candidate) => knownPaths.has(candidate));

      if (match) {
        edges.push({ from: file.path, to: match });
      } else {
        unresolvedImports.push(specifier);
      }
    }
  }

  return { edges, unresolvedImports };
}
