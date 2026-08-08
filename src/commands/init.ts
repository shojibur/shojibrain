import path from "node:path";
import { DECISIONS_DIR, DOC_FILES, FEATURES_DIR, SPECS_DIR } from "../project/constants";
import {
  architectureTemplate,
  currentTemplate,
  promptTemplate,
  productTemplate,
  rulesTemplate,
} from "../templates";
import {
  ensureAgentsSection,
  ensureBrainDirectories,
  ensureGitignoreEntry,
  findProjectRoot,
  writeFileIfMissing,
} from "../utils/fs";

export async function runInit(startDir: string): Promise<{ rootDir: string; created: string[]; updated: string[] }> {
  const rootDir = await findProjectRoot(startDir);
  await ensureBrainDirectories(rootDir);

  const created: string[] = [];
  const updated: string[] = [];

  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.product), productTemplate)) created.push(DOC_FILES.product);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.architecture), architectureTemplate)) created.push(DOC_FILES.architecture);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.rules), rulesTemplate)) created.push(DOC_FILES.rules);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.current), currentTemplate)) created.push(DOC_FILES.current);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.promptTemplate), promptTemplate)) created.push(DOC_FILES.promptTemplate);
  if (await writeFileIfMissing(path.join(rootDir, FEATURES_DIR, "README.md"), "# Features\n")) created.push(path.posix.join(FEATURES_DIR, "README.md"));
  if (await writeFileIfMissing(path.join(rootDir, SPECS_DIR, "README.md"), "# Specifications\n")) created.push(path.posix.join(SPECS_DIR, "README.md"));
  if (await writeFileIfMissing(path.join(rootDir, DECISIONS_DIR, "README.md"), "# Decisions\n")) created.push(path.posix.join(DECISIONS_DIR, "README.md"));

  if (await ensureGitignoreEntry(rootDir, ".shojibrain-cache/")) updated.push(".gitignore");

  const agentsResult = await ensureAgentsSection(rootDir);
  if (agentsResult === "created") created.push("AGENTS.md");
  if (agentsResult === "updated") updated.push("AGENTS.md");

  return { rootDir, created, updated };
}
