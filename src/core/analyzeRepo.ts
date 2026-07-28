import { ingestRepo } from "@/core/ingestion/ingestRepo";
import { parseImports } from "@/core/parser/parseImports";
import { buildGraph } from "@/core/graph/buildGraph";
import { computeLayout, type LayoutResult } from "@/core/layout/computeLayout";

export interface AnalyzeRepoResult {
  owner: string;
  repo: string;
  branch: string;
  layout: LayoutResult;
  unresolvedImports: string[];
}

export async function analyzeRepo(
  url: string,
  branch = "main",
): Promise<AnalyzeRepoResult> {
  const ingested = await ingestRepo(url, branch);
  const parseResult = parseImports(ingested.files);
  const graph = buildGraph(ingested.files, parseResult);
  const layout = computeLayout(graph);

  return {
    owner: ingested.owner,
    repo: ingested.repo,
    branch: ingested.branch,
    layout,
    unresolvedImports: [...new Set(parseResult.unresolvedImports)],
  };
}
