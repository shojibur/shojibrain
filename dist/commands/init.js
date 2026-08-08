"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInit = runInit;
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = __importDefault(require("node:readline/promises"));
const node_process_1 = require("node:process");
const constants_1 = require("../project/constants");
const index_1 = require("../presets/index");
const scan_1 = require("../scanner/scan");
const io_1 = require("../storage/io");
const project_config_1 = require("../storage/project-config");
const templates_1 = require("../templates");
const fs_1 = require("../utils/fs");
async function runInit(startDir, options = {}) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    await (0, fs_1.ensureBrainDirectories)(rootDir);
    const requestedPresets = await resolveRequestedPresets(options.presets ?? [], options.interactive ?? true);
    const presetEntries = (0, index_1.resolvePresetConfigEntries)(requestedPresets);
    const config = (0, index_1.buildProjectConfig)(presetEntries);
    const created = [];
    const updated = [];
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.product), (0, templates_1.buildProductTemplate)(presetEntries)))
        created.push(constants_1.DOC_FILES.product);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.architecture), (0, templates_1.buildArchitectureTemplate)(presetEntries)))
        created.push(constants_1.DOC_FILES.architecture);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.rules), (0, templates_1.buildRulesTemplate)(presetEntries)))
        created.push(constants_1.DOC_FILES.rules);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.current), (0, templates_1.buildCurrentTemplate)(presetEntries)))
        created.push(constants_1.DOC_FILES.current);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DOC_FILES.promptTemplate), (0, templates_1.buildPromptTemplate)(presetEntries)))
        created.push(constants_1.DOC_FILES.promptTemplate);
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.FEATURES_DIR, "README.md"), "# Features\n"))
        created.push(node_path_1.default.posix.join(constants_1.FEATURES_DIR, "README.md"));
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.SPECS_DIR, "README.md"), "# Specifications\n"))
        created.push(node_path_1.default.posix.join(constants_1.SPECS_DIR, "README.md"));
    if (await (0, fs_1.writeFileIfMissing)(node_path_1.default.join(rootDir, constants_1.DECISIONS_DIR, "README.md"), "# Decisions\n"))
        created.push(node_path_1.default.posix.join(constants_1.DECISIONS_DIR, "README.md"));
    const hadConfig = await (0, fs_1.fileExists)(node_path_1.default.join(rootDir, constants_1.PROJECT_CONFIG_FILE));
    await (0, project_config_1.writeProjectConfig)(rootDir, config);
    if (hadConfig) {
        updated.push(constants_1.PROJECT_CONFIG_FILE);
    }
    else {
        created.push(constants_1.PROJECT_CONFIG_FILE);
    }
    if (await (0, fs_1.ensureGitignoreEntry)(rootDir, ".shojibrain-cache/"))
        updated.push(".gitignore");
    const agentsResult = await (0, fs_1.ensureAgentsSection)(rootDir);
    if (agentsResult === "created")
        created.push("AGENTS.md");
    if (agentsResult === "updated")
        updated.push("AGENTS.md");
    let scan = null;
    if (options.scan !== false) {
        const result = await (0, scan_1.scanProject)(rootDir);
        await (0, io_1.writeScanResult)(rootDir, result);
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
async function resolveRequestedPresets(presetFlags, interactive) {
    if (presetFlags.length > 0) {
        return (0, index_1.parsePresetInputs)(presetFlags);
    }
    if (!interactive || !node_process_1.stdin.isTTY || !node_process_1.stdout.isTTY) {
        return [];
    }
    const rl = promises_1.default.createInterface({ input: node_process_1.stdin, output: node_process_1.stdout });
    try {
        const presetList = (0, index_1.listPresetDefinitions)()
            .map((preset) => `- ${preset.id}: ${preset.label} (${preset.description})`)
            .join("\n");
        const answer = await rl.question(`Select preset(s) for this project. Use comma-separated entries like "laravel:.,react-native:mobile". Press Enter to skip.\n${presetList}\n> `);
        if (!answer.trim()) {
            return [];
        }
        return (0, index_1.parsePresetInputs)([answer]);
    }
    finally {
        rl.close();
    }
}
//# sourceMappingURL=init.js.map