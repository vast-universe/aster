import chalk from "chalk";
import { getConfig, hasConfig } from "../utils/config";
import { fileExists, getInstalledComponents } from "../core/fs";

export async function info(): Promise<void> {
  console.log(chalk.bold("\n📋 Aster 配置信息\n"));

  // 检查配置文件
  if (!hasConfig()) {
    console.log(chalk.yellow("⚠ 未初始化"));
    console.log(chalk.dim("  运行 npx aster init 初始化项目\n"));
    return;
  }

  const config = await getConfig();

  console.log(chalk.cyan("配置文件:"), "aster.json");
  console.log(chalk.cyan("框架:"), config.framework || "未指定");
  console.log(chalk.cyan("样式方案:"), config.style);
  console.log(chalk.cyan("TypeScript:"), config.typescript ? "是" : "否");

  console.log();
  console.log(chalk.cyan("路径配置:"));
  console.log(`  组件: ${config.paths.components}`);
  console.log(`  工具: ${config.paths.lib}`);
  console.log(`  Hooks: ${config.paths.hooks || "未配置"}`);

  // 检查目录是否存在
  const componentsExist = fileExists(config.paths.components);
  const libExist = fileExists(config.paths.lib);
  const hooksExist = config.paths.hooks && fileExists(config.paths.hooks);

  console.log();
  console.log(chalk.cyan("目录状态:"));
  console.log(
    `  ${config.paths.components}: ${
      componentsExist ? chalk.green("✔ 存在") : chalk.dim("未创建")
    }`
  );
  console.log(
    `  ${config.paths.lib}: ${
      libExist ? chalk.green("✔ 存在") : chalk.dim("未创建")
    }`
  );
  if (config.paths.hooks) {
    console.log(
      `  ${config.paths.hooks}: ${
        hooksExist ? chalk.green("✔ 存在") : chalk.dim("未创建")
      }`
    );
  }

  // 统计已安装组件
  if (componentsExist) {
    const components = getInstalledComponents(config.paths.components);
    console.log();
    console.log(chalk.cyan("已安装组件:"), components.length);
    if (components.length > 0) {
      console.log(chalk.dim("  " + components.join(", ")));
    }
  }

  // 显示 registries
  if (config.registries && Object.keys(config.registries).length > 0) {
    console.log();
    console.log(chalk.cyan("第三方 Registry:"));
    for (const [name, url] of Object.entries(config.registries)) {
      console.log(`  ${name}: ${typeof url === "string" ? url : url.url}`);
    }
  }

  console.log();
}
