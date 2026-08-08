export declare function runStatus(startDir: string): Promise<{
    rootDir: string;
    initialized: boolean;
    docs: {
        [k: string]: boolean;
    };
    presets: import("../types").ProjectPresetConfigEntry[];
    changedFiles: string[];
    project: import("../types").ProjectMap | null;
    counts: {
        files: number;
        symbols: number;
        dependencies: number;
        tests: number;
    } | null;
}>;
//# sourceMappingURL=status.d.ts.map