import fs from "node:fs/promises";
import path from "node:path";
import { SymbolEntry } from "../types";

export interface LangAnalysis {
  imports: string[];
  exports: string[];
  symbols: Record<string, SymbolEntry>;
  language: string;
  isTest: boolean;
}

export function supportsLang(ext: string): boolean {
  return LANG_EXTENSIONS.has(ext.toLowerCase());
}

export function isTestFileLang(relativeFile: string): boolean {
  return /(_test|\.test|_spec|\.spec|test|spec)\.(py|php|rb|go)$/i.test(relativeFile) ||
    /(^|\/)(__tests__|tests?|spec|specs)(\/|$)/i.test(relativeFile);
}

export async function analyzeNonJsFile(
  relativeFile: string,
  rootDir: string,
): Promise<LangAnalysis> {
  const ext = path.extname(relativeFile).toLowerCase();
  const absolutePath = path.join(rootDir, relativeFile);
  const content = await fs.readFile(absolutePath, "utf8");

  switch (ext) {
    case ".py": return analyzePython(relativeFile, content);
    case ".php": return analyzePhp(relativeFile, content);
    case ".rb": return analyzeRuby(relativeFile, content);
    case ".go": return analyzeGo(relativeFile, content);
    default: return emptyAnalysis(relativeFile, ext);
  }
}

// ── Python ──────────────────────────────────────────────────────────────────

function analyzePython(relativeFile: string, content: string): LangAnalysis {
  const imports: string[] = [];
  const exports: string[] = [];
  const symbols: Record<string, SymbolEntry> = {};

  // import statements
  for (const m of content.matchAll(/^import\s+([\w.]+)/gm)) {
    if (m[1]) imports.push(m[1]);
  }
  for (const m of content.matchAll(/^from\s+([\w.]+)\s+import/gm)) {
    if (m[1]) imports.push(m[1]);
  }

  // class definitions
  for (const m of content.matchAll(/^class\s+([A-Za-z_]\w*)/gm)) {
    const name = m[1];
    if (!name) continue;
    symbols[name] = { type: "class", file: toPosix(relativeFile), exported: !name.startsWith("_") };
    if (!name.startsWith("_")) exports.push(name);
  }

  // top-level functions
  for (const m of content.matchAll(/^def\s+([A-Za-z_]\w*)/gm)) {
    const name = m[1];
    if (!name) continue;
    symbols[name] = { type: "function", file: toPosix(relativeFile), exported: !name.startsWith("_") };
    if (!name.startsWith("_")) exports.push(name);
  }

  // __all__ overrides the export list
  const allMatch = content.match(/__all__\s*=\s*\[([^\]]+)\]/);
  if (allMatch?.[1]) {
    const names = Array.from(allMatch[1].matchAll(/["']([A-Za-z_]\w*)["']/g)).map((m) => m[1]).filter((n): n is string => Boolean(n));
    exports.length = 0;
    exports.push(...names);
  }

  return {
    imports: unique(imports),
    exports: unique(exports),
    symbols,
    language: "python",
    isTest: isTestFileLang(relativeFile),
  };
}

// ── PHP ─────────────────────────────────────────────────────────────────────

function analyzePhp(relativeFile: string, content: string): LangAnalysis {
  const imports: string[] = [];
  const exports: string[] = [];
  const symbols: Record<string, SymbolEntry> = {};

  // use statements
  for (const m of content.matchAll(/^use\s+([\w\\]+)/gm)) {
    if (m[1]) imports.push(m[1]);
  }
  // require / include
  for (const m of content.matchAll(/(?:require|include)(?:_once)?\s*\(?["']([^"']+)["']/gm)) {
    if (m[1]) imports.push(m[1]);
  }

  // classes / interfaces / traits
  for (const m of content.matchAll(/^(?:abstract\s+)?(?:class|interface|trait)\s+([A-Za-z_]\w*)/gm)) {
    const name = m[1];
    if (!name) continue;
    const type: SymbolEntry["type"] = m[0].includes("interface") ? "interface" : "class";
    symbols[name] = { type, file: toPosix(relativeFile), exported: true };
    exports.push(name);
  }

  // public functions
  for (const m of content.matchAll(/(?:public\s+)?(?:static\s+)?function\s+([A-Za-z_]\w*)/gm)) {
    const name = m[1];
    if (!name || name.startsWith("__")) continue;
    symbols[name] = { type: "function", file: toPosix(relativeFile), exported: true };
    exports.push(name);
  }

  return {
    imports: unique(imports),
    exports: unique(exports),
    symbols,
    language: "php",
    isTest: isTestFileLang(relativeFile),
  };
}

// ── Ruby ────────────────────────────────────────────────────────────────────

function analyzeRuby(relativeFile: string, content: string): LangAnalysis {
  const imports: string[] = [];
  const exports: string[] = [];
  const symbols: Record<string, SymbolEntry> = {};

  for (const m of content.matchAll(/^\s*(?:require|require_relative)\s+["']([^"']+)["']/gm)) {
    if (m[1]) imports.push(m[1]);
  }

  for (const m of content.matchAll(/^(?:class|module)\s+([A-Za-z_:]\w*)/gm)) {
    const name = m[1];
    if (!name) continue;
    const type: SymbolEntry["type"] = m[0].startsWith("module") ? "class" : "class";
    symbols[name] = { type, file: toPosix(relativeFile), exported: true };
    exports.push(name);
  }

  for (const m of content.matchAll(/^\s*def\s+(?:self\.)?([A-Za-z_]\w*)/gm)) {
    const name = m[1];
    if (!name) continue;
    symbols[name] = { type: "function", file: toPosix(relativeFile), exported: !name.startsWith("_") };
    if (!name.startsWith("_")) exports.push(name);
  }

  return {
    imports: unique(imports),
    exports: unique(exports),
    symbols,
    language: "ruby",
    isTest: isTestFileLang(relativeFile),
  };
}

// ── Go ──────────────────────────────────────────────────────────────────────

function analyzeGo(relativeFile: string, content: string): LangAnalysis {
  const imports: string[] = [];
  const exports: string[] = [];
  const symbols: Record<string, SymbolEntry> = {};

  // single import
  for (const m of content.matchAll(/^import\s+"([^"]+)"/gm)) {
    if (m[1]) imports.push(m[1]);
  }
  // import block
  const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/);
  if (blockMatch?.[1]) {
    for (const m of blockMatch[1].matchAll(/"([^"]+)"/g)) {
      if (m[1]) imports.push(m[1]);
    }
  }

  // exported funcs (uppercase first letter = exported in Go)
  for (const m of content.matchAll(/^func\s+(?:\([^)]+\)\s+)?([A-Z][A-Za-z0-9_]*)\s*\(/gm)) {
    const name = m[1];
    if (!name) continue;
    symbols[name] = { type: "function", file: toPosix(relativeFile), exported: true };
    exports.push(name);
  }

  // exported types
  for (const m of content.matchAll(/^type\s+([A-Z][A-Za-z0-9_]*)\s+(?:struct|interface)/gm)) {
    const name = m[1];
    if (!name) continue;
    const type: SymbolEntry["type"] = m[0].includes("interface") ? "interface" : "class";
    symbols[name] = { type, file: toPosix(relativeFile), exported: true };
    exports.push(name);
  }

  return {
    imports: unique(imports),
    exports: unique(exports),
    symbols,
    language: "go",
    isTest: relativeFile.endsWith("_test.go"),
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function emptyAnalysis(relativeFile: string, ext: string): LangAnalysis {
  return { imports: [], exports: [], symbols: {}, language: ext.replace(".", ""), isTest: false };
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function toPosix(p: string): string {
  return p.split(path.sep).join(path.posix.sep);
}

export const LANG_EXTENSIONS = new Set([".py", ".php", ".rb", ".go"]);

export const LANG_GLOB_PATTERN = "**/*.{py,php,rb,go}";

export function languageForExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".py": return "python";
    case ".php": return "php";
    case ".rb": return "ruby";
    case ".go": return "go";
    default: return ext.replace(".", "");
  }
}
