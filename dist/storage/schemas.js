"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanResultSchema = exports.testsMapSchema = exports.dependencyEntrySchema = exports.symbolEntrySchema = exports.moduleEntrySchema = exports.fileEntrySchema = exports.projectConfigSchema = exports.projectPresetConfigEntrySchema = exports.projectMapSchema = void 0;
const zod_1 = require("zod");
exports.projectMapSchema = zod_1.z.object({
    schemaVersion: zod_1.z.number().int(),
    generatedAt: zod_1.z.string(),
    name: zod_1.z.string(),
    languages: zod_1.z.array(zod_1.z.string()),
    frameworks: zod_1.z.array(zod_1.z.string()),
    packageManager: zod_1.z.string().nullable(),
    sourceDirectories: zod_1.z.array(zod_1.z.string()),
    testDirectories: zod_1.z.array(zod_1.z.string()),
});
exports.projectPresetConfigEntrySchema = zod_1.z.object({
    id: zod_1.z.string(),
    label: zod_1.z.string(),
    scope: zod_1.z.string(),
    description: zod_1.z.string(),
});
exports.projectConfigSchema = zod_1.z.object({
    schemaVersion: zod_1.z.number().int(),
    initializedAt: zod_1.z.string(),
    presets: zod_1.z.array(exports.projectPresetConfigEntrySchema),
});
exports.fileEntrySchema = zod_1.z.object({
    language: zod_1.z.string(),
    module: zod_1.z.string().nullable(),
    imports: zod_1.z.array(zod_1.z.string()),
    exports: zod_1.z.array(zod_1.z.string()),
    isTest: zod_1.z.boolean(),
    size: zod_1.z.number().int().nonnegative(),
});
exports.moduleEntrySchema = zod_1.z.object({
    files: zod_1.z.array(zod_1.z.string()),
    tests: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.enum(["high", "medium", "low"]),
});
exports.symbolEntrySchema = zod_1.z.object({
    type: zod_1.z.enum(["class", "interface", "function", "const", "method", "type"]),
    file: zod_1.z.string(),
    exported: zod_1.z.boolean(),
});
exports.dependencyEntrySchema = zod_1.z.object({
    dependsOn: zod_1.z.array(zod_1.z.string()),
    usedBy: zod_1.z.array(zod_1.z.string()),
});
exports.testsMapSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.array(zod_1.z.string()));
exports.scanResultSchema = zod_1.z.object({
    project: exports.projectMapSchema,
    files: zod_1.z.record(zod_1.z.string(), exports.fileEntrySchema),
    modules: zod_1.z.record(zod_1.z.string(), exports.moduleEntrySchema),
    symbols: zod_1.z.record(zod_1.z.string(), exports.symbolEntrySchema),
    dependencies: zod_1.z.record(zod_1.z.string(), exports.dependencyEntrySchema),
    tests: exports.testsMapSchema,
});
//# sourceMappingURL=schemas.js.map