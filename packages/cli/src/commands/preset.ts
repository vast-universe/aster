/**
 * Preset 命令 - 管理预设配置
 */

import chalk from "chalk";
import prompts from "prompts";
import {
  getAllPresets,
  getPreset,
  deleteUserPreset,
  type Preset,
} from "../utils/presets";

/** 列出所有预设 */
export async function presetList(): Promise<void> {
  const presets = await getAllPresets();

  console.log(chalk.cyan.bold("\n📦 可用预设\n"));

  // 按框架分组
  const grouped = presets.reduce(
    (acc, p) => {
      if (!acc[p.framework]) acc[p.framework] = [];
      acc[p.framework].push(p);
      return acc;
    },
    {} as Record<string, Preset[]>
  );

  for (const [framework, items] of Object.entries(grouped)) {
    console.log(chalk.yellow(`\n${framework.toUpperCase()}`));
    for (const p of items) {
      const source = p.source === "user" ? chalk.dim(" (自定义)") : "";
      console.log(`  ${chalk.green(p.name)}${source}`);
      console.log(chalk.dim(`    ${p.description}`));
      console.log(
        chalk.dim(`    样式: ${p.style} | 状态: ${p.stateLib} | 库: ${p.extraLibs.join(", ")}`)
      );
    }
  }

  console.log(chalk.dim("\n使用: npx aster create my-app --preset <name>\n"));
}

/** 显示预设详情 */
export async function presetInfo(name?: string): Promise<void> {
  if (!name) {
    const presets = await getAllPresets();
    const { selected } = await prompts({
      type: "select",
      name: "selected",
      message: "选择预设:",
      choices: presets.map((p) => ({
        title: `${p.name} - ${p.description}`,
        value: p.name,
      })),
    });
    name = selected;
  }

  if (!name) return;

  const preset = await getPreset(name);
  if (!preset) {
    console.error(chalk.red(`预设 "${name}" 不存在`));
    return;
  }

  console.log(chalk.cyan.bold(`\n📦 预设: ${preset.name}\n`));
  console.log(`描述: ${preset.description}`);
  console.log(`来源: ${preset.source === "user" ? "自定义" : "内置"}`);
  console.log(`\n配置:`);
  console.log(`  框架: ${preset.framework}`);
  console.log(`  样式: ${preset.style}`);
  console.log(`  状态管理: ${preset.stateLib}`);
  console.log(`  额外库: ${preset.extraLibs.join(", ") || "无"}`);
  console.log();
}

/** 删除用户预设 */
export async function presetRemove(name?: string): Promise<void> {
  if (!name) {
    const presets = await getAllPresets();
    const userPresets = presets.filter((p) => p.source === "user");

    if (userPresets.length === 0) {
      console.log(chalk.yellow("没有自定义预设"));
      return;
    }

    const { selected } = await prompts({
      type: "select",
      name: "selected",
      message: "选择要删除的预设:",
      choices: userPresets.map((p) => ({
        title: `${p.name} - ${p.description}`,
        value: p.name,
      })),
    });
    name = selected;
  }

  if (!name) return;

  const preset = await getPreset(name);
  if (!preset) {
    console.error(chalk.red(`预设 "${name}" 不存在`));
    return;
  }

  if (preset.source !== "user") {
    console.error(chalk.red("只能删除自定义预设"));
    return;
  }

  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: `确定删除预设 "${name}"？`,
    initial: false,
  });

  if (!confirm) return;

  const success = await deleteUserPreset(name);
  if (success) {
    console.log(chalk.green(`\n预设 "${name}" 已删除\n`));
  } else {
    console.error(chalk.red("删除失败"));
  }
}
