"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSync = runSync;
const status_1 = require("../git/status");
const scan_1 = require("../scanner/scan");
const io_1 = require("../storage/io");
const fs_1 = require("../utils/fs");
async function runSync(startDir) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const changedFiles = await (0, status_1.getRelevantChangedFiles)(rootDir);
    const result = await (0, scan_1.scanProject)(rootDir);
    await (0, io_1.writeScanResult)(rootDir, result);
    return {
        rootDir,
        changedFiles,
        updated: ["files", "symbols", "dependencies", "tests"],
    };
}
//# sourceMappingURL=sync.js.map