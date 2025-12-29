/**
 * Update 命令 - 更新已安装的组件
 */

import path from "path";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import { createHash } from "crypto";
import { getConfig, getTargetDir } from "../utils/config";
import { fetchComponentFromSource } from "../utils/fetcher";
import {
  writeFile,
  readFile,
  getInstalledComponents,
  findComponentFile,
} from "../core/fs";

interface UpdateInfo {
  name: string;
  hasUpdate: boolean;
  localHash?: string;
  remoteHash?: string;
}

export async function update(
  components: string[],
  options: { all?: boolean; force?: boolean }
): Promise<void> {
  const spinner = ora();

  try {
    const config = await getConfig();
    const { style } = config;
    const componentsDir = config.paths.components;

    // 获取已安装的组件
    const installed = getInstalledComponents(componentsDir);

    if (installed.length === 0) {
      console.log(chalk.yellow("\n没有已安装的组件\n"));
      return;
    }

    // 确定要检查的组件
    let toCheck: string[];
    if (options.all || components.length === 0) {
      toCheck = installed;
    } else {
      toCheck = components.filter((c) => installed.includes(c));
      const notInstalled = components.filter((c) => !installed.includes(c));
      if (notInstalled.length > 0) {
        console.log(
          chalk.yellow(`\n⚠ 以下组件未安装: ${notInstalled.join(", ")}\n`)
        );
      }
    }

    if (toCheck.length === 0) {
      console.log(chalk.yellow("\n没有需要检查的组件\n"));
      return;
    }

    console.log(chalk.dim(`\n检查 ${toCheck.length} 个组件的更新...\n`));

    // 检查更新
    spinner.start("检查更新...");
    const updates: UpdateInfo[] = [];

    for (const name of toCheck) {
      try {
        const localPath = findComponentFile(componentsDir, name);
        if (!localPath) continue;

        const localContent = await readFile(localPath);
        const localHash = hashContent(localContent);

        const remoteItem = await fetchComponentFromSource(name, style, config);
        const remoteContent = remoteItem.files[0]?.content || "";
        const remoteHash = hashContent(remoteContent);

        updates.push({
          name,
          hasUpdate: localHash !== remoteHash,
          localHash,
          remoteHash,
        });
      } catch {
        // 获取远程失败，跳过
        updates.push({
          name,
          hasUpdate: false,
        });
      }
    }

    spinner.stop();

    // 显示结果
    const withUpdates = updates.filter((u) => u.hasUpdate);
    const upToDate = updates.filter((u) => !u.hasUpdate);

    if (withUpdates.length === 0) {
      console.log(chalk.green("✔ 所有组件都是最新的\n"));
      return;
    }

    console.log(chalk.cyan("有更新的组件:"));
    for (const u of withUpdates) {
      console.log(`  ${chalk.yellow("●")} ${u.name}`);
    }

    if (upToDate.length > 0) {
      console.log(
        chalk.dim(`\n已是最新: ${upToDate.map((u) => u.name).join(", ")}`)
      );
    }

    // 确认更新
    let toUpdate: string[];
    if (!options.force) {
      const answer = await prompts({
        type: "multiselect",
        name: "selected",
        message: "选择要更新的组件:",
        choices: withUpdates.map((u) => ({
          title: u.name,
          value: u.name,
          selected: true,
        })),
      });

      if (!answer.selected || answer.selected.length === 0) {
        console.log(chalk.yellow("\n已取消\n"));
        return;
      }

      toUpdate = answer.selected;
    } else {
      toUpdate = withUpdates.map((u) => u.name);
    }

    console.log();

    // 执行更新
    for (const name of toUpdate) {
      spinner.start(`更新 ${name}...`);

      try {
        const remoteItem = await fetchComponentFromSource(name, style, config);

        for (const file of remoteItem.files) {
          const targetDir = getTargetDir(file.type, config);
          const targetPath = path.join(targetDir, path.basename(file.path));
          await writeFile(targetPath, file.content);
        }

        spinner.succeed(`已更新 ${name}`);
      } catch {
        spinner.fail(`更新 ${name} 失败`);
      }
    }

    console.log(chalk.green("\n完成! 🎉\n"));
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 计算内容哈希 (忽略空白差异)
 */
function hashContent(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return createHash("md5").update(normalized).digest("hex");
}
