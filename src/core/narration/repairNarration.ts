import { z } from "zod";
import { narrationSchema } from "./schema";

function truncateOversizedStrings(data: unknown, error: z.ZodError): unknown {
  if (typeof data !== "object" || data === null) return data;
  const repaired = structuredClone(data) as Record<string, unknown>;

  for (const issue of error.issues) {
    if (
      issue.code !== "too_big" ||
      !("maximum" in issue) ||
      typeof issue.maximum !== "number"
    ) {
      continue;
    }

    let target: Record<string, unknown> = repaired;
    for (let i = 0; i < issue.path.length - 1; i++) {
      target = target[issue.path[i] as string] as Record<string, unknown>;
    }

    const lastKey = issue.path[issue.path.length - 1] as string;
    if (typeof target[lastKey] === "string") {
      target[lastKey] = (target[lastKey] as string).slice(0, issue.maximum);
    }
  }

  return repaired;
}

export function parseNarrationResponse(
  raw: unknown,
): z.infer<typeof narrationSchema> {
  const firstAttempt = narrationSchema.safeParse(raw);
  if (firstAttempt.success) return firstAttempt.data;

  const repaired = truncateOversizedStrings(raw, firstAttempt.error);
  const secondAttempt = narrationSchema.safeParse(repaired);
  if (secondAttempt.success) return secondAttempt.data;

  // Still invalid after attempting a repair — this is a genuinely different,
  // more serious problem (missing field, wrong type), not just an oversized string.
  throw firstAttempt.error;
}
