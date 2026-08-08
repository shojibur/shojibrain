import fs from "node:fs/promises";
import path from "node:path";
import { z, ZodSchema } from "zod";
import { MAP_FILES } from "../project/constants";
import {
  dependencyEntrySchema,
  fileEntrySchema,
  moduleEntrySchema,
  projectMapSchema,
  symbolEntrySchema,
  testsMapSchema,
} from "./schemas";
import { ScanResult } from "../types";

async function writeJson(rootDir: string, relativePath: string, value: unknown): Promise<void> {
  await fs.writeFile(path.join(rootDir, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJson<T>(rootDir: string, relativePath: string, schema: ZodSchema<T>): Promise<T> {
  const content = await fs.readFile(path.join(rootDir, relativePath), "utf8");
  return schema.parse(JSON.parse(content));
}

export async function writeScanResult(rootDir: string, scan: ScanResult): Promise<void> {
  await Promise.all([
    writeJson(rootDir, MAP_FILES.project, scan.project),
    writeJson(rootDir, MAP_FILES.files, scan.files),
    writeJson(rootDir, MAP_FILES.modules, scan.modules),
    writeJson(rootDir, MAP_FILES.symbols, scan.symbols),
    writeJson(rootDir, MAP_FILES.dependencies, scan.dependencies),
    writeJson(rootDir, MAP_FILES.tests, scan.tests),
  ]);
}

export async function readScanResult(rootDir: string): Promise<ScanResult> {
  return {
    project: await readJson(rootDir, MAP_FILES.project, projectMapSchema),
    files: await readJson(rootDir, MAP_FILES.files, z.record(z.string(), fileEntrySchema)),
    modules: await readJson(rootDir, MAP_FILES.modules, z.record(z.string(), moduleEntrySchema)),
    symbols: await readJson(rootDir, MAP_FILES.symbols, z.record(z.string(), symbolEntrySchema)),
    dependencies: await readJson(rootDir, MAP_FILES.dependencies, z.record(z.string(), dependencyEntrySchema)),
    tests: await readJson(rootDir, MAP_FILES.tests, testsMapSchema),
  };
}
