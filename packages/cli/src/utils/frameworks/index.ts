/**
 * 框架适配器注册
 */

import type { FrameworkAdapter, FrameworkName } from "./types";
import { expoAdapter } from "./expo";
import { nextAdapter } from "./next";
import { vueAdapter } from "./vue";
import { nuxtAdapter } from "./nuxt";

export type { FrameworkAdapter, FrameworkConfig, FrameworkName } from "./types";

// 注册所有框架适配器
const frameworks: Record<FrameworkName, FrameworkAdapter> = {
  expo: expoAdapter,
  next: nextAdapter,
  vue: vueAdapter,
  nuxt: nuxtAdapter,
};

/**
 * 获取框架适配器
 */
export function getFrameworkAdapter(name: FrameworkName): FrameworkAdapter {
  const adapter = frameworks[name];
  if (!adapter) {
    throw new Error(`未知框架: ${name}`);
  }
  return adapter;
}

/**
 * 获取所有框架选项
 */
export function getFrameworkChoices() {
  return Object.values(frameworks).map((adapter) => ({
    title: adapter.displayName,
    value: adapter.name,
    description: adapter.description,
  }));
}

/**
 * 获取所有框架名称
 */
export function getFrameworkNames(): FrameworkName[] {
  return Object.keys(frameworks) as FrameworkName[];
}
