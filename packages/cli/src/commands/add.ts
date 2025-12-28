import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { getConfig } from "../utils/config";
import { resolveAllDependencies } from "../utils/fetcher";
import { parseSource, formatSource } from "../utils/source-parser";
import { installDeps, installDevDeps } from "../utils/installer";

interface AddOptions {
  force?: boolean;
}

export async function add(
  components: string[],
  options: AddOptions
): Promise<void> {
  const spinner = ora();

  try {
    // 1. 读取配置
    const config = await getConfig();
    const { style } = config;

    console.log(chalk.dim(`\n样式方案: ${style}\n`));

    // 显示来源信息
    for (const comp of components) {
      const source = parseSource(comp);
      if (source.type !== "official") {
        console.log(chalk.dim(`来源: ${formatSource(source)}`));
      }
    }

    // 2. 解析所有依赖 (支持第三方)
    spinner.start("解析组件依赖...");
    const resolvedItems = await resolveAllDependencies(components, style, config);
    const componentNames = resolvedItems.map((r) => r.item.name);
    spinner.succeed(`解析依赖: ${componentNames.join(", ")}`);

    if (resolvedItems.length === 0) {
      console.log(chalk.yellow("\n没有找到可安装的组件\n"));
      return;
    }

    // 3. 收集 npm 依赖
    const dependencies = new Set<string>();
    const devDependencies = new Set<string>();

    for (const { item } of resolvedItems) {
      item.dependencies?.forEach((dep) => dependencies.add(dep));
      item.devDependencies?.forEach((dep) => devDependencies.add(dep));
    }

    // 4. 安装依赖
    if (dependencies.size > 0) {
      spinner.start(`安装依赖: ${[...dependencies].join(", ")}`);
      await installDeps([...dependencies]);
      spinner.succeed("依赖安装完成");
    }

    if (devDependencies.size > 0) {
      spinner.start(`安装开发依赖: ${[...devDependencies].join(", ")}`);
      await installDevDeps([...devDependencies]);
      spinner.succeed("开发依赖安装完成");
    }

    // 5. 写入文件
    for (const { item } of resolvedItems) {
      for (const file of item.files) {
        const targetDir =
          file.type === "registry:ui"
            ? config.paths.components
            : config.paths.lib;

        const targetPath = path.join(targetDir, path.basename(file.path));

        // 检查文件是否存在
        if (existsSync(targetPath) && !options.force) {
          console.log(
            chalk.yellow(`⚠ 跳过 ${targetPath} (已存在，使用 --force 覆盖)`)
          );
          continue;
        }

        // 创建目录
        await mkdir(path.dirname(targetPath), { recursive: true });

        // 写入文件
        await writeFile(targetPath, file.content);
        console.log(chalk.green(`✔ ${file.path} → ${targetPath}`));
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
