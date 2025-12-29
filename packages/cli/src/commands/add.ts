import path from "path";
import chalk from "chalk";
import ora from "ora";
import { getConfig, getTargetDir } from "../utils/config";
import { resolveAllDependencies } from "../utils/fetcher";
import { parseSource, formatSource, isConfigSource } from "../utils/source-parser";
import { writeFile, fileExists, appendExport, getFileDiff } from "../core/fs";
import { installDeps, installDevDeps, filterInstalledDeps } from "../core/deps";
import { installConfig } from "../core/installer";
import { recordComponent, recordConfig } from "../core/lockfile";

interface AddOptions {
  force?: boolean;
  skipExport?: boolean;
}

export async function add(components: string[], options: AddOptions): Promise<void> {
  const spinner = ora();

  try {
    const config = await getConfig();
    const { style } = config;

    const configItems = components.filter(isConfigSource);
    const componentItems = components.filter((c) => !isConfigSource(c));

    if (componentItems.length > 0) {
      console.log(chalk.dim(`\n样式方案: ${style}\n`));
    }

    for (const comp of components) {
      const source = parseSource(comp);
      if (source.type !== "official") {
        console.log(chalk.dim(`来源: ${formatSource(source)}`));
      }
    }

    // 处理配置片段
    if (configItems.length > 0) {
      spinner.start("解析配置片段...");
      const configResolved = await resolveAllDependencies(configItems, style, config);
      spinner.succeed(`配置片段: ${configResolved.map((r) => r.item.name).join(", ")}`);

      for (const { source, item } of configResolved) {
        spinner.start(`安装 ${item.name}...`);
        const result = await installConfig(item, { force: options.force });
        if (result.files.length > 0) {
          spinner.succeed(`${item.name} 安装完成`);
          result.files.forEach((f) => console.log(chalk.dim(`  + ${f}`)));
          await recordConfig(item.name, source, result.files);
        } else {
          spinner.info(`${item.name} 已存在 (使用 --force 覆盖)`);
        }
      }
    }

    // 处理普通组件
    if (componentItems.length > 0) {
      spinner.start("解析组件依赖...");
      const resolvedItems = await resolveAllDependencies(componentItems, style, config);
      const componentNames = resolvedItems.map((r) => r.item.name);
      spinner.succeed(`解析依赖: ${componentNames.join(", ")}`);

      if (resolvedItems.length === 0) {
        console.log(chalk.yellow("\n没有找到可安装的组件\n"));
        return;
      }

      const dependencies = new Set<string>();
      const devDependencies = new Set<string>();

      for (const { item } of resolvedItems) {
        item.dependencies?.forEach((dep) => dependencies.add(dep));
        item.devDependencies?.forEach((dep) => devDependencies.add(dep));
      }

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

      const installedComponents: string[] = [];

      for (const { source, item } of resolvedItems) {
        const componentFiles: string[] = [];

        for (const file of item.files) {
          let targetPath: string;
          if (file.target) {
            targetPath = file.target;
          } else {
            const targetDir = getTargetDir(file.type, config);
            targetPath = path.join(targetDir, path.basename(file.path));
          }

          if (fileExists(targetPath) && !options.force) {
            const { hasChanges, oldContent } = await getFileDiff(targetPath, file.content);
            if (hasChanges) {
              console.log(chalk.yellow(`⚠ 跳过 ${targetPath} (已存在且有差异，使用 --force 覆盖)`));
              console.log(chalk.dim(`   本地: ${oldContent.split("\n").length} 行, 远程: ${file.content.split("\n").length} 行`));
              continue;
            }
          }

          await writeFile(targetPath, file.content);
          console.log(chalk.green(`✔ ${item.name} → ${targetPath}`));
          componentFiles.push(targetPath);

          if (file.type === "registry:ui") {
            const componentName = path.basename(targetPath, path.extname(targetPath));
            installedComponents.push(componentName);
          }
        }

        if (componentFiles.length > 0) {
          await recordComponent(item.name, source, componentFiles);
        }
      }

      if (!options.skipExport && installedComponents.length > 0) {
        const indexPath = path.join(config.paths.components, "index.ts");
        for (const componentName of installedComponents) {
          await appendExport(indexPath, componentName);
        }
        console.log(chalk.dim(`\n已更新导出: ${indexPath}`));
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
