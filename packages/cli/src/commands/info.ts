import { existsSync } from "fs";
import path from "path";
import chalk from "chalk";
import { getConfig, hasConfig } from "../utils/config";

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
  console.log(chalk.cyan("样式方案:"), config.style);
  console.log(chalk.cyan("TypeScript:"), config.typescript ? "是" : "否");
  console.log(chalk.cyan("组件目录:"), config.paths.components);
  console.log(chalk.cyan("工具目录:"), config.paths.lib);

  // 检查目录是否存在
  const componentsExist = existsSync(config.paths.components);
  const libExist = existsSync(config.paths.lib);

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

  // 统计已安装组件
  if (componentsExist) {
    const fs = await import("fs/promises");
    const files = await fs.readdir(config.paths.components);
    const components = files.filter((f) => f.endsWith(".tsx"));
    console.log();
    console.log(chalk.cyan("已安装组件:"), components.length);
    if (components.length > 0) {
      console.log(
        chalk.dim("  " + components.map((f) => f.replace(".tsx", "")).join(", "))
      );
    }
  }

  console.log();
}
