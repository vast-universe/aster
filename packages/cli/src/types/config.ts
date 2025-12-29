/**
 * 配置相关类型
 */

export type Style = "nativewind" | "stylesheet";

export interface RegistryConfig {
  url: string;
  headers?: Record<string, string>;
}

export interface AsterConfig {
  framework?: string;
  style: Style;
  typescript: boolean;
  paths: {
    components: string;
    lib: string;
    hooks?: string;
  };
  registries?: Record<string, string | RegistryConfig>;
}

export interface LockfileEntry {
  version: string;
  installedAt: string;
  source: string;
  files: string[];
}

export interface Lockfile {
  lockfileVersion: 1;
  components: Record<string, LockfileEntry>;
  configs: Record<string, LockfileEntry>;
}
