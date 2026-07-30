import { describe, it, expect } from "vitest";
import { parseRepoUrl } from "./parseRepoUrl";

describe("parseRepoUrl", () => {
  it("parses a standard GitHub URL", () => {
    expect(
      parseRepoUrl("https://github.com/arunsmn/codebase-cartographer"),
    ).toEqual({
      owner: "arunsmn",
      repo: "codebase-cartographer",
      branch: "main",
    });
  });

  it("uses the provided branch instead of the default", () => {
    expect(
      parseRepoUrl("https://github.com/arunsmn/codebase-cartographer", "dev"),
    ).toEqual({
      owner: "arunsmn",
      repo: "codebase-cartographer",
      branch: "dev",
    });
  });

  it("strips a trailing .git suffix", () => {
    const result = parseRepoUrl(
      "https://github.com/arunsmn/codebase-cartographer.git",
    );
    expect(result.repo).toBe("codebase-cartographer");
  });

  it("throws AppError for a non-GitHub URL", () => {
    expect(() => parseRepoUrl("https://gitlab.com/arunsmn/foo")).toThrow();
  });

  it("throws AppError for a malformed string", () => {
    expect(() => parseRepoUrl("not a url")).toThrow();
  });
});
