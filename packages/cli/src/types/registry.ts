/**
 * Registry 相关类型
 */

export type Framework = "expo";

export type RegistryType =
  | "registry:ui"
  | "registry:hook"
  | "registry:lib"
  | "registry:config";

export interface FileTransform {
  file: string;
  merge?: Record<string, unknown>;
  append?: { key: string; value: string };
}

export interface RegistryFile {
  path: string;
  content: string;
  type: RegistryType;
  target?: string;
}

export interface RegistryItem {
  name: string;
  type: RegistryType;
  description?: string;
  files: RegistryFile[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  transforms?: FileTransform[];
  postInstall?: string[];
}

export interface Preset {
  name: string;
  description: string;
  framework: Framework;
  style: string;
  stateLib: string;
  extraLibs: string[];
  source?: "remote" | "user";
}
