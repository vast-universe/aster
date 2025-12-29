/**
 * Nuxt 框架适配器
 */

import { execSync } from "child_process";
import path from "path";
import fs from "fs/promises";
import type { FrameworkAdapter, FrameworkConfig } from "./types";

// 三方库配置
const LIBRARIES: Record<string, string[]> = {
  pinia: ["@pinia/nuxt"],
  axios: [], // Nuxt 内置 $fetch，但可以用 axios
  tanstack: ["@tanstack/vue-query"],
  i18n: ["@nuxtjs/i18n"],
  form: ["vee-validate", "zod", "@vee-validate/zod"],
  auth: ["@sidebase/nuxt-auth"],
};

export const nuxtAdapter: FrameworkAdapter = {
  name: "nuxt",
  displayName: "Nuxt",
  description: "使用 Nuxt 创建 Vue 全栈项目",

  styles: [
    { title: "Tailwind CSS", value: "tailwind" },
    { title: "UnoCSS", value: "unocss" },
    { title: "CSS/SCSS", value: "css" },
  ],

  stateLibs: [
    { title: "Pinia (推荐)", value: "pinia" },
    { title: "不需要 (用 useState)", value: "none" },
  ],

  extraLibs: [
    { title: "@nuxtjs/i18n - 国际化", value: "i18n" },
    { title: "Nuxt Auth - 认证", value: "auth" },
    { title: "TanStack Query - 数据请求", value: "tanstack" },
    { title: "VeeValidate - 表单验证", value: "form" },
    { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
  ],

  async create(config: FrameworkConfig): Promise<void> {
    const { projectName, stateLib, extraLibs } = config;
    const targetDir = path.resolve(process.cwd(), projectName);

    // 1. 创建 Nuxt 项目
    execSync(`npx nuxi@latest init ${projectName}`, { stdio: "inherit" });

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

    // 4. 配置 nuxt.config.ts 添加模块
    await configureNuxtModules(targetDir, stateLib, extraLibs);

    // 5. 创建组件目录
    await fs.mkdir(path.join(targetDir, "components", "ui"), {
      recursive: true,
    });
  },

  async setupStyle(targetDir: string, style: string): Promise<void> {
    if (style === "tailwind") {
      // 安装 Tailwind 模块
      execSync("npm install -D @nuxtjs/tailwindcss", {
        cwd: targetDir,
        stdio: "pipe",
      });

      // 添加到 nuxt.config.ts
      await addNuxtModule(targetDir, "@nuxtjs/tailwindcss");

      // 安装工具链
      execSync("npm install clsx tailwind-merge", {
        cwd: targetDir,
        stdio: "pipe",
      });

      // 创建 cn 函数
      const utilsDir = path.join(targetDir, "utils");
      await fs.mkdir(utilsDir, { recursive: true });
      await fs.writeFile(
        path.join(utilsDir, "cn.ts"),
        `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`
      );
    } else if (style === "unocss") {
      execSync("npm install -D @unocss/nuxt", {
        cwd: targetDir,
        stdio: "pipe",
      });
      await addNuxtModule(targetDir, "@unocss/nuxt");
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
          semi: false,
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
      framework: "nuxt",
      style: config.style,
      typescript: true,
      paths: {
        components: "components/ui",
        lib: "utils",
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
 * 配置 Nuxt 模块
 */
async function configureNuxtModules(
  targetDir: string,
  stateLib: string,
  extraLibs: string[]
): Promise<void> {
  const modules: string[] = [];

  if (stateLib === "pinia") {
    modules.push("@pinia/nuxt");
  }

  if (extraLibs.includes("i18n")) {
    modules.push("@nuxtjs/i18n");
  }

  if (extraLibs.includes("auth")) {
    modules.push("@sidebase/nuxt-auth");
  }

  for (const mod of modules) {
    await addNuxtModule(targetDir, mod);
  }
}

/**
 * 添加 Nuxt 模块到配置
 */
async function addNuxtModule(
  targetDir: string,
  moduleName: string
): Promise<void> {
  const configPath = path.join(targetDir, "nuxt.config.ts");

  try {
    let content = await fs.readFile(configPath, "utf-8");

    // 检查是否已有 modules 数组
    if (content.includes("modules:")) {
      // 在 modules 数组中添加
      content = content.replace(
        /modules:\s*\[/,
        `modules: [\n    '${moduleName}',`
      );
    } else {
      // 添加 modules 配置
      content = content.replace(
        /defineNuxtConfig\(\{/,
        `defineNuxtConfig({\n  modules: ['${moduleName}'],`
      );
    }

    await fs.writeFile(configPath, content);
  } catch {
    // 如果文件不存在或解析失败，创建新配置
    const newConfig = `// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['${moduleName}'],
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
`;
    await fs.writeFile(configPath, newConfig);
  }
}
