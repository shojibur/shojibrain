import { SymbolEntry } from "../types";
export interface LangAnalysis {
    imports: string[];
    exports: string[];
    symbols: Record<string, SymbolEntry>;
    language: string;
    isTest: boolean;
}
export declare function supportsLang(ext: string): boolean;
export declare function isTestFileLang(relativeFile: string): boolean;
export declare function analyzeNonJsFile(relativeFile: string, rootDir: string): Promise<LangAnalysis>;
export declare const LANG_EXTENSIONS: Set<string>;
export declare const LANG_GLOB_PATTERN = "**/*.{py,php,rb,go}";
export declare function languageForExt(ext: string): string;
//# sourceMappingURL=lang.d.ts.map