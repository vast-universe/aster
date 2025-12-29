/**
 * Init 命令 - 初始化 Aster 配置
 */

import prompts from "prompts";
import chalk from "chalk";
import { writeJson, fileExists } from "../core/fs";
import { getFrameworkChoices, getFrameworkAdapter } from "../adapters";

export async function init(): Promise<void> {
  console.log(chalk.bold("\n🚀 初始化 Aster\n"));

  // 检查是否已存在配置
  if (fileExists("aster.json")) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "aster.json 已存在，是否覆盖？",
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.yellow("\n已取消\n"));
      return;
    }
  }

  // 选择框架
  const { framework } = await prompts({
    type: "select",
    name: "framework",
    message: "选择框架:",
    choices: getFrameworkChoices(),
    initial: 0,
  });

  if (!framework) {
    console.log(chalk.red("\n已取消\n"));
    return;
  }

  const adapter = getFrameworkAdapter(framework);

  // 选择样式
  const { style } = await prompts({
    type: "select",
    name: "style",
    message: "选择样式方案:",
    choices: adapter.styles,
    initial: 0,
  });

  if (!style) {
    console.log(chalk.red("\n已取消\n"));
    return;
  }

  // 配置路径
  const paths = await prompts([
    {
      type: "text",
      name: "components",
      message: "组件存放目录:",
      initial: adapter.defaultPaths.ui,
    },
    {
      type: "text",
      name: "lib",
      message: "工具函数目录:",
      initial: adapter.defaultPaths.lib,
    },
    {
      type: "text",
      name: "hooks",
      message: "Hooks 目录:",
      initial: adapter.defaultPaths.hooks,
    },
  ]);

  // TypeScript
  const { typescript } = await prompts({
    type: "confirm",
    name: "typescript",
    message: "使用 TypeScript?",
    initial: true,
  });

  const config = {
    $schema: "https://aster.dev/schema.json",
    framework,
    style,
    typescript,
    paths: {
      components: paths.components,
      lib: paths.lib,
      hooks: paths.hooks,
    },
  };

  await writeJson("aster.json", config);

  console.log(chalk.green("\n✔ 创建 aster.json"));
  console.log(chalk.dim(`   框架: ${framework}`));
  console.log(chalk.dim(`   样式方案: ${style}`));

  // 提示用户配置路径别名
  console.log(chalk.yellow("\n⚠ 请确保在 tsconfig.json 中配置路径别名:"));
  console.log(
    chalk.dim(`
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
`)
  );

  // NativeWind 风格额外提示
  if (style === "nativewind") {
    console.log(chalk.yellow("⚠ NativeWind 风格需要先配置 NativeWind:"));
    console.log(
      chalk.dim("   https://www.nativewind.dev/getting-started/expo-router\n")
    );
  }

  console.log(
    chalk.dim("运行 ") +
      chalk.cyan("npx aster add button") +
      chalk.dim(" 添加第一个组件\n")
  );
}
