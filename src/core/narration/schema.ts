import { z } from "zod";

export const narrationSchema = z.object({
  summary: z.string().max(500),
  nodeNarrations: z.array(
    z.object({
      nodeId: z.string(),
      description: z.string().max(200),
    }),
  ),
});

export type NarrationSchemaOutput = z.infer<typeof narrationSchema>;
