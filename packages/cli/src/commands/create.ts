/**
 * create 命令 - 创建新项目
 */
import { execSync } from "child_process";
import path from "path";
import ora from "ora";
import prompts from "prompts";
import { logger, fs } from "../lib";

const TEMPLATE_REPO = "nicepkg/aster-templates";

interface CreateOptions {
  framework?: string;
  starter?: string;
  features?: string[];
  yes?: boolean;
}

interface FrameworkConfig {
  name: string;
  description: string;
  path: string;
  status: string;
  baseCommand: string;
}

interface StarterConfig {
  name: string;
  description: string;
  path: string;
  features: string[];
}

interface FeatureConfig {
  name: string;
  description: string;
  path: string;
  dependencies?: string[];
  devDependencies?: string[];
  expoDependencies?: string[];
  npmDependencies?: string[];
  overrides?: Record<string, string>;
}

interface TemplateConfig {
  features: Record<string, FeatureConfig>;
  starters: Record<string, StarterConfig>;
  presets: Record<string, string[]>;
}

export async function create(projectName: string | undefined, options: CreateOptions = {}): Promise<void> {
  const spinner = ora();

  logger.header("🚀", "Aster Create - 创建新项目");

  // 1. 获取项目名称
  if (!projectName) {
    const answer = await prompts({
      type: "text",
      name: "projectName",
      message: "项目名称:",
      initial: "my-app",
    });
    projectName = answer.projectName;
  }

  if (!projectName) {
    logger.warn("已取消");
    return;
  }

  const targetDir = path.resolve(process.cwd(), projectName);

  // 检查目录是否存在
  if (await fs.exists(targetDir)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `目录 ${projectName} 已存在，是否覆盖？`,
      initial: false,
    });

    if (!overwrite) {
      logger.warn("已取消");
      return;
    }

    await fs.remove(targetDir);
  }

  // 2. 选择框架
  let framework = options.framework || "expo";

  if (!options.yes && !options.framework) {
    const answer = await prompts({
      type: "select",
      name: "framework",
      message: "选择框架:",
      choices: [
        { title: "Expo (React Native)", value: "expo" },
        { title: "Next.js (即将支持)", value: "nextjs", disabled: true },
        { title: "Nuxt (即将支持)", value: "nuxt", disabled: true },
      ],
      initial: 0,
    });

    if (!answer.framework) {
      logger.warn("已取消");
      return;
    }

    framework = answer.framework;
  }

  // 3. 选择创建方式
  let useStarter = true;
  let starterName = options.starter || "standard";

  if (!options.yes && !options.starter) {
    const modeAnswer = await prompts({
      type: "select",
      name: "mode",
      message: "创建方式:",
      choices: [
        { title: "🎯 使用完整模板 (推荐)", value: "starter" },
        { title: "🔧 自定义组合功能", value: "custom" },
      ],
      initial: 0,
    });

    if (!modeAnswer.mode) {
      logger.warn("已取消");
      return;
    }

    useStarter = modeAnswer.mode === "starter";

    if (useStarter) {
      const starterAnswer = await prompts({
        type: "select",
        name: "starter",
        message: "选择模板:",
        choices: [
          { title: "minimal   - 最小启动 (NativeWind)", value: "minimal" },
          { title: "standard  - 标准企业 (推荐)", value: "standard" },
          { title: "full      - 全功能 + 示例", value: "full", disabled: true },
          { title: "ecommerce - 电商 App", value: "ecommerce", disabled: true },
        ],
        initial: 1,
      });

      if (!starterAnswer.starter) {
        logger.warn("已取消");
        return;
      }

      starterName = starterAnswer.starter;
    }
  }

  logger.newline();

  // 4. 创建项目
  if (framework === "expo") {
    await createExpoProject(projectName, targetDir, starterName, useStarter, spinner);
  } else {
    logger.error(`框架 ${framework} 暂不支持`);
    return;
  }

  // 5. 输出结果
  logger.newline();
  logger.success("项目创建成功！");
  logger.newline();
  logger.log(`  cd ${projectName}`);
  logger.log("  npm start");
  logger.newline();
  logger.dim("提示: 运行 npx aster add button 添加组件");
  logger.newline();
}

async function createExpoProject(
  projectName: string,
  targetDir: string,
  starterName: string,
  useStarter: boolean,
  spinner: ora.Ora
): Promise<void> {
  // 1. 创建 Expo 项目
  spinner.start("创建 Expo 项目...");

  try {
    execSync(`npx create-expo-app@latest ${projectName}`, {
      stdio: "pipe",
      cwd: path.dirname(targetDir),
    });
    spinner.succeed("Expo 项目创建完成");
  } catch (error) {
    spinner.fail("Expo 项目创建失败");
    throw error;
  }

  // 2. 重置项目
  spinner.start("重置项目...");
  try {
    execSync("echo Y | npm run reset-project", {
      cwd: targetDir,
      stdio: "pipe",
      shell: true,
    });
    spinner.succeed("项目重置完成");
  } catch {
    spinner.warn("reset-project 未执行");
  }

  // 3. 拉取模板文件
  spinner.start(`拉取 ${starterName} 模板...`);

  try {
    // 使用 degit 拉取模板
    const tempDir = path.join(targetDir, ".temp-template");
    execSync(
      `npx degit ${TEMPLATE_REPO}/expo/starters/${starterName} ${tempDir} --force`,
      { stdio: "pipe" }
    );

    // 复制文件到项目
    await copyTemplateFiles(tempDir, targetDir);
    await fs.remove(tempDir);

    spinner.succeed("模板文件复制完成");
  } catch (error) {
    spinner.fail("模板拉取失败，使用本地默认配置");
    // 创建基础文件
    await createDefaultFiles(targetDir);
  }

  // 4. 安装依赖
  spinner.start("安装 NativeWind...");

  try {
    // 添加 overrides
    const pkgPath = path.join(targetDir, "package.json");
    const pkg = await fs.readJson<Record<string, unknown>>(pkgPath);
    if (pkg) {
      pkg.overrides = { lightningcss: "1.30.1" };
      await fs.writeJson(pkgPath, pkg);
    }

    // 安装 NativeWind
    execSync(
      "npx expo install nativewind@preview react-native-css react-native-reanimated react-native-safe-area-context",
      { cwd: targetDir, stdio: "pipe" }
    );

    execSync("npx expo install --dev tailwindcss @tailwindcss/postcss postcss", {
      cwd: targetDir,
      stdio: "pipe",
    });

    execSync("npm install clsx tailwind-merge class-variance-authority", {
      cwd: targetDir,
      stdio: "pipe",
    });

    spinner.succeed("NativeWind 安装完成");
  } catch {
    spinner.fail("NativeWind 安装失败，请手动安装");
  }

  // 5. 根据模板安装额外依赖
  if (starterName === "standard" || starterName === "full") {
    spinner.start("安装 Redux...");
    try {
      execSync(
        "npm install @reduxjs/toolkit react-redux redux-persist @react-native-async-storage/async-storage",
        { cwd: targetDir, stdio: "pipe" }
      );
      spinner.succeed("Redux 安装完成");
    } catch {
      spinner.fail("Redux 安装失败");
    }

    spinner.start("安装 Axios...");
    try {
      execSync("npm install axios", { cwd: targetDir, stdio: "pipe" });
      spinner.succeed("Axios 安装完成");
    } catch {
      spinner.fail("Axios 安装失败");
    }
  }

  // 6. 更新 tsconfig
  spinner.start("配置 TypeScript...");
  try {
    const tsconfigPath = path.join(targetDir, "tsconfig.json");
    const tsconfig = await fs.readJson<Record<string, unknown>>(tsconfigPath);
    if (tsconfig) {
      if (!Array.isArray(tsconfig.include)) {
        tsconfig.include = [];
      }
      if (!(tsconfig.include as string[]).includes("nativewind-env.d.ts")) {
        (tsconfig.include as string[]).push("nativewind-env.d.ts");
      }
      await fs.writeJson(tsconfigPath, tsconfig);
    }
    spinner.succeed("TypeScript 配置完成");
  } catch {
    spinner.warn("TypeScript 配置失败");
  }
}

async function copyTemplateFiles(srcDir: string, destDir: string): Promise<void> {
  const files = await fs.listDir(srcDir);

  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);

    const stat = await fs.stat(srcPath);
    if (stat?.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyTemplateFiles(srcPath, destPath);
    } else {
      await fs.copy(srcPath, destPath);
    }
  }
}

async function createDefaultFiles(targetDir: string): Promise<void> {
  // global.css
  await fs.writeText(
    path.join(targetDir, "global.css"),
    `@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";

@import "nativewind/theme";
`
  );

  // metro.config.js
  await fs.writeText(
    path.join(targetDir, "metro.config.js"),
    `const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config);
`
  );

  // postcss.config.mjs
  await fs.writeText(
    path.join(targetDir, "postcss.config.mjs"),
    `export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`
  );

  // nativewind-env.d.ts
  await fs.writeText(
    path.join(targetDir, "nativewind-env.d.ts"),
    `/// <reference types="nativewind/types" />
`
  );

  // lib/utils.ts
  await fs.ensureDir(path.join(targetDir, "lib"));
  await fs.writeText(
    path.join(targetDir, "lib/utils.ts"),
    `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
`
  );

  // components/ui/index.ts
  await fs.ensureDir(path.join(targetDir, "components/ui"));
  await fs.writeText(
    path.join(targetDir, "components/ui/index.ts"),
    `// UI 组件导出
// 使用 npx aster add button 添加组件
`
  );

  // aster.json
  await fs.writeJson(path.join(targetDir, "aster.json"), {
    $schema: "https://aster.dev/schema/aster.json",
    style: "nativewind",
    framework: "expo",
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
    },
    installed: {
      ui: {},
      hook: {},
      lib: {},
      config: {},
    },
  });

  // 更新 app/_layout.tsx
  const layoutPath = path.join(targetDir, "app/_layout.tsx");
  if (await fs.exists(layoutPath)) {
    await fs.writeText(
      layoutPath,
      `import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
`
    );
  }
}
