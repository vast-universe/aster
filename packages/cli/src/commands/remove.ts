import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { getConfig } from "../utils/config";
import { deleteFile, getInstalledComponentsFromDir, findComponentFile } from "../core/fs";
import {
  getInstalledComponents,
  getInstalledConfigs,
  removeComponentRecord,
  removeConfigRecord,
  hasLockfile,
} from "../core/lockfile";

export async function remove(components: string[], options: { yes?: boolean }): Promise<void> {
  const spinner = ora();

  try {
    const config = await getConfig();
    const componentsDir = config.paths.components;

    let installed: string[];
    let installedConfigs: string[] = [];
    const useLockfile = hasLockfile();

    if (useLockfile) {
      installed = await getInstalledComponents();
      installedConfigs = await getInstalledConfigs();
    } else {
      installed = getInstalledComponentsFromDir(componentsDir);
    }

    const allInstalled = [...installed, ...installedConfigs.map((c) => `config:${c}`)];

    if (allInstalled.length === 0) {
      console.log(chalk.yellow("\n没有已安装的组件或配置\n"));
      return;
    }

    if (components.length === 0) {
      const choices = [
        ...installed.map((name) => ({ title: name, value: name })),
        ...installedConfigs.map((name) => ({ title: `config:${name}`, value: `config:${name}` })),
      ];

      const answer = await prompts({
        type: "multiselect",
        name: "components",
        message: "选择要删除的组件/配置:",
        choices,
        min: 1,
      });

      if (!answer.components || answer.components.length === 0) {
        console.log(chalk.yellow("\n已取消\n"));
        return;
      }

      components = answer.components;
    }

    const configsToRemove = components.filter((c) => c.startsWith("config:")).map((c) => c.replace("config:", ""));
    const componentsToRemove = components.filter((c) => !c.startsWith("config:"));

    const validComponents = componentsToRemove.filter((c) => installed.includes(c));
    const validConfigs = configsToRemove.filter((c) => installedConfigs.includes(c));
    const invalidItems = [
      ...componentsToRemove.filter((c) => !installed.includes(c)),
      ...configsToRemove.filter((c) => !installedConfigs.includes(c)).map((c) => `config:${c}`),
    ];

    if (invalidItems.length > 0) {
      console.log(chalk.yellow(`\n⚠ 以下项不存在: ${invalidItems.join(", ")}`));
    }

    if (validComponents.length === 0 && validConfigs.length === 0) {
      console.log(chalk.yellow("\n没有可删除的项\n"));
      return;
    }

    const allValid = [...validComponents, ...validConfigs.map((c) => `config:${c}`)];
    if (!options.yes) {
      const confirm = await prompts({
        type: "confirm",
        name: "value",
        message: `确定删除 ${allValid.join(", ")}?`,
        initial: false,
      });

      if (!confirm.value) {
        console.log(chalk.yellow("\n已取消\n"));
        return;
      }
    }

    console.log();

    for (const component of validComponents) {
      spinner.start(`删除 ${component}...`);

      if (useLockfile) {
        const files = await removeComponentRecord(component);
        for (const file of files) {
          await deleteFile(file);
        }
      } else {
        const filePath = findComponentFile(componentsDir, component);
        if (filePath) {
          await deleteFile(filePath);
        }
      }

      spinner.succeed(`已删除 ${component}`);
    }

    for (const configName of validConfigs) {
      spinner.start(`删除 config:${configName}...`);
      const files = await removeConfigRecord(configName);
      for (const file of files) {
        await deleteFile(file);
      }
      spinner.succeed(`已删除 config:${configName}`);
    }

    console.log(chalk.green("\n完成! 🎉\n"));
    console.log(chalk.dim("提示: 组件的 npm 依赖需要手动清理，运行:"));
    console.log(chalk.dim("  npm prune 或 pnpm prune\n"));
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}
