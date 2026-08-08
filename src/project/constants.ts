import path from "node:path";

export const TOOL_NAME = "ShojiBrain";
export const MAP_SCHEMA_VERSION = 1;
export const BRAIN_DIR = ".shojibrain";
export const CACHE_DIR = ".shojibrain-cache";
export const MAP_DIR = path.posix.join(BRAIN_DIR, "map");
export const FEATURES_DIR = path.posix.join(BRAIN_DIR, "features");
export const SPECS_DIR = path.posix.join(BRAIN_DIR, "specs");
export const DECISIONS_DIR = path.posix.join(BRAIN_DIR, "decisions");
export const TASKS_DIR = path.posix.join(BRAIN_DIR, "tasks");
export const PROJECT_CONFIG_FILE = path.posix.join(BRAIN_DIR, "project.config.json");
export const DOC_FILES = {
  product: path.posix.join(BRAIN_DIR, "PRODUCT.md"),
  architecture: path.posix.join(BRAIN_DIR, "ARCHITECTURE.md"),
  rules: path.posix.join(BRAIN_DIR, "RULES.md"),
  current: path.posix.join(BRAIN_DIR, "CURRENT.md"),
  promptTemplate: path.posix.join(BRAIN_DIR, "PROMPT_TEMPLATE.md"),
} as const;

export const MAP_FILES = {
  project: path.posix.join(MAP_DIR, "project.json"),
  files: path.posix.join(MAP_DIR, "files.json"),
  modules: path.posix.join(MAP_DIR, "modules.json"),
  symbols: path.posix.join(MAP_DIR, "symbols.json"),
  dependencies: path.posix.join(MAP_DIR, "dependencies.json"),
  tests: path.posix.join(MAP_DIR, "tests.json"),
} as const;

export const AGENTS_SECTION_START = "<!-- SHojibrain:START -->";
export const AGENTS_SECTION_END = "<!-- SHojibrain:END -->";

export const DEFAULT_IGNORES = [
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

export const SUPPORTED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
]);

export const TEST_FILE_PATTERN =
  "**/*.{test,spec}.{ts,tsx,js,jsx,mts,cts,mjs,cjs}";

export const SOURCE_FILE_PATTERN =
  "**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}";
