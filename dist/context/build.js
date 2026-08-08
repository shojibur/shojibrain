"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContext = buildContext;
exports.formatContext = formatContext;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const constants_1 = require("../project/constants");
const fs_1 = require("../utils/fs");
async function buildContext(rootDir, scan, request) {
    const terms = tokenize(request);
    const docs = await rankDocs(rootDir, terms);
    const files = rankFiles(scan, terms).slice(0, 8);
    const symbols = rankSymbols(scan, terms).slice(0, 8);
    const modules = rankModules(scan, terms).slice(0, 6);
    const tests = rankTests(scan, terms, files.map((file) => file.path)).slice(0, 6);
    const currentState = await readCurrentStateExcerpt(rootDir, terms);
    return {
        request,
        docs,
        files,
        symbols,
        modules,
        tests,
        currentState,
    };
}
async function rankDocs(rootDir, terms) {
    const docPaths = await (0, fs_1.readDocFiles)(rootDir);
    const matches = [];
    for (const relativePath of docPaths) {
        try {
            const content = await promises_1.default.readFile(node_path_1.default.join(rootDir, relativePath), "utf8");
            const sections = splitMarkdownSections(content);
            for (const section of sections) {
                const score = scoreText(section.heading, terms) * 3 + scoreText(section.body, terms);
                if (score <= 0)
                    continue;
                matches.push({
                    path: relativePath,
                    title: section.heading,
                    excerpt: summarize(section.body),
                    score,
                });
            }
        }
        catch {
            continue;
        }
    }
    return matches.sort((a, b) => b.score - a.score).slice(0, 8);
}
function rankFiles(scan, terms) {
    return Object.entries(scan.files)
        .map(([file, entry]) => {
        let score = scoreText(file, terms) * 3;
        const reasons = [];
        if (score > 0)
            reasons.push("filename match");
        score += scoreText(entry.exports.join(" "), terms) * 4;
        if (scoreText(entry.exports.join(" "), terms) > 0)
            reasons.push("export match");
        score += scoreText(entry.module ?? "", terms) * 5;
        if ((entry.module && scoreText(entry.module, terms) > 0))
            reasons.push("module match");
        if (scan.tests[file]?.length) {
            score += 1;
            reasons.push("has related tests");
        }
        return { path: file, score, reasons };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}
function rankSymbols(scan, terms) {
    return Object.entries(scan.symbols)
        .map(([name, entry]) => ({
        name,
        entry,
        score: scoreText(name, terms) * 4 + scoreText(entry.file, terms),
    }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}
function rankModules(scan, terms) {
    return Object.entries(scan.modules)
        .map(([name, entry]) => ({
        name,
        entry,
        score: scoreText(name, terms) * 5 + entry.files.length,
    }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}
function rankTests(scan, terms, rankedFiles) {
    const linked = new Set(rankedFiles);
    return Object.entries(scan.tests)
        .map(([source, tests]) => ({
        source,
        tests,
        score: (linked.has(source) ? 10 : 0) + scoreText(source, terms),
    }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}
async function readCurrentStateExcerpt(rootDir, terms) {
    try {
        const content = await promises_1.default.readFile(node_path_1.default.join(rootDir, constants_1.DOC_FILES.current), "utf8");
        const sections = splitMarkdownSections(content);
        const best = sections
            .map((section) => ({ section, score: scoreText(section.heading, terms) * 2 + scoreText(section.body, terms) }))
            .sort((a, b) => b.score - a.score)[0];
        return best ? `## ${best.section.heading}\n${summarize(best.section.body)}` : summarize(content);
    }
    catch {
        return null;
    }
}
function splitMarkdownSections(content) {
    const lines = content.split(/\r?\n/);
    const sections = [];
    let heading = "Overview";
    let body = [];
    for (const line of lines) {
        if (line.startsWith("#")) {
            sections.push({ heading, body: body.join("\n").trim() });
            heading = line.replace(/^#+\s*/, "").trim() || "Untitled";
            body = [];
        }
        else {
            body.push(line);
        }
    }
    sections.push({ heading, body: body.join("\n").trim() });
    return sections.filter((section) => section.body.length > 0 || section.heading !== "Overview");
}
function summarize(content) {
    return content
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 280);
}
function scoreText(text, terms) {
    const normalized = text.toLowerCase();
    return terms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0);
}
function tokenize(value) {
    return Array.from(new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length >= 2)));
}
function formatContext(result) {
    const lines = [
        "SHOJIBRAIN CONTEXT",
        "==================",
        "",
        "REQUEST",
        result.request,
        "",
    ];
    if (result.docs.length > 0) {
        lines.push("DOCUMENTATION");
        for (const doc of result.docs) {
            lines.push(`- ${doc.path} :: ${doc.title}`);
            lines.push(`  ${doc.excerpt}`);
        }
        lines.push("");
    }
    if (result.modules.length > 0) {
        lines.push("RELEVANT MODULES");
        for (const module of result.modules) {
            lines.push(`- ${module.name} (${module.entry.confidence})`);
        }
        lines.push("");
    }
    if (result.files.length > 0) {
        lines.push("RELEVANT FILES");
        for (const file of result.files) {
            lines.push(`- ${file.path} [${file.reasons.join(", ")}]`);
        }
        lines.push("");
    }
    if (result.symbols.length > 0) {
        lines.push("RELEVANT SYMBOLS");
        for (const symbol of result.symbols) {
            lines.push(`- ${symbol.name} (${symbol.entry.type}) in ${symbol.entry.file}`);
        }
        lines.push("");
    }
    if (result.tests.length > 0) {
        lines.push("RELATED TESTS");
        for (const entry of result.tests) {
            lines.push(`- ${entry.source}: ${entry.tests.join(", ")}`);
        }
        lines.push("");
    }
    if (result.currentState) {
        lines.push("CURRENT STATE");
        lines.push(result.currentState);
        lines.push("");
    }
    return lines.join("\n").trimEnd();
}
//# sourceMappingURL=build.js.map