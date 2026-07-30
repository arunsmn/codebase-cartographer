"use client";

import { useState, type FormEvent } from "react";
import { DependencyGraph } from "./DependencyGraph";
import { MobileNotice } from "./MobileNotice";
import type { DependencyGraph as DependencyGraphData } from "@/core/graph/types";
import type { NarrationResult } from "@/core/narration/types";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AnalyzeResponse {
  owner: string;
  repo: string;
  branch: string;
  graph: DependencyGraphData;
  narration: NarrationResult;
}

type Status = "idle" | "loading" | "error" | "success";

export function RepoAnalyzer() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please try again.");
    }
  }

  if (status === "success" && result) {
    return (
      <>
        <MobileNotice />
        <div className="flex h-screen w-full flex-col overflow-hidden bg-canvas">
          <div className="shrink-0 border-b border-node-border px-6 py-4">
            <h1 className="font-mono text-sm text-text-primary">
              {result.owner}/{result.repo}
              <span className="ml-2 text-text-secondary">
                ({result.branch})
              </span>
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">
              {result.narration.summary}
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <DependencyGraph
              key={`${result.owner}/${result.repo}/${result.branch}`}
              graph={result.graph}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileNotice />
      <div className="flex h-screen w-full flex-col bg-canvas">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <form onSubmit={handleSubmit} className="w-full max-w-md px-6">
            <label className="mb-2 block font-mono text-sm text-text-secondary">
              GitHub repository URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-md border border-node-border bg-node px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-3 w-full rounded-md bg-accent px-3 py-2 font-mono text-sm font-semibold text-canvas disabled:opacity-50"
            >
              {status === "loading" ? "Analyzing…" : "Analyze"}
            </button>
            {status === "error" && (
              <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
            )}
          </form>
        </div>
        <Footer />
      </div>
    </>
  );
}
