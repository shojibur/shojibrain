export interface CheckpointResult {
    proposed: string;
    written: boolean;
    dryRun: boolean;
    commitCount: number;
    fileCount: number;
}
export declare function runCheckpoint(startDir: string, options?: {
    since?: string;
    dryRun?: boolean;
}): Promise<CheckpointResult>;
//# sourceMappingURL=checkpoint.d.ts.map