import { NextResponse } from "next/server";
import { getAllComponents, getStyles, type Style } from "@/registry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const style = (searchParams.get("style") || "nativewind") as Style;

  const validStyles = getStyles();
  if (!validStyles.includes(style)) {
    return NextResponse.json(
      { error: `Invalid style. Valid styles: ${validStyles.join(", ")}` },
      { status: 400 }
    );
  }

  const components = getAllComponents(style);

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
