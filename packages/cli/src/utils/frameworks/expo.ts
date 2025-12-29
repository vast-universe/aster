/**
 * Expo (React Native) 框架适配器
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import type { FrameworkAdapter, FrameworkConfig } from "./types";

// 三方库配置
const LIBRARIES: Record<string, string[]> = {
  redux: [
    "@reduxjs/toolkit",
    "react-redux",
    "redux-persist",
    "@react-native-async-storage/async-storage",
  ],
  zustand: ["zustand"],
  axios: ["axios"],
  i18n: ["i18next", "react-i18next"],
  toast: ["react-native-toast-message"],
  form: ["react-hook-form", "zod", "@hookform/resolvers"],
  tanstack: ["@tanstack/react-query"],
};

export const expoAdapter: FrameworkAdapter = {
  name: "expo",
  displayName: "Expo (React Native)",
  description: "使用 Expo 创建 React Native 项目",

  defaultPaths: {
    ui: "components/ui",
    hooks: "hooks",
    lib: "lib",
  },

  styles: [
    { title: "NativeWind (Tailwind)", value: "nativewind" },
    { title: "StyleSheet (零依赖)", value: "stylesheet" },
  ],

  stateLibs: [
    { title: "不需要", value: "none" },
    { title: "Redux Toolkit", value: "redux" },
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

  async create(config: FrameworkConfig): Promise<void> {
    const { projectName, stateLib, extraLibs } = config;
    const targetDir = path.resolve(process.cwd(), projectName);

    // 1. 创建 Expo 项目
    execSync(`npx create-expo-app@latest ${projectName}`, { stdio: "inherit" });

    // 2. 重置项目
    try {
      execSync("echo Y | npm run reset-project", {
        cwd: targetDir,
        stdio: "pipe",
        shell: "/bin/sh",
      });
    } catch {
      // 忽略错误
    }

    // 3. 收集并安装依赖
    const deps = collectDependencies(stateLib, extraLibs);
    if (deps.length > 0) {
      execSync(`npm install ${deps.join(" ")}`, {
        cwd: targetDir,
        stdio: "pipe",
      });
    }

    // 4. 创建组件目录
    await fs.mkdir(path.join(targetDir, "components", "ui"), { recursive: true });
  },

  async setupStyle(targetDir: string, style: string): Promise<void> {
    if (style === "nativewind") {
      await setupNativeWind(targetDir);
    }
    // stylesheet 不需要额外配置
  },

  async setupLint(targetDir: string): Promise<void> {
    // 安装依赖
    execSync("npm install -D prettier husky lint-staged", {
      cwd: targetDir,
      stdio: "pipe",
    });

    // .prettierrc
    await fs.writeFile(
      path.join(targetDir, ".prettierrc"),
      JSON.stringify(
        {
          semi: true,
          singleQuote: false,
          tabWidth: 2,
          trailingComma: "es5",
        },
        null,
        2
      )
    );

    // .prettierignore
    await fs.writeFile(
      path.join(targetDir, ".prettierignore"),
      "node_modules\n.expo\ndist\nbuild\n"
    );

    // 初始化 husky
    execSync("npx husky init", { cwd: targetDir, stdio: "pipe" });

    // pre-commit hook
    await fs.writeFile(
      path.join(targetDir, ".husky", "pre-commit"),
      "npx lint-staged\n"
    );

    // 更新 package.json
    const pkgPath = path.join(targetDir, "package.json");
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
    pkg.scripts = {
      ...pkg.scripts,
      format: 'prettier --write "**/*.{js,jsx,ts,tsx,json,md}"',
    };
    pkg["lint-staged"] = {
      "*.{js,jsx,ts,tsx}": ["prettier --write"],
    };
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  },

  async generateAsterConfig(
    targetDir: string,
    config: FrameworkConfig
  ): Promise<void> {
    const asterConfig = {
      $schema: "https://aster.dev/schema.json",
      framework: "react-native",
      style: config.style,
      typescript: true,
      paths: {
        components: "components/ui",
        lib: "lib",
        hooks: "hooks",
      },
    };

    await fs.writeFile(
      path.join(targetDir, "aster.json"),
      JSON.stringify(asterConfig, null, 2)
    );
  },
};

/**
 * 收集依赖
 */
function collectDependencies(stateLib: string, extraLibs: string[]): string[] {
  const deps: string[] = [];

  if (stateLib !== "none" && LIBRARIES[stateLib]) {
    deps.push(...LIBRARIES[stateLib]);
  }

  for (const lib of extraLibs) {
    if (LIBRARIES[lib]) {
      deps.push(...LIBRARIES[lib]);
    }
  }

  return [...new Set(deps)];
}

/**
 * 配置 NativeWind
 */
async function setupNativeWind(targetDir: string): Promise<void> {
  // 添加 overrides
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
  pkg.overrides = { ...pkg.overrides, lightningcss: "1.30.1" };
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  // 安装 NativeWind
  execSync(
    "npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context",
    { cwd: targetDir, stdio: "pipe" }
  );

  // 安装开发依赖
  execSync("npx expo install --dev tailwindcss @tailwindcss/postcss postcss", {
    cwd: targetDir,
    stdio: "pipe",
  });

  // 安装工具链
  execSync("npm install clsx tailwind-merge class-variance-authority", {
    cwd: targetDir,
    stdio: "pipe",
  });

  // 创建配置文件
  await createNativeWindConfigs(targetDir);
}

/**
 * 创建 NativeWind 配置文件
 */
async function createNativeWindConfigs(targetDir: string): Promise<void> {
  // tailwind.config.js
  await fs.writeFile(
    path.join(targetDir, "tailwind.config.js"),
    `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
  );

  // postcss.config.js
  await fs.writeFile(
    path.join(targetDir, "postcss.config.js"),
    `module.exports = {
  plugins: {
    "tailwindcss": {},
  },
};
`
  );

  // global.css
  await fs.writeFile(
    path.join(targetDir, "global.css"),
    `@tailwind base;
@tailwind components;
@tailwind utilities;
`
  );

  // metro.config.js
  await fs.writeFile(
    path.join(targetDir, "metro.config.js"),
    `const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
`
  );

  // nativewind-env.d.ts
  await fs.writeFile(
    path.join(targetDir, "nativewind-env.d.ts"),
    `/// <reference types="nativewind/types" />
`
  );

  // 更新 tsconfig.json
  const tsconfigPath = path.join(targetDir, "tsconfig.json");
  if (existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, "utf-8"));
    if (!tsconfig.include) tsconfig.include = [];
    if (!tsconfig.include.includes("nativewind-env.d.ts")) {
      tsconfig.include.push("nativewind-env.d.ts");
    }
    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }

  // 创建 lib/utils.ts (cn 函数)
  const libDir = path.join(targetDir, "lib");
  await fs.mkdir(libDir, { recursive: true });
  await fs.writeFile(
    path.join(libDir, "utils.ts"),
    `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
  );
}
