import type { IngestedFile } from "@/core/ingestion/types";
import { extractRawImports } from "./extractImports";
import { extractPathAliases } from "./pathAliases";
import { resolveImports } from "./resolveImports";
import type { ParseResult } from "./types";

export function parseImports(files: IngestedFile[]): ParseResult {
  const rawImports = extractRawImports(files);
  const aliasConfig = extractPathAliases(files);
  return resolveImports(rawImports, aliasConfig);
}
