import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { DECISIONS_DIR, DOC_FILES, FEATURES_DIR, PROJECT_CONFIG_FILE, SPECS_DIR } from "../project/constants";
import {
  buildProjectConfig,
  listPresetDefinitions,
  parsePresetInputs,
  RequestedPreset,
  resolvePresetConfigEntries,
} from "../presets/index";
import { scanProject } from "../scanner/scan";
import { writeScanResult } from "../storage/io";
import { writeProjectConfig } from "../storage/project-config";
import {
  buildArchitectureTemplate,
  buildCurrentTemplate,
  buildProductTemplate,
  buildPromptTemplate,
  buildRulesTemplate,
} from "../templates";
import {
  ensureAgentsSection,
  ensureBrainDirectories,
  ensureGitignoreEntry,
  fileExists,
  findProjectRoot,
  writeFileIfMissing,
} from "../utils/fs";

export async function runInit(
  startDir: string,
  options: { presets?: string[]; interactive?: boolean; scan?: boolean } = {},
): Promise<{
  rootDir: string;
  created: string[];
  updated: string[];
  presets: string[];
  scan: null | {
    fileCount: number;
    symbolCount: number;
    dependencyCount: number;
    testCount: number;
  };
}> {
  const rootDir = await findProjectRoot(startDir);
  await ensureBrainDirectories(rootDir);
  const requestedPresets = await resolveRequestedPresets(options.presets ?? [], options.interactive ?? true);
  const presetEntries = resolvePresetConfigEntries(requestedPresets);
  const config = buildProjectConfig(presetEntries);

  const created: string[] = [];
  const updated: string[] = [];

  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.product), buildProductTemplate(presetEntries))) created.push(DOC_FILES.product);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.architecture), buildArchitectureTemplate(presetEntries))) created.push(DOC_FILES.architecture);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.rules), buildRulesTemplate(presetEntries))) created.push(DOC_FILES.rules);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.current), buildCurrentTemplate(presetEntries))) created.push(DOC_FILES.current);
  if (await writeFileIfMissing(path.join(rootDir, DOC_FILES.promptTemplate), buildPromptTemplate(presetEntries))) created.push(DOC_FILES.promptTemplate);
  if (await writeFileIfMissing(path.join(rootDir, FEATURES_DIR, "README.md"), "# Features\n")) created.push(path.posix.join(FEATURES_DIR, "README.md"));
  if (await writeFileIfMissing(path.join(rootDir, SPECS_DIR, "README.md"), "# Specifications\n")) created.push(path.posix.join(SPECS_DIR, "README.md"));
  if (await writeFileIfMissing(path.join(rootDir, DECISIONS_DIR, "README.md"), "# Decisions\n")) created.push(path.posix.join(DECISIONS_DIR, "README.md"));
  const hadConfig = await fileExists(path.join(rootDir, PROJECT_CONFIG_FILE));
  await writeProjectConfig(rootDir, config);
  if (hadConfig) {
    updated.push(PROJECT_CONFIG_FILE);
  } else {
    created.push(PROJECT_CONFIG_FILE);
  }

  if (await ensureGitignoreEntry(rootDir, ".shojibrain-cache/")) updated.push(".gitignore");

  const agentsResult = await ensureAgentsSection(rootDir);
  if (agentsResult === "created") created.push("AGENTS.md");
  if (agentsResult === "updated") updated.push("AGENTS.md");

  let scan: null | {
    fileCount: number;
    symbolCount: number;
    dependencyCount: number;
    testCount: number;
  } = null;

  if (options.scan !== false) {
    const result = await scanProject(rootDir);
    await writeScanResult(rootDir, result);
    scan = {
      fileCount: Object.keys(result.files).length,
      symbolCount: Object.keys(result.symbols).length,
      dependencyCount: Object.values(result.dependencies).reduce((count, entry) => count + entry.dependsOn.length, 0),
      testCount: Object.keys(result.tests).length,
    };
  }

  return {
    rootDir,
    created,
    updated,
    presets: presetEntries.map((preset) => `${preset.id}:${preset.scope}`),
    scan,
  };
}

async function resolveRequestedPresets(
  presetFlags: string[],
  interactive: boolean,
): Promise<RequestedPreset[]> {
  if (presetFlags.length > 0) {
    return parsePresetInputs(presetFlags);
  }

  if (!interactive || !input.isTTY || !output.isTTY) {
    return [];
  }

  const rl = readline.createInterface({ input, output });
  try {
    const presetList = listPresetDefinitions()
      .map((preset) => `- ${preset.id}: ${preset.label} (${preset.description})`)
      .join("\n");
    const answer = await rl.question(
      `Select preset(s) for this project. Use comma-separated entries like "laravel:.,react-native:mobile". Press Enter to skip.\n${presetList}\n> `,
    );
    if (!answer.trim()) {
      return [];
    }
    return parsePresetInputs([answer]);
  } finally {
    rl.close();
  }
}
