import { buildContext, formatContext } from "../context/build";
import { readScanResult } from "../storage/io";
import { findProjectRoot } from "../utils/fs";

export async function runContext(startDir: string, request: string) {
  const rootDir = await findProjectRoot(startDir);
  const scan = await readScanResult(rootDir);
  const result = await buildContext(rootDir, scan, request);
  return {
    rootDir,
    result,
    text: formatContext(result),
  };
}
