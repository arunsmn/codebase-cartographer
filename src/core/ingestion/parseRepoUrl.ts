export interface RepoLocation {
  owner: string;
  repo: string;
  branch: string;
}

const GITHUB_URL_PATTERN =
  /^https?:\/\/github\.com\/(?<owner>[\w.-]+)\/(?<repo>[\w.-]+?)(\.git)?\/?$/;

export function parseRepoUrl(url: string, branch = "main"): RepoLocation {
  const match = GITHUB_URL_PATTERN.exec(url.trim());

  if (!match?.groups) {
    throw new Error(
      `"${url}" doesn't look like a valid GitHub repository URL. Expected something like https://github.com/owner/repo`,
    );
  }

  return {
    owner: match.groups.owner,
    repo: match.groups.repo,
    branch,
  };
}
