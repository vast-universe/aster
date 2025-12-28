import type { Style } from "./config";

// API 地址配置 (支持国内镜像)
const API_URLS = [
  process.env.ASTER_API_URL || "http://localhost:3001/api/r",
  // TODO: 部署后启用
  // "https://aster.dev/api/r",
  // "https://aster.cn/api/r",  // 国内镜像
];

export interface RegistryItem {
  name: string;
  type: "registry:ui" | "registry:hook" | "registry:lib";
  description: string;
  files: {
    path: string;
    content: string;
    type: string;
  }[];
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
}

async function fetchWithFallback(
  path: string,
  retries = 2
): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_URLS) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok || response.status === 404) {
          return response;
        }
      } catch (error) {
        lastError = error as Error;
        // 递增延迟重试
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        }
      }
    }
  }

  throw lastError || new Error("网络请求失败");
}

export async function fetchComponent(
  name: string,
  style: Style
): Promise<RegistryItem> {
  const response = await fetchWithFallback(`/${name}?style=${style}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `组件 "${name}" 不存在，运行 npx aster list 查看可用组件`
      );
    }
    throw new Error(`获取组件失败: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchRegistry(style: Style): Promise<RegistryItem[]> {
  const response = await fetchWithFallback(`?style=${style}`);

  if (!response.ok) {
    throw new Error(`获取组件列表失败: ${response.statusText}`);
  }

  return response.json();
}

export async function resolveRegistryDeps(
  names: string[],
  style: Style
): Promise<string[]> {
  const resolved = new Set<string>();
  const queue = [...names];

  while (queue.length > 0) {
    const name = queue.shift()!;
    if (resolved.has(name)) continue;

    resolved.add(name);

    try {
      const item = await fetchComponent(name, style);
      for (const dep of item.registryDependencies || []) {
        if (!resolved.has(dep)) {
          queue.push(dep);
        }
      }
    } catch {
      // 忽略错误，继续处理其他组件
    }
  }

  return Array.from(resolved);
}
