export interface ProjectMap {
  schemaVersion: number;
  generatedAt: string;
  name: string;
  languages: string[];
  frameworks: string[];
  packageManager: string | null;
  sourceDirectories: string[];
  testDirectories: string[];
}

export interface ProjectPresetConfigEntry {
  id: string;
  label: string;
  scope: string;
  description: string;
}

export interface ProjectConfig {
  schemaVersion: number;
  initializedAt: string;
  presets: ProjectPresetConfigEntry[];
}

export interface FileEntry {
  language: string;
  module: string | null;
  imports: string[];
  exports: string[];
  isTest: boolean;
  size: number;
}

export interface ModuleEntry {
  files: string[];
  tests: string[];
  confidence: "high" | "medium" | "low";
}

export interface SymbolEntry {
  type: "class" | "interface" | "function" | "const" | "method" | "type";
  file: string;
  exported: boolean;
}

export interface DependencyEntry {
  dependsOn: string[];
  usedBy: string[];
}

export type TestsMap = Record<string, string[]>;

export interface ScanResult {
  project: ProjectMap;
  files: Record<string, FileEntry>;
  modules: Record<string, ModuleEntry>;
  symbols: Record<string, SymbolEntry>;
  dependencies: Record<string, DependencyEntry>;
  tests: TestsMap;
}

export interface DocMatch {
  path: string;
  title: string;
  excerpt: string;
  score: number;
}

export interface RankedFile {
  path: string;
  score: number;
  reasons: string[];
}

export interface ContextResult {
  request: string;
  docs: DocMatch[];
  files: RankedFile[];
  symbols: Array<{ name: string; entry: SymbolEntry; score: number }>;
  modules: Array<{ name: string; entry: ModuleEntry; score: number }>;
  tests: Array<{ source: string; tests: string[]; score: number }>;
  currentState: string | null;
}
