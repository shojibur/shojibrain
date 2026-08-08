export declare function ensureDir(dirPath: string): Promise<void>;
export declare function fileExists(filePath: string): Promise<boolean>;
export declare function writeFileIfMissing(filePath: string, content: string): Promise<boolean>;
export declare function readTextIfExists(filePath: string): Promise<string | null>;
export declare function ensureBrainDirectories(rootDir: string): Promise<void>;
export declare function ensureGitignoreEntry(rootDir: string, entry: string): Promise<boolean>;
export declare function ensureAgentsSection(rootDir: string): Promise<"created" | "updated" | "unchanged">;
export declare function escapeRegExp(value: string): string;
export declare function findProjectRoot(startDir: string): Promise<string>;
export declare function getGitignorePatterns(rootDir: string): Promise<string[]>;
export declare function listMarkdownFiles(rootDir: string, relativeDir: string): Promise<string[]>;
export declare function readDocFiles(rootDir: string): Promise<string[]>;
//# sourceMappingURL=fs.d.ts.map