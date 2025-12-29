/**
 * Expo (React Native) 框架适配器
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import type { FrameworkAdapter, FrameworkConfig, FrameworkMeta } from "../types/framework";
import { fetchConfig } from "../services/registry";
import { fetchFrameworkMeta } from "../services/remote-config";
import { installConfig } from "../core/installer";

let cachedMeta: FrameworkMeta | null = null;

async function getMeta(): Promise<FrameworkMeta> {
  if (cachedMeta) return cachedMeta;

  try {
    cachedMeta = await fetchFrameworkMeta("expo");
    return cachedMeta;
  } catch {
    return getDefaultMeta();
  }
}

function getDefaultMeta(): FrameworkMeta {
  return {
    name: "expo",
    displayName: "Expo (React Native)",
    description: "使用 Expo 创建 React Native 项目",
    defaultPaths: { ui: "components/ui", hooks: "hooks", lib: "lib" },
    styles: [
      { title: "NativeWind (Tailwind)", value: "nativewind" },
      { title: "StyleSheet (零依赖)", value: "stylesheet" },
    ],
    stateLibs: [
      { title: "不需要", value: "none" },
      { title: "Zustand (轻量)", value: "zustand" },
    ],
    extraLibs: [
      { title: "Axios - HTTP 请求", value: "axios" },
      { title: "TanStack Query - 数据请求", value: "tanstack" },
      { title: "i18next - 国际化", value: "i18n" },
      { title: "Toast - 消息提示", value: "toast" },
      { title: "Form - 表单验证", value: "form" },
      { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
    ],
    createCommand: "npx create-expo-app@latest",
    resetCommand: "echo Y | npm run reset-project",
  };
}

export const expoAdapter: FrameworkAdapter = {
  name: "expo",
  displayName: "Expo (React Native)",
  description: "使用 Expo 创建 React Native 项目",

  get defaultPaths() {
    return { ui: "components/ui", hooks: "hooks", lib: "lib" };
  },

  get styles() {
    return [
      { title: "NativeWind (Tailwind)", value: "nativewind" },
      { title: "StyleSheet (零依赖)", value: "stylesheet" },
    ];
  },

  get stateLibs() {
    return [
      { title: "不需要", value: "none" },
      { title: "Zustand (轻量)", value: "zustand" },
    ];
  },

  get extraLibs() {
    return [
      { title: "Axios - HTTP 请求", value: "axios" },
      { title: "TanStack Query - 数据请求", value: "tanstack" },
      { title: "i18next - 国际化", value: "i18n" },
      { title: "Toast - 消息提示", value: "toast" },
      { title: "Form - 表单验证", value: "form" },
      { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
    ];
  },

  async loadRemoteConfig() {
    return getMeta();
  },

  async create(config: FrameworkConfig): Promise<void> {
    const { projectName } = config;
    const targetDir = path.resolve(process.cwd(), projectName);
    const meta = await getMeta();

    execSync(`${meta.createCommand} ${projectName}`, { stdio: "inherit" });

    try {
      execSync(meta.resetCommand, { cwd: targetDir, stdio: "pipe", shell: "/bin/sh" });
    } catch {
      // ignore
    }

    await fs.mkdir(path.join(targetDir, "components", "ui"), { recursive: true });
  },

  async setupStyle(targetDir: string, style: string): Promise<void> {
    if (style === "nativewind") {
      try {
        const config = await fetchConfig("nativewind", "expo");
        await installConfig(config, { cwd: targetDir });
      } catch {
        console.warn("NativeWind 配置获取失败，跳过");
      }
    }
  },

  async setupLint(targetDir: string): Promise<void> {
    try {
      const config = await fetchConfig("lint", "expo");
      await installConfig(config, { cwd: targetDir });
    } catch {
      console.warn("Lint 配置获取失败，跳过");
    }
  },

  async setupExtras(targetDir: string, config: FrameworkConfig): Promise<void> {
    const { stateLib, extraLibs } = config;

    if (stateLib && stateLib !== "none") {
      try {
        const stateConfig = await fetchConfig(stateLib, "expo");
        await installConfig(stateConfig, { cwd: targetDir });
      } catch {
        console.warn(`${stateLib} 配置获取失败，跳过`);
      }
    }

    for (const lib of extraLibs.filter((l) => l !== "lint")) {
      try {
        const libConfig = await fetchConfig(lib, "expo");
        await installConfig(libConfig, { cwd: targetDir });
      } catch {
        console.warn(`${lib} 配置获取失败，跳过`);
      }
    }
  },

  async generateAsterConfig(targetDir: string, config: FrameworkConfig): Promise<void> {
    const meta = await getMeta();

    const asterConfig = {
      $schema: "https://aster.dev/schema.json",
      framework: "react-native",
      style: config.style,
      typescript: true,
      paths: {
        components: meta.defaultPaths.ui,
        lib: meta.defaultPaths.lib,
        hooks: meta.defaultPaths.hooks,
      },
    };

    await fs.writeFile(
      path.join(targetDir, "aster.json"),
      JSON.stringify(asterConfig, null, 2)
    );
  },
};
