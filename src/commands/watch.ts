import path from "node:path";
import chokidar from "chokidar";
import { DOC_FILES } from "../project/constants";
import { scanProject } from "../scanner/scan";
import { writeScanResult } from "../storage/io";
import { findProjectRoot } from "../utils/fs";

const DEBOUNCE_MS = 1200;
const SOURCE_RE = /\.(tsx?|jsx?|mts|cts|mjs|cjs|py|php|rb|go)$/i;
const BRAIN_DOC_RE = /^\.shojibrain\/.+\.(md|json)$/i;
const CURRENT_DOC_PATH = DOC_FILES.current;

export async function runWatch(startDir: string, onEvent?: (msg: string) => void): Promise<void> {
  const rootDir = await findProjectRoot(startDir);
  const log = onEvent ?? ((msg: string) => process.stdout.write(msg + "\n"));

  log(`ShojiBrain Watch — watching ${rootDir}`);
  log("Press Ctrl+C to stop.\n");

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pending = false;
  let running = false;
  let batchChangedFiles = new Set<string>();

  const trigger = () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    pending = false;
    const batchFiles = new Set(batchChangedFiles);
    batchChangedFiles = new Set<string>();

    const start = Date.now();
    log("Scanning…");
    scanProject(rootDir)
      .then((result) => writeScanResult(rootDir, result).then(() => result))
      .then((result) => {
        const elapsed = Date.now() - start;
        log(
          `Synced — ${Object.keys(result.files).length} files, ` +
          `${Object.keys(result.symbols).length} symbols [${elapsed}ms]`,
        );
        const checkpointHint = buildCheckpointHint(batchFiles);
        if (checkpointHint) {
          log(checkpointHint);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        log(`Scan error: ${msg}`);
      })
      .finally(() => {
        running = false;
        if (pending) trigger();
      });
  };

  const schedule = (filePath: string, event: string) => {
    const rel = path.relative(rootDir, filePath);
    if (
      rel.startsWith("node_modules") ||
      rel.startsWith("dist") ||
      rel.startsWith(".git")
    ) {
      return;
    }
    const normalized = rel.split(path.sep).join(path.posix.sep);
    if (!SOURCE_RE.test(filePath) && !BRAIN_DOC_RE.test(normalized)) return;
    batchChangedFiles.add(normalized);
    log(`  ${event}: ${rel}`);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(trigger, DEBOUNCE_MS);
  };

  const watcher = chokidar.watch(rootDir, {
    ignored: [
      /node_modules/,
      /\.git/,
      /\.shojibrain-cache/,
      /dist\//,
      /build\//,
      /coverage\//,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 400, pollInterval: 100 },
  });

  watcher
    .on("add", (p) => schedule(p, "added"))
    .on("change", (p) => schedule(p, "changed"))
    .on("unlink", (p) => schedule(p, "removed"))
    .on("error", (err) => log(`Watcher error: ${String(err)}`));

  // keep the process alive
  await new Promise<void>((_, reject) => {
    process.on("SIGINT", () => {
      watcher.close().then(() => {
        log("\nWatch stopped.");
        process.exit(0);
      });
    });
    process.on("SIGTERM", () => {
      watcher.close().then(() => {
        reject(new Error("terminated"));
      });
    });
  });
}

function buildCheckpointHint(changedFiles: Set<string>): string | null {
  const files = Array.from(changedFiles);
  if (files.length === 0) {
    return null;
  }

  const touchedCurrent = files.includes(CURRENT_DOC_PATH);
  if (touchedCurrent) {
    return null;
  }

  const meaningfulFiles = files.filter(isMeaningfulForCurrentState);
  if (meaningfulFiles.length < 3) {
    return null;
  }

  return "Hint: CURRENT.md may be stale after this change set. Run `shojibrain checkpoint --dry-run`.";
}

function isMeaningfulForCurrentState(file: string): boolean {
  const lower = file.toLowerCase();
  if (lower.startsWith(".shojibrain/")) return false;
  if (lower === "readme.md" || lower === "license" || lower === ".gitignore") return false;
  if (/^package(-lock)?\.json$/.test(lower)) return false;
  if (/\.(md|txt|ya?ml|json)$/i.test(lower) && !SOURCE_RE.test(lower)) return false;
  return true;
}
