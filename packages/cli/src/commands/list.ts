import chalk from "chalk";
import ora from "ora";
import { getConfig, hasConfig, type Style } from "../utils/config";
import { fetchRegistry, fetchConfigRegistry } from "../services/registry";
import { readLockfile, hasLockfile } from "../core/lockfile";
import type { Framework } from "../types/registry";

interface ListOptions {
  configs?: boolean;
  installed?: boolean;
}

export async function list(options: ListOptions = {}): Promise<void> {
  const spinner = ora();

  try {
    if (options.installed) {
      if (!hasLockfile()) {
        console.log(chalk.yellow("\n没有找到 aster.lock，无法获取已安装列表\n"));
        console.log(chalk.dim("提示: 使用 npx aster add 安装组件后会自动生成\n"));
        return;
      }

      const lockfile = await readLockfile();
      const components = Object.keys(lockfile.components);
      const configs = Object.keys(lockfile.configs);

      console.log(chalk.bold("\n📦 已安装\n"));

      if (components.length > 0) {
        console.log(chalk.cyan("组件:"));
        for (const name of components) {
          const entry = lockfile.components[name];
          const date = new Date(entry.installedAt).toLocaleDateString();
          console.log(`  ${chalk.white(name)} ${chalk.dim(`(${date})`)}`);
        }
        console.log();
      }

      if (configs.length > 0) {
        console.log(chalk.cyan("配置:"));
        for (const name of configs) {
          const entry = lockfile.configs[name];
          const date = new Date(entry.installedAt).toLocaleDateString();
          console.log(`  ${chalk.white(name)} ${chalk.dim(`(${date})`)}`);
        }
        console.log();
      }

      if (components.length === 0 && configs.length === 0) {
        console.log(chalk.dim("  暂无已安装的组件或配置\n"));
      }

      return;
    }

    let style: Style = "nativewind";
    let framework: Framework = "expo";

    if (hasConfig()) {
      const config = await getConfig();
      style = config.style;
      framework = "expo";
    }

    if (options.configs) {
      spinner.start(`获取配置列表 (${framework})...`);
      const configs = await fetchConfigRegistry(framework);
      spinner.stop();

      console.log(chalk.bold(`\n⚙️ 可用配置 (${framework})\n`));

      for (const item of configs) {
        console.log(`  ${chalk.white(item.name)} - ${chalk.dim(item.description || "")}`);
      }

      console.log(chalk.dim("\n运行 ") + chalk.cyan("npx aster add config:<配置名>") + chalk.dim(" 添加配置\n"));
      return;
    }

    spinner.start(`获取组件列表 (${framework}/${style})...`);
    const items = await fetchRegistry(framework, style);
    spinner.stop();

    console.log(chalk.bold(`\n📦 可用组件 (${framework}/${style})\n`));

    const ui = items.filter((i) => i.type === "registry:ui");
    const lib = items.filter((i) => i.type === "registry:lib");
    const hooks = items.filter((i) => i.type === "registry:hook");

    if (ui.length > 0) {
      console.log(chalk.cyan("UI 组件:"));
      for (const item of ui) {
        console.log(`  ${chalk.white(item.name)} - ${chalk.dim(item.description || "")}`);
      }
      console.log();
    }

    if (lib.length > 0) {
      console.log(chalk.cyan("工具函数:"));
      for (const item of lib) {
        console.log(`  ${chalk.white(item.name)} - ${chalk.dim(item.description || "")}`);
      }
      console.log();
    }

    if (hooks.length > 0) {
      console.log(chalk.cyan("Hooks:"));
      for (const item of hooks) {
        console.log(`  ${chalk.white(item.name)} - ${chalk.dim(item.description || "")}`);
      }
      console.log();
    }

    console.log(chalk.dim("运行 ") + chalk.cyan("npx aster add <组件名>") + chalk.dim(" 添加组件\n"));
  } catch (error) {
    spinner.fail("获取列表失败");
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}
