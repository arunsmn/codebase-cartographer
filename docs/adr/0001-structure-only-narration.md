# 1. Narration is generated from structure, not file contents

## Status

Accepted

## Context

The narration agent (Phase 4) generates a one-sentence description for every
file in a repo, plus an overall architecture summary. The prompt only
includes file paths and the import/dependency graph between them — never
actual file contents.

Testing against this project's own repo showed the tradeoff clearly: every
generated description referenced a real file (the hallucination guard,
which filters any nodeId not present in the actual graph, had nothing to
filter), but at least one description was subtly inaccurate about a file's
actual behavior. `DependencyGraph.tsx` was described as computing node
positions, when it only renders positions computed elsewhere
(`computeLayout.ts`). The model reasoned from the filename and its
connections in the graph, not from what the file actually does.

## Decision

Ship v1 with structure-only narration. Do not feed full file contents into
the narration prompt for this version.

## Consequences

- Narration correctly avoids referencing files that don't exist (verified
  by the hallucination guard).
- Narration may still be factually wrong about what a specific file does,
  since the model has no visibility into actual code behavior.
- Token cost and prompt size stay low and predictable regardless of repo
  size.
- Planned follow-up (post-Phase 8): feed capped file-content snippets
  (e.g. first ~30 lines, or extracted function signatures) into the
  narration prompt to ground descriptions in real code, not just
  structure. Revisit this decision once the full pipeline is complete.
