import path from "node:path";
import simpleGit from "simple-git";
import { SOURCE_FILE_PATTERN } from "../project/constants";

export async function getRelevantChangedFiles(rootDir: string): Promise<string[]> {
  const git = simpleGit(rootDir);
  try {
    const status = await git.status();
    const changed = [
      ...status.modified,
      ...status.created,
      ...status.not_added,
      ...status.renamed.map((entry) => entry.to),
      ...status.staged,
    ];
    return Array.from(new Set(changed))
      .filter((file) => matchesSourcePattern(file))
      .map((file) => file.split(path.sep).join(path.posix.sep))
      .sort();
  } catch {
    return [];
  }
}

function matchesSourcePattern(file: string): boolean {
  return /\.(tsx?|jsx?|mts|cts|mjs|cjs|py|php|rb|go)$/i.test(file);
}
