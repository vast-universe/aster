/**
 * 组件来源解析器
 * 支持多种来源格式：
 * - 官方: button
 * - 配置: config:nativewind
 * - GitHub: github:user/repo/component
 * - HTTP: https://example.com/r/component.json
 * - 命名空间: @acme/component
 */

export type SourceType =
  | "official"
  | "config"
  | "github"
  | "http"
  | "namespace"
  | "local";

export interface ParsedSource {
  type: SourceType;
  component: string;
  // GitHub 特有
  owner?: string;
  repo?: string;
  ref?: string; // 分支/tag
  // HTTP 特有
  url?: string;
  // 命名空间特有
  namespace?: string;
  // 本地文件
  filePath?: string;
}

/**
 * 解析组件来源字符串
 */
export function parseSource(input: string): ParsedSource {
  // 0. 配置片段: config:name
  if (input.startsWith("config:")) {
    return {
      type: "config",
      component: input.slice(7),
    };
  }

  // 1. GitHub: github:user/repo/component[@ref]
  const githubMatch = input.match(
    /^github:([^/]+)\/([^/]+)\/(.+?)(?:@([^@]+))?$/
  );
  if (githubMatch) {
    return {
      type: "github",
      owner: githubMatch[1],
      repo: githubMatch[2],
      component: githubMatch[3],
      ref: githubMatch[4] || "main",
    };
  }

  // 2. HTTP URL
  if (input.startsWith("http://") || input.startsWith("https://")) {
    const url = new URL(input);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const component =
      pathParts[pathParts.length - 1]?.replace(".json", "") || "unknown";
    return {
      type: "http",
      url: input,
      component,
    };
  }

  // 3. 本地文件
  if (
    input.startsWith("./") ||
    input.startsWith("/") ||
    input.startsWith("~/")
  ) {
    const component =
      input.split("/").pop()?.replace(".json", "") || "unknown";
    return {
      type: "local",
      filePath: input,
      component,
    };
  }

  // 4. 命名空间: @namespace/component
  const namespaceMatch = input.match(/^@([a-zA-Z0-9_-]+)\/(.+)$/);
  if (namespaceMatch) {
    return {
      type: "namespace",
      namespace: namespaceMatch[1],
      component: namespaceMatch[2],
    };
  }

  // 5. 官方组件
  return {
    type: "official",
    component: input,
  };
}

/**
 * 检查是否为第三方来源
 */
export function isThirdPartySource(input: string): boolean {
  const source = parseSource(input);
  return source.type !== "official" && source.type !== "config";
}

/**
 * 检查是否为配置片段
 */
export function isConfigSource(input: string): boolean {
  return parseSource(input).type === "config";
}

/**
 * 格式化来源显示
 */
export function formatSource(source: ParsedSource): string {
  switch (source.type) {
    case "config":
      return `config:${source.component}`;
    case "github":
      return `github:${source.owner}/${source.repo}/${source.component}${source.ref !== "main" ? `@${source.ref}` : ""}`;
    case "http":
      return source.url || "";
    case "namespace":
      return `@${source.namespace}/${source.component}`;
    case "local":
      return source.filePath || "";
    default:
      return source.component;
  }
}
