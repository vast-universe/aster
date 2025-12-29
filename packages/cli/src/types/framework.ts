/**
 * 框架适配器类型
 */

export type FrameworkName = "expo";

export interface FrameworkConfig {
  projectName: string;
  style: string;
  stateLib: string;
  extraLibs: string[];
  [key: string]: unknown;
}

export interface FrameworkPaths {
  ui: string;
  hooks: string;
  lib: string;
}

export interface FrameworkMeta {
  name: string;
  displayName: string;
  description: string;
  defaultPaths: FrameworkPaths;
  styles: Array<{ title: string; value: string }>;
  stateLibs: Array<{ title: string; value: string }>;
  extraLibs: Array<{ title: string; value: string; selected?: boolean }>;
  createCommand: string;
  resetCommand: string;
}

export interface FrameworkAdapter {
  name: string;
  displayName: string;
  description: string;
  defaultPaths: FrameworkPaths;
  styles: { title: string; value: string }[];
  stateLibs: { title: string; value: string }[];
  extraLibs: { title: string; value: string; selected?: boolean }[];
  loadRemoteConfig?(): Promise<FrameworkMeta>;
  create(config: FrameworkConfig): Promise<void>;
  setupStyle(targetDir: string, style: string): Promise<void>;
  setupLint(targetDir: string): Promise<void>;
  setupExtras?(targetDir: string, config: FrameworkConfig): Promise<void>;
  generateAsterConfig(targetDir: string, config: FrameworkConfig): Promise<void>;
}
