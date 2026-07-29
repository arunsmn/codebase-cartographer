import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestRepo } from "@/core/ingestion/ingestRepo";
import { parseImports } from "@/core/parser/parseImports";
import { buildGraph } from "@/core/graph/buildGraph";
import { computeLayout } from "@/core/layout/computeLayout";
import { geminiProvider } from "@/core/narration/geminiProvider";
import { AppError } from "@/lib/errors";

const analyzeRequestSchema = z.object({
  url: z.url(),
  branch: z.string().optional(),
});

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

  try {
    const ingested = await ingestRepo(url, branch);
    const parseResult = parseImports(ingested.files);
    const graph = buildGraph(ingested.files, parseResult);
    const layout = computeLayout(graph);
    const narration = await geminiProvider.narrate(
      graph,
      `${ingested.owner}/${ingested.repo}`,
    );

    return NextResponse.json({
      owner: ingested.owner,
      repo: ingested.repo,
      branch: ingested.branch,
      layout,
      narration,
    });
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
