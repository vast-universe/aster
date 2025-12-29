/**
 * Lockfile 管理 - 追踪已安装的组件和配置
 */

import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import type { Lockfile, LockfileEntry } from "../types/config";

const LOCKFILE_NAME = "aster.lock";

function getLockfilePath(cwd = process.cwd()): string {
  return path.join(cwd, LOCKFILE_NAME);
}

function createEmptyLockfile(): Lockfile {
  return { lockfileVersion: 1, components: {}, configs: {} };
}

export async function readLockfile(cwd = process.cwd()): Promise<Lockfile> {
  const lockfilePath = getLockfilePath(cwd);

  if (!existsSync(lockfilePath)) {
    return createEmptyLockfile();
  }

  try {
    const content = await readFile(lockfilePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return createEmptyLockfile();
  }
}

export async function writeLockfile(lockfile: Lockfile, cwd = process.cwd()): Promise<void> {
  const lockfilePath = getLockfilePath(cwd);
  await writeFile(lockfilePath, JSON.stringify(lockfile, null, 2));
}

export async function recordComponent(
  name: string,
  source: string,
  files: string[],
  cwd = process.cwd()
): Promise<void> {
  const lockfile = await readLockfile(cwd);
  lockfile.components[name] = {
    version: Date.now().toString(),
    installedAt: new Date().toISOString(),
    source,
    files,
  };
  await writeLockfile(lockfile, cwd);
}

export async function recordConfig(
  name: string,
  source: string,
  files: string[],
  cwd = process.cwd()
): Promise<void> {
  const lockfile = await readLockfile(cwd);
  lockfile.configs[name] = {
    version: Date.now().toString(),
    installedAt: new Date().toISOString(),
    source,
    files,
  };
  await writeLockfile(lockfile, cwd);
}

export async function getInstalledComponents(cwd = process.cwd()): Promise<string[]> {
  const lockfile = await readLockfile(cwd);
  return Object.keys(lockfile.components);
}

export async function getInstalledConfigs(cwd = process.cwd()): Promise<string[]> {
  const lockfile = await readLockfile(cwd);
  return Object.keys(lockfile.configs);
}

export async function removeComponentRecord(name: string, cwd = process.cwd()): Promise<string[]> {
  const lockfile = await readLockfile(cwd);
  const entry = lockfile.components[name];
  const files = entry?.files || [];
  delete lockfile.components[name];
  await writeLockfile(lockfile, cwd);
  return files;
}

export async function removeConfigRecord(name: string, cwd = process.cwd()): Promise<string[]> {
  const lockfile = await readLockfile(cwd);
  const entry = lockfile.configs[name];
  const files = entry?.files || [];
  delete lockfile.configs[name];
  await writeLockfile(lockfile, cwd);
  return files;
}

export function hasLockfile(cwd = process.cwd()): boolean {
  return existsSync(getLockfilePath(cwd));
}
