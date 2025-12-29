/**
 * 统一组件获取器 - 根据来源类型选择合适的获取方式
 */

import type { AsterConfig, Style } from "../types/config";
import type { RegistryItem, Framework } from "../types/registry";
import { parseSource, formatSource, type ParsedSource } from "./source-parser";
import { fetchGitComponent } from "../services/git-registry";
import { fetchHttpComponent, fetchNamespaceComponent } from "../services/http-registry";
import { fetchComponent as fetchOfficialComponent, fetchConfig } from "../services/registry";
import { cacheComponent, getCachedComponent } from "./cache";

function getFramework(_config: AsterConfig): Framework {
  return "expo";
}

export async function fetchComponentFromSource(
  input: string,
  style: Style,
  config: AsterConfig,
  options: { useCache?: boolean; skipCache?: boolean } = {}
): Promise<RegistryItem> {
  const { useCache = true, skipCache = false } = options;
  const source = parseSource(input);
  const sourceKey = formatSource(source);
  const framework = getFramework(config);

  if (source.type === "config") {
    return fetchConfig(source.component, framework);
  }

  if (useCache && !skipCache) {
    const cached = await getCachedComponent(source.component, style, sourceKey);
    if (cached) return cached;
  }

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
      item = await fetchNamespaceComponent(source.namespace!, source.component, style, config);
      break;
    case "local":
      item = await fetchLocalComponent(source.filePath!);
      break;
    default:
      item = await fetchOfficialComponent(source.component, framework, style);
      break;
  }

  if (useCache && source.type !== "local") {
    try {
      await cacheComponent(item, style, sourceKey);
    } catch {
      // ignore
    }
  }

  return item;
}

async function fetchLocalComponent(filePath: string): Promise<RegistryItem> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");

  let resolvedPath = filePath;
  if (filePath.startsWith("~/")) {
    resolvedPath = path.join(os.homedir(), filePath.slice(2));
  }
  resolvedPath = path.resolve(resolvedPath);

  try {
    const content = await fs.readFile(resolvedPath, "utf-8");
    return JSON.parse(content);
  } catch {
    throw new Error(`无法读取本地文件: ${filePath}`);
  }
}

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
    const source = parseSource(input);
    const key = getSourceKey(source);

    if (visited.has(key)) continue;
    visited.add(key);

    try {
      const item = await fetchComponentFromSource(input, style, config);
      resolved.set(input, item);

      for (const dep of item.registryDependencies || []) {
        const depSource = parseSource(dep);
        const depKey = getSourceKey(depSource);
        if (!visited.has(depKey)) {
          queue.push(dep);
        }
      }
    } catch (error) {
      console.warn(`警告: 获取 ${input} 失败 - ${(error as Error).message}`);
    }
  }

  return Array.from(resolved.entries()).map(([source, item]) => ({ source, item }));
}

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
