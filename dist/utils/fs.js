"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDir = ensureDir;
exports.fileExists = fileExists;
exports.writeFileIfMissing = writeFileIfMissing;
exports.readTextIfExists = readTextIfExists;
exports.ensureBrainDirectories = ensureBrainDirectories;
exports.ensureGitignoreEntry = ensureGitignoreEntry;
exports.ensureAgentsSection = ensureAgentsSection;
exports.escapeRegExp = escapeRegExp;
exports.findProjectRoot = findProjectRoot;
exports.getGitignorePatterns = getGitignorePatterns;
exports.listMarkdownFiles = listMarkdownFiles;
exports.readDocFiles = readDocFiles;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const constants_1 = require("../project/constants");
const templates_1 = require("../templates");
async function ensureDir(dirPath) {
    await promises_1.default.mkdir(dirPath, { recursive: true });
}
async function fileExists(filePath) {
    try {
        await promises_1.default.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function writeFileIfMissing(filePath, content) {
    if (await fileExists(filePath)) {
        return false;
    }
    await promises_1.default.writeFile(filePath, content, "utf8");
    return true;
}
async function readTextIfExists(filePath) {
    if (!(await fileExists(filePath))) {
        return null;
    }
    return promises_1.default.readFile(filePath, "utf8");
}
async function ensureBrainDirectories(rootDir) {
    for (const relativePath of [
        constants_1.BRAIN_DIR,
        constants_1.CACHE_DIR,
        constants_1.MAP_DIR,
        constants_1.FEATURES_DIR,
        constants_1.SPECS_DIR,
        constants_1.DECISIONS_DIR,
        constants_1.TASKS_DIR,
    ]) {
        await ensureDir(node_path_1.default.join(rootDir, relativePath));
    }
}
async function ensureGitignoreEntry(rootDir, entry) {
    const gitignorePath = node_path_1.default.join(rootDir, ".gitignore");
    const existing = (await readTextIfExists(gitignorePath)) ?? "";
    const lines = existing.split(/\r?\n/).filter(Boolean);
    if (lines.includes(entry)) {
        return false;
    }
    const next = existing.trimEnd().length > 0 ? `${existing.trimEnd()}\n${entry}\n` : `${entry}\n`;
    await promises_1.default.writeFile(gitignorePath, next, "utf8");
    return true;
}
async function ensureAgentsSection(rootDir) {
    const agentsPath = node_path_1.default.join(rootDir, "AGENTS.md");
    const block = `${constants_1.AGENTS_SECTION_START}\n${templates_1.agentsSection}\n${constants_1.AGENTS_SECTION_END}\n`;
    const current = await readTextIfExists(agentsPath);
    if (current === null) {
        await promises_1.default.writeFile(agentsPath, `# Agent Instructions\n\n${block}`, "utf8");
        return "created";
    }
    if (current.includes(constants_1.AGENTS_SECTION_START) && current.includes(constants_1.AGENTS_SECTION_END)) {
        const next = current.replace(new RegExp(`${escapeRegExp(constants_1.AGENTS_SECTION_START)}[\\s\\S]*?${escapeRegExp(constants_1.AGENTS_SECTION_END)}\\n?`, "m"), block);
        if (next === current) {
            return "unchanged";
        }
        await promises_1.default.writeFile(agentsPath, next, "utf8");
        return "updated";
    }
    await promises_1.default.writeFile(agentsPath, `${current.trimEnd()}\n\n${block}`, "utf8");
    return "updated";
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function findProjectRoot(startDir) {
    let current = node_path_1.default.resolve(startDir);
    while (true) {
        const pkg = node_path_1.default.join(current, "package.json");
        const git = node_path_1.default.join(current, ".git");
        if ((await fileExists(pkg)) || (await fileExists(git)) || (await fileExists(node_path_1.default.join(current, constants_1.BRAIN_DIR)))) {
            return current;
        }
        const parent = node_path_1.default.dirname(current);
        if (parent === current) {
            return node_path_1.default.resolve(startDir);
        }
        current = parent;
    }
}
async function getGitignorePatterns(rootDir) {
    const gitignorePath = node_path_1.default.join(rootDir, ".gitignore");
    const content = (await readTextIfExists(gitignorePath)) ?? "";
    const patterns = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));
    return [...constants_1.DEFAULT_IGNORES, ...patterns];
}
async function listMarkdownFiles(rootDir, relativeDir) {
    const dir = node_path_1.default.join(rootDir, relativeDir);
    if (!(await fileExists(dir))) {
        return [];
    }
    return (0, fast_glob_1.default)("**/*.md", {
        cwd: dir,
        onlyFiles: true,
        dot: false,
    }).then((files) => files.map((file) => node_path_1.default.posix.join(relativeDir, file)));
}
async function readDocFiles(rootDir) {
    const explicitDocs = Object.values(constants_1.DOC_FILES);
    const generated = [
        ...(await listMarkdownFiles(rootDir, constants_1.FEATURES_DIR)),
        ...(await listMarkdownFiles(rootDir, constants_1.SPECS_DIR)),
        ...(await listMarkdownFiles(rootDir, constants_1.DECISIONS_DIR)),
    ];
    return [...explicitDocs, ...generated];
}
//# sourceMappingURL=fs.js.map