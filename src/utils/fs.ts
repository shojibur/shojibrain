import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import {
  AGENTS_SECTION_END,
  AGENTS_SECTION_START,
  BRAIN_DIR,
  CACHE_DIR,
  DECISIONS_DIR,
  DEFAULT_IGNORES,
  DOC_FILES,
  FEATURES_DIR,
  MAP_DIR,
  SPECS_DIR,
  TASKS_DIR,
} from "../project/constants";
import { agentsSection } from "../templates";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeFileIfMissing(
  filePath: string,
  content: string,
): Promise<boolean> {
  if (await fileExists(filePath)) {
    return false;
  }
  await fs.writeFile(filePath, content, "utf8");
  return true;
}

export async function readTextIfExists(filePath: string): Promise<string | null> {
  if (!(await fileExists(filePath))) {
    return null;
  }
  return fs.readFile(filePath, "utf8");
}

export async function ensureBrainDirectories(rootDir: string): Promise<void> {
  for (const relativePath of [
    BRAIN_DIR,
    CACHE_DIR,
    MAP_DIR,
    FEATURES_DIR,
    SPECS_DIR,
    DECISIONS_DIR,
    TASKS_DIR,
  ]) {
    await ensureDir(path.join(rootDir, relativePath));
  }
}

export async function ensureGitignoreEntry(
  rootDir: string,
  entry: string,
): Promise<boolean> {
  const gitignorePath = path.join(rootDir, ".gitignore");
  const existing = (await readTextIfExists(gitignorePath)) ?? "";
  const lines = existing.split(/\r?\n/).filter(Boolean);
  if (lines.includes(entry)) {
    return false;
  }
  const next = existing.trimEnd().length > 0 ? `${existing.trimEnd()}\n${entry}\n` : `${entry}\n`;
  await fs.writeFile(gitignorePath, next, "utf8");
  return true;
}

export async function ensureAgentsSection(rootDir: string): Promise<"created" | "updated" | "unchanged"> {
  const agentsPath = path.join(rootDir, "AGENTS.md");
  const block = `${AGENTS_SECTION_START}\n${agentsSection}\n${AGENTS_SECTION_END}\n`;
  const current = await readTextIfExists(agentsPath);

  if (current === null) {
    await fs.writeFile(agentsPath, `# Agent Instructions\n\n${block}`, "utf8");
    return "created";
  }

  if (current.includes(AGENTS_SECTION_START) && current.includes(AGENTS_SECTION_END)) {
    const next = current.replace(
      new RegExp(`${escapeRegExp(AGENTS_SECTION_START)}[\\s\\S]*?${escapeRegExp(AGENTS_SECTION_END)}\\n?`, "m"),
      block,
    );
    if (next === current) {
      return "unchanged";
    }
    await fs.writeFile(agentsPath, next, "utf8");
    return "updated";
  }

  await fs.writeFile(agentsPath, `${current.trimEnd()}\n\n${block}`, "utf8");
  return "updated";
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findProjectRoot(startDir: string): Promise<string> {
  let current = path.resolve(startDir);
  while (true) {
    const pkg = path.join(current, "package.json");
    const git = path.join(current, ".git");
    if ((await fileExists(pkg)) || (await fileExists(git)) || (await fileExists(path.join(current, BRAIN_DIR)))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

export async function getGitignorePatterns(rootDir: string): Promise<string[]> {
  const gitignorePath = path.join(rootDir, ".gitignore");
  const content = (await readTextIfExists(gitignorePath)) ?? "";
  const patterns = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  return [...DEFAULT_IGNORES, ...patterns];
}

export async function listMarkdownFiles(rootDir: string, relativeDir: string): Promise<string[]> {
  const dir = path.join(rootDir, relativeDir);
  if (!(await fileExists(dir))) {
    return [];
  }
  return fg("**/*.md", {
    cwd: dir,
    onlyFiles: true,
    dot: false,
  }).then((files) => files.map((file) => path.posix.join(relativeDir, file)));
}

export async function readDocFiles(rootDir: string): Promise<string[]> {
  const explicitDocs = Object.values(DOC_FILES);
  const generated = [
    ...(await listMarkdownFiles(rootDir, FEATURES_DIR)),
    ...(await listMarkdownFiles(rootDir, SPECS_DIR)),
    ...(await listMarkdownFiles(rootDir, DECISIONS_DIR)),
  ];
  return [...explicitDocs, ...generated];
}
