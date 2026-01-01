/**
 * Expo (React Native) Registry
 */

import type { FrameworkRegistry, Registry } from "../schema";

// 配置片段
export const configs: Registry = [
  {
    name: "nativewind",
    type: "registry:config",
    description: "NativeWind v5 (Tailwind CSS for React Native)",
    files: [
      { path: "configs/nativewind/global.css", type: "registry:config", target: "global.css" },
      { path: "configs/nativewind/metro.config.js", type: "registry:config", target: "metro.config.js" },
      { path: "configs/nativewind/postcss.config.mjs", type: "registry:config", target: "postcss.config.mjs" },
      { path: "configs/nativewind/nativewind-env.d.ts", type: "registry:config", target: "nativewind-env.d.ts" },
      { path: "configs/nativewind/lib/utils.ts", type: "registry:lib", target: "lib/utils.ts" },
    ],
    dependencies: [
      "nativewind",
      "react-native-reanimated",
      "react-native-safe-area-context",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
    ],
    devDependencies: ["tailwindcss", "@tailwindcss/postcss"],
    transforms: [
      { file: "tsconfig.json", append: { key: "include", value: "nativewind-env.d.ts" } },
    ],
  },
  {
    name: "zustand",
    type: "registry:config",
    description: "Zustand 轻量状态管理",
    files: [{ path: "shared:configs/zustand/store/index.ts", type: "registry:config", target: "store/index.ts" }],
    dependencies: ["zustand", "zustand/middleware"],
  },
  {
    name: "axios",
    type: "registry:config",
    description: "Axios HTTP 请求封装",
    files: [{ path: "shared:configs/axios/lib/request.ts", type: "registry:lib", target: "lib/request.ts" }],
    dependencies: ["axios"],
  },
  {
    name: "tanstack",
    type: "registry:config",
    description: "TanStack Query 数据请求",
    files: [{ path: "shared:configs/tanstack/lib/query-client.ts", type: "registry:lib", target: "lib/query-client.ts" }],
    dependencies: ["@tanstack/react-query"],
  },
  {
    name: "i18n",
    type: "registry:config",
    description: "i18next 国际化",
    files: [
      { path: "shared:configs/i18n/lib/i18n/index.ts", type: "registry:lib", target: "lib/i18n/index.ts" },
      { path: "shared:configs/i18n/lib/i18n/locales/zh.ts", type: "registry:lib", target: "lib/i18n/locales/zh.ts" },
      { path: "shared:configs/i18n/lib/i18n/locales/en.ts", type: "registry:lib", target: "lib/i18n/locales/en.ts" },
    ],
    dependencies: ["i18next", "react-i18next"],
  },
  {
    name: "toast",
    type: "registry:config",
    description: "Toast 消息提示",
    files: [{ path: "configs/toast/lib/toast.ts", type: "registry:lib", target: "lib/toast.ts" }],
    dependencies: ["react-native-toast-message"],
  },
  {
    name: "form",
    type: "registry:config",
    description: "react-hook-form + zod 表单验证",
    files: [{ path: "shared:configs/form/lib/form/index.ts", type: "registry:lib", target: "lib/form/index.ts" }],
    dependencies: ["react-hook-form", "zod", "@hookform/resolvers"],
  },
  {
    name: "lint",
    type: "registry:config",
    description: "Husky + Prettier + lint-staged 代码规范",
    files: [
      { path: "shared:configs/lint/.prettierrc", type: "registry:config", target: ".prettierrc" },
      { path: "shared:configs/lint/.prettierignore", type: "registry:config", target: ".prettierignore" },
      { path: "shared:configs/lint/.lintstagedrc.js", type: "registry:config", target: ".lintstagedrc.js" },
    ],
    devDependencies: ["prettier", "husky", "lint-staged"],
    transforms: [
      {
        file: "package.json",
        merge: { scripts: { format: 'prettier --write "**/*.{js,jsx,ts,tsx,json,md}"' } },
      },
    ],
    postInstall: ["npx husky init"],
  },
];

// NativeWind 组件
import { registry as nativewindComponents } from "./components/nativewind/registry";
import { registry as stylesheetComponents } from "./components/stylesheet/registry";

export const expoRegistry: FrameworkRegistry = {
  name: "expo",
  displayName: "Expo (React Native)",
  styles: ["nativewind", "stylesheet"],
  configs,
  components: {
    nativewind: nativewindComponents,
    stylesheet: stylesheetComponents,
  },
};
