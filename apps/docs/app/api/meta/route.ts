import { NextResponse } from "next/server";
import { expoMeta } from "@/registry/expo/meta";

/**
 * GET /api/meta?framework=expo
 * 获取框架元数据 (样式选项、状态管理选项等)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const framework = searchParams.get("framework");

  if (!framework || framework !== "expo") {
    return NextResponse.json(
      { error: "Invalid framework. Currently only 'expo' is supported." },
      { status: 400 }
    );
  }

  return NextResponse.json(expoMeta);
}
