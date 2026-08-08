import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import fg from "fast-glob";
import { MAP_SCHEMA_VERSION, SOURCE_FILE_PATTERN, SUPPORTED_EXTENSIONS } from "../project/constants";
import { ScanResult, SymbolEntry } from "../types";
import { getGitignorePatterns } from "../utils/fs";

const MAX_FILE_SIZE_BYTES = 512 * 1024;

export async function scanProject(rootDir: string): Promise<ScanResult> {
  const ignore = await getGitignorePatterns(rootDir);
  const files = await fg(SOURCE_FILE_PATTERN, {
    cwd: rootDir,
    onlyFiles: true,
    dot: false,
    ignore,
  });

  const relevantFiles = files
    .filter((file) => SUPPORTED_EXTENSIONS.has(path.extname(file)))
    .sort();

  const fileMap: ScanResult["files"] = {};
  const dependencyMap = new Map<string, Set<string>>();
  const symbolMap: ScanResult["symbols"] = {};

  for (const relativeFile of relevantFiles) {
    const absolutePath = path.join(rootDir, relativeFile);
    const stat = await fs.stat(absolutePath);
    if (stat.size > MAX_FILE_SIZE_BYTES) {
      continue;
    }

    const content = await fs.readFile(absolutePath, "utf8");
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

async function buildProjectMap(
  rootDir: string,
  files: ScanResult["files"],
): Promise<ScanResult["project"]> {
  const packageJsonPath = path.join(rootDir, "package.json");
  let packageManager: string | null = null;
  const frameworks = new Set<string>();

  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as {
      packageManager?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    packageManager = detectPackageManager(rootDir, packageJson.packageManager);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    if ("next" in deps) frameworks.add("nextjs");
    if ("react" in deps) frameworks.add("react");
    if ("vue" in deps) frameworks.add("vue");
    if ("svelte" in deps) frameworks.add("svelte");
    if ("express" in deps) frameworks.add("express");
    if ("fastify" in deps) frameworks.add("fastify");
    if ("nestjs" in deps || "@nestjs/core" in deps) frameworks.add("nestjs");
  } catch {
    packageManager = detectPackageManager(rootDir);
  }

  const directories = Object.keys(files).map((file) => file.split("/")[0] ?? ".");
  const sourceDirectories = uniqueSorted(
    directories.filter((value) => !value.toLowerCase().includes("test")),
  );
  const testDirectories = uniqueSorted(
    Object.entries(files)
      .filter(([, value]) => value.isTest)
      .map(([file]) => file.split("/")[0] ?? "."),
  );
  const languages = uniqueSorted(Object.values(files).map((entry) => entry.language));

  return {
    schemaVersion: MAP_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    name: path.basename(rootDir),
    languages,
    frameworks: Array.from(frameworks).sort(),
    packageManager,
    sourceDirectories,
    testDirectories,
  };
}

function analyzeFile(
  relativeFile: string,
  content: string,
  allFiles: string[],
  targetSymbols: Record<string, SymbolEntry>,
): { imports: string[]; resolvedImports: string[]; exports: string[] } {
  const fileBase = path.basename(relativeFile);
  const imports = new Set<string>();
  const exports = new Set<string>();
  const localSymbols: Record<string, SymbolEntry> = {};

  try {
    const ast = parse(content, {
      sourceType: "unambiguous",
      plugins: parserPluginsForFile(relativeFile),
      errorRecovery: true,
      allowReturnOutsideFunction: true,
    });

    traverse(ast, {
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
        } else if (t.isClassDeclaration(declaration) && declaration.id) {
          localSymbols[declaration.id.name] = makeSymbol("class", relativeFile, true);
        }
      },
      CallExpression(path) {
        const callee = path.node.callee;
        if (
          t.isIdentifier(callee, { name: "require" }) &&
          path.node.arguments.length === 1 &&
          t.isStringLiteral(path.node.arguments[0])
        ) {
          imports.add(path.node.arguments[0].value);
        }
      },
      ClassDeclaration(path) {
        if (!path.node.id) return;
        localSymbols[path.node.id.name] = makeSymbol(
          "class",
          relativeFile,
          hasExport(path.parentPath),
        );
        collectClassMethods(path, localSymbols, relativeFile);
      },
      TSInterfaceDeclaration(path) {
        localSymbols[path.node.id.name] = makeSymbol(
          "interface",
          relativeFile,
          hasExport(path.parentPath),
        );
      },
      TSTypeAliasDeclaration(path) {
        localSymbols[path.node.id.name] = makeSymbol(
          "type",
          relativeFile,
          hasExport(path.parentPath),
        );
      },
      FunctionDeclaration(path) {
        if (!path.node.id) return;
        localSymbols[path.node.id.name] = makeSymbol(
          "function",
          relativeFile,
          hasExport(path.parentPath),
        );
      },
      VariableDeclarator(path) {
        if (!t.isIdentifier(path.node.id)) return;
        const declaration = path.parentPath.parentPath;
        if (!declaration || !declaration.isVariableDeclaration()) return;
        localSymbols[path.node.id.name] = makeSymbol(
          "const",
          relativeFile,
          hasExport(path.parentPath.parentPath.parentPath),
        );
      },
      ObjectMethod(path) {
        if (!path.parentPath.parentPath?.isClassBody()) return;
        const name = propertyName(path.node.key);
        if (!name) return;
        localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
      },
      ClassMethod(path) {
        const name = propertyName(path.node.key);
        if (!name) return;
        localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
      },
      ClassPrivateMethod(path) {
        const name = t.isPrivateName(path.node.key) && t.isIdentifier(path.node.key.id)
          ? `#${path.node.key.id.name}`
          : null;
        if (!name) return;
        localSymbols[`${fileBase}::${name}`] = makeSymbol("method", relativeFile, false);
      },
    });
  } catch {
    const fallback = collectFallbackMetadata(content, relativeFile);
    for (const value of fallback.imports) imports.add(value);
    for (const value of fallback.exports) exports.add(value);
    Object.assign(localSymbols, fallback.symbols);
  }

  Object.assign(targetSymbols, localSymbols);
  const resolvedImports = Array.from(imports)
    .map((value) => resolveImportPath(relativeFile, value, allFiles))
    .filter((value): value is string => Boolean(value));

  return {
    imports: Array.from(imports),
    resolvedImports,
    exports: Array.from(exports),
  };
}

function collectNamedExports(
  path: NodePath<t.ExportNamedDeclaration>,
  exports: Set<string>,
  symbols: Record<string, SymbolEntry>,
  relativeFile: string,
): void {
  const declaration = path.node.declaration;
  if (declaration) {
    if (t.isFunctionDeclaration(declaration) && declaration.id) {
      exports.add(declaration.id.name);
      symbols[declaration.id.name] = makeSymbol("function", relativeFile, true);
    } else if (t.isClassDeclaration(declaration) && declaration.id) {
      exports.add(declaration.id.name);
      symbols[declaration.id.name] = makeSymbol("class", relativeFile, true);
      collectClassMethodsFromNode(declaration, symbols, relativeFile);
    } else if (t.isTSInterfaceDeclaration(declaration)) {
      exports.add(declaration.id.name);
      symbols[declaration.id.name] = makeSymbol("interface", relativeFile, true);
    } else if (t.isTSTypeAliasDeclaration(declaration)) {
      exports.add(declaration.id.name);
      symbols[declaration.id.name] = makeSymbol("type", relativeFile, true);
    } else if (t.isVariableDeclaration(declaration)) {
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

function collectClassMethods(
  path: NodePath<t.ClassDeclaration>,
  symbols: Record<string, SymbolEntry>,
  relativeFile: string,
): void {
  collectClassMethodsFromNode(path.node, symbols, relativeFile);
}

function collectClassMethodsFromNode(
  declaration: t.ClassDeclaration,
  symbols: Record<string, SymbolEntry>,
  relativeFile: string,
): void {
  for (const member of declaration.body.body) {
    if (t.isClassMethod(member) || t.isClassPrivateMethod(member)) {
      const name = t.isClassPrivateMethod(member)
        ? t.isPrivateName(member.key) && t.isIdentifier(member.key.id)
          ? `#${member.key.id.name}`
          : null
        : propertyName(member.key);
      if (!name) continue;
      symbols[`${path.basename(relativeFile)}::${name}`] = makeSymbol("method", relativeFile, false);
    }
  }
}

function propertyName(
  key: t.Expression | t.PrivateName | t.Identifier | t.StringLiteral | t.NumericLiteral | t.BigIntLiteral,
): string | null {
  if (t.isIdentifier(key)) return key.name;
  if (t.isStringLiteral(key)) return key.value;
  if (t.isNumericLiteral(key)) return String(key.value);
  if (t.isBigIntLiteral(key)) return String(key.value);
  return null;
}

function makeSymbol(
  type: SymbolEntry["type"],
  relativeFile: string,
  exported: boolean,
): SymbolEntry {
  return {
    type,
    file: toPosix(relativeFile),
    exported,
  };
}

function hasExport(path: NodePath | null | undefined): boolean {
  if (!path) return false;
  if (path.isExportNamedDeclaration() || path.isExportDefaultDeclaration()) {
    return true;
  }
  return false;
}

function collectFallbackMetadata(
  content: string,
  relativeFile: string,
): { imports: string[]; exports: string[]; symbols: Record<string, SymbolEntry> } {
  const imports = new Set<string>();
  const exports = new Set<string>();
  const symbols: Record<string, SymbolEntry> = {};

  for (const regex of [
    /import[\s\S]*?from\s+["']([^"']+)["']/g,
    /export[\s\S]*?from\s+["']([^"']+)["']/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ]) {
    for (const match of content.matchAll(regex)) {
      if (match[1]) imports.add(match[1]);
    }
  }

  const add = (name: string, type: SymbolEntry["type"], exported: boolean) => {
    exports.add(name);
    symbols[name] = makeSymbol(type, relativeFile, exported);
  };

  for (const match of content.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) {
    if (match[1]) add(match[1], "function", true);
  }
  for (const match of content.matchAll(/export\s+class\s+([A-Za-z0-9_$]+)/g)) {
    if (match[1]) add(match[1], "class", true);
  }
  for (const match of content.matchAll(/export\s+interface\s+([A-Za-z0-9_$]+)/g)) {
    if (match[1]) add(match[1], "interface", true);
  }
  for (const match of content.matchAll(/export\s+type\s+([A-Za-z0-9_$]+)/g)) {
    if (match[1]) add(match[1], "type", true);
  }
  for (const match of content.matchAll(/export\s+const\s+([A-Za-z0-9_$]+)/g)) {
    if (match[1]) add(match[1], "const", true);
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

function parserPluginsForFile(relativeFile: string): any[] {
  const ext = path.extname(relativeFile).toLowerCase();
  const plugins: any[] = [
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

function detectPackageManager(rootDir: string, declared?: string): string | null {
  if (declared) {
    return declared.split("@")[0] ?? declared;
  }
  if (require("node:fs").existsSync(path.join(rootDir, "pnpm-lock.yaml"))) return "pnpm";
  if (require("node:fs").existsSync(path.join(rootDir, "yarn.lock"))) return "yarn";
  if (require("node:fs").existsSync(path.join(rootDir, "bun.lockb"))) return "bun";
  if (require("node:fs").existsSync(path.join(rootDir, "package-lock.json"))) return "npm";
  return null;
}

function resolveImportPath(fromFile: string, importValue: string, allFiles: string[]): string | null {
  if (!importValue.startsWith(".")) {
    return null;
  }
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(toPosix(fromFile)), importValue));
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
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
    path.posix.join(base, "index.js"),
    path.posix.join(base, "index.jsx"),
  ];
  const set = new Set(allFiles.map(toPosix));
  return candidates.find((candidate) => set.has(candidate)) ?? null;
}

function buildDependencies(
  files: ScanResult["files"],
  dependencyMap: Map<string, Set<string>>,
): ScanResult["dependencies"] {
  const result: ScanResult["dependencies"] = {};
  const reverse = new Map<string, Set<string>>();

  for (const [source, deps] of dependencyMap.entries()) {
    for (const dep of deps) {
      if (!reverse.has(dep)) reverse.set(dep, new Set());
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

function buildModules(
  files: ScanResult["files"],
  dependencies: ScanResult["dependencies"],
): ScanResult["modules"] {
  const modules = new Map<string, { files: Set<string>; tests: Set<string>; confidence: "high" | "medium" | "low" }>();
  for (const [file, entry] of Object.entries(files)) {
    const moduleName = entry.module ?? "root";
    if (!modules.has(moduleName)) {
      modules.set(moduleName, { files: new Set(), tests: new Set(), confidence: moduleName === "root" ? "low" : "medium" });
    }
    const bucket = modules.get(moduleName)!;
    if (entry.isTest) {
      bucket.tests.add(file);
    } else {
      bucket.files.add(file);
    }
    if ((dependencies[file]?.usedBy.length ?? 0) > 0) {
      bucket.confidence = "high";
    }
  }

  const result: ScanResult["modules"] = {};
  for (const [name, entry] of modules.entries()) {
    result[name] = {
      files: Array.from(entry.files).sort(),
      tests: Array.from(entry.tests).sort(),
      confidence: entry.confidence,
    };
  }
  return result;
}

function buildTestsMap(
  files: ScanResult["files"],
  dependencyMap: Map<string, Set<string>>,
): ScanResult["tests"] {
  const result: ScanResult["tests"] = {};
  const testFiles = Object.entries(files).filter(([, entry]) => entry.isTest);
  const sourceFiles = Object.entries(files).filter(([, entry]) => !entry.isTest);

  for (const [sourceFile] of sourceFiles) {
    const matches = new Set<string>();
    const sourceBase = stripTestSuffix(path.posix.basename(sourceFile, path.posix.extname(sourceFile)));
    for (const [testFile] of testFiles) {
      const imports = dependencyMap.get(testFile) ?? new Set<string>();
      if (imports.has(sourceFile)) {
        matches.add(testFile);
        continue;
      }
      const testBase = stripTestSuffix(path.posix.basename(testFile, path.posix.extname(testFile)));
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

function stripTestSuffix(value: string): string {
  return value.replace(/\.(test|spec)$/i, "");
}

function isTestFile(relativeFile: string): boolean {
  return /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/i.test(relativeFile) &&
    (relativeFile.includes(".test.") || relativeFile.includes(".spec.") || relativeFile.includes("/__tests__/"));
}

function inferModuleName(relativeFile: string): string | null {
  const parts = toPosix(relativeFile).split("/");
  if (parts.length >= 3 && (parts[0] === "src" || parts[0] === "app" || parts[0] === "packages")) {
    return parts[1] ?? null;
  }
  if (parts.length >= 2) {
    return parts[0] ?? null;
  }
  return null;
}

function languageForFile(relativeFile: string): string {
  const ext = path.extname(relativeFile);
  return ext.includes("ts") ? "typescript" : "javascript";
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function toPosix(value: string): string {
  return value.split(path.sep).join(path.posix.sep);
}
