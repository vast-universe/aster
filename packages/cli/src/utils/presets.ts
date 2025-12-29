/**
 * Preset 系统 - 预设配置管理
 */

import path from "path";
import os from "os";
import type { FrameworkName } from "./frameworks";
import { readJson, writeJson, fileExists } from "../core/fs";

export interface Preset {
  name: string;
  description: string;
  framework: FrameworkName;
  style: string;
  stateLib: string;
  extraLibs: string[];
  /** 预设来源: builtin | user | remote */
  source?: "builtin" | "user" | "remote";
}

/** 内置预设 */
const BUILTIN_PRESETS: Preset[] = [
  {
    name: "expo-starter",
    description: "Expo 基础模板 (NativeWind + Zustand)",
    framework: "expo",
    style: "nativewind",
    stateLib: "zustand",
    extraLibs: ["axios", "lint"],
    source: "builtin",
  },
  {
    name: "expo-minimal",
    description: "Expo 最小模板 (StyleSheet)",
    framework: "expo",
    style: "stylesheet",
    stateLib: "none",
    extraLibs: ["lint"],
    source: "builtin",
  },
  {
    name: "expo-full",
    description: "Expo 完整模板 (全部功能)",
    framework: "expo",
    style: "nativewind",
    stateLib: "zustand",
    extraLibs: ["axios", "tanstack", "i18n", "toast", "form", "lint"],
    source: "builtin",
  },
  {
    name: "next-starter",
    description: "Next.js 基础模板 (Tailwind + Zustand)",
    framework: "next",
    style: "tailwind",
    stateLib: "zustand",
    extraLibs: ["tanstack", "lint"],
    source: "builtin",
  },
  {
    name: "next-full",
    description: "Next.js 完整模板 (全部功能)",
    framework: "next",
    style: "tailwind",
    stateLib: "zustand",
    extraLibs: ["tanstack", "axios", "i18n", "auth", "form", "lint"],
    source: "builtin",
  },
  {
    name: "vue-starter",
    description: "Vue 基础模板 (Tailwind + Pinia)",
    framework: "vue",
    style: "tailwind",
    stateLib: "pinia",
    extraLibs: ["router", "lint"],
    source: "builtin",
  },
  {
    name: "nuxt-starter",
    description: "Nuxt 基础模板 (Tailwind + Pinia)",
    framework: "nuxt",
    style: "tailwind",
    stateLib: "pinia",
    extraLibs: ["lint"],
    source: "builtin",
  },
];

/** 用户预设存储路径 */
function getUserPresetsPath(): string {
  return path.join(os.homedir(), ".aster", "presets.json");
}

/** 获取用户预设 */
async function getUserPresets(): Promise<Preset[]> {
  const presetsPath = getUserPresetsPath();
  if (!fileExists(presetsPath)) {
    return [];
  }
  try {
    const data = await readJson<{ presets: Preset[] }>(presetsPath);
    return (data.presets || []).map((p) => ({ ...p, source: "user" as const }));
  } catch {
    return [];
  }
}

/** 获取所有预设 */
export async function getAllPresets(): Promise<Preset[]> {
  const userPresets = await getUserPresets();
  return [...BUILTIN_PRESETS, ...userPresets];
}

/** 根据名称获取预设 */
export async function getPreset(name: string): Promise<Preset | undefined> {
  const presets = await getAllPresets();
  return presets.find((p) => p.name === name);
}

/** 根据框架过滤预设 */
export async function getPresetsByFramework(
  framework: FrameworkName
): Promise<Preset[]> {
  const presets = await getAllPresets();
  return presets.filter((p) => p.framework === framework);
}

/** 保存用户预设 */
export async function saveUserPreset(preset: Omit<Preset, "source">): Promise<void> {
  const presetsPath = getUserPresetsPath();
  const userPresets = await getUserPresets();

  // 检查是否已存在
  const existingIndex = userPresets.findIndex((p) => p.name === preset.name);
  if (existingIndex >= 0) {
    userPresets[existingIndex] = { ...preset, source: "user" };
  } else {
    userPresets.push({ ...preset, source: "user" });
  }

  await writeJson(presetsPath, { presets: userPresets });
}

/** 删除用户预设 */
export async function deleteUserPreset(name: string): Promise<boolean> {
  const presetsPath = getUserPresetsPath();
  const userPresets = await getUserPresets();

  const index = userPresets.findIndex((p) => p.name === name);
  if (index < 0) {
    return false;
  }

  userPresets.splice(index, 1);
  await writeJson(presetsPath, { presets: userPresets });
  return true;
}

/** 列出预设 (用于 CLI 选择) */
export async function getPresetChoices(framework?: FrameworkName) {
  const presets = framework
    ? await getPresetsByFramework(framework)
    : await getAllPresets();

  return presets.map((p) => ({
    title: `${p.name} - ${p.description}`,
    value: p.name,
    description: `${p.framework} | ${p.style} | ${p.stateLib}`,
  }));
}
