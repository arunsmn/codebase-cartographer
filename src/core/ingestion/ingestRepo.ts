import pLimit from "p-limit";
import { parseRepoUrl } from "./parseRepoUrl";
import { fetchRepoTree, fetchBlobContent } from "./githubClient";
import { filterRelevantFiles } from "./filterFiles";
import type { IngestedRepo, IngestedFile } from "./types";

const CONCURRENT_FILE_FETCHES = 10;

export async function ingestRepo(
  url: string,
  branch = "main",
): Promise<IngestedRepo> {
  const { owner, repo, branch: resolvedBranch } = parseRepoUrl(url, branch);

  const tree = await fetchRepoTree(owner, repo, resolvedBranch);
  const relevantEntries = filterRelevantFiles(tree);

  const limit = pLimit(CONCURRENT_FILE_FETCHES);

  const files: IngestedFile[] = await Promise.all(
    relevantEntries.map((entry) =>
      limit(async () => ({
        path: entry.path,
        content: await fetchBlobContent(owner, repo, entry.sha),
      })),
    ),
  );

  return {
    owner,
    repo,
    branch: resolvedBranch,
    files,
  };
}
