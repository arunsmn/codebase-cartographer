import type { RemoteTreeEntry } from "./githubClient";

const IGNORED_DIRECTORIES = [
  "node_modules/",
  ".git/",
  ".next/",
  "dist/",
  "build/",
  "out/",
  "coverage/",
];

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

const MAX_FILE_SIZE_BYTES = 200_000; // 200 KB — generous for source files, excludes bundled/minified junk
const MAX_FILE_COUNT = 1_500; // a deliberate v1 ceiling on repo size

export function filterRelevantFiles(
  entries: RemoteTreeEntry[],
): RemoteTreeEntry[] {
  const relevant = entries.filter((entry) => {
    if (entry.type !== "blob") return false;
    if (
      IGNORED_DIRECTORIES.some(
        (dir) => entry.path.startsWith(dir) || entry.path.includes(`/${dir}`),
      )
    ) {
      return false;
    }
    if (!SUPPORTED_EXTENSIONS.some((ext) => entry.path.endsWith(ext))) {
      return false;
    }
    if (entry.size !== undefined && entry.size > MAX_FILE_SIZE_BYTES) {
      return false;
    }
    return true;
  });

  if (relevant.length > MAX_FILE_COUNT) {
    throw new Error(
      `This repo has ${relevant.length} matching files, over our current limit of ${MAX_FILE_COUNT}. Support for larger repos isn't built yet.`,
    );
  }

  return relevant;
}
