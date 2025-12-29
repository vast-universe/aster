/**
 * 框架适配器类型定义
 */

export interface FrameworkConfig {
  projectName: string;
  style: string;
  stateLib: string;
  extraLibs: string[];
  [key: string]: unknown;
}

/** 框架路径配置 */
export interface FrameworkPaths {
  /** UI 组件目录 */
  ui: string;
  /** Hooks 目录 */
  hooks: string;
  /** 工具函数目录 */
  lib: string;
}

export interface FrameworkAdapter {
  /** 框架名称 */
  name: string;

  /** 显示名称 */
  displayName: string;

  /** 框架描述 */
  description: string;

  /** 默认路径配置 */
  defaultPaths: FrameworkPaths;

  /** 支持的样式方案 */
  styles: { title: string; value: string }[];

  /** 支持的状态管理 */
  stateLibs: { title: string; value: string }[];

  /** 支持的额外库 */
  extraLibs: { title: string; value: string; selected?: boolean }[];

  /** 获取框架特定的提示问题 */
  getPrompts?: () => Promise<Record<string, unknown>>;

  /** 创建项目 */
  create(config: FrameworkConfig): Promise<void>;

  /** 配置样式 */
  setupStyle(targetDir: string, style: string): Promise<void>;

  /** 配置代码规范 */
  setupLint(targetDir: string): Promise<void>;

  /** 生成 aster.json */
  generateAsterConfig(
    targetDir: string,
    config: FrameworkConfig
  ): Promise<void>;
}

export type FrameworkName = "expo" | "next" | "vue" | "nuxt";
