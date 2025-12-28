/**
 * 离线缓存管理
 * 缓存已下载的组件，支持离线使用
 */

import { mkdir, readFile, writeFile, readdir, unlink, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import type { RegistryItem } from "./registry";

// 缓存目录
const CACHE_DIR = path.join(os.homedir(), ".aster", "cache");
const CACHE_INDEX_FILE = path.join(CACHE_DIR, "index.json");
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 天

interface CacheIndex {
  version: string;
  items: Record<string, CacheEntry>;
}

interface CacheEntry {
  name: string;
  style: string;
  source: string;
  cachedAt: number;
  filePath: string;
}

/**
 * 初始化缓存目录
 */
async function ensureCacheDir(): Promise<void> {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true });
  }
}

/**
 * 获取缓存索引
 */
async function getCacheIndex(): Promise<CacheIndex> {
  await ensureCacheDir();

  if (!existsSync(CACHE_INDEX_FILE)) {
    return { version: "1.0", items: {} };
  }

  try {
    const content = await readFile(CACHE_INDEX_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return { version: "1.0", items: {} };
  }
}

/**
 * 保存缓存索引
 */
async function saveCacheIndex(index: CacheIndex): Promise<void> {
  await ensureCacheDir();
  await writeFile(CACHE_INDEX_FILE, JSON.stringify(index, null, 2));
}

/**
 * 生成缓存 key
 */
function getCacheKey(name: string, style: string, source: string): string {
  return `${source}:${style}:${name}`;
}

/**
 * 缓存组件
 */
export async function cacheComponent(
  item: RegistryItem,
  style: string,
  source: string
): Promise<void> {
  await ensureCacheDir();

  const key = getCacheKey(item.name, style, source);
  const fileName = `${key.replace(/[/:]/g, "_")}.json`;
  const filePath = path.join(CACHE_DIR, fileName);

  // 保存组件数据
  await writeFile(filePath, JSON.stringify(item, null, 2));

  // 更新索引
  const index = await getCacheIndex();
  index.items[key] = {
    name: item.name,
    style,
    source,
    cachedAt: Date.now(),
    filePath: fileName,
  };
  await saveCacheIndex(index);
}

/**
 * 从缓存获取组件
 */
export async function getCachedComponent(
  name: string,
  style: string,
  source: string
): Promise<RegistryItem | null> {
  const index = await getCacheIndex();
  const key = getCacheKey(name, style, source);
  const entry = index.items[key];

  if (!entry) {
    return null;
  }

  // 检查是否过期
  if (Date.now() - entry.cachedAt > CACHE_TTL) {
    return null;
  }

  const filePath = path.join(CACHE_DIR, entry.filePath);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * 检查缓存是否存在且有效
 */
export async function hasCachedComponent(
  name: string,
  style: string,
  source: string
): Promise<boolean> {
  const cached = await getCachedComponent(name, style, source);
  return cached !== null;
}

/**
 * 清理过期缓存
 */
export async function cleanExpiredCache(): Promise<number> {
  const index = await getCacheIndex();
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of Object.entries(index.items)) {
    if (now - entry.cachedAt > CACHE_TTL) {
      const filePath = path.join(CACHE_DIR, entry.filePath);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
      delete index.items[key];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    await saveCacheIndex(index);
  }

  return cleaned;
}

/**
 * 清空所有缓存
 */
export async function clearAllCache(): Promise<number> {
  const index = await getCacheIndex();
  let cleared = 0;

  for (const entry of Object.values(index.items)) {
    const filePath = path.join(CACHE_DIR, entry.filePath);
    if (existsSync(filePath)) {
      await unlink(filePath);
      cleared++;
    }
  }

  await saveCacheIndex({ version: "1.0", items: {} });
  return cleared;
}

/**
 * 获取缓存统计
 */
export async function getCacheStats(): Promise<{
  count: number;
  size: number;
  oldestAt: number | null;
}> {
  const index = await getCacheIndex();
  const entries = Object.values(index.items);

  let totalSize = 0;
  let oldestAt: number | null = null;

  for (const entry of entries) {
    const filePath = path.join(CACHE_DIR, entry.filePath);
    if (existsSync(filePath)) {
      const stats = await stat(filePath);
      totalSize += stats.size;
    }

    if (oldestAt === null || entry.cachedAt < oldestAt) {
      oldestAt = entry.cachedAt;
    }
  }

  return {
    count: entries.length,
    size: totalSize,
    oldestAt,
  };
}

/**
 * 列出所有缓存的组件
 */
export async function listCachedComponents(): Promise<CacheEntry[]> {
  const index = await getCacheIndex();
  return Object.values(index.items);
}
