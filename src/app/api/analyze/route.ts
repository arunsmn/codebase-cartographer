import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestRepo } from "@/core/ingestion/ingestRepo";
import { parseImports } from "@/core/parser/parseImports";
import { buildGraph } from "@/core/graph/buildGraph";
import { computeLayout, type LayoutResult } from "@/core/layout/computeLayout";
import { geminiProvider } from "@/core/narration/geminiProvider";
import { mockProvider } from "@/core/narration/mockProvider";
import type { NarrationResult } from "@/core/narration/types";
import { AppError } from "@/lib/errors";
import { getCached, setCached } from "@/lib/analysisCache";
import { env } from "@/lib/env";

const narrationProvider =
  env.NARRATION_PROVIDER === "mock" ? mockProvider : geminiProvider;

const analyzeRequestSchema = z.object({
  url: z.url(),
  branch: z.string().optional(),
});

interface AnalyzeResult {
  owner: string;
  repo: string;
  branch: string;
  layout: LayoutResult;
  narration: NarrationResult;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsedBody = analyzeRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "Invalid request: expected a valid repository URL." },
      { status: 400 },
    );
  }

  const { url, branch } = parsedBody.data;
  const cacheKey = `${url}#${branch ?? "main"}`;

  const cached = getCached<AnalyzeResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const ingested = await ingestRepo(url, branch);
    const parseResult = parseImports(ingested.files);
    const graph = buildGraph(ingested.files, parseResult);
    const layout = computeLayout(graph);
    const narration = await narrationProvider.narrate(
      graph,
      `${ingested.owner}/${ingested.repo}`,
    );

    const result: AnalyzeResult = {
      owner: ingested.owner,
      repo: ingested.repo,
      branch: ingested.branch,
      layout,
      narration,
    };

    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Unexpected error analyzing repo:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong analyzing this repository. Please try again.",
      },
      { status: 500 },
    );
  }
}
