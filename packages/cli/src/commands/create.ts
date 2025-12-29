import path from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import {
  getFrameworkAdapter,
  getFrameworkChoices,
  type FrameworkConfig,
  type FrameworkName,
} from "../utils/frameworks";

interface CreateOptions {
  yes?: boolean;
  preset?: string;
  template?: string;
  framework?: string;
}

export async function create(
  projectName: string | undefined,
  options: CreateOptions
): Promise<void> {
  console.log(chalk.cyan.bold("\n🚀 Aster - 创建项目\n"));

  try {
    // 1. 选择框架
    const frameworkName = await selectFramework(options);
    const adapter = getFrameworkAdapter(frameworkName);

    console.log(chalk.dim(`\n框架: ${adapter.displayName}\n`));

    // 2. 获取项目配置
    const config = await getProjectConfig(projectName, adapter, options);
    const targetDir = path.resolve(process.cwd(), config.projectName);

    // 检查目录是否存在
    if (existsSync(targetDir)) {
      const { overwrite } = await prompts({
        type: "confirm",
        name: "overwrite",
        message: `目录 ${config.projectName} 已存在，是否覆盖？`,
        initial: false,
      });
      if (!overwrite) {
        console.log(chalk.yellow("已取消"));
        return;
      }
    }

    const spinner = ora();

    // 3. 创建项目
    console.log(chalk.cyan(`\n正在创建 ${adapter.displayName} 项目...\n`));
    await adapter.create(config);

    // 4. 配置样式
    spinner.start(`配置 ${config.style} 样式...`);
    await adapter.setupStyle(targetDir, config.style);
    spinner.succeed("样式配置完成");

    // 5. 配置代码规范
    if (config.extraLibs.includes("lint")) {
      spinner.start("配置代码规范...");
      await adapter.setupLint(targetDir);
      spinner.succeed("代码规范配置完成");
    }

    // 6. 生成 Aster 配置
    spinner.start("生成 Aster 配置...");
    await adapter.generateAsterConfig(targetDir, config);
    spinner.succeed("Aster 配置完成");

    // 7. 输出结果
    console.log(chalk.green.bold("\n✅ 项目创建成功!\n"));
    console.log(chalk.white(`  cd ${config.projectName}`));
    console.log(chalk.white("  npm run dev\n"));

    // 提示可用命令
    console.log(chalk.cyan("接下来可以:"));
    console.log(chalk.white("  npx aster add button    # 添加组件"));
    console.log(chalk.white("  npx aster list          # 查看所有组件\n"));
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 选择框架
 */
async function selectFramework(options: CreateOptions): Promise<FrameworkName> {
  // 命令行指定
  if (options.framework) {
    return options.framework as FrameworkName;
  }

  // 默认使用 Expo
  if (options.yes) {
    return "expo";
  }

  const { framework } = await prompts({
    type: "select",
    name: "framework",
    message: "选择框架:",
    choices: getFrameworkChoices(),
    initial: 0,
  });

  return framework;
}

/**
 * 获取项目配置
 */
async function getProjectConfig(
  initialName: string | undefined,
  adapter: ReturnType<typeof getFrameworkAdapter>,
  options: CreateOptions
): Promise<FrameworkConfig> {
  // 使用默认配置
  if (options.yes) {
    return {
      projectName: initialName || "my-app",
      style: adapter.styles[0].value,
      stateLib: "none",
      extraLibs: ["lint"],
    };
  }

  const answers = await prompts([
    {
      type: initialName ? null : "text",
      name: "projectName",
      message: "项目名称:",
      initial: "my-app",
    },
    {
      type: "select",
      name: "style",
      message: "样式方案:",
      choices: adapter.styles,
      initial: 0,
    },
    {
      type: "select",
      name: "stateLib",
      message: "状态管理:",
      choices: adapter.stateLibs,
      initial: 0,
    },
    {
      type: "multiselect",
      name: "extraLibs",
      message: "选择其他库 (空格选择):",
      choices: adapter.extraLibs,
    },
  ]);

  return {
    projectName: initialName || answers.projectName,
    style: answers.style,
    stateLib: answers.stateLib,
    extraLibs: answers.extraLibs || [],
  };
}
