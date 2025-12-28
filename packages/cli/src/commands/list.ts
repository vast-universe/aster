import chalk from "chalk";
import ora from "ora";
import { getConfig, hasConfig } from "../utils/config";
import { fetchRegistry } from "../utils/registry";

export async function list(): Promise<void> {
  const spinner = ora();

  try {
    // 获取风格
    let style: "nativewind" | "stylesheet" = "nativewind";
    if (hasConfig()) {
      const config = await getConfig();
      style = config.style;
    }

    spinner.start(`获取组件列表 (${style})...`);
    const items = await fetchRegistry(style);
    spinner.stop();

    console.log(chalk.bold(`\n📦 可用组件 (${style})\n`));

    // 按类型分组
    const ui = items.filter((i) => i.type === "registry:ui");
    const lib = items.filter((i) => i.type === "registry:lib");
    const hooks = items.filter((i) => i.type === "registry:hook");

    if (ui.length > 0) {
      console.log(chalk.cyan("UI 组件:"));
      for (const item of ui) {
        console.log(
          `  ${chalk.white(item.name)} - ${chalk.dim(item.description)}`
        );
      }
      console.log();
    }

    if (lib.length > 0) {
      console.log(chalk.cyan("工具函数:"));
      for (const item of lib) {
        console.log(
          `  ${chalk.white(item.name)} - ${chalk.dim(item.description)}`
        );
      }
      console.log();
    }

    if (hooks.length > 0) {
      console.log(chalk.cyan("Hooks:"));
      for (const item of hooks) {
        console.log(
          `  ${chalk.white(item.name)} - ${chalk.dim(item.description)}`
        );
      }
      console.log();
    }

    console.log(
      chalk.dim("运行 ") +
        chalk.cyan("npx aster add <组件名>") +
        chalk.dim(" 添加组件\n")
    );
  } catch (error) {
    spinner.fail("获取组件列表失败");
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}
