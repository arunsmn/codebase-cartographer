# 2. Scope v1 to JavaScript/TypeScript repos only

## Status

Accepted

## Context

The parsing engine (Phase 2) is built on `ts-morph`, which wraps the
TypeScript compiler API. It has no ability to parse Python, Go, Java, or
any other language's import/dependency syntax. Supporting another
language would mean running that language's own toolchain (e.g. Python's
`ast` module, Go's `go/packages`) as a separate subprocess, plus building
a second, genuinely different resolution strategy for that language's
module system.

## Decision

Ship v1 supporting JavaScript/TypeScript repositories only. Detect
non-JS/TS repos up front (by file extension) and show a clear message
rather than silently producing an incomplete or wrong diagram.

The parser sits behind an interface (see the `core/parser` module
boundary) specifically so that adding a second language later means
writing a new class that implements the same contract — not rewriting
the graph, layout, or narration logic, none of which know or care how an
edge was originally discovered.

## Consequences

- The tool is honest about what it supports, rather than attempting
  every language and quietly producing inaccurate results for ones it
  doesn't actually understand.
- Adding Python, Go, or another language later is additive, not a
  rewrite — the rest of the pipeline (graph building, layout, narration,
  UI) is already language-agnostic.
- This was a deliberate scope decision made in Phase 0, before any
  parsing code was written, not a limitation discovered afterward.
