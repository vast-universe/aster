import { NextResponse } from "next/server";
import {
  getConfigs,
  getComponents,
  getFrameworks,
  getStyles,
  type Framework,
  type Style,
} from "@/registry";

/**
 * GET /api/r?framework=expo&type=config
 * GET /api/r?framework=expo&type=ui&style=nativewind
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework") as Framework | null;
  const type = searchParams.get("type") || "ui"; // config | ui
  const style = searchParams.get("style") as Style | null;

  // 验证 framework 参数
  if (!framework) {
    return NextResponse.json(
      {
        error: "Missing framework parameter",
        frameworks: getFrameworks(),
      },
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

  // 获取配置列表
  if (type === "config") {
    const configs = getConfigs(framework);
    return NextResponse.json(
      configs.map((item) => ({
        name: item.name,
        type: item.type,
        description: item.description,
        dependencies: item.dependencies ?? [],
        devDependencies: item.devDependencies ?? [],
        registryDependencies: item.registryDependencies ?? [],
      }))
    );
  }

  // 获取组件列表
  if (!style) {
    const styles = getStyles(framework);
    return NextResponse.json(
      {
        error: "Missing style parameter for components",
        styles,
      },
      { status: 400 }
    );
  }

  const validStyles = getStyles(framework);
  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: `Invalid style for ${framework}. Valid: ${validStyles.join(", ")}` },
      { status: 400 }
    );
  }

  const components = getComponents(framework, style);
  return NextResponse.json(
    components.map((item) => ({
      name: item.name,
      type: item.type,
      description: item.description,
      dependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
    }))
  );
}
