"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANG_GLOB_PATTERN = exports.LANG_EXTENSIONS = void 0;
exports.supportsLang = supportsLang;
exports.isTestFileLang = isTestFileLang;
exports.analyzeNonJsFile = analyzeNonJsFile;
exports.languageForExt = languageForExt;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
function supportsLang(ext) {
    return exports.LANG_EXTENSIONS.has(ext.toLowerCase());
}
function isTestFileLang(relativeFile) {
    return /(_test|\.test|_spec|\.spec)\.(py|php|rb|go)$/i.test(relativeFile) ||
        /\/(tests?|spec)\//i.test(relativeFile);
}
async function analyzeNonJsFile(relativeFile, rootDir) {
    const ext = node_path_1.default.extname(relativeFile).toLowerCase();
    const absolutePath = node_path_1.default.join(rootDir, relativeFile);
    const content = await promises_1.default.readFile(absolutePath, "utf8");
    switch (ext) {
        case ".py": return analyzePython(relativeFile, content);
        case ".php": return analyzePhp(relativeFile, content);
        case ".rb": return analyzeRuby(relativeFile, content);
        case ".go": return analyzeGo(relativeFile, content);
        default: return emptyAnalysis(relativeFile, ext);
    }
}
// ── Python ──────────────────────────────────────────────────────────────────
function analyzePython(relativeFile, content) {
    const imports = [];
    const exports = [];
    const symbols = {};
    // import statements
    for (const m of content.matchAll(/^import\s+([\w.]+)/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    for (const m of content.matchAll(/^from\s+([\w.]+)\s+import/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    // class definitions
    for (const m of content.matchAll(/^class\s+([A-Za-z_]\w*)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        symbols[name] = { type: "class", file: toPosix(relativeFile), exported: !name.startsWith("_") };
        if (!name.startsWith("_"))
            exports.push(name);
    }
    // top-level functions
    for (const m of content.matchAll(/^def\s+([A-Za-z_]\w*)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        symbols[name] = { type: "function", file: toPosix(relativeFile), exported: !name.startsWith("_") };
        if (!name.startsWith("_"))
            exports.push(name);
    }
    // __all__ overrides the export list
    const allMatch = content.match(/__all__\s*=\s*\[([^\]]+)\]/);
    if (allMatch?.[1]) {
        const names = Array.from(allMatch[1].matchAll(/["']([A-Za-z_]\w*)["']/g)).map((m) => m[1]).filter((n) => Boolean(n));
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
function analyzePhp(relativeFile, content) {
    const imports = [];
    const exports = [];
    const symbols = {};
    // use statements
    for (const m of content.matchAll(/^use\s+([\w\\]+)/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    // require / include
    for (const m of content.matchAll(/(?:require|include)(?:_once)?\s*\(?["']([^"']+)["']/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    // classes / interfaces / traits
    for (const m of content.matchAll(/^(?:abstract\s+)?(?:class|interface|trait)\s+([A-Za-z_]\w*)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        const type = m[0].includes("interface") ? "interface" : "class";
        symbols[name] = { type, file: toPosix(relativeFile), exported: true };
        exports.push(name);
    }
    // public functions
    for (const m of content.matchAll(/(?:public\s+)?(?:static\s+)?function\s+([A-Za-z_]\w*)/gm)) {
        const name = m[1];
        if (!name || name.startsWith("__"))
            continue;
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
function analyzeRuby(relativeFile, content) {
    const imports = [];
    const exports = [];
    const symbols = {};
    for (const m of content.matchAll(/^\s*(?:require|require_relative)\s+["']([^"']+)["']/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    for (const m of content.matchAll(/^(?:class|module)\s+([A-Za-z_:]\w*)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        const type = m[0].startsWith("module") ? "class" : "class";
        symbols[name] = { type, file: toPosix(relativeFile), exported: true };
        exports.push(name);
    }
    for (const m of content.matchAll(/^\s*def\s+(?:self\.)?([A-Za-z_]\w*)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        symbols[name] = { type: "function", file: toPosix(relativeFile), exported: !name.startsWith("_") };
        if (!name.startsWith("_"))
            exports.push(name);
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
function analyzeGo(relativeFile, content) {
    const imports = [];
    const exports = [];
    const symbols = {};
    // single import
    for (const m of content.matchAll(/^import\s+"([^"]+)"/gm)) {
        if (m[1])
            imports.push(m[1]);
    }
    // import block
    const blockMatch = content.match(/import\s*\(([\s\S]*?)\)/);
    if (blockMatch?.[1]) {
        for (const m of blockMatch[1].matchAll(/"([^"]+)"/g)) {
            if (m[1])
                imports.push(m[1]);
        }
    }
    // exported funcs (uppercase first letter = exported in Go)
    for (const m of content.matchAll(/^func\s+(?:\([^)]+\)\s+)?([A-Z][A-Za-z0-9_]*)\s*\(/gm)) {
        const name = m[1];
        if (!name)
            continue;
        symbols[name] = { type: "function", file: toPosix(relativeFile), exported: true };
        exports.push(name);
    }
    // exported types
    for (const m of content.matchAll(/^type\s+([A-Z][A-Za-z0-9_]*)\s+(?:struct|interface)/gm)) {
        const name = m[1];
        if (!name)
            continue;
        const type = m[0].includes("interface") ? "interface" : "class";
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
function emptyAnalysis(relativeFile, ext) {
    return { imports: [], exports: [], symbols: {}, language: ext.replace(".", ""), isTest: false };
}
function unique(arr) {
    return Array.from(new Set(arr));
}
function toPosix(p) {
    return p.split(node_path_1.default.sep).join(node_path_1.default.posix.sep);
}
exports.LANG_EXTENSIONS = new Set([".py", ".php", ".rb", ".go"]);
exports.LANG_GLOB_PATTERN = "**/*.{py,php,rb,go}";
function languageForExt(ext) {
    switch (ext.toLowerCase()) {
        case ".py": return "python";
        case ".php": return "php";
        case ".rb": return "ruby";
        case ".go": return "go";
        default: return ext.replace(".", "");
    }
}
//# sourceMappingURL=lang.js.map