import { GoogleGenAI, ApiError } from "@google/genai";
import pRetry, { AbortError } from "p-retry";
import { z } from "zod";
import { env } from "@/lib/env";
import { narrationSchema } from "./schema";
import { buildNarrationPrompt } from "./buildPrompt";
import { parseNarrationResponse } from "./repairNarration";
import type { NarrationProvider } from "./NarrationProvider";
import type { DependencyGraph } from "@/core/graph/types";

const MODEL = "gemini-3.6-flash";
const RETRYABLE_STATUS_CODES = new Set([429, 503]);

async function callGemini(ai: GoogleGenAI, prompt: string) {
  try {
    return await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(narrationSchema),
      },
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      !RETRYABLE_STATUS_CODES.has(error.status)
    ) {
      throw new AbortError(error);
    }
    throw error;
  }
}

async function narrate(graph: DependencyGraph, repoLabel: string) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const prompt = buildNarrationPrompt(graph, repoLabel);

  const response = await pRetry(() => callGemini(ai, prompt), {
    retries: 3,
    onFailedAttempt: ({ error, attemptNumber, retriesLeft }) => {
      console.warn(
        `Gemini call failed (attempt ${attemptNumber}, ${retriesLeft} retries left): ${error.message}`,
      );
    },
  });

  const parsed = JSON.parse(response.text ?? "");
  const validated = parseNarrationResponse(parsed);

  const knownIds = new Set(graph.nodes.map((n) => n.id));
  const nodeNarrations = validated.nodeNarrations.filter((n) =>
    knownIds.has(n.nodeId),
  );

  return { summary: validated.summary, nodeNarrations };
}

export const geminiProvider: NarrationProvider = { narrate };
