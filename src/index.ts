#!/usr/bin/env node
import { Command } from "commander";
import { runContext } from "./commands/context";
import { runDoctor } from "./commands/doctor";
import { runInit } from "./commands/init";
import { runScan } from "./commands/scan";
import { runStatus } from "./commands/status";
import { runSync } from "./commands/sync";
import { listPresetDefinitions } from "./presets/index";
import { TOOL_NAME } from "./project/constants";

const program = new Command();

program.name("shojibrain").description(`${TOOL_NAME} local-first project intelligence`).version("0.1.0");

program
  .command("init")
  .description("Initialize ShojiBrain in the current project")
  .option("-p, --preset <preset>", "Project preset in the form id or id:scope. Repeat for mixed-stack repos.", collectOption, [])
  .option("--list-presets", "List available project presets")
  .option("--no-interactive", "Skip the preset prompt when no preset is provided")
  .action(async (options: { preset?: string[]; listPresets?: boolean; interactive?: boolean }) => {
    if (options.listPresets) {
      printLines([
        "Available presets",
        "",
        ...listPresetDefinitions().map((preset: { id: string; label: string; description: string }) => `- ${preset.id}: ${preset.label} :: ${preset.description}`),
      ]);
      return;
    }

    const initOptions = {
      presets: options.preset ?? [],
      ...(options.interactive === undefined ? {} : { interactive: options.interactive }),
    };
    const result = await runInit(process.cwd(), initOptions);
    printLines([
      `${TOOL_NAME} Init`,
      "",
      `Project root: ${result.rootDir}`,
      `Presets: ${result.presets.length > 0 ? result.presets.join(", ") : "none"}`,
      result.created.length ? `Created: ${result.created.join(", ")}` : "Created: none",
      result.updated.length ? `Updated: ${result.updated.join(", ")}` : "Updated: none",
    ]);
  });

program
  .command("scan")
  .description("Scan the repository and build project intelligence maps")
  .action(async () => {
    const result = await runScan(process.cwd());
    printLines([
      `${TOOL_NAME} Scan`,
      "",
      `Project: ${result.project.name}`,
      `Files indexed: ${result.fileCount}`,
      `Symbols indexed: ${result.symbolCount}`,
      `Dependency relationships: ${result.dependencyCount}`,
      `Tests mapped: ${result.testCount}`,
    ]);
  });

program
  .command("sync")
  .description("Synchronize ShojiBrain after code changes")
  .action(async () => {
    const result = await runSync(process.cwd());
    printLines([
      `${TOOL_NAME} Sync`,
      "",
      `${result.changedFiles.length} relevant files changed.`,
      "",
      "Updated:",
      ...result.updated.map((item) => `- ${item}`),
      "",
      "Brain synchronized.",
    ]);
  });

program
  .command("status")
  .description("Show ShojiBrain project health and index status")
  .option("--json", "Output JSON")
  .action(async (options: { json?: boolean }) => {
    const result = await runStatus(process.cwd());
    if (options.json) {
      printJson(result);
      return;
    }
    printLines([
      TOOL_NAME,
      "",
      `Project: ${result.project?.name ?? "(not scanned)"}`,
      `Language: ${result.project?.languages.join(", ") || "(unknown)"}`,
      `Framework: ${result.project?.frameworks.join(", ") || "(none detected)"}`,
      "",
      "Brain:",
      `- Initialized: ${result.initialized ? "yes" : "no"}`,
      `- Last scan: ${result.project?.generatedAt ?? "(not available)"}`,
      `- Files indexed: ${result.counts?.files ?? 0}`,
      `- Symbols indexed: ${result.counts?.symbols ?? 0}`,
      `- Dependency relationships: ${result.counts?.dependencies ?? 0}`,
      `- Tests mapped: ${result.counts?.tests ?? 0}`,
      "",
      "Documentation:",
      ...Object.entries(result.docs).map(([name, ok]) => `- ${name}: ${ok ? "present" : "missing"}`),
      "",
      `Presets: ${result.presets.length > 0 ? result.presets.map((preset) => `${preset.id}:${preset.scope}`).join(", ") : "(none configured)"}`,
      "",
      `Working tree: ${result.changedFiles.length} relevant changed files`,
    ]);
  });

program
  .command("doctor")
  .description("Validate ShojiBrain configuration and map health")
  .action(async () => {
    const result = await runDoctor(process.cwd());
    printLines([
      `${TOOL_NAME} Doctor`,
      "",
      ...result.checks.map((check) => `${check.ok ? "OK" : "FAIL"} ${check.name}: ${check.detail}`),
      "",
      result.ok ? "ShojiBrain is healthy." : "ShojiBrain needs attention.",
    ]);
    process.exitCode = result.ok ? 0 : 1;
  });

program
  .command("context")
  .description("Return ranked project context for a development request")
  .argument("<request>", "Task or change request")
  .option("--json", "Output JSON")
  .action(async (request: string, options: { json?: boolean }) => {
    const result = await runContext(process.cwd(), request);
    if (options.json) {
      printJson(result.result);
      return;
    }
    printLines([result.text]);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`${TOOL_NAME} error: ${message}`);
  process.exit(1);
});

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printLines(lines: string[]): void {
  console.log(lines.join("\n"));
}

function collectOption(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}
