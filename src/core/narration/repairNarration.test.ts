import { describe, it, expect } from "vitest";
import { parseNarrationResponse } from "./repairNarration";

describe("parseNarrationResponse", () => {
  it("passes through a valid response unchanged", () => {
    const valid = {
      summary: "A short summary.",
      nodeNarrations: [{ nodeId: "src/a.ts", description: "Does a thing." }],
    };

    expect(parseNarrationResponse(valid)).toEqual(valid);
  });

  it("truncates an oversized summary instead of throwing", () => {
    const oversized = {
      summary: "x".repeat(600),
      nodeNarrations: [],
    };

    const result = parseNarrationResponse(oversized);

    expect(result.summary).toHaveLength(500);
  });

  it("truncates an oversized nodeNarration description", () => {
    const oversized = {
      summary: "fine",
      nodeNarrations: [{ nodeId: "src/a.ts", description: "y".repeat(300) }],
    };

    const result = parseNarrationResponse(oversized);

    expect(result.nodeNarrations[0].description).toHaveLength(200);
  });

  it("still throws for a genuinely malformed response (missing required field)", () => {
    const malformed = { summary: "fine" }; // missing nodeNarrations entirely

    expect(() => parseNarrationResponse(malformed)).toThrow();
  });
});
