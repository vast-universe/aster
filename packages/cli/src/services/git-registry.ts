/**
 * Git Registry 服务 - 从 GitHub 仓库获取组件
 */

import type { Style } from "../types/config";
import type { RegistryItem } from "../types/registry";

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

async function fetchGitHubRaw(
  owner: string,
  repo: string,
  path: string,
  ref = "main"
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "aster-cli" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`文件不存在: ${path}`);
    }
    throw new Error(`获取文件失败: ${response.statusText}`);
  }

  return response.text();
}

async function fetchGitRegistryIndex(
  owner: string,
  repo: string,
  ref = "main"
): Promise<GitRegistryIndex> {
  const content = await fetchGitHubRaw(owner, repo, "registry.json", ref);
  return JSON.parse(content);
}

export async function fetchGitComponent(
  owner: string,
  repo: string,
  componentName: string,
  style: Style,
  ref = "main"
): Promise<RegistryItem> {
  const index = await fetchGitRegistryIndex(owner, repo, ref);
  const meta = index.components[componentName];

  if (!meta) {
    const available = Object.keys(index.components).join(", ");
    throw new Error(
      `组件 "${componentName}" 不存在于 ${owner}/${repo}\n可用组件: ${available}`
    );
  }

  const files = await Promise.all(
    meta.files.map(async (filePath) => {
      const fullPath = `${style}/${filePath}`;
      try {
        const content = await fetchGitHubRaw(owner, repo, fullPath, ref);
        return { path: filePath, content, type: meta.type };
      } catch {
        if (style !== "nativewind") {
          const defaultPath = `nativewind/${filePath}`;
          const content = await fetchGitHubRaw(owner, repo, defaultPath, ref);
          return { path: filePath, content, type: meta.type };
        }
        throw new Error(`获取文件失败: ${fullPath}`);
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
