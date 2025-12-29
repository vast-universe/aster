/**
 * HTTP Registry 服务 - 从 HTTP API 获取组件
 */

import type { Style, AsterConfig } from "../types/config";
import type { RegistryItem } from "../types/registry";

export async function fetchHttpComponent(
  url: string,
  style: Style
): Promise<RegistryItem> {
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

export async function fetchNamespaceComponent(
  namespace: string,
  componentName: string,
  style: Style,
  config: AsterConfig
): Promise<RegistryItem> {
  const registries = config.registries || {};
  const registryUrl = registries[`@${namespace}`];

  if (!registryUrl) {
    throw new Error(
      `Registry "@${namespace}" 未配置\n` +
        `请在 aster.json 中添加:\n` +
        `{\n  "registries": {\n    "@${namespace}": "https://example.com/api/r"\n  }\n}`
    );
  }

  let url: string;
  if (typeof registryUrl === "string") {
    url = registryUrl.replace("{name}", componentName).replace("{style}", style);
    if (!registryUrl.includes("{name}")) {
      url = `${registryUrl}/${componentName}`;
    }
  } else {
    url = registryUrl.url.replace("{name}", componentName).replace("{style}", style);
    if (!registryUrl.url.includes("{name}")) {
      url = `${registryUrl.url}/${componentName}`;
    }
  }

  const urlObj = new URL(url);
  if (!urlObj.searchParams.has("style")) {
    urlObj.searchParams.set("style", style);
  }

  const headers: Record<string, string> = {
    "User-Agent": "aster-cli",
    Accept: "application/json",
  };

  if (typeof registryUrl !== "string" && registryUrl.headers) {
    for (const [key, value] of Object.entries(registryUrl.headers)) {
      headers[key] = value.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] || "");
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
