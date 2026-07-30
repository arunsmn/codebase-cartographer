"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import dynamic from "next/dynamic";
import { MobileNotice } from "./MobileNotice";
import { Header } from "./Header";
import { Footer } from "./Footer";
import type { DependencyGraph as DependencyGraphData } from "@/core/graph/types";
import type { NarrationResult } from "@/core/narration/types";

const DependencyGraph = dynamic(
  () => import("./DependencyGraph").then((mod) => mod.DependencyGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-canvas font-mono text-sm text-text-secondary">
        Loading diagram…
      </div>
    ),
  },
);

interface AnalyzeResponse {
  owner: string;
  repo: string;
  branch: string;
  graph: DependencyGraphData;
  narration: NarrationResult;
}

type Status = "idle" | "loading" | "error" | "success";

const LOADING_MESSAGES = [
  "Fetching repository files…",
  "Parsing imports…",
  "Building dependency graph…",
  "Generating AI summary…",
];
const LOADING_MESSAGE_INTERVAL_MS = 3000;

export function RepoAnalyzer() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (status !== "loading") return;

    const interval = setInterval(() => {
      setLoadingMessageIndex((current) =>
        Math.min(current + 1, LOADING_MESSAGES.length - 1),
      );
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status]);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setLoadingMessageIndex(0);
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

  function handleAnalyzeAnother() {
    setResult(null);
    setUrl("");
    setStatus("idle");
    setErrorMessage("");
  }

  if (status === "success" && result) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-canvas">
        <MobileNotice />
        <div className="flex shrink-0 items-start justify-between border-b border-node-border px-6 py-4">
          <div>
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
          <button
            onClick={handleAnalyzeAnother}
            className="shrink-0 rounded-md border border-node-border bg-node px-3 py-1.5 font-mono text-xs text-text-secondary hover:border-accent hover:text-text-primary"
          >
            ← Analyze another repo
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <DependencyGraph
            key={`${result.owner}/${result.repo}/${result.branch}`}
            graph={result.graph}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-canvas">
      <MobileNotice />
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
            {status === "loading"
              ? LOADING_MESSAGES[loadingMessageIndex]
              : "Analyze"}
          </button>
          {status === "error" && (
            <p className="mt-3 text-sm text-red-400">{errorMessage}</p>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
}
