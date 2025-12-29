/**
 * 官方 Registry 服务
 */

import type { Style } from "../types/config";
import type { Framework, RegistryItem } from "../types/registry";

const API_URLS = [
  process.env.ASTER_API_URL || "http://localhost:3000/api/r",
];

async function fetchWithFallback(path: string, retries = 2): Promise<Response> {
  let lastError: Error | null = null;

  for (const baseUrl of API_URLS) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok || response.status === 404 || response.status === 400) {
          return response;
        }
      } catch (error) {
        lastError = error as Error;
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
  framework: Framework = "expo",
  style: Style
): Promise<RegistryItem> {
  const params = new URLSearchParams({ framework, type: "ui", style });
  const response = await fetchWithFallback(`/${name}?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`组件 "${name}" 不存在`);
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `获取组件失败: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchConfig(
  name: string,
  framework: Framework = "expo"
): Promise<RegistryItem> {
  const params = new URLSearchParams({ framework, type: "config" });
  const response = await fetchWithFallback(`/${name}?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`配置 "${name}" 不存在`);
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `获取配置失败: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchRegistry(
  framework: Framework = "expo",
  style: Style
): Promise<RegistryItem[]> {
  const params = new URLSearchParams({ framework, type: "ui", style });
  const response = await fetchWithFallback(`?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `获取组件列表失败`);
  }

  return response.json();
}

export async function fetchConfigRegistry(
  framework: Framework = "expo"
): Promise<RegistryItem[]> {
  const params = new URLSearchParams({ framework, type: "config" });
  const response = await fetchWithFallback(`?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `获取配置列表失败`);
  }

  return response.json();
}
