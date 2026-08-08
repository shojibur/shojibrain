#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const context_1 = require("./commands/context");
const doctor_1 = require("./commands/doctor");
const init_1 = require("./commands/init");
const scan_1 = require("./commands/scan");
const status_1 = require("./commands/status");
const sync_1 = require("./commands/sync");
const constants_1 = require("./project/constants");
const program = new commander_1.Command();
program.name("shojibrain").description(`${constants_1.TOOL_NAME} local-first project intelligence`).version("0.1.0");
program
    .command("init")
    .description("Initialize ShojiBrain in the current project")
    .action(async () => {
    const result = await (0, init_1.runInit)(process.cwd());
    printLines([
        `${constants_1.TOOL_NAME} Init`,
        "",
        `Project root: ${result.rootDir}`,
        result.created.length ? `Created: ${result.created.join(", ")}` : "Created: none",
        result.updated.length ? `Updated: ${result.updated.join(", ")}` : "Updated: none",
    ]);
});
program
    .command("scan")
    .description("Scan the repository and build project intelligence maps")
    .action(async () => {
    const result = await (0, scan_1.runScan)(process.cwd());
    printLines([
        `${constants_1.TOOL_NAME} Scan`,
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
    const result = await (0, sync_1.runSync)(process.cwd());
    printLines([
        `${constants_1.TOOL_NAME} Sync`,
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
    .action(async (options) => {
    const result = await (0, status_1.runStatus)(process.cwd());
    if (options.json) {
        printJson(result);
        return;
    }
    printLines([
        constants_1.TOOL_NAME,
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
        `Working tree: ${result.changedFiles.length} relevant changed files`,
    ]);
});
program
    .command("doctor")
    .description("Validate ShojiBrain configuration and map health")
    .action(async () => {
    const result = await (0, doctor_1.runDoctor)(process.cwd());
    printLines([
        `${constants_1.TOOL_NAME} Doctor`,
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
    .action(async (request, options) => {
    const result = await (0, context_1.runContext)(process.cwd(), request);
    if (options.json) {
        printJson(result.result);
        return;
    }
    printLines([result.text]);
});
program.parseAsync(process.argv).catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`${constants_1.TOOL_NAME} error: ${message}`);
    process.exit(1);
});
function printJson(value) {
    console.log(JSON.stringify(value, null, 2));
}
function printLines(lines) {
    console.log(lines.join("\n"));
}
//# sourceMappingURL=index.js.map