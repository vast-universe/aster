/**
 * 构建 Registry - 生成静态 JSON 文件到 public/r/
 * 按框架组织的新结构
 *
 * 运行: npx tsx scripts/build-registry.ts
 */

import { promises as fs } from "fs";
import path from "path";
import {
  frameworkRegistries,
  getFrameworks,
  type Framework,
} from "../registry";
import type { RegistryItem, Style } from "../registry/schema";

const OUTPUT_DIR = path.join(process.cwd(), "public/r");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    console.error(`  ⚠️ Failed to read: ${filePath}`);
    return "";
  }
}

/**
 * 构建框架的配置 Registry
 */
async function buildConfigRegistry(framework: Framework) {
  const registry = frameworkRegistries[framework];
  const outputDir = path.join(OUTPUT_DIR, framework, "configs");
  await ensureDir(outputDir);

  const configs = registry.configs;

  // 构建索引
  const index = configs.map((item) => ({
    name: item.name,
    type: item.type,
    description: item.description,
    dependencies: item.dependencies ?? [],
    devDependencies: item.devDependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
  }));

  await fs.writeFile(
    path.join(outputDir, "index.json"),
    JSON.stringify(index, null, 2)
  );

  // 构建单个配置 JSON (带文件内容)
  for (const item of configs) {
    const filesWithContent = await Promise.all(
      item.files.map(async (file) => {
        let filePath: string;

        // 检查是否是 shared: 前缀
        if (file.path.startsWith("shared:")) {
          const sharedPath = file.path.replace("shared:", "");
          filePath = path.join(process.cwd(), "registry", "shared", sharedPath);
        } else {
          filePath = path.join(process.cwd(), "registry", framework, file.path);
        }

        const content = await readFileContent(filePath);
        return { ...file, content };
      })
    );

    const itemWithContent = { ...item, files: filesWithContent };
    await fs.writeFile(
      path.join(outputDir, `${item.name}.json`),
      JSON.stringify(itemWithContent, null, 2)
    );
  }

  console.log(`  ✅ ${framework}/configs: ${configs.length} items`);
}

/**
 * 构建框架的组件 Registry
 */
async function buildComponentRegistry(framework: Framework, style: Style) {
  const registry = frameworkRegistries[framework];
  const components = registry.components[style] || [];

  if (components.length === 0) {
    return;
  }

  const outputDir = path.join(OUTPUT_DIR, framework, "components", style);
  await ensureDir(outputDir);

  // 构建索引
  const index = components.map((item: RegistryItem) => ({
    name: item.name,
    type: item.type,
    description: item.description,
    dependencies: item.dependencies ?? [],
    devDependencies: item.devDependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
  }));

  await fs.writeFile(
    path.join(outputDir, "index.json"),
    JSON.stringify(index, null, 2)
  );

  // 构建单个组件 JSON (带文件内容)
  for (const item of components) {
    const filesWithContent = await Promise.all(
      item.files.map(async (file) => {
        const filePath = path.join(
          process.cwd(),
          "registry",
          framework,
          "components",
          style,
          file.path
        );
        const content = await readFileContent(filePath);
        return { ...file, content };
      })
    );

    const itemWithContent = { ...item, files: filesWithContent };
    await fs.writeFile(
      path.join(outputDir, `${item.name}.json`),
      JSON.stringify(itemWithContent, null, 2)
    );
  }

  console.log(`  ✅ ${framework}/components/${style}: ${components.length} items`);
}

/**
 * 构建框架索引
 */
async function buildFrameworkIndex(framework: Framework) {
  const registry = frameworkRegistries[framework];
  const outputDir = path.join(OUTPUT_DIR, framework);
  await ensureDir(outputDir);

  const index = {
    name: registry.name,
    displayName: registry.displayName,
    styles: registry.styles,
    configs: registry.configs.map((c) => c.name),
    components: Object.fromEntries(
      registry.styles.map((style) => [
        style,
        (registry.components[style] || []).map((c: RegistryItem) => c.name),
      ])
    ),
  };

  await fs.writeFile(
    path.join(outputDir, "index.json"),
    JSON.stringify(index, null, 2)
  );
}

/**
 * 构建主索引
 */
async function buildMainIndex() {
  const frameworks = getFrameworks();
  const index = {
    frameworks,
    registries: Object.fromEntries(
      frameworks.map((f) => [
        f,
        {
          displayName: frameworkRegistries[f].displayName,
          styles: frameworkRegistries[f].styles,
        },
      ])
    ),
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, "index.json"),
    JSON.stringify(index, null, 2)
  );
}

async function main() {
  console.log("🏗️ Building Registry...\n");

  await ensureDir(OUTPUT_DIR);

  const frameworks = getFrameworks();

  for (const framework of frameworks) {
    console.log(`\n📦 Building ${framework}...`);

    // 构建配置
    await buildConfigRegistry(framework);

    // 构建组件
    const registry = frameworkRegistries[framework];
    for (const style of registry.styles) {
      await buildComponentRegistry(framework, style);
    }

    // 构建框架索引
    await buildFrameworkIndex(framework);
  }

  // 构建主索引
  console.log("\n📋 Building main index...");
  await buildMainIndex();

  console.log("\n✅ Build complete!");
  console.log(`   Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
