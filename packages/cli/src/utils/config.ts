/**
 * 配置文件管理
 */

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { Style, AsterConfig, RegistryConfig } from "../types/config";

export type { Style, AsterConfig, RegistryConfig };

const DEFAULT_PATHS = {
  components: "components/ui",
  lib: "lib",
  hooks: "hooks",
};

export function getTargetDir(fileType: string, config: AsterConfig): string {
  switch (fileType) {
    case "registry:ui":
      return config.paths.components || DEFAULT_PATHS.components;
    case "registry:hook":
      return config.paths.hooks || DEFAULT_PATHS.hooks;
    case "registry:lib":
    default:
      return config.paths.lib || DEFAULT_PATHS.lib;
  }
}

export async function getConfig(): Promise<AsterConfig> {
  const configPath = path.join(process.cwd(), "aster.json");

  if (!existsSync(configPath)) {
    throw new Error("找不到 aster.json，请先运行 npx aster init");
  }

  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content);
}

export function hasConfig(): boolean {
  return existsSync(path.join(process.cwd(), "aster.json"));
}

export async function saveConfig(config: AsterConfig): Promise<void> {
  const configPath = path.join(process.cwd(), "aster.json");
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function addRegistry(name: string, url: string): Promise<void> {
  const config = await getConfig();
  config.registries = config.registries || {};
  config.registries[name] = url;
  await saveConfig(config);
}

export async function removeRegistry(name: string): Promise<void> {
  const config = await getConfig();
  if (config.registries) {
    delete config.registries[name];
    await saveConfig(config);
  }
}

export function getRegistries(config: AsterConfig): Record<string, string | RegistryConfig> {
  return config.registries || {};
}
