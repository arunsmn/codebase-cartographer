import { Octokit } from "octokit";
import { env } from "@/lib/env";

const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

export interface RemoteTreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
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
    throw new Error(
      `The file tree for ${owner}/${repo} is too large and was truncated by GitHub's API — this repo isn't supported yet.`,
    );
  }

  return data.tree
    .filter(
      (
        entry,
      ): entry is typeof entry & { path: string; type: "blob" | "tree" } =>
        Boolean(entry.path && entry.type),
    )
    .map((entry) => ({
      path: entry.path,
      type: entry.type as "blob" | "tree",
      size: entry.size,
    }));
}
