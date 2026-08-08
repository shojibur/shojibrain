export declare function runInit(startDir: string, options?: {
    presets?: string[];
    interactive?: boolean;
    scan?: boolean;
}): Promise<{
    rootDir: string;
    created: string[];
    updated: string[];
    presets: string[];
    scan: null | {
        fileCount: number;
        symbolCount: number;
        dependencyCount: number;
        testCount: number;
    };
}>;
//# sourceMappingURL=init.d.ts.map