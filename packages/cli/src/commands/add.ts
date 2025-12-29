import path from "path";
import chalk from "chalk";
import ora from "ora";
import { getConfig, getTargetDir } from "../utils/config";
import { resolveAllDependencies } from "../utils/fetcher";
import { parseSource, formatSource } from "../utils/source-parser";
import {
  writeFile,
  fileExists,
  appendExport,
  getFileDiff,
} from "../core/fs";
import {
  installDeps,
  installDevDeps,
  filterInstalledDeps,
} from "../core/deps";

interface AddOptions {
  force?: boolean;
  skipExport?: boolean;
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

    // 4. 安装依赖 (过滤已安装的)
    if (dependencies.size > 0) {
      const depsToInstall = await filterInstalledDeps([...dependencies]);
      if (depsToInstall.length > 0) {
        spinner.start(`安装依赖: ${depsToInstall.join(", ")}`);
        installDeps(depsToInstall);
        spinner.succeed("依赖安装完成");
      }
    }

    if (devDependencies.size > 0) {
      const devDepsToInstall = await filterInstalledDeps([...devDependencies]);
      if (devDepsToInstall.length > 0) {
        spinner.start(`安装开发依赖: ${devDepsToInstall.join(", ")}`);
        installDevDeps(devDepsToInstall);
        spinner.succeed("开发依赖安装完成");
      }
    }

    // 5. 写入文件
    const installedComponents: string[] = [];

    for (const { item } of resolvedItems) {
      for (const file of item.files) {
        // 根据文件类型获取目标目录
        const targetDir = getTargetDir(file.type, config);
        const targetPath = path.join(targetDir, path.basename(file.path));

        // 检查文件冲突
        if (fileExists(targetPath) && !options.force) {
          const { hasChanges, oldContent } = await getFileDiff(
            targetPath,
            file.content
          );

          if (hasChanges) {
            console.log(
              chalk.yellow(`⚠ 跳过 ${targetPath} (已存在且有差异，使用 --force 覆盖)`)
            );
            // 显示简单差异提示
            const oldLines = oldContent.split("\n").length;
            const newLines = file.content.split("\n").length;
            console.log(
              chalk.dim(`   本地: ${oldLines} 行, 远程: ${newLines} 行`)
            );
            continue;
          }
        }

        // 写入文件 (自动创建目录)
        await writeFile(targetPath, file.content);
        console.log(chalk.green(`✔ ${file.path} → ${targetPath}`));

        // 记录安装的组件名 (只记录 UI 组件)
        if (file.type === "registry:ui") {
          const componentName = path.basename(file.path, path.extname(file.path));
          installedComponents.push(componentName);
        }
      }
    }

    // 6. 自动更新导出 (index.ts)
    if (!options.skipExport && installedComponents.length > 0) {
      const indexPath = path.join(config.paths.components, "index.ts");
      for (const componentName of installedComponents) {
        await appendExport(indexPath, componentName);
      }
      console.log(chalk.dim(`\n已更新导出: ${indexPath}`));
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
