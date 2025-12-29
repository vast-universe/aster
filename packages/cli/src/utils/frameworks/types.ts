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

export interface FrameworkAdapter {
  /** 框架名称 */
  name: string;
  
  /** 显示名称 */
  displayName: string;
  
  /** 框架描述 */
  description: string;
  
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
  generateAsterConfig(targetDir: string, config: FrameworkConfig): Promise<void>;
}

export type FrameworkName = "expo" | "next" | "vue" | "nuxt";
