"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWatch = runWatch;
const node_path_1 = __importDefault(require("node:path"));
const chokidar_1 = __importDefault(require("chokidar"));
const constants_1 = require("../project/constants");
const scan_1 = require("../scanner/scan");
const io_1 = require("../storage/io");
const fs_1 = require("../utils/fs");
const DEBOUNCE_MS = 1200;
const SOURCE_RE = /\.(tsx?|jsx?|mts|cts|mjs|cjs|py|php|rb|go)$/i;
const BRAIN_DOC_RE = /^\.shojibrain\/.+\.(md|json)$/i;
const CURRENT_DOC_PATH = constants_1.DOC_FILES.current;
async function runWatch(startDir, onEvent) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const log = onEvent ?? ((msg) => process.stdout.write(msg + "\n"));
    log(`ShojiBrain Watch — watching ${rootDir}`);
    log("Press Ctrl+C to stop.\n");
    let debounceTimer = null;
    let pending = false;
    let running = false;
    let batchChangedFiles = new Set();
    const trigger = () => {
        if (running) {
            pending = true;
            return;
        }
        running = true;
        pending = false;
        const batchFiles = new Set(batchChangedFiles);
        batchChangedFiles = new Set();
        const start = Date.now();
        log("Scanning…");
        (0, scan_1.scanProject)(rootDir)
            .then((result) => (0, io_1.writeScanResult)(rootDir, result).then(() => result))
            .then((result) => {
            const elapsed = Date.now() - start;
            log(`Synced — ${Object.keys(result.files).length} files, ` +
                `${Object.keys(result.symbols).length} symbols [${elapsed}ms]`);
            const checkpointHint = buildCheckpointHint(batchFiles);
            if (checkpointHint) {
                log(checkpointHint);
            }
        })
            .catch((err) => {
            const msg = err instanceof Error ? err.message : String(err);
            log(`Scan error: ${msg}`);
        })
            .finally(() => {
            running = false;
            if (pending)
                trigger();
        });
    };
    const schedule = (filePath, event) => {
        const rel = node_path_1.default.relative(rootDir, filePath);
        if (rel.startsWith("node_modules") ||
            rel.startsWith("dist") ||
            rel.startsWith(".git")) {
            return;
        }
        const normalized = rel.split(node_path_1.default.sep).join(node_path_1.default.posix.sep);
        if (!SOURCE_RE.test(filePath) && !BRAIN_DOC_RE.test(normalized))
            return;
        batchChangedFiles.add(normalized);
        log(`  ${event}: ${rel}`);
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(trigger, DEBOUNCE_MS);
    };
    const watcher = chokidar_1.default.watch(rootDir, {
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
    await new Promise((_, reject) => {
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
function buildCheckpointHint(changedFiles) {
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
function isMeaningfulForCurrentState(file) {
    const lower = file.toLowerCase();
    if (lower.startsWith(".shojibrain/"))
        return false;
    if (lower === "readme.md" || lower === "license" || lower === ".gitignore")
        return false;
    if (/^package(-lock)?\.json$/.test(lower))
        return false;
    if (/\.(md|txt|ya?ml|json)$/i.test(lower) && !SOURCE_RE.test(lower))
        return false;
    return true;
}
//# sourceMappingURL=watch.js.map