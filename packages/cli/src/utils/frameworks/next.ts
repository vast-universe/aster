/**
 * Next.js 框架适配器
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import type { FrameworkAdapter, FrameworkConfig } from "./types";

// 三方库配置
const LIBRARIES: Record<string, string[]> = {
  redux: ["@reduxjs/toolkit", "react-redux"],
  zustand: ["zustand"],
  jotai: ["jotai"],
  axios: ["axios"],
  tanstack: ["@tanstack/react-query"],
  i18n: ["next-intl"],
  form: ["react-hook-form", "zod", "@hookform/resolvers"],
  auth: ["next-auth"],
};

export const nextAdapter: FrameworkAdapter = {
  name: "next",
  displayName: "Next.js",
  description: "使用 Next.js 创建 React Web 项目",

  styles: [
    { title: "Tailwind CSS", value: "tailwind" },
    { title: "CSS Modules", value: "css-modules" },
  ],

  stateLibs: [
    { title: "不需要", value: "none" },
    { title: "Zustand (推荐)", value: "zustand" },
    { title: "Jotai (原子化)", value: "jotai" },
    { title: "Redux Toolkit", value: "redux" },
  ],

  extraLibs: [
    { title: "TanStack Query - 数据请求", value: "tanstack" },
    { title: "Axios - HTTP 请求", value: "axios" },
    { title: "next-intl - 国际化", value: "i18n" },
    { title: "NextAuth - 认证", value: "auth" },
    { title: "Form - 表单验证", value: "form" },
    { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
  ],

  async create(config: FrameworkConfig): Promise<void> {
    const { projectName, style, stateLib, extraLibs } = config;
    const targetDir = path.resolve(process.cwd(), projectName);

    // 1. 创建 Next.js 项目
    const useTailwind = style === "tailwind";
    execSync(
      `npx create-next-app@latest ${projectName} --typescript --eslint ${useTailwind ? "--tailwind" : "--no-tailwind"} --app --src-dir --import-alias "@/*"`,
      { stdio: "inherit" }
    );

    // 2. 收集并安装依赖
    const deps = collectDependencies(stateLib, extraLibs);
    if (deps.length > 0) {
      execSync(`npm install ${deps.join(" ")}`, {
        cwd: targetDir,
        stdio: "pipe",
      });
    }

    // 3. 创建组件目录
    await fs.mkdir(path.join(targetDir, "src", "components", "ui"), {
      recursive: true,
    });
  },

  async setupStyle(targetDir: string, style: string): Promise<void> {
    if (style === "tailwind") {
      // 安装 shadcn 工具链
      execSync("npm install clsx tailwind-merge class-variance-authority", {
        cwd: targetDir,
        stdio: "pipe",
      });

      // 创建 cn 函数
      const libDir = path.join(targetDir, "src", "lib");
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
          plugins: ["prettier-plugin-tailwindcss"],
        },
        null,
        2
      )
    );

    // 安装 tailwind prettier 插件
    execSync("npm install -D prettier-plugin-tailwindcss", {
      cwd: targetDir,
      stdio: "pipe",
    });

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
      framework: "next",
      style: config.style,
      typescript: true,
      paths: {
        components: "src/components/ui",
        lib: "src/lib",
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
