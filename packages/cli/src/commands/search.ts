/**
 * Search 命令 - 搜索组件
 */

import chalk from "chalk";
import ora from "ora";
import { getConfig, hasConfig } from "../utils/config";
import { fetchRegistry } from "../services/registry";

interface SearchResult {
  name: string;
  description: string;
  source: "official" | "community";
  namespace?: string;
}

// 社区组件索引 (后续可以从远程获取)
const COMMUNITY_COMPONENTS: SearchResult[] = [
  // 示例数据，实际上线后从 API 获取
  {
    name: "fancy-button",
    description: "带动画效果的按钮",
    source: "community",
    namespace: "github:aster/examples",
  },
  {
    name: "gradient-card",
    description: "渐变背景卡片",
    source: "community",
    namespace: "github:aster/examples",
  },
];

export async function search(query?: string): Promise<void> {
  const spinner = ora();

  try {
    // 获取配置 (如果存在)
    let style: "nativewind" | "stylesheet" = "nativewind";
    if (hasConfig()) {
      const config = await getConfig();
      style = config.style;
    }

    // 获取官方组件列表
    spinner.start("搜索组件...");
    let officialComponents: SearchResult[] = [];

    try {
      const registry = await fetchRegistry("expo", style);
      officialComponents = registry.map((item) => ({
        name: item.name,
        description: item.description || "",
        source: "official" as const,
      }));
    } catch {
      // 离线时使用缓存或跳过
    }

    spinner.stop();

    // 合并所有组件
    const allComponents = [...officialComponents, ...COMMUNITY_COMPONENTS];

    // 搜索过滤
    let results = allComponents;
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = allComponents.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery)
      );
    }

    if (results.length === 0) {
      console.log(chalk.yellow(`\n没有找到匹配 "${query}" 的组件\n`));
      return;
    }

    // 分组显示
    const official = results.filter((r) => r.source === "official");
    const community = results.filter((r) => r.source === "community");

    console.log(
      chalk.bold(`\n🔍 搜索结果${query ? ` "${query}"` : ""} (${results.length} 个)\n`)
    );

    if (official.length > 0) {
      console.log(chalk.cyan("官方组件:"));
      for (const comp of official) {
        console.log(`  ${chalk.green(comp.name.padEnd(20))} ${chalk.dim(comp.description)}`);
      }
      console.log();
    }

    if (community.length > 0) {
      console.log(chalk.cyan("社区组件:"));
      for (const comp of community) {
        console.log(
          `  ${chalk.green(comp.name.padEnd(20))} ${chalk.dim(comp.description)}`
        );
        console.log(chalk.dim(`    → npx aster add ${comp.namespace}/${comp.name}`));
      }
      console.log();
    }

    // 使用提示
    console.log(chalk.dim("安装组件: npx aster add <component>"));
    console.log(chalk.dim("查看详情: npx aster info <component>\n"));
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}
