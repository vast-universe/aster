/**
 * 依赖管理 - 统一管理 npm 依赖安装
 */

import { execSync } from "child_process";
import path from "path";
import { readJson, fileExists } from "./fs";

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * 检测包管理器
 */
export function detectPackageManager(
  cwd: string = process.cwd()
): "npm" | "yarn" | "pnpm" | "bun" {
  if (fileExists(path.join(cwd, "bun.lockb"))) return "bun";
  if (fileExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fileExists(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

/**
 * 安装依赖
 */
export function installDependencies(
  deps: string[],
  options: { cwd?: string; dev?: boolean } = {}
): void {
  if (deps.length === 0) return;

  const { cwd = process.cwd(), dev = false } = options;
  const pm = detectPackageManager(cwd);

  let command: string;
  switch (pm) {
    case "bun":
      command = `bun add ${dev ? "-d" : ""} ${deps.join(" ")}`;
      break;
    case "pnpm":
      command = `pnpm add ${dev ? "-D" : ""} ${deps.join(" ")}`;
      break;
    case "yarn":
      command = `yarn add ${dev ? "-D" : ""} ${deps.join(" ")}`;
      break;
    default:
      command = `npm install ${dev ? "-D" : ""} ${deps.join(" ")}`;
  }

  execSync(command, { cwd, stdio: "pipe" });
}

/**
 * 安装生产依赖
 */
export function installDeps(deps: string[], cwd?: string): void {
  installDependencies(deps, { cwd, dev: false });
}

/**
 * 安装开发依赖
 */
export function installDevDeps(deps: string[], cwd?: string): void {
  installDependencies(deps, { cwd, dev: true });
}

/**
 * 检查依赖是否已安装
 */
export async function isDependencyInstalled(
  dep: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  const pkgPath = path.join(cwd, "package.json");
  if (!fileExists(pkgPath)) return false;

  const pkg = await readJson<PackageJson>(pkgPath);
  const depName = dep.split("@")[0]; // 处理 @scope/name@version

  return !!(pkg.dependencies?.[depName] || pkg.devDependencies?.[depName]);
}

/**
 * 过滤已安装的依赖
 */
export async function filterInstalledDeps(
  deps: string[],
  cwd?: string
): Promise<string[]> {
  const results = await Promise.all(
    deps.map(async (dep) => ({
      dep,
      installed: await isDependencyInstalled(dep, cwd),
    }))
  );

  return results.filter((r) => !r.installed).map((r) => r.dep);
}
