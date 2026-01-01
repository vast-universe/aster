/**
 * 类型定义统一导出
 */

// 资源类型
export type ResourceType = "ui" | "hook" | "lib" | "config";

// 框架类型
export type Framework = "expo";

// 样式类型
export type Style = "nativewind" | "stylesheet";

// 资源引用
export interface ResourceRef {
  namespace: string;
  type: ResourceType;
  name: string;
  version?: string;
}

// 资源文件
export interface ResourceFile {
  path: string;
  content: string;
  type: string;
}

// 资源内容
export interface ResourceContent {
  name: string;
  type: ResourceType;
  version: string;
  description?: string;
  files: ResourceFile[];
  dependencies?: string[];
  registryDependencies?: string[];
  devDependencies?: string[];
  meta?: Record<string, any>;
}

// 已安装资源
export interface InstalledResource {
  version: string;
  namespace: string;
  installedAt: string;
  integrity?: string;
}

// Aster 配置
export interface AsterConfig {
  $schema?: string;
  style: Style;
  framework: Framework;
  aliases: {
    components: string;
    hooks: string;
    lib: string;
  };
  installed: {
    ui: Record<string, InstalledResource>;
    hook: Record<string, InstalledResource>;
    lib: Record<string, InstalledResource>;
    config: Record<string, InstalledResource>;
  };
}

// 用户信息
export interface UserInfo {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  namespaces: string[];
}

// 凭证
export interface Credentials {
  token: string;
  user: UserInfo;
  expiresAt?: string;
}

// 安全公告
export interface SecurityAdvisory {
  namespace: string;
  name: string;
  type: ResourceType;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  affectedVersions: string;
  patchedVersion?: string;
}

// 搜索结果
export interface SearchResult {
  namespace: string;
  name: string;
  type: ResourceType;
  description?: string;
  downloads: number;
  latestVersion: string;
}

// 版本信息
export interface VersionInfo {
  version: string;
  publishedAt: string;
  downloads: number;
}

// 命名空间信息
export interface NamespaceInfo {
  name: string;
  description?: string;
  isDefault?: boolean;
  verified?: boolean;
  resourceCount?: number;
  createdAt?: string;
}
