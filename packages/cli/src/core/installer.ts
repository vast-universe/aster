/**
 * 安装器 - 处理组件和配置的安装
 */

import { execSync } from "child_process";
import path from "path";
import type { RegistryItem, FileTransform } from "../types/registry";
import { writeFile, fileExists, readJson, writeJson } from "./fs";
import { installDeps, installDevDeps } from "./deps";

interface InstallOptions {
  cwd?: string;
  force?: boolean;
}

/**
 * 安装配置片段
 */
export async function installConfig(
  config: RegistryItem,
  options: InstallOptions = {}
): Promise<{ success: boolean; files: string[] }> {
  const { cwd = process.cwd(), force = false } = options;
  const installedFiles: string[] = [];

  // 1. 安装依赖
  if (config.dependencies?.length) {
    installDeps(config.dependencies, cwd);
  }
  if (config.devDependencies?.length) {
    installDevDeps(config.devDependencies, cwd);
  }

  // 2. 创建文件
  for (const file of config.files) {
    const targetPath = file.target || path.basename(file.path);
    const filePath = path.join(cwd, targetPath);

    if (fileExists(filePath) && !force) {
      console.log(`  跳过 ${targetPath} (已存在)`);
      continue;
    }

    await writeFile(filePath, file.content);
    installedFiles.push(targetPath);
  }

  // 3. 执行 transforms
  if (config.transforms?.length) {
    for (const transform of config.transforms) {
      await applyTransform(cwd, transform);
    }
  }

  // 4. 执行 postInstall
  if (config.postInstall?.length) {
    for (const cmd of config.postInstall) {
      try {
        execSync(cmd, { cwd, stdio: "pipe" });
      } catch {
        // ignore
      }
    }
  }

  return { success: true, files: installedFiles };
}

async function applyTransform(cwd: string, transform: FileTransform): Promise<void> {
  const filePath = path.join(cwd, transform.file);

  if (!fileExists(filePath)) return;

  if (transform.merge) {
    const data = await readJson<Record<string, unknown>>(filePath);
    const merged = deepMerge(data, transform.merge);
    await writeJson(filePath, merged);
  }

  if (transform.append) {
    const data = await readJson<Record<string, unknown>>(filePath);
    const arr = (data[transform.append.key] as string[]) || [];
    if (!arr.includes(transform.append.value)) {
      arr.push(transform.append.value);
      data[transform.append.key] = arr;
      await writeJson(filePath, data);
    }
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (result[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

export async function installConfigs(
  configs: RegistryItem[],
  options: InstallOptions = {}
): Promise<void> {
  for (const config of configs) {
    await installConfig(config, options);
  }
}
