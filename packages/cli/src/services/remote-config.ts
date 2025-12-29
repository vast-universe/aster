/**
 * 远程配置服务 - 获取框架元数据和预设
 */

import type { FrameworkMeta } from "../types/framework";
import type { Preset } from "../types/registry";

const API_BASE = process.env.ASTER_API_URL?.replace("/r", "") || "http://localhost:3000/api";

export async function fetchFrameworkMeta(
  framework: string = "expo"
): Promise<FrameworkMeta> {
  const response = await fetch(`${API_BASE}/meta?framework=${framework}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`获取框架配置失败: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPresets(): Promise<Preset[]> {
  const response = await fetch(`${API_BASE}/presets`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`获取预设列表失败: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchPreset(name: string): Promise<Preset | null> {
  const response = await fetch(`${API_BASE}/presets?name=${name}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`获取预设失败: ${response.statusText}`);
  }

  return response.json();
}
