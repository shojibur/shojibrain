"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDoctor = runDoctor;
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../project/constants");
const io_1 = require("../storage/io");
const project_config_1 = require("../storage/project-config");
const fs_1 = require("../utils/fs");
async function runDoctor(startDir) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const checks = [];
    checks.push({
        name: ".shojibrain exists",
        ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, ".shojibrain")),
        detail: "Run `shojibrain init` if missing.",
    });
    for (const relativePath of Object.values(constants_1.DOC_FILES)) {
        checks.push({
            name: `${relativePath} exists`,
            ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, relativePath)),
            detail: "Initialize the project templates or restore the file.",
        });
    }
    checks.push({
        name: `${constants_1.CACHE_DIR} exists`,
        ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, constants_1.CACHE_DIR)),
        detail: "The cache directory should be writable for future local indexes.",
    });
    checks.push({
        name: `${constants_1.PROJECT_CONFIG_FILE} exists`,
        ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, constants_1.PROJECT_CONFIG_FILE)),
        detail: "Run `shojibrain init` with optional presets to store project-type configuration.",
    });
    for (const relativePath of Object.values(constants_1.MAP_FILES)) {
        checks.push({
            name: `${relativePath} exists`,
            ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, relativePath)),
            detail: "Run `shojibrain scan` to generate or refresh maps.",
        });
    }
    try {
        const scan = await (0, io_1.readScanResult)(rootDir);
        checks.push({
            name: "Map schema readable",
            ok: scan.project.schemaVersion === 1,
            detail: `Detected schema version ${scan.project.schemaVersion}.`,
        });
    }
    catch (error) {
        checks.push({
            name: "Map schema readable",
            ok: false,
            detail: error instanceof Error ? error.message : "Unable to parse persisted map files.",
        });
    }
    const config = await (0, project_config_1.readProjectConfig)(rootDir);
    checks.push({
        name: "Project preset config readable",
        ok: config !== null,
        detail: config ? `Detected ${config.presets.length} preset(s).` : "Project preset config is missing or unreadable.",
    });
    checks.push({
        name: "AGENTS.md integration exists",
        ok: await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, "AGENTS.md")),
        detail: "Run `shojibrain init` to create or update agent instructions.",
    });
    return {
        rootDir,
        ok: checks.every((check) => check.ok),
        checks,
    };
}
//# sourceMappingURL=doctor.js.map