/**
 * Git Registry 支持
 * 从 GitHub 仓库获取组件
 */

import type { Style } from "./config";
import type { RegistryItem } from "./registry";

interface GitRegistryIndex {
  name: string;
  description?: string;
  components: Record<string, GitComponentMeta>;
}

interface GitComponentMeta {
  name: string;
  type: "registry:ui" | "registry:hook" | "registry:lib";
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

/**
 * 从 GitHub Raw 获取文件内容
 */
async function fetchGitHubRaw(
  owner: string,
  repo: string,
  path: string,
  ref = "main"
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "aster-cli",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`文件不存在: ${path}`);
    }
    throw new Error(`获取文件失败: ${response.statusText}`);
  }

  return response.text();
}

/**
 * 获取 Git Registry 索引
 */
async function fetchGitRegistryIndex(
  owner: string,
  repo: string,
  ref = "main"
): Promise<GitRegistryIndex> {
  const content = await fetchGitHubRaw(owner, repo, "registry.json", ref);
  return JSON.parse(content);
}

/**
 * 从 GitHub 仓库获取组件
 */
export async function fetchGitComponent(
  owner: string,
  repo: string,
  componentName: string,
  style: Style,
  ref = "main"
): Promise<RegistryItem> {
  // 1. 获取 registry.json 索引
  const index = await fetchGitRegistryIndex(owner, repo, ref);

  // 2. 查找组件元数据
  const meta = index.components[componentName];
  if (!meta) {
    const available = Object.keys(index.components).join(", ");
    throw new Error(
      `组件 "${componentName}" 不存在于 ${owner}/${repo}\n可用组件: ${available}`
    );
  }

  // 3. 获取组件文件内容
  const files = await Promise.all(
    meta.files.map(async (filePath) => {
      const fullPath = `${style}/${filePath}`;
      try {
        const content = await fetchGitHubRaw(owner, repo, fullPath, ref);
        return {
          path: filePath,
          content,
          type: meta.type,
        };
      } catch (error) {
        // 如果指定风格不存在，尝试获取默认风格
        if (style !== "nativewind") {
          const defaultPath = `nativewind/${filePath}`;
          const content = await fetchGitHubRaw(owner, repo, defaultPath, ref);
          return {
            path: filePath,
            content,
            type: meta.type,
          };
        }
        throw error;
      }
    })
  );

  return {
    name: meta.name,
    type: meta.type,
    description: meta.description || "",
    files,
    dependencies: meta.dependencies || [],
    devDependencies: meta.devDependencies || [],
    registryDependencies: meta.registryDependencies || [],
  };
}

/**
 * 获取 Git Registry 的组件列表
 */
export async function fetchGitRegistryList(
  owner: string,
  repo: string,
  ref = "main"
): Promise<{ name: string; description: string }[]> {
  const index = await fetchGitRegistryIndex(owner, repo, ref);

  return Object.values(index.components).map((meta) => ({
    name: meta.name,
    description: meta.description || "",
  }));
}
