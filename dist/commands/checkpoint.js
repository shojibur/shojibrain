"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCheckpoint = runCheckpoint;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const simple_git_1 = __importDefault(require("simple-git"));
const constants_1 = require("../project/constants");
const fs_1 = require("../utils/fs");
const MAX_COMMITS = 12;
const MAX_ITEMS = 5;
const PLACEHOLDER_PREFIXES = ["[", "- ["];
async function runCheckpoint(startDir, options = {}) {
    const rootDir = await (0, fs_1.findProjectRoot)(startDir);
    const git = (0, simple_git_1.default)(rootDir);
    const dryRun = options.dryRun ?? false;
    const currentPath = node_path_1.default.join(rootDir, constants_1.DOC_FILES.current);
    const existingCurrent = (await (0, fs_1.readTextIfExists)(currentPath)) ?? "";
    const commits = await readRecentCommits(git, options.since);
    const changedFiles = await readRecentChangedFiles(git, commits);
    const existing = parseCurrentSections(existingCurrent);
    const proposed = buildCurrentDocument(existing, commits, changedFiles);
    let written = false;
    if (!dryRun && normalize(proposed) !== normalize(existingCurrent)) {
        await promises_1.default.writeFile(currentPath, `${proposed}\n`, "utf8");
        written = true;
    }
    return {
        proposed,
        written,
        dryRun,
        commitCount: commits.length,
        fileCount: changedFiles.length,
    };
}
async function readRecentCommits(git, since) {
    const args = [
        "log",
        "--no-merges",
        `--max-count=${MAX_COMMITS}`,
        "--format=%H%x09%s%x09%ad",
        "--date=short",
    ];
    if (since) {
        args.push(`--since=${since}`);
    }
    const raw = await git.raw(args).catch(() => "");
    return raw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
        const [hash, subject, date] = line.split("\t");
        return {
            hash: (hash ?? "").slice(0, 8),
            subject: (subject ?? "").trim(),
            date: (date ?? "").trim(),
        };
    })
        .filter((entry) => entry.subject.length > 0);
}
async function readRecentChangedFiles(git, commits) {
    const files = new Set();
    for (const commit of commits) {
        const diff = await git.raw(["show", "--name-only", "--format=", commit.hash]).catch(() => "");
        for (const line of diff.split("\n")) {
            const file = line.trim();
            if (!file)
                continue;
            if (file.startsWith(".shojibrain") || file.startsWith("dist/"))
                continue;
            files.add(file);
        }
    }
    return Array.from(files).sort();
}
function buildCurrentDocument(existing, commits, changedFiles) {
    const focusedFiles = focusChangedFiles(changedFiles);
    const activeAreas = rankAreas(focusedFiles);
    const currentGoal = buildCurrentGoal(commits, activeAreas);
    const inProgress = buildInProgress(focusedFiles);
    const recentlyCompleted = commits.slice(0, MAX_ITEMS).map((commit) => `${commit.subject} (${commit.date})`);
    const next = buildNextSteps(activeAreas, focusedFiles);
    const recentDecisions = buildRecentDecisions(commits);
    const knownIssues = preserveMeaningful(existing["Known Issues"]);
    const blockers = preserveMeaningful(existing["Blockers"]);
    return [
        "# Current Project State",
        "",
        "Keep this short. It should reflect the current working reality of the project, not a historical archive.",
        "",
        "## Current Goal",
        currentGoal,
        "",
        "## Active Feature",
        activeAreas.length > 0 ? activeAreas.join(", ") : fallbackSingle(existing["Active Feature"], "[What feature or area is currently being changed?]"),
        "",
        "## In Progress",
        ...toBulletLines(inProgress, ["[Current work item]"]),
        "",
        "## Recently Completed",
        ...toBulletLines(recentlyCompleted, ["[Recently finished item]"]),
        "",
        "## Next",
        ...toBulletLines(next, ["[Likely next step]"]),
        "",
        "## Known Issues",
        ...toBulletLines(knownIssues, ["[Known issue]"]),
        "",
        "## Blockers",
        ...toBulletLines(blockers, ["[Blocking dependency or empty]"]),
        "",
        "## Recent Decisions",
        ...toBulletLines(recentDecisions, ["[Decision worth remembering during current work]"]),
    ].join("\n");
}
function buildCurrentGoal(commits, activeAreas) {
    if (activeAreas.length > 0) {
        const topArea = activeAreas[0];
        const recentIntent = commits[0]?.subject;
        return recentIntent
            ? `Advance ${topArea} work based on recent changes: ${recentIntent}.`
            : `Advance current work in ${topArea}.`;
    }
    if (commits[0]?.subject) {
        return `Continue recent development activity around: ${commits[0].subject}.`;
    }
    return "[What is the team trying to achieve right now?]";
}
function buildInProgress(changedFiles) {
    return changedFiles
        .slice(0, MAX_ITEMS)
        .map((file) => `Working in ${file}`);
}
function buildNextSteps(activeAreas, changedFiles) {
    const next = [];
    if (activeAreas.length > 0) {
        next.push(`Validate and finish changes in ${activeAreas[0]}.`);
    }
    const testFiles = changedFiles.filter((file) => /test|spec/i.test(file));
    if (testFiles.length === 0 && changedFiles.length > 0) {
        next.push("Add or update relevant tests for the changed areas.");
    }
    next.push("Run relevant checks and synchronize ShojiBrain after the next meaningful change set.");
    return next.slice(0, MAX_ITEMS);
}
function buildRecentDecisions(commits) {
    const decisionKeywords = /refactor|rename|switch|replace|migrate|introduce|adopt|standardize/i;
    const decisions = commits
        .filter((commit) => decisionKeywords.test(commit.subject))
        .map((commit) => `${commit.subject} (${commit.date})`);
    return decisions.slice(0, MAX_ITEMS);
}
function focusChangedFiles(changedFiles) {
    const filtered = changedFiles.filter((file) => {
        const lower = file.toLowerCase();
        if (lower === "readme.md" || lower === "license" || lower === ".gitignore")
            return false;
        if (/^package(-lock)?\.json$/.test(lower))
            return false;
        return true;
    });
    return filtered.length > 0 ? filtered : changedFiles;
}
function rankAreas(changedFiles) {
    const counts = new Map();
    for (const file of changedFiles) {
        const area = inferArea(file);
        counts.set(area, (counts.get(area) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([area]) => area);
}
function inferArea(file) {
    const parts = file.split("/");
    if (parts.length >= 3 && ["src", "app", "packages"].includes(parts[0] ?? "")) {
        return parts[1] ?? file;
    }
    if (parts.length >= 2) {
        return parts[0] ?? file;
    }
    return file;
}
function parseCurrentSections(content) {
    const result = {};
    let currentSection = "";
    for (const line of content.split(/\r?\n/)) {
        if (line.startsWith("## ")) {
            currentSection = line.slice(3).trim();
            result[currentSection] = [];
            continue;
        }
        if (!currentSection)
            continue;
        if (!result[currentSection]) {
            result[currentSection] = [];
        }
        const bucket = result[currentSection];
        if (bucket) {
            bucket.push(line);
        }
    }
    return result;
}
function preserveMeaningful(lines) {
    if (!lines)
        return [];
    return lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .filter((line) => !PLACEHOLDER_PREFIXES.some((prefix) => line.startsWith(prefix)));
}
function fallbackSingle(lines, fallback) {
    const meaningful = preserveMeaningful(lines);
    return meaningful[0] ?? fallback;
}
function toBulletLines(items, fallback) {
    const unique = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, MAX_ITEMS);
    if (unique.length === 0) {
        return fallback.map((item) => (item.startsWith("-") ? item : `- ${item}`));
    }
    return unique.map((item) => (item.startsWith("-") ? item : `- ${item}`));
}
function normalize(value) {
    return value.replace(/\s+/g, " ").trim();
}
//# sourceMappingURL=checkpoint.js.map