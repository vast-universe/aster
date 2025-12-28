/**
 * HTTP Registry 支持
 * 从 HTTP API 获取组件 (兼容 shadcn 风格)
 */

import type { Style, AsterConfig } from "./config";
import type { RegistryItem } from "./registry";

/**
 * 从 HTTP URL 获取组件
 */
export async function fetchHttpComponent(
  url: string,
  style: Style
): Promise<RegistryItem> {
  // 添加 style 参数
  const urlObj = new URL(url);
  if (!urlObj.searchParams.has("style")) {
    urlObj.searchParams.set("style", style);
  }

  const response = await fetch(urlObj.toString(), {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "aster-cli",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`组件不存在: ${url}`);
    }
    throw new Error(`获取组件失败: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 从命名空间 registry 获取组件
 */
export async function fetchNamespaceComponent(
  namespace: string,
  componentName: string,
  style: Style,
  config: AsterConfig
): Promise<RegistryItem> {
  // 从配置中获取 registry URL
  const registries = config.registries || {};
  const registryUrl = registries[`@${namespace}`];

  if (!registryUrl) {
    throw new Error(
      `Registry "@${namespace}" 未配置\n` +
        `请在 aster.json 中添加:\n` +
        `{\n  "registries": {\n    "@${namespace}": "https://example.com/api/r"\n  }\n}`
    );
  }

  // 构建 URL
  let url: string;
  if (typeof registryUrl === "string") {
    // 简单 URL 模板
    url = registryUrl
      .replace("{name}", componentName)
      .replace("{style}", style);

    // 如果没有占位符，追加组件名
    if (!registryUrl.includes("{name}")) {
      url = `${registryUrl}/${componentName}`;
    }
  } else {
    // 复杂配置 (带 headers 等)
    url = registryUrl.url
      .replace("{name}", componentName)
      .replace("{style}", style);

    if (!registryUrl.url.includes("{name}")) {
      url = `${registryUrl.url}/${componentName}`;
    }
  }

  // 添加 style 参数
  const urlObj = new URL(url);
  if (!urlObj.searchParams.has("style")) {
    urlObj.searchParams.set("style", style);
  }

  // 构建 headers
  const headers: Record<string, string> = {
    "User-Agent": "aster-cli",
    Accept: "application/json",
  };

  if (typeof registryUrl !== "string" && registryUrl.headers) {
    // 展开环境变量
    for (const [key, value] of Object.entries(registryUrl.headers)) {
      headers[key] = expandEnvVars(value);
    }
  }

  const response = await fetch(urlObj.toString(), {
    signal: AbortSignal.timeout(15000),
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(`认证失败: @${namespace}/${componentName}`);
    }
    if (response.status === 404) {
      throw new Error(`组件不存在: @${namespace}/${componentName}`);
    }
    throw new Error(`获取组件失败: ${response.statusText}`);
  }

  return response.json();
}

/**
 * 展开环境变量 ${VAR_NAME}
 */
function expandEnvVars(value: string): string {
  return value.replace(/\$\{(\w+)\}/g, (_, name) => {
    return process.env[name] || "";
  });
}
