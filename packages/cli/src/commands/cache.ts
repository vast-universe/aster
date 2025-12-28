/**
 * Cache 命令 - 管理离线缓存
 */

import chalk from "chalk";
import ora from "ora";
import {
  getCacheStats,
  listCachedComponents,
  cleanExpiredCache,
  clearAllCache,
} from "../utils/cache";

/**
 * 显示缓存状态
 */
export async function cacheStatus(): Promise<void> {
  const spinner = ora();

  try {
    spinner.start("获取缓存信息...");
    const stats = await getCacheStats();
    const cached = await listCachedComponents();
    spinner.stop();

    console.log(chalk.bold("\n📦 缓存状态\n"));

    console.log(`组件数量: ${chalk.cyan(stats.count)}`);
    console.log(`缓存大小: ${chalk.cyan(formatSize(stats.size))}`);

    if (stats.oldestAt) {
      const age = Date.now() - stats.oldestAt;
      console.log(`最早缓存: ${chalk.cyan(formatAge(age))} 前`);
    }

    if (cached.length > 0) {
      console.log(chalk.dim("\n已缓存的组件:"));
      
      // 按来源分组
      const bySource = new Map<string, typeof cached>();
      for (const entry of cached) {
        const source = entry.source || "official";
        if (!bySource.has(source)) {
          bySource.set(source, []);
        }
        bySource.get(source)!.push(entry);
      }

      for (const [source, entries] of bySource) {
        console.log(chalk.cyan(`\n  ${source}:`));
        for (const entry of entries) {
          const age = formatAge(Date.now() - entry.cachedAt);
          console.log(`    ${entry.name} (${entry.style}) - ${chalk.dim(age + " 前")}`);
        }
      }
    }

    console.log();
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 清理过期缓存
 */
export async function cacheClean(): Promise<void> {
  const spinner = ora();

  try {
    spinner.start("清理过期缓存...");
    const cleaned = await cleanExpiredCache();
    spinner.succeed(`已清理 ${cleaned} 个过期缓存`);
    console.log();
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 清空所有缓存
 */
export async function cacheClear(): Promise<void> {
  const spinner = ora();

  try {
    spinner.start("清空所有缓存...");
    const cleared = await clearAllCache();
    spinner.succeed(`已清空 ${cleared} 个缓存`);
    console.log();
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      console.error(chalk.red(`\n错误: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 格式化时间间隔
 */
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} 秒`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时`;

  const days = Math.floor(hours / 24);
  return `${days} 天`;
}
