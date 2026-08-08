"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelevantChangedFiles = getRelevantChangedFiles;
const node_path_1 = __importDefault(require("node:path"));
const simple_git_1 = __importDefault(require("simple-git"));
async function getRelevantChangedFiles(rootDir) {
    const git = (0, simple_git_1.default)(rootDir);
    try {
        const status = await git.status();
        const changed = [
            ...status.modified,
            ...status.created,
            ...status.not_added,
            ...status.renamed.map((entry) => entry.to),
            ...status.staged,
        ];
        return Array.from(new Set(changed))
            .filter((file) => matchesSourcePattern(file))
            .map((file) => file.split(node_path_1.default.sep).join(node_path_1.default.posix.sep))
            .sort();
    }
    catch {
        return [];
    }
}
function matchesSourcePattern(file) {
    return /\.(tsx?|jsx?|mts|cts|mjs|cjs|py|php|rb|go)$/i.test(file);
}
//# sourceMappingURL=status.js.map