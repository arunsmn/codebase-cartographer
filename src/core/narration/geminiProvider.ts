import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { env } from "@/lib/env";
import { narrationSchema } from "./schema";
import { buildNarrationPrompt } from "./buildPrompt";
import type { NarrationProvider } from "./NarrationProvider";
import type { DependencyGraph } from "@/core/graph/types";

const MODEL = "gemini-3.6-flash";

async function narrate(graph: DependencyGraph, repoLabel: string) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const prompt = buildNarrationPrompt(graph, repoLabel);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(narrationSchema),
    },
  });

  const parsed = JSON.parse(response.text ?? "");
  const validated = narrationSchema.parse(parsed);

  const knownIds = new Set(graph.nodes.map((n) => n.id));
  const nodeNarrations = validated.nodeNarrations.filter((n) =>
    knownIds.has(n.nodeId),
  );

  return { summary: validated.summary, nodeNarrations };
}

export const geminiProvider: NarrationProvider = { narrate };
