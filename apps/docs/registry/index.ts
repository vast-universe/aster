/**
 * Aster Registry - Expo (React Native) 专用
 */

import { expoRegistry } from "./expo/_registry";
import type { Framework, Style, RegistryItem, FrameworkRegistry } from "./schema";

// 导出类型
export type { Framework, Style, RegistryItem, FrameworkRegistry };

// 框架 Registry (目前只有 Expo)
export const frameworkRegistries: Record<Framework, FrameworkRegistry> = {
  expo: expoRegistry,
};

/**
 * 获取框架 Registry
 */
export function getFrameworkRegistry(framework: Framework): FrameworkRegistry {
  return frameworkRegistries[framework];
}

/**
 * 获取框架的配置列表
 */
export function getConfigs(framework: Framework): RegistryItem[] {
  return frameworkRegistries[framework]?.configs || [];
}

/**
 * 获取框架的单个配置
 */
export function getConfigItem(
  framework: Framework,
  name: string
): RegistryItem | undefined {
  const configs = getConfigs(framework);
  return configs.find((item) => item.name === name);
}

/**
 * 获取框架的组件列表
 */
export function getComponents(
  framework: Framework,
  style: Style
): RegistryItem[] {
  const registry = frameworkRegistries[framework];
  return registry?.components[style] || [];
}

/**
 * 获取框架的单个组件
 */
export function getComponentItem(
  framework: Framework,
  style: Style,
  name: string
): RegistryItem | undefined {
  const components = getComponents(framework, style);
  return components.find((item) => item.name === name);
}

/**
 * 获取所有框架
 */
export function getFrameworks(): Framework[] {
  return Object.keys(frameworkRegistries) as Framework[];
}

/**
 * 获取框架支持的样式
 */
export function getStyles(framework: Framework): Style[] {
  return frameworkRegistries[framework]?.styles || [];
}

/**
 * 验证框架是否支持某样式
 */
export function isStyleSupported(framework: Framework, style: Style): boolean {
  const styles = getStyles(framework);
  return styles.includes(style);
}
