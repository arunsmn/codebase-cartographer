import path from "node:path";
import type { RawFileImports } from "./extractImports";
import type { ImportEdge, ParseResult } from "./types";
import { applyPathAlias, type PathAliasConfig } from "./pathAliases";

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

export function resolveImports(
  rawImports: RawFileImports[],
  aliasConfig: PathAliasConfig | null,
): ParseResult {
  const knownPaths = new Set(rawImports.map((f) => f.path));
  const edges: ImportEdge[] = [];
  const unresolvedImports: string[] = [];

  for (const file of rawImports) {
    const fileDir = path.posix.dirname(file.path);

    for (const specifier of file.specifiers) {
      let resolvedBase: string;

      if (specifier.startsWith(".")) {
        resolvedBase = path.posix.normalize(
          path.posix.join(fileDir, specifier),
        );
      } else {
        const aliasResolved = aliasConfig
          ? applyPathAlias(specifier, aliasConfig)
          : null;
        if (!aliasResolved) {
          // Not relative, not a known alias — a genuine external package.
          unresolvedImports.push(specifier);
          continue;
        }
        resolvedBase = aliasResolved;
      }

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
