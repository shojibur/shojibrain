"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_FILE_PATTERN = exports.TEST_FILE_PATTERN = exports.SUPPORTED_EXTENSIONS = exports.DEFAULT_IGNORES = exports.AGENTS_SECTION_END = exports.AGENTS_SECTION_START = exports.MAP_FILES = exports.DOC_FILES = exports.TASKS_DIR = exports.DECISIONS_DIR = exports.SPECS_DIR = exports.FEATURES_DIR = exports.MAP_DIR = exports.CACHE_DIR = exports.BRAIN_DIR = exports.MAP_SCHEMA_VERSION = exports.TOOL_NAME = void 0;
const node_path_1 = __importDefault(require("node:path"));
exports.TOOL_NAME = "ShojiBrain";
exports.MAP_SCHEMA_VERSION = 1;
exports.BRAIN_DIR = ".shojibrain";
exports.CACHE_DIR = ".shojibrain-cache";
exports.MAP_DIR = node_path_1.default.posix.join(exports.BRAIN_DIR, "map");
exports.FEATURES_DIR = node_path_1.default.posix.join(exports.BRAIN_DIR, "features");
exports.SPECS_DIR = node_path_1.default.posix.join(exports.BRAIN_DIR, "specs");
exports.DECISIONS_DIR = node_path_1.default.posix.join(exports.BRAIN_DIR, "decisions");
exports.TASKS_DIR = node_path_1.default.posix.join(exports.BRAIN_DIR, "tasks");
exports.DOC_FILES = {
    product: node_path_1.default.posix.join(exports.BRAIN_DIR, "PRODUCT.md"),
    architecture: node_path_1.default.posix.join(exports.BRAIN_DIR, "ARCHITECTURE.md"),
    rules: node_path_1.default.posix.join(exports.BRAIN_DIR, "RULES.md"),
    current: node_path_1.default.posix.join(exports.BRAIN_DIR, "CURRENT.md"),
};
exports.MAP_FILES = {
    project: node_path_1.default.posix.join(exports.MAP_DIR, "project.json"),
    files: node_path_1.default.posix.join(exports.MAP_DIR, "files.json"),
    modules: node_path_1.default.posix.join(exports.MAP_DIR, "modules.json"),
    symbols: node_path_1.default.posix.join(exports.MAP_DIR, "symbols.json"),
    dependencies: node_path_1.default.posix.join(exports.MAP_DIR, "dependencies.json"),
    tests: node_path_1.default.posix.join(exports.MAP_DIR, "tests.json"),
};
exports.AGENTS_SECTION_START = "<!-- SHojibrain:START -->";
exports.AGENTS_SECTION_END = "<!-- SHojibrain:END -->";
exports.DEFAULT_IGNORES = [
    "**/node_modules/**",
    "**/vendor/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/.git/**",
    "**/.next/**",
    "**/.turbo/**",
    "**/.cache/**",
    "**/.shojibrain-cache/**",
    "**/bin/**",
    "**/obj/**",
];
exports.SUPPORTED_EXTENSIONS = new Set([
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mts",
    ".cts",
    ".mjs",
    ".cjs",
]);
exports.TEST_FILE_PATTERN = "**/*.{test,spec}.{ts,tsx,js,jsx,mts,cts,mjs,cjs}";
exports.SOURCE_FILE_PATTERN = "**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}";
//# sourceMappingURL=constants.js.map