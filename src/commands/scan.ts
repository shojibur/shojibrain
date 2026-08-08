import { scanProject } from "../scanner/scan";
import { writeScanResult } from "../storage/io";
import { findProjectRoot } from "../utils/fs";

export async function runScan(startDir: string) {
  const rootDir = await findProjectRoot(startDir);
  const result = await scanProject(rootDir);
  await writeScanResult(rootDir, result);
  return {
    rootDir,
    fileCount: Object.keys(result.files).length,
    symbolCount: Object.keys(result.symbols).length,
    dependencyCount: Object.values(result.dependencies).reduce((count, entry) => count + entry.dependsOn.length, 0),
    testCount: Object.keys(result.tests).length,
    project: result.project,
  };
}
