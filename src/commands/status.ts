import path from "node:path";
import { DOC_FILES } from "../project/constants";
import { readProjectConfig } from "../storage/project-config";
import { getRelevantChangedFiles } from "../git/status";
import { readScanResult } from "../storage/io";
import { fileExists, findProjectRoot } from "../utils/fs";

export async function runStatus(startDir: string) {
  const rootDir = await findProjectRoot(startDir);
  const initialized = await fileExists(path.join(rootDir, ".shojibrain"));
  const docs = await Promise.all(
    Object.entries(DOC_FILES).map(async ([key, relativePath]) => [key, await fileExists(path.join(rootDir, relativePath))] as const),
  );
  const changedFiles = await getRelevantChangedFiles(rootDir);
  const projectConfig = await readProjectConfig(rootDir);

  let scan = null;
  try {
    scan = await readScanResult(rootDir);
  } catch {
    scan = null;
  }

  return {
    rootDir,
    initialized,
    docs: Object.fromEntries(docs),
    presets: projectConfig?.presets ?? [],
    changedFiles,
    project: scan?.project ?? null,
    counts: scan
      ? {
          files: Object.keys(scan.files).length,
          symbols: Object.keys(scan.symbols).length,
          dependencies: Object.values(scan.dependencies).reduce((count, entry) => count + entry.dependsOn.length, 0),
          tests: Object.keys(scan.tests).length,
        }
      : null,
  };
}
