"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatus = runStatus;
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../project/constants");
const status_1 = require("../git/status");
const io_1 = require("../storage/io");
const fs_1 = require("../utils/fs");
async function runStatus(startDir) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const initialized = await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, ".shojibrain"));
    const docs = await Promise.all(Object.entries(constants_1.DOC_FILES).map(async ([key, relativePath]) => [key, await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, relativePath))]));
    const changedFiles = await (0, status_1.getRelevantChangedFiles)(rootDir);
    let scan = null;
    try {
        scan = await (0, io_1.readScanResult)(rootDir);
    }
    catch {
        scan = null;
    }
    return {
        rootDir,
        initialized,
        docs: Object.fromEntries(docs),
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
//# sourceMappingURL=status.js.map