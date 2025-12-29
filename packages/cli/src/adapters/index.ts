/**
 * 框架适配器统一入口
 */

import { expoAdapter } from "./expo";
import type { FrameworkAdapter, FrameworkName } from "../types/framework";

export type { FrameworkAdapter, FrameworkConfig, FrameworkName } from "../types/framework";

const adapters: Record<FrameworkName, FrameworkAdapter> = {
  expo: expoAdapter,
};

export function getFrameworkAdapter(name: FrameworkName): FrameworkAdapter {
  const adapter = adapters[name];
  if (!adapter) {
    throw new Error(`不支持的框架: ${name}`);
  }
  return adapter;
}

export function getFrameworkChoices() {
  return [
    {
      title: expoAdapter.displayName,
      value: "expo" as FrameworkName,
      description: expoAdapter.description,
    },
  ];
}
