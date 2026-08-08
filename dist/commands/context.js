"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runContext = runContext;
const build_1 = require("../context/build");
const io_1 = require("../storage/io");
const fs_1 = require("../utils/fs");
async function runContext(startDir, request) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const scan = await (0, io_1.readScanResult)(rootDir);
    const result = await (0, build_1.buildContext)(rootDir, scan, request);
    return {
        rootDir,
        result,
        text: (0, build_1.formatContext)(result),
    };
}
//# sourceMappingURL=context.js.map