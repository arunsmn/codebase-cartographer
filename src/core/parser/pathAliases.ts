import path from "node:path";
import { parse } from "jsonc-parser";
import type { IngestedFile } from "@/core/ingestion/types";

export interface PathAliasConfig {
  baseUrl: string;
  paths: Record<string, string[]>;
}

export function extractPathAliases(
  files: IngestedFile[],
): PathAliasConfig | null {
  const tsconfigFile = files.find((f) => f.path === "tsconfig.json");
  if (!tsconfigFile) return null;

  const parsed = parse(tsconfigFile.content);
  const paths = parsed?.compilerOptions?.paths;
  if (!paths) return null;

  return {
    baseUrl: parsed.compilerOptions.baseUrl ?? ".",
    paths,
  };
}

export function applyPathAlias(
  specifier: string,
  aliasConfig: PathAliasConfig,
): string | null {
  for (const [pattern, targets] of Object.entries(aliasConfig.paths)) {
    const prefix = pattern.replace(/\*$/, "");
    if (!specifier.startsWith(prefix)) continue;

    const rest = specifier.slice(prefix.length);
    const targetPrefix = targets[0].replace(/\*$/, "");
    return path.posix.normalize(
      path.posix.join(aliasConfig.baseUrl, targetPrefix, rest),
    );
  }
  return null;
}
