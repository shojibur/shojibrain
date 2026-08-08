"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanProject = scanProject;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const constants_1 = require("../project/constants");
const fs_1 = require("../utils/fs");
const MAX_FILE_SIZE_BYTES = 512 * 1024;
async function scanProject(rootDir) {
    const ignore = await (0, fs_1.getGitignorePatterns)(rootDir);
    const files = await (0, fast_glob_1.default)(constants_1.SOURCE_FILE_PATTERN, {
        cwd: rootDir,
        onlyFiles: true,
        dot: false,
        ignore,
    });
    const relevantFiles = files
        .filter((file) => constants_1.SUPPORTED_EXTENSIONS.has(node_path_1.default.extname(file)))
        .sort();
    const fileMap = {};
    const dependencyMap = new Map();
    const symbolMap = {};
    for (const relativeFile of relevantFiles) {
        const absolutePath = node_path_1.default.join(rootDir, relativeFile);
        const stat = await promises_1.default.stat(absolutePath);
        if (stat.size > MAX_FILE_SIZE_BYTES) {
            continue;
        }
        const content = await promises_1.default.readFile(absolutePath, "utf8");
        const analysis = analyzeFile(relativeFile, content, relevantFiles, symbolMap);
        dependencyMap.set(toPosix(relativeFile), new Set(analysis.resolvedImports));
        fileMap[toPosix(relativeFile)] = {
            language: languageForFile(relativeFile),
            module: inferModuleName(relativeFile),
            imports: analysis.imports.sort(),
            exports: analysis.exports.sort(),
            isTest: isTestFile(relativeFile),
            size: stat.size,
        };
    }
    const dependencies = buildDependencies(fileMap, dependencyMap);
    const modules = buildModules(fileMap, dependencies);
    const tests = buildTestsMap(fileMap, dependencyMap);
    return {
        project: await buildProjectMap(rootDir, fileMap),
        files: fileMap,
        modules,
        symbols: symbolMap,
        dependencies,
        tests,
    };
}
async function buildProjectMap(rootDir, files) {
    const packageJsonPath = node_path_1.default.join(rootDir, "package.json");
    let packageManager = null;
    const frameworks = new Set();
    try {
        const packageJson = JSON.parse(await promises_1.default.readFile(packageJsonPath, "utf8"));
        packageManager = detectPackageManager(rootDir, packageJson.packageManager);
        const deps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };
        if ("next" in deps)
            frameworks.add("nextjs");
        if ("react" in deps)
            frameworks.add("react");
        if ("vue" in deps)
            frameworks.add("vue");
        if ("svelte" in deps)
            frameworks.add("svelte");
        if ("express" in deps)
            frameworks.add("express");
        if ("fastify" in deps)
            frameworks.add("fastify");
        if ("nestjs" in deps || "@nestjs/core" in deps)
            frameworks.add("nestjs");
    }
    catch {
        packageManager = detectPackageManager(rootDir);
    }
    const directories = Object.keys(files).map((file) => file.split("/")[0] ?? ".");
    const sourceDirectories = uniqueSorted(directories.filter((value) => !value.toLowerCase().includes("test")));
    const testDirectories = uniqueSorted(Object.entries(files)
        .filter(([, value]) => value.isTest)
        .map(([file]) => file.split("/")[0] ?? "."));
    const languages = uniqueSorted(Object.values(files).map((entry) => entry.language));
    return {
        schemaVersion: constants_1.MAP_SCHEMA_VERSION,
        generatedAt: new Date().toISOString(),
        name: node_path_1.default.basename(rootDir),
        languages,
        frameworks: Array.from(frameworks).sort(),
        packageManager,
        sourceDirectories,
        testDirectories,
    };
}
function analyzeFile(relativeFile, content, allFiles, targetSymbols) {
    const fileBase = node_path_1.default.basename(relativeFile);
    const imports = new Set();
    const exports = new Set();
    const localSymbols = {};
    try {
        const ast = (0, parser_1.parse)(content, {
            sourceType: "unambiguous",
            plugins: parserPluginsForFile(relativeFile),
            errorRecovery: true,
            allowReturnOutsideFunction: true,
        });
        (0, traverse_1.default)(ast, {
            ImportDeclaration(path) {
                imports.add(path.node.source.value);
            },
            ExportNamedDeclaration(path) {
                if (path.node.source?.value) {
                    imports.add(path.node.source.value);
                }
                collectNamedExports(path, exports, localSymbols, relativeFile);
            },
            ExportDefaultDeclaration(path) {
                exports.add("default");
                const declaration = path.node.declaration;
                if (t.isFunctionDeclaration(declaration) && declaration.id) {
                    localSymbols[declaration.id.name] = makeSymbol("function", relativeFile, true);
                }
                else if (t.isClassDeclaration(declaration) && declaration.id) {
                    localSymbols[declaration.id.name] = makeSymbol("class", relativeFile, true);
                }
            },
            CallExpression(path) {
                const callee = path.node.callee;
                if (t.isIdentifier(callee, { name: "require" }) &&
                    path.node.arguments.length === 1 &&
                    t.isStringLiteral(path.node.arguments[0])) {
                    imports.add(path.node.arguments[0].value);
                }
            },
            ClassDeclaration(path) {
                if (!path.node.id)
                    return;
                localSymbols[path.node.id.name] = makeSymbol("class", relativeFile, hasExport(path.parentPath));
                collectClassMethods(path, localSymbols, relativeFile);
            },
            TSInterfaceDeclaration(path) {
                localSymbols[path.node.id.name] = makeSymbol("interface", relativeFile, hasExport(path.parentPath));
            },
            TSTypeAliasDeclaration(path) {
                localSymbols[path.node.id.name] = makeSymbol("type", relativeFile, hasExport(path.parentPath));
            },
            FunctionDeclaration(path) {
                if (!path.node.id)
                    return;
                localSymbols[path.node.id.name] = makeSymbol("function", relativeFile, hasExport(path.parentPath));
            },
            VariableDeclarator(path) {
                if (!t.isIdentifier(path.node.id))
                    return;
                const declaration = path.parentPath.parentPath;
                if (!declaration || !declaration.isVariableDeclaration())
                    return;
                localSymbols[path.node.id.name] = makeSymbol("const", relativeFile, hasExport(path.parentPath.parentPath.parentPath));
            },
            ObjectMethod(path) {
                if (!path.parentPath.parentPath?.isClassBody())
                    return;
                const name = propertyName(path.node.key);
                if (!name)
                    return;
                localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
            },
            ClassMethod(path) {
                const name = propertyName(path.node.key);
                if (!name)
                    return;
                localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
            },
            ClassPrivateMethod(path) {
                const name = t.isPrivateName(path.node.key) && t.isIdentifier(path.node.key.id)
                    ? `#${path.node.key.id.name}`
                    : null;
                if (!name)
                    return;
                localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
            },
        });
    }
    catch {
        const fallback = collectFallbackMetadata(content, relativeFile);
        for (const value of fallback.imports)
            imports.add(value);
        for (const value of fallback.exports)
            exports.add(value);
        Object.assign(localSymbols, fallback.symbols);
    }
    Object.assign(targetSymbols, localSymbols);
    const resolvedImports = Array.from(imports)
        .map((value) => resolveImportPath(relativeFile, value, allFiles))
        .filter((value) => Boolean(value));
    return {
        imports: Array.from(imports),
        resolvedImports,
        exports: Array.from(exports),
    };
}
function collectNamedExports(path, exports, symbols, relativeFile) {
    const declaration = path.node.declaration;
    if (declaration) {
        if (t.isFunctionDeclaration(declaration) && declaration.id) {
            exports.add(declaration.id.name);
            symbols[declaration.id.name] = makeSymbol("function", relativeFile, true);
        }
        else if (t.isClassDeclaration(declaration) && declaration.id) {
            exports.add(declaration.id.name);
            symbols[declaration.id.name] = makeSymbol("class", relativeFile, true);
            collectClassMethodsFromNode(declaration, symbols, relativeFile);
        }
        else if (t.isTSInterfaceDeclaration(declaration)) {
            exports.add(declaration.id.name);
            symbols[declaration.id.name] = makeSymbol("interface", relativeFile, true);
        }
        else if (t.isTSTypeAliasDeclaration(declaration)) {
            exports.add(declaration.id.name);
            symbols[declaration.id.name] = makeSymbol("type", relativeFile, true);
        }
        else if (t.isVariableDeclaration(declaration)) {
            for (const declarator of declaration.declarations) {
                if (t.isIdentifier(declarator.id)) {
                    exports.add(declarator.id.name);
                    symbols[declarator.id.name] = makeSymbol("const", relativeFile, true);
                }
            }
        }
    }
    for (const specifier of path.node.specifiers) {
        if (t.isExportSpecifier(specifier)) {
            const name = t.isIdentifier(specifier.exported)
                ? specifier.exported.name
                : specifier.exported.value;
            exports.add(name);
        }
    }
}
function collectClassMethods(path, symbols, relativeFile) {
    collectClassMethodsFromNode(path.node, symbols, relativeFile);
}
function collectClassMethodsFromNode(declaration, symbols, relativeFile) {
    for (const member of declaration.body.body) {
        if (t.isClassMethod(member) || t.isClassPrivateMethod(member)) {
            const name = t.isClassPrivateMethod(member)
                ? t.isPrivateName(member.key) && t.isIdentifier(member.key.id)
                    ? `#${member.key.id.name}`
                    : null
                : propertyName(member.key);
            if (!name)
                continue;
            symbols[`${node_path_1.default.basename(relativeFile)}::${name}`] = makeSymbol("method", relativeFile, false);
        }
    }
}
function propertyName(key) {
    if (t.isIdentifier(key))
        return key.name;
    if (t.isStringLiteral(key))
        return key.value;
    if (t.isNumericLiteral(key))
        return String(key.value);
    if (t.isBigIntLiteral(key))
        return String(key.value);
    return null;
}
function makeSymbol(type, relativeFile, exported) {
    return {
        type,
        file: toPosix(relativeFile),
        exported,
    };
}
function hasExport(path) {
    if (!path)
        return false;
    if (path.isExportNamedDeclaration() || path.isExportDefaultDeclaration()) {
        return true;
    }
    return false;
}
function collectFallbackMetadata(content, relativeFile) {
    const imports = new Set();
    const exports = new Set();
    const symbols = {};
    for (const regex of [
        /import[\s\S]*?from\s+["']([^"']+)["']/g,
        /export[\s\S]*?from\s+["']([^"']+)["']/g,
        /require\(\s*["']([^"']+)["']\s*\)/g,
    ]) {
        for (const match of content.matchAll(regex)) {
            if (match[1])
                imports.add(match[1]);
        }
    }
    const add = (name, type, exported) => {
        exports.add(name);
        symbols[name] = makeSymbol(type, relativeFile, exported);
    };
    for (const match of content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) {
        if (match[1])
            add(match[1], "function", true);
    }
    for (const match of content.matchAll(/export\s+class\s+([A-Za-z0-9_$]+)/g)) {
        if (match[1])
            add(match[1], "class", true);
    }
    for (const match of content.matchAll(/export\s+interface\s+([A-Za-z0-9_$]+)/g)) {
        if (match[1])
            add(match[1], "interface", true);
    }
    for (const match of content.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g)) {
        if (match[1])
            add(match[1], "type", true);
    }
    for (const match of content.matchAll(/export\s+const\s+([A-Za-z0-9_$]+)/g)) {
        if (match[1])
            add(match[1], "const", true);
    }
    if (/export\s+default\b/.test(content)) {
        exports.add("default");
    }
    return {
        imports: Array.from(imports),
        exports: Array.from(exports),
        symbols,
    };
}
function parserPluginsForFile(relativeFile) {
    const ext = node_path_1.default.extname(relativeFile).toLowerCase();
    const plugins = [
        "jsx",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "decorators-legacy",
        "dynamicImport",
        "objectRestSpread",
        "topLevelAwait",
    ];
    if ([".ts", ".tsx", ".mts", ".cts"].includes(ext)) {
        plugins.push("typescript");
    }
    return plugins;
}
function detectPackageManager(rootDir, declared) {
    if (declared) {
        return declared.split("@")[0] ?? declared;
    }
    if (require("node:fs").existsSync(node_path_1.default.join(rootDir, "pnpm-lock.yaml")))
        return "pnpm";
    if (require("node:fs").existsSync(node_path_1.default.join(rootDir, "yarn.lock")))
        return "yarn";
    if (require("node:fs").existsSync(node_path_1.default.join(rootDir, "bun.lockb")))
        return "bun";
    if (require("node:fs").existsSync(node_path_1.default.join(rootDir, "package-lock.json")))
        return "npm";
    return null;
}
function resolveImportPath(fromFile, importValue, allFiles) {
    if (!importValue.startsWith(".")) {
        return null;
    }
    const base = node_path_1.default.posix.normalize(node_path_1.default.posix.join(node_path_1.default.posix.dirname(toPosix(fromFile)), importValue));
    const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        `${base}.mts`,
        `${base}.cts`,
        `${base}.mjs`,
        `${base}.cjs`,
        node_path_1.default.posix.join(base, "index.ts"),
        node_path_1.default.posix.join(base, "index.tsx"),
        node_path_1.default.posix.join(base, "index.js"),
        node_path_1.default.posix.join(base, "index.jsx"),
    ];
    const set = new Set(allFiles.map(toPosix));
    return candidates.find((candidate) => set.has(candidate)) ?? null;
}
function buildDependencies(files, dependencyMap) {
    const result = {};
    const reverse = new Map();
    for (const [source, deps] of dependencyMap.entries()) {
        for (const dep of deps) {
            if (!reverse.has(dep))
                reverse.set(dep, new Set());
            reverse.get(dep)?.add(toPosix(source));
        }
    }
    for (const file of Object.keys(files)) {
        result[file] = {
            dependsOn: Array.from(dependencyMap.get(file) ?? []).map(toPosix).sort(),
            usedBy: Array.from(reverse.get(file) ?? []).sort(),
        };
    }
    return result;
}
function buildModules(files, dependencies) {
    const modules = new Map();
    for (const [file, entry] of Object.entries(files)) {
        const moduleName = entry.module ?? "root";
        if (!modules.has(moduleName)) {
            modules.set(moduleName, { files: new Set(), tests: new Set(), confidence: moduleName === "root" ? "low" : "medium" });
        }
        const bucket = modules.get(moduleName);
        if (entry.isTest) {
            bucket.tests.add(file);
        }
        else {
            bucket.files.add(file);
        }
        if ((dependencies[file]?.usedBy.length ?? 0) > 0) {
            bucket.confidence = "high";
        }
    }
    const result = {};
    for (const [name, entry] of modules.entries()) {
        result[name] = {
            files: Array.from(entry.files).sort(),
            tests: Array.from(entry.tests).sort(),
            confidence: entry.confidence,
        };
    }
    return result;
}
function buildTestsMap(files, dependencyMap) {
    const result = {};
    const testFiles = Object.entries(files).filter(([, entry]) => entry.isTest);
    const sourceFiles = Object.entries(files).filter(([, entry]) => !entry.isTest);
    for (const [sourceFile] of sourceFiles) {
        const matches = new Set();
        const sourceBase = stripTestSuffix(node_path_1.default.posix.basename(sourceFile, node_path_1.default.posix.extname(sourceFile)));
        for (const [testFile] of testFiles) {
            const imports = dependencyMap.get(testFile) ?? new Set();
            if (imports.has(sourceFile)) {
                matches.add(testFile);
                continue;
            }
            const testBase = stripTestSuffix(node_path_1.default.posix.basename(testFile, node_path_1.default.posix.extname(testFile)));
            if (sourceBase === testBase) {
                matches.add(testFile);
            }
        }
        if (matches.size > 0) {
            result[sourceFile] = Array.from(matches).sort();
        }
    }
    return result;
}
function stripTestSuffix(value) {
    return value.replace(/\.(test|spec)$/i, "");
}
function isTestFile(relativeFile) {
    return /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i.test(relativeFile) &&
        (relativeFile.includes(".test.") || relativeFile.includes(".spec.") || relativeFile.includes("/__tests__/"));
}
function inferModuleName(relativeFile) {
    const parts = toPosix(relativeFile).split("/");
    if (parts.length >= 3 && (parts[0] === "src" || parts[0] === "app" || parts[0] === "packages")) {
        return parts[1] ?? null;
    }
    if (parts.length >= 2) {
        return parts[0] ?? null;
    }
    return null;
}
function languageForFile(relativeFile) {
    const ext = node_path_1.default.extname(relativeFile);
    return ext.includes("ts") ? "typescript" : "javascript";
}
function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort();
}
function toPosix(value) {
    return value.split(node_path_1.default.sep).join(node_path_1.default.posix.sep);
}
//# sourceMappingURL=scan.js.map