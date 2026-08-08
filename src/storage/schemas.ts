import { z } from "zod";

export const projectMapSchema = z.object({
  schemaVersion: z.number().int(),
  generatedAt: z.string(),
  name: z.string(),
  languages: z.array(z.string()),
  frameworks: z.array(z.string()),
  packageManager: z.string().nullable(),
  sourceDirectories: z.array(z.string()),
  testDirectories: z.array(z.string()),
});

export const fileEntrySchema = z.object({
  language: z.string(),
  module: z.string().nullable(),
  imports: z.array(z.string()),
  exports: z.array(z.string()),
  isTest: z.boolean(),
  size: z.number().int().nonnegative(),
});

export const moduleEntrySchema = z.object({
  files: z.array(z.string()),
  tests: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
});

export const symbolEntrySchema = z.object({
  type: z.enum(["class", "interface", "function", "const", "method", "type"]),
  file: z.string(),
  exported: z.boolean(),
});

export const dependencyEntrySchema = z.object({
  dependsOn: z.array(z.string()),
  usedBy: z.array(z.string()),
});

export const testsMapSchema = z.record(z.string(), z.array(z.string()));

export const scanResultSchema = z.object({
  project: projectMapSchema,
  files: z.record(z.string(), fileEntrySchema),
  modules: z.record(z.string(), moduleEntrySchema),
  symbols: z.record(z.string(), symbolEntrySchema),
  dependencies: z.record(z.string(), dependencyEntrySchema),
  tests: testsMapSchema,
});
