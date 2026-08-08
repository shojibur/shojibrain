"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScan = runScan;
const scan_1 = require("../scanner/scan");
const io_1 = require("../storage/io");
const fs_1 = require("../utils/fs");
async function runScan(startDir) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const result = await (0, scan_1.scanProject)(rootDir);
    await (0, io_1.writeScanResult)(rootDir, result);
    return {
        rootDir,
        fileCount: Object.keys(result.files).length,
        symbolCount: Object.keys(result.symbols).length,
        dependencyCount: Object.values(result.dependencies).reduce((count, entry) => count + entry.dependsOn.length, 0),
        testCount: Object.keys(result.tests).length,
        project: result.project,
    };
}
//# sourceMappingURL=scan.js.map