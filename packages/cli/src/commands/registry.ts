/**
 * Registry 管理命令
 * 添加、删除、列出第三方 registry
 * */

import chalk from "chalk";
import prompts from "prompts";
import {
  getConfig,
  addRegistry,
  removeRegistry,
  getRegistries,
  hasConfig,
} from "../utils/config";

/**
 * 添加 registry
 */
export async function registryAdd(name?: string, url?: string): Promise<void> {
  if (!hasConfig()) {
    console.error(chalk.red("\n错误: 找不到 aster.json，请先运行 npx aster init\n"));
    process.exit(1);
  }

  // 交互式输入
  if (!name || !url) {
    const answers = await prompts([
      {
        type: "text",
        name: "name",
        message: "Registry 名称 (如 @acme):",
        initial: name || "@",
        validate: (v) => v.startsWith("@") || "名称必须以 @ 开头",
      },
      {
        type: "text",
        name: "url",
        message: "Registry URL:",
        initial: url || "https://",
        validate: (v) => v.startsWith("http") || "URL 必须以 http 开头",
      },
    ]);

    name = answers.name;
    url = answers.url;
  }

  if (!name || !url) {
    console.log(chalk.yellow("\n已取消\n"));
    return;
  }

  // 确保名称以 @ 开头
  if (!name.startsWith("@")) {
    name = `@${name}`;
  }

  await addRegistry(name, url);
  console.log(chalk.green(`\n✔ 已添加 registry: ${name} → ${url}\n`));
  console.log(chalk.dim(`使用方式: npx aster add ${name}/component-name\n`));
}

/**
 * 删除 registry
 */
export async function registryRemove(name?: string): Promise<void> {
  if (!hasConfig()) {
    console.error(chalk.red("\n错误: 找不到 aster.json，请先运行 npx aster init\n"));
    process.exit(1);
  }

  const config = await getConfig();
  const registries = getRegistries(config);
  const registryNames = Object.keys(registries);

  if (registryNames.length === 0) {
    console.log(chalk.yellow("\n没有配置任何第三方 registry\n"));
    return;
  }

  // 交互式选择
  if (!name) {
    const answer = await prompts({
      type: "select",
      name: "name",
      message: "选择要删除的 registry:",
      choices: registryNames.map((n) => ({
        title: `${n} → ${typeof registries[n] === "string" ? registries[n] : (registries[n] as any).url}`,
        value: n,
      })),
    });

    name = answer.name;
  }

  if (!name) {
    console.log(chalk.yellow("\n已取消\n"));
    return;
  }

  await removeRegistry(name);
  console.log(chalk.green(`\n✔ 已删除 registry: ${name}\n`));
}

/**
 * 列出所有 registry
 */
export async function registryList(): Promise<void> {
  if (!hasConfig()) {
    console.error(chalk.red("\n错误: 找不到 aster.json，请先运行 npx aster init\n"));
    process.exit(1);
  }

  const config = await getConfig();
  const registries = getRegistries(config);
  const registryNames = Object.keys(registries);

  console.log(chalk.bold("\n📦 已配置的 Registry\n"));

  // 官方 registry
  console.log(chalk.cyan("官方:"));
  console.log(`  @aster → https://aster.dev/api/r (默认)\n`);

  // 第三方 registry
  if (registryNames.length > 0) {
    console.log(chalk.cyan("第三方:"));
    for (const name of registryNames) {
      const value = registries[name];
      const url = typeof value === "string" ? value : value.url;
      console.log(`  ${name} → ${url}`);
    }
    console.log();
  } else {
    console.log(chalk.dim("暂无第三方 registry\n"));
  }

  // 使用提示
  console.log(chalk.dim("添加 registry: npx aster registry add"));
  console.log(chalk.dim("使用第三方组件: npx aster add @namespace/component"));
  console.log(chalk.dim("使用 GitHub 组件: npx aster add github:user/repo/component\n"));
}
