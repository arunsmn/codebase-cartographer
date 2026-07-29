import { Octokit } from "octokit";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";

const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

export interface RemoteTreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<RemoteTreeEntry[]> {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "true",
  });

  if (data.truncated) {
    throw new AppError(
      `The file tree for ${owner}/${repo} is too large and was truncated by GitHub's API — this repo isn't supported yet.`,
      400,
    );
  }

  return data.tree
    .filter(
      (
        entry,
      ): entry is typeof entry & {
        path: string;
        type: "blob" | "tree";
        sha: string;
      } => Boolean(entry.path && entry.type && entry.sha),
    )
    .map((entry) => ({
      path: entry.path,
      type: entry.type as "blob" | "tree",
      size: entry.size,
      sha: entry.sha,
    }));
}

export async function fetchBlobContent(
  owner: string,
  repo: string,
  sha: string,
): Promise<string> {
  const { data } = await octokit.rest.git.getBlob({
    owner,
    repo,
    file_sha: sha,
  });
  return Buffer.from(data.content, "base64").toString("utf-8");
}
