import path from "node:path";
import { CACHE_DIR, DOC_FILES, MAP_FILES } from "../project/constants";
import { readScanResult } from "../storage/io";
import { fileExists, findProjectRoot } from "../utils/fs";

export async function runDoctor(startDir: string) {
  const rootDir = await findProjectRoot(startDir);
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  checks.push({
    name: ".shojibrain exists",
    ok: await fileExists(path.join(rootDir, ".shojibrain")),
    detail: "Run `shojibrain init` if missing.",
  });

  for (const relativePath of Object.values(DOC_FILES)) {
    checks.push({
      name: `${relativePath} exists`,
      ok: await fileExists(path.join(rootDir, relativePath)),
      detail: "Initialize the project templates or restore the file.",
    });
  }

  checks.push({
    name: `${CACHE_DIR} exists`,
    ok: await fileExists(path.join(rootDir, CACHE_DIR)),
    detail: "The cache directory should be writable for future local indexes.",
  });

  for (const relativePath of Object.values(MAP_FILES)) {
    checks.push({
      name: `${relativePath} exists`,
      ok: await fileExists(path.join(rootDir, relativePath)),
      detail: "Run `shojibrain scan` to generate or refresh maps.",
    });
  }

  try {
    const scan = await readScanResult(rootDir);
    checks.push({
      name: "Map schema readable",
      ok: scan.project.schemaVersion === 1,
      detail: `Detected schema version ${scan.project.schemaVersion}.`,
    });
  } catch (error) {
    checks.push({
      name: "Map schema readable",
      ok: false,
      detail: error instanceof Error ? error.message : "Unable to parse persisted map files.",
    });
  }

  checks.push({
    name: "AGENTS.md integration exists",
    ok: await fileExists(path.join(rootDir, "AGENTS.md")),
    detail: "Run `shojibrain init` to create or update agent instructions.",
  });

  return {
    rootDir,
    ok: checks.every((check) => check.ok),
    checks,
  };
}
