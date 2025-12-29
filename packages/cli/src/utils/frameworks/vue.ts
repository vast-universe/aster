/**
 * Vue (Vite) 框架适配器
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import type { FrameworkAdapter, FrameworkConfig } from "./types";

// 三方库配置
const LIBRARIES: Record<string, string[]> = {
  pinia: ["pinia", "pinia-plugin-persistedstate"],
  axios: ["axios"],
  tanstack: ["@tanstack/vue-query"],
  i18n: ["vue-i18n"],
  form: ["vee-validate", "zod", "@vee-validate/zod"],
  router: ["vue-router"],
};

export const vueAdapter: FrameworkAdapter = {
  name: "vue",
  displayName: "Vue (Vite)",
  description: "使用 Vite 创建 Vue 项目",

  styles: [
    { title: "Tailwind CSS", value: "tailwind" },
    { title: "UnoCSS", value: "unocss" },
    { title: "CSS/SCSS", value: "css" },
  ],

  stateLibs: [
    { title: "Pinia (推荐)", value: "pinia" },
    { title: "不需要", value: "none" },
  ],

  extraLibs: [
    { title: "Vue Router - 路由", value: "router", selected: true },
    { title: "Axios - HTTP 请求", value: "axios" },
    { title: "TanStack Query - 数据请求", value: "tanstack" },
    { title: "vue-i18n - 国际化", value: "i18n" },
    { title: "VeeValidate - 表单验证", value: "form" },
    { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
  ],

  async create(config: FrameworkConfig): Promise<void> {
    const { projectName, stateLib, extraLibs } = config;
    const targetDir = path.resolve(process.cwd(), projectName);

    // 1. 创建 Vue 项目
    execSync(`npm create vite@latest ${projectName} -- --template vue-ts`, {
      stdio: "inherit",
    });

    // 2. 安装基础依赖
    execSync("npm install", { cwd: targetDir, stdio: "pipe" });

    // 3. 收集并安装额外依赖
    const deps = collectDependencies(stateLib, extraLibs);
    if (deps.length > 0) {
      execSync(`npm install ${deps.join(" ")}`, {
        cwd: targetDir,
        stdio: "pipe",
      });
    }

    // 4. 创建组件目录
    await fs.mkdir(path.join(targetDir, "src", "components", "ui"), {
      recursive: true,
    });
  },

  async setupStyle(targetDir: string, style: string): Promise<void> {
    if (style === "tailwind") {
      // 安装 Tailwind
      execSync("npm install -D tailwindcss postcss autoprefixer", {
        cwd: targetDir,
        stdio: "pipe",
      });

      // 初始化 Tailwind
      execSync("npx tailwindcss init -p", { cwd: targetDir, stdio: "pipe" });

      // 更新 tailwind.config.js
      await fs.writeFile(
        path.join(targetDir, "tailwind.config.js"),
        `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
      );

      // 更新 src/style.css
      await fs.writeFile(
        path.join(targetDir, "src", "style.css"),
        `@tailwind base;
@tailwind components;
@tailwind utilities;
`
      );

      // 安装工具链
      execSync("npm install clsx tailwind-merge", {
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
    } else if (style === "unocss") {
      execSync("npm install -D unocss", { cwd: targetDir, stdio: "pipe" });
      // UnoCSS 配置...
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
          singleQuote: true,
          tabWidth: 2,
          trailingComma: "es5",
        },
        null,
        2
      )
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
      format: 'prettier --write "**/*.{vue,js,ts,json,md}"',
    };
    pkg["lint-staged"] = {
      "*.{vue,js,ts}": ["prettier --write"],
    };
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));
  },

  async generateAsterConfig(
    targetDir: string,
    config: FrameworkConfig
  ): Promise<void> {
    const asterConfig = {
      $schema: "https://aster.dev/schema.json",
      framework: "vue",
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
