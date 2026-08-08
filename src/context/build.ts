import fs from "node:fs/promises";
import path from "node:path";
import { ContextResult, DocMatch, ScanResult } from "../types";
import { DOC_FILES } from "../project/constants";
import { readDocFiles } from "../utils/fs";

export async function buildContext(
  rootDir: string,
  scan: ScanResult,
  request: string,
): Promise<ContextResult> {
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

async function rankDocs(rootDir: string, terms: string[]): Promise<DocMatch[]> {
  const docPaths = await readDocFiles(rootDir);
  const matches: DocMatch[] = [];
  for (const relativePath of docPaths) {
    try {
      const content = await fs.readFile(path.join(rootDir, relativePath), "utf8");
      const sections = splitMarkdownSections(content);
      for (const section of sections) {
        const score = scoreText(section.heading, terms) * 4 + scoreText(section.body, terms) * 1.5;
        if (score <= 0) continue;
        matches.push({
          path: relativePath,
          title: section.heading,
          excerpt: summarize(section.body),
          score,
        });
      }
    } catch {
      continue;
    }
  }
  return matches.sort((a, b) => b.score - a.score).slice(0, 8);
}

function rankFiles(scan: ScanResult, terms: string[]) {
  const testTerms = new Set(["test", "spec", "mock"]);
  const requestMentionsTests = terms.some((t) => testTerms.has(t));

  return Object.entries(scan.files)
    .map(([file, entry]) => {
      const reasons: string[] = [];

      // path score — each segment tokenised separately so nested paths score better
      const pathScore = scoreText(file, terms) * 3;
      if (pathScore > 0) reasons.push("filename match");

      // exports: each exported name tokenised through camelCase splitter
      const exportScore = entry.exports.reduce((sum, name) => sum + scoreText(name, terms) * 5, 0);
      if (exportScore > 0) reasons.push("export match");

      // module name
      const moduleScore = scoreText(entry.module ?? "", terms) * 4;
      if (moduleScore > 0) reasons.push("module match");

      // dependency centrality: files imported by many others are more likely core
      const usedBy = scan.dependencies[file]?.usedBy.length ?? 0;
      const centralityBoost = Math.log(1 + usedBy) * 0.5;

      // related-test linkage
      let testBoost = 0;
      if (scan.tests[file]?.length) {
        testBoost = 1;
        reasons.push("has related tests");
      }

      // de-prioritise test files unless query is about tests
      const testPenalty = entry.isTest && !requestMentionsTests ? 0.4 : 1;

      const score = (pathScore + exportScore + moduleScore + centralityBoost + testBoost) * testPenalty;
      return { path: file, score, reasons };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function rankSymbols(scan: ScanResult, terms: string[]) {
  return Object.entries(scan.symbols)
    .map(([name, entry]) => {
      const nameScore = scoreText(name, terms) * 5;
      const fileScore = scoreText(entry.file, terms) * 1.5;
      const exportBoost = entry.exported ? 1.5 : 1;
      // class/function/interface are higher signal than const/method
      const typeBoost = ["class", "function", "interface"].includes(entry.type) ? 1.3 : 1;
      const score = (nameScore + fileScore) * exportBoost * typeBoost;
      return { name, entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function rankModules(scan: ScanResult, terms: string[]) {
  return Object.entries(scan.modules)
    .map(([name, entry]) => ({
      name,
      entry,
      score: scoreText(name, terms) * 5 + entry.files.length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
}

function rankTests(scan: ScanResult, terms: string[], rankedFiles: string[]) {
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

async function readCurrentStateExcerpt(rootDir: string, terms: string[]): Promise<string | null> {
  try {
    const content = await fs.readFile(path.join(rootDir, DOC_FILES.current), "utf8");
    const sections = splitMarkdownSections(content);
    const best = sections
      .map((section) => ({ section, score: scoreText(section.heading, terms) * 2 + scoreText(section.body, terms) }))
      .sort((a, b) => b.score - a.score)[0];
    return best ? `## ${best.section.heading}\n${summarize(best.section.body)}` : summarize(content);
  } catch {
    return null;
  }
}

function splitMarkdownSections(content: string): Array<{ heading: string; body: string }> {
  const lines = content.split(/\r?\n/);
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = "Overview";
  let body: string[] = [];
  for (const line of lines) {
    if (line.startsWith("#")) {
      sections.push({ heading, body: body.join("\n").trim() });
      heading = line.replace(/^#+\s*/, "").trim() || "Untitled";
      body = [];
    } else {
      body.push(line);
    }
  }
  sections.push({ heading, body: body.join("\n").trim() });
  return sections.filter((section) => section.body.length > 0 || section.heading !== "Overview");
}

function summarize(content: string): string {
  return content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function scoreText(text: string, terms: string[]): number {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);
  const tf = (term: string) => (freq.get(term) ?? 0) / Math.max(tokens.length, 1);
  return terms.reduce((score, term) => {
    const termTf = tf(term);
    if (termTf === 0) return score;
    // IDF-like boost: reward rare terms more than single-letter noise
    const idfBoost = Math.log(1 + 1 / (termTf + 0.01));
    return score + termTf * idfBoost;
  }, 0);
}

function tokenize(value: string): string[] {
  // split on non-alphanumeric AND on camelCase / PascalCase boundaries
  const parts = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/);
  return Array.from(new Set(parts.filter((p) => p.length >= 2)));
}

export function formatContext(result: ContextResult): string {
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
