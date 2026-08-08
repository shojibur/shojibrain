import { ProjectConfig, ProjectPresetConfigEntry } from "../types";
export interface PresetDefinition {
    id: string;
    label: string;
    description: string;
    productHints: string[];
    architectureHints: string[];
    rules: string[];
    currentHints: string[];
}
export interface RequestedPreset {
    id: string;
    scope: string;
}
export declare function listPresetDefinitions(): PresetDefinition[];
export declare function getPresetDefinition(id: string): PresetDefinition | undefined;
export declare function parsePresetInputs(values: string[]): RequestedPreset[];
export declare function resolvePresetConfigEntries(requested: RequestedPreset[]): ProjectPresetConfigEntry[];
export declare function buildProjectConfig(presets: ProjectPresetConfigEntry[]): ProjectConfig;
export declare function buildPresetSummary(presets: ProjectPresetConfigEntry[]): string;
export declare function buildPresetGuidanceSection(presets: ProjectPresetConfigEntry[], type: "product" | "architecture" | "rules" | "current"): string;
//# sourceMappingURL=index.d.ts.map