/**
 * Remove 命令 - 删除已安装的组件
 */

import { unlink, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { getConfig } from "../utils/config";

export async function remove(
  components: string[],
  options: { yes?: boolean }
): Promise<void> {
  const spinner = ora();

  try {
    const config = await getConfig();
    const componentsDir = config.paths.components;

    // 如果没有指定组件，列出已安装的组件让用户选择
    if (components.length === 0) {
      const installed = await getInstalledComponents(componentsDir);

      if (installed.length === 0) {
        console.log(chalk.yellow("\n没有已安装的组件\n"));
        return;
      }

      const answer = await prompts({
        type: "multiselect",
        name: "components",
        message: "选择要删除的组件:",
        choices: installed.map((name) => ({
          title: name,
          value: name,
        })),
        min: 1,
      });

      if (!answer.components || answer.components.length === 0) {
        console.log(chalk.yellow("\n已取消\n"));
        return;
      }

      components = answer.components;
    }

    // 确认删除
    if (!options.yes) {
      const confirm = await prompts({
        type: "confirm",
        name: "value",
        message: `确定删除 ${components.join(", ")}?`,
        initial: false,
      });

      if (!confirm.value) {
        console.log(chalk.yellow("\n已取消\n"));
        return;
      }
    }

    console.log();

    // 删除组件文件
    for (const component of components) {
      const filePath = path.join(componentsDir, `${component}.tsx`);

      if (!existsSync(filePath)) {
        console.log(chalk.yellow(`⚠ ${component} 不存在`));
        continue;
      }

      spinner.start(`删除 ${component}...`);
      await unlink(filePath);
      spinner.succeed(`已删除 ${component}`);
    }

    console.log(chalk.green("\n完成! 🎉\n"));

    // 提示清理依赖
    console.log(
      chalk.dim("提示: 组件的 npm 依赖需要手动清理，运行:")
    );
    console.log(chalk.dim("  npm prune 或 pnpm prune\n"));
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 获取已安装的组件列表
 */
async function getInstalledComponents(componentsDir: string): Promise<string[]> {
  if (!existsSync(componentsDir)) {
    return [];
  }

  const files = await readdir(componentsDir);
  return files
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(".tsx", ""));
}
