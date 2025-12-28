import { execa } from "execa";
import { existsSync } from "fs";
import path from "path";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

function detectPackageManager(): PackageManager {
  const cwd = process.cwd();

  if (existsSync(path.join(cwd, "bun.lockb"))) return "bun";
  if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export async function installDeps(deps: string[]): Promise<void> {
  if (deps.length === 0) return;

  const pm = detectPackageManager();
  const args = pm === "npm" ? ["install", ...deps] : ["add", ...deps];

  await execa(pm, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}

export async function installDevDeps(deps: string[]): Promise<void> {
  if (deps.length === 0) return;

  const pm = detectPackageManager();
  const args =
    pm === "npm"
      ? ["install", "-D", ...deps]
      : ["add", "-D", ...deps];

  await execa(pm, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
