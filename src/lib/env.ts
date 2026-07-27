import { z } from "zod";

const envSchema = z.object({
  GITHUB_TOKEN: z
    .string()
    .min(1, "GITHUB_TOKEN is required to avoid GitHub API rate limits"),
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required for narration generation"),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
