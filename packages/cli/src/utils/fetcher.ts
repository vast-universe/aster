/**
 * 统一组件获取器
 * 根据来源类型选择合适的获取方式
 */

import type { AsterConfig, Style } from "./config";
import type { RegistryItem } from "./registry";
import { parseSource, formatSource, type ParsedSource } from "./source-parser";
import { fetchGitComponent } from "./git-registry";
import { fetchHttpComponent, fetchNamespaceComponent } from "./http-registry";
import { fetchComponent as fetchOfficialComponent } from "./registry";
import { cacheComponent, getCachedComponent } from "./cache";

/**
 * 获取组件 (自动识别来源，支持缓存)
 */
export async function fetchComponentFromSource(
  input: string,
  style: Style,
  config: AsterConfig,
  options: { useCache?: boolean; skipCache?: boolean } = {}
): Promise<RegistryItem> {
  const { useCache = true, skipCache = false } = options;
  const source = parseSource(input);
  const sourceKey = formatSource(source);

  // 尝试从缓存获取
  if (useCache && !skipCache) {
    const cached = await getCachedComponent(source.component, style, sourceKey);
    if (cached) {
      return cached;
    }
  }

  // 从远程获取
  let item: RegistryItem;

  switch (source.type) {
    case "github":
      item = await fetchGitComponent(
        source.owner!,
        source.repo!,
        source.component,
        style,
        source.ref
      );
      break;

    case "http":
      item = await fetchHttpComponent(source.url!, style);
      break;

    case "namespace":
      item = await fetchNamespaceComponent(
        source.namespace!,
        source.component,
        style,
        config
      );
      break;

    case "local":
      item = await fetchLocalComponent(source.filePath!);
      break;

    case "official":
    default:
      item = await fetchOfficialComponent(source.component, style);
      break;
  }

  // 缓存结果
  if (useCache && source.type !== "local") {
    try {
      await cacheComponent(item, style, sourceKey);
    } catch {
      // 缓存失败不影响主流程
    }
  }

  return item;
}

/**
 * 从本地文件获取组件
 */
async function fetchLocalComponent(filePath: string): Promise<RegistryItem> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  // 处理 ~ 路径
  let resolvedPath = filePath;
  if (filePath.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), filePath.slice(2));
  }

  resolvedPath = path.resolve(resolvedPath);

  try {
    const content = await fs.readFile(resolvedPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`无法读取本地文件: ${filePath}`);
  }
}

/**
 * 解析所有依赖 (包括第三方)
 */
export async function resolveAllDependencies(
  inputs: string[],
  style: Style,
  config: AsterConfig
): Promise<{ source: string; item: RegistryItem }[]> {
  const resolved = new Map<string, RegistryItem>();
  const queue = [...inputs];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const input = queue.shift()!;

    // 生成唯一 key
    const source = parseSource(input);
    const key = getSourceKey(source);

    if (visited.has(key)) continue;
    visited.add(key);

    try {
      const item = await fetchComponentFromSource(input, style, config);
      resolved.set(input, item);

      // 处理 registryDependencies
      for (const dep of item.registryDependencies || []) {
        const depSource = parseSource(dep);
        const depKey = getSourceKey(depSource);

        if (!visited.has(depKey)) {
          queue.push(dep);
        }
      }
    } catch (error) {
      // 记录错误但继续处理其他组件
      console.warn(`警告: 获取 ${input} 失败 - ${(error as Error).message}`);
    }
  }

  return Array.from(resolved.entries()).map(([source, item]) => ({
    source,
    item,
  }));
}

/**
 * 生成来源唯一 key
 */
function getSourceKey(source: ParsedSource): string {
  switch (source.type) {
    case "github":
      return `github:${source.owner}/${source.repo}/${source.component}@${source.ref}`;
    case "http":
      return source.url!;
    case "namespace":
      return `@${source.namespace}/${source.component}`;
    case "local":
      return source.filePath!;
    default:
      return source.component;
  }
}
