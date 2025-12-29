/**
 * 文件系统操作 - 统一管理所有文件操作
 */

import { promises as fs } from "fs";
import { existsSync, readdirSync } from "fs";
import path from "path";

/**
 * 检查文件是否存在
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * 读取文件内容
 */
export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

/**
 * 写入文件 (自动创建目录)
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

/**
 * 删除文件
 */
export async function deleteFile(filePath: string): Promise<void> {
  if (fileExists(filePath)) {
    await fs.unlink(filePath);
  }
}

/**
 * 读取 JSON 文件
 */
export async function readJson<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  return JSON.parse(content);
}

/**
 * 写入 JSON 文件
 */
export async function writeJson(
  filePath: string,
  data: unknown
): Promise<void> {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * 追加导出到 index.ts
 */
export async function appendExport(
  indexPath: string,
  componentName: string
): Promise<void> {
  const exportLine = `export * from './${componentName}';\n`;

  if (!fileExists(indexPath)) {
    // 创建新的 index.ts
    await writeFile(indexPath, exportLine);
    return;
  }

  const content = await readFile(indexPath);

  // 检查是否已经导出
  if (content.includes(`'./${componentName}'`)) {
    return;
  }

  // 追加导出
  await fs.appendFile(indexPath, exportLine);
}

/**
 * 获取文件差异 (简单实现)
 */
export async function getFileDiff(
  filePath: string,
  newContent: string
): Promise<{ hasChanges: boolean; oldContent: string }> {
  if (!fileExists(filePath)) {
    return { hasChanges: true, oldContent: "" };
  }

  const oldContent = await readFile(filePath);
  return {
    hasChanges: oldContent !== newContent,
    oldContent,
  };
}

/** 支持的组件文件扩展名 */
const COMPONENT_EXTENSIONS = [".tsx", ".ts", ".vue"];

/**
 * 获取目录中已安装的组件列表 (基于文件系统)
 */
export function getInstalledComponentsFromDir(componentsDir: string): string[] {
  if (!fileExists(componentsDir)) {
    return [];
  }

  const files = readdirSync(componentsDir);
  return files
    .filter((f) => COMPONENT_EXTENSIONS.some((ext) => f.endsWith(ext)))
    .map((f) => {
      // 移除扩展名
      for (const ext of COMPONENT_EXTENSIONS) {
        if (f.endsWith(ext)) {
          return f.slice(0, -ext.length);
        }
      }
      return f;
    });
}

/**
 * @deprecated 使用 getInstalledComponentsFromDir 代替
 */
export const getInstalledComponents = getInstalledComponentsFromDir;

/**
 * 查找组件文件路径 (自动匹配扩展名)
 */
export function findComponentFile(
  componentsDir: string,
  componentName: string
): string | null {
  for (const ext of COMPONENT_EXTENSIONS) {
    const filePath = path.join(componentsDir, `${componentName}${ext}`);
    if (fileExists(filePath)) {
      return filePath;
    }
  }
  return null;
}
