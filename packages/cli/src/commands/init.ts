import prompts from "prompts";
import { writeFile } from "fs/promises";
import chalk from "chalk";

export async function init() {
  console.log(chalk.bold("\n🚀 初始化 Aster\n"));

  const options = await prompts([
    {
      type: "select",
      name: "style",
      message: "选择样式方案:",
      choices: [
        { title: "NativeWind (推荐)", value: "nativewind" },
        { title: "StyleSheet (零依赖)", value: "stylesheet" },
      ],
      initial: 0,
    },
    {
      type: "text",
      name: "components",
      message: "组件存放目录:",
      initial: "components/ui",
    },
    {
      type: "text",
      name: "lib",
      message: "工具函数目录:",
      initial: "lib",
    },
    {
      type: "confirm",
      name: "typescript",
      message: "使用 TypeScript?",
      initial: true,
    },
  ]);

  if (!options.style) {
    console.log(chalk.red("\n已取消"));
    return;
  }

  const config = {
    $schema: "https://aster.dev/schema.json",
    style: options.style,
    typescript: options.typescript,
    paths: {
      components: options.components,
      lib: options.lib,
    },
  };

  await writeFile("aster.json", JSON.stringify(config, null, 2));

  console.log(chalk.green("\n✔ 创建 aster.json"));
  console.log(chalk.dim(`   样式方案: ${options.style}`));

  // 提示用户配置路径别名
  console.log(chalk.yellow("\n⚠ 请确保在 tsconfig.json 中配置路径别名:"));
  console.log(chalk.dim(`
  {
    "compilerOptions": {
      "baseUrl": ".",
      "paths": {
        "@/*": ["./*"]
      }
    }
  }
`));

  // NativeWind 风格额外提示
  if (options.style === "nativewind") {
    console.log(chalk.yellow("⚠ NativeWind 风格需要先配置 NativeWind:"));
    console.log(chalk.dim("   https://www.nativewind.dev/getting-started/expo-router\n"));
  }

  console.log(
    chalk.dim("运行 ") +
      chalk.cyan("npx aster add button") +
      chalk.dim(" 添加第一个组件\n")
  );
}
