import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getRegistryItem, getStyles, type Style } from "@/registry";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { searchParams } = new URL(request.url);
  const style = (searchParams.get("style") || "nativewind") as Style;

  // 验证风格
  const validStyles = getStyles();
  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: `Invalid style. Valid styles: ${validStyles.join(", ")}` },
      { status: 400 }
    );
  }

  // 查找组件
  const item = getRegistryItem(name, style);
  if (!item) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  // 读取文件内容
  const files = await Promise.all(
    item.files.map(async (file) => {
      const filePath = path.join(process.cwd(), "registry", style, file.path);
      const content = await fs.readFile(filePath, "utf-8");
      return {
        path: file.path,
        content,
        type: file.type,
      };
    })
  );

  return NextResponse.json({
    name: item.name,
    type: item.type,
    description: item.description,
    files,
    dependencies: item.dependencies ?? [],
    devDependencies: item.devDependencies ?? [],
    registryDependencies: item.registryDependencies ?? [],
  });
}
