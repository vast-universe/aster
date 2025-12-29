import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  getConfigItem,
  getComponentItem,
  getFrameworks,
  getStyles,
  type Framework,
  type Style,
} from "@/registry";
import type { RegistryItem } from "@/registry/schema";

/**
 * GET /api/r/[name]?framework=expo&type=config
 * GET /api/r/[name]?framework=expo&type=ui&style=nativewind
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework") as Framework | null;
  const type = searchParams.get("type") || "ui";
  const style = searchParams.get("style") as Style | null;

  // 验证 framework 参数
  if (!framework) {
    return NextResponse.json(
      { error: "Missing framework parameter", frameworks: getFrameworks() },
      { status: 400 }
    );
  }

  const validFrameworks = getFrameworks();
  if (!validFrameworks.includes(framework)) {
    return NextResponse.json(
      { error: `Invalid framework. Valid: ${validFrameworks.join(", ")}` },
      { status: 400 }
    );
  }

  let item: RegistryItem | undefined;
  let basePath: string;

  // 获取配置
  if (type === "config") {
    item = getConfigItem(framework, name);
    basePath = path.join(process.cwd(), "registry", framework);

    if (!item) {
      // 尝试从 shared 获取
      basePath = path.join(process.cwd(), "registry", "shared");
    }

    if (!item) {
      return NextResponse.json(
        { error: `Config "${name}" not found for framework "${framework}"` },
        { status: 404 }
      );
    }
  } else {
    // 获取组件
    if (!style) {
      return NextResponse.json(
        { error: "Missing style parameter", styles: getStyles(framework) },
        { status: 400 }
      );
    }

    const validStyles = getStyles(framework);
    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `Invalid style. Valid: ${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    item = getComponentItem(framework, style, name);
    basePath = path.join(
      process.cwd(),
      "registry",
      framework,
      "components",
      style
    );

    if (!item) {
      return NextResponse.json(
        { error: `Component "${name}" not found` },
        { status: 404 }
      );
    }
  }

  // 读取文件内容
  const filesWithContent = await Promise.all(
    item.files.map(async (file) => {
      let filePath: string;
      
      // 检查是否是 shared: 前缀
      if (file.path.startsWith("shared:")) {
        const sharedPath = file.path.replace("shared:", "");
        filePath = path.join(process.cwd(), "registry", "shared", sharedPath);
      } else {
        filePath = path.join(basePath, file.path);
      }

      try {
        const content = await fs.readFile(filePath, "utf-8");
        return { ...file, content };
      } catch {
        console.error(`Failed to read file: ${filePath}`);
        return { ...file, content: "" };
      }
    })
  );

  return NextResponse.json({
    ...item,
    files: filesWithContent,
  });
}
