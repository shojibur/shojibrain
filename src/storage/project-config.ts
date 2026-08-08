import fs from "node:fs/promises";
import path from "node:path";
import { PROJECT_CONFIG_FILE } from "../project/constants";
import { ProjectConfig } from "../types";
import { projectConfigSchema } from "./schemas";

export async function readProjectConfig(rootDir: string): Promise<ProjectConfig | null> {
  try {
    const content = await fs.readFile(path.join(rootDir, PROJECT_CONFIG_FILE), "utf8");
    return projectConfigSchema.parse(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function writeProjectConfig(rootDir: string, config: ProjectConfig): Promise<void> {
  await fs.writeFile(
    path.join(rootDir, PROJECT_CONFIG_FILE),
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}
