"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInit = runInit;
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../project/constants");
const templates_1 = require("../templates");
const fs_1 = require("../utils/fs");
async function runInit(startDir) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    await (0, fs_1.ensureBrainDirectories)(rootDir);
    const created = [];
    const updated = [];
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.product), templates_1.productTemplate))
        created.push(constants_1.DOC_FILES.product);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.architecture), templates_1.architectureTemplate))
        created.push(constants_1.DOC_FILES.architecture);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.rules), templates_1.rulesTemplate))
        created.push(constants_1.DOC_FILES.rules);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.current), templates_1.currentTemplate))
        created.push(constants_1.DOC_FILES.current);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.FEATURES_DIR, "README.md"), "# Features\n"))
        created.push(node_path_1.default.posix.join(constants_1.FEATURES_DIR, "README.md"));
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.SPECS_DIR, "README.md"), "# Specifications\n"))
        created.push(node_path_1.default.posix.join(constants_1.SPECS_DIR, "README.md"));
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DECISIONS_DIR, "README.md"), "# Decisions\n"))
        created.push(node_path_1.default.posix.join(constants_1.DECISIONS_DIR, "README.md"));
    if (await (0, fs_1.ensureGitignoreEntry)(rootDir, ".shojibrain-cache/"))
        updated.push(".gitignore");
    const agentsResult = await (0, fs_1.ensureAgentsSection)(rootDir);
    if (agentsResult === "created")
        created.push("AGENTS.md");
    if (agentsResult === "updated")
        updated.push("AGENTS.md");
    return { rootDir, created, updated };
}
//# sourceMappingURL=init.js.map