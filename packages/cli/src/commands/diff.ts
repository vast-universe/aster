/**
 * Diff 命令 - 检查组件更新
 */

import chalk from "chalk";
import { getConfig, hasConfig } from "../utils/config";
import { fetchComponent, fetchRegistry } from "../utils/registry";
import {
  readFile,
  getInstalledComponents,
  findComponentFile,
} from "../core/fs";

export async function diff(componentName?: string): Promise<void> {
  try {
    if (!hasConfig()) {
      console.log(chalk.red("\n找不到 aster.json，请先运行 npx aster init\n"));
      process.exit(1);
    }

    const config = await getConfig();
    const { style } = config;

    console.log(chalk.dim(`\n样式方案: ${style}\n`));

    if (componentName) {
      // 对比单个组件
      await diffSingleComponent(componentName, config);
    } else {
      // 检查所有组件更新
      await diffAllComponents(config);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

async function diffAllComponents(
  config: Awaited<ReturnType<typeof getConfig>>
) {
  const registry = await fetchRegistry(config.style);
  const installed = getInstalledComponents(config.paths.components);
  const componentsWithUpdates: string[] = [];

  console.log(chalk.dim("检查组件更新...\n"));

  for (const item of registry) {
    if (item.type !== "registry:ui") continue;
    if (!installed.includes(item.name)) continue;

    const localPath = findComponentFile(config.paths.components, item.name);
    if (!localPath) continue;

    try {
      const remoteItem = await fetchComponent(item.name, config.style);
      const localContent = await readFile(localPath);
      const remoteContent = remoteItem.files[0]?.content || "";

      if (normalizeContent(localContent) !== normalizeContent(remoteContent)) {
        componentsWithUpdates.push(item.name);
      }
    } catch {
      // 忽略获取失败的组件
    }
  }

  if (componentsWithUpdates.length === 0) {
    console.log(chalk.green("✔ 所有组件都是最新的\n"));
    return;
  }

  console.log(chalk.yellow("以下组件有更新:\n"));
  for (const name of componentsWithUpdates) {
    console.log(`  - ${chalk.cyan(name)}`);
  }
  console.log(
    chalk.dim(`\n运行 `) +
      chalk.cyan(`npx aster diff <组件名>`) +
      chalk.dim(` 查看具体差异\n`)
  );
}

async function diffSingleComponent(
  name: string,
  config: Awaited<ReturnType<typeof getConfig>>
) {
  const localPath = findComponentFile(config.paths.components, name);

  if (!localPath) {
    console.log(chalk.yellow(`组件 ${name} 不存在于本地\n`));
    return;
  }

  const remoteItem = await fetchComponent(name, config.style);
  const localContent = await readFile(localPath);
  const remoteContent = remoteItem.files[0]?.content || "";

  if (normalizeContent(localContent) === normalizeContent(remoteContent)) {
    console.log(chalk.green(`✔ ${name} 已是最新版本\n`));
    return;
  }

  console.log(chalk.yellow(`${name} 有差异:\n`));
  console.log(chalk.dim("─".repeat(50)));

  // 简单的行对比
  const localLines = localContent.split("\n");
  const remoteLines = remoteContent.split("\n");

  const maxLines = Math.max(localLines.length, remoteLines.length);
  let diffCount = 0;

  for (let i = 0; i < maxLines; i++) {
    const local = localLines[i] || "";
    const remote = remoteLines[i] || "";

    if (local !== remote) {
      diffCount++;
      if (diffCount <= 20) {
        // 只显示前 20 处差异
        console.log(chalk.dim(`行 ${i + 1}:`));
        if (local) console.log(chalk.red(`- ${local}`));
        if (remote) console.log(chalk.green(`+ ${remote}`));
        console.log();
      }
    }
  }

  if (diffCount > 20) {
    console.log(chalk.dim(`... 还有 ${diffCount - 20} 处差异\n`));
  }

  console.log(chalk.dim("─".repeat(50)));
  console.log(
    chalk.dim("\n运行 ") +
      chalk.cyan(`npx aster add ${name} --force`) +
      chalk.dim(` 更新组件\n`)
  );
}

function normalizeContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/gm, "")
    .trim();
}
