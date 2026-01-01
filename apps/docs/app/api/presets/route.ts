import { NextResponse } from "next/server";
import { presets } from "@/registry/presets";

/**
 * GET /api/presets
 * GET /api/presets?name=expo-starter
 * 获取预设列表或单个预设
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  // 获取单个预设
  if (name) {
    const preset = presets.find((p) => p.name === name);
    if (!preset) {
      return NextResponse.json(
        { error: `Preset "${name}" not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(preset);
  }

  // 获取所有预设
  return NextResponse.json(presets);
}
