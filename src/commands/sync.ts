import { getRelevantChangedFiles } from "../git/status";
import { scanProject } from "../scanner/scan";
import { writeScanResult } from "../storage/io";
import { findProjectRoot } from "../utils/fs";

export async function runSync(startDir: string) {
  const rootDir = await findProjectRoot(startDir);
  const changedFiles = await getRelevantChangedFiles(rootDir);
  const result = await scanProject(rootDir);
  await writeScanResult(rootDir, result);
  return {
    rootDir,
    changedFiles,
    updated: ["files", "symbols", "dependencies", "tests"],
  };
}
