/**
 * 预设管理 - 优先从远程获取，支持本地用户预设
 */

import path from "path";
import os from "os";
import type { FrameworkName } from "../types/framework";
import type { Preset } from "../types/registry";
import { readJson, writeJson, fileExists } from "../core/fs";
import { fetchPresets as fetchRemotePresets, fetchPreset as fetchRemotePreset } from "../services/remote-config";

export type { Preset };

function getUserPresetsPath(): string {
  return path.join(os.homedir(), ".aster", "presets.json");
}

async function getUserPresets(): Promise<Preset[]> {
  const presetsPath = getUserPresetsPath();
  if (!fileExists(presetsPath)) return [];

  try {
    const data = await readJson<{ presets: Preset[] }>(presetsPath);
    return (data.presets || []).map((p) => ({ ...p, source: "user" as const }));
  } catch {
    return [];
  }
}

async function getRemotePresets(): Promise<Preset[]> {
  try {
    const remotePresets = await fetchRemotePresets();
    return remotePresets.map((p) => ({ ...p, source: "remote" as const }));
  } catch {
    return [];
  }
}

export async function getAllPresets(): Promise<Preset[]> {
  const [remotePresets, userPresets] = await Promise.all([
    getRemotePresets(),
    getUserPresets(),
  ]);

  const presetMap = new Map<string, Preset>();
  for (const preset of remotePresets) presetMap.set(preset.name, preset);
  for (const preset of userPresets) presetMap.set(preset.name, preset);

  return Array.from(presetMap.values());
}

export async function getPreset(name: string): Promise<Preset | undefined> {
  const userPresets = await getUserPresets();
  const userPreset = userPresets.find((p) => p.name === name);
  if (userPreset) return userPreset;

  try {
    const remotePreset = await fetchRemotePreset(name);
    if (remotePreset) return { ...remotePreset, source: "remote" };
  } catch {
    // ignore
  }

  return undefined;
}

export async function saveUserPreset(preset: Omit<Preset, "source">): Promise<void> {
  const presetsPath = getUserPresetsPath();
  const userPresets = await getUserPresets();

  const existingIndex = userPresets.findIndex((p) => p.name === preset.name);
  if (existingIndex >= 0) {
    userPresets[existingIndex] = { ...preset, source: "user" };
  } else {
    userPresets.push({ ...preset, source: "user" });
  }

  await writeJson(presetsPath, { presets: userPresets });
}

export async function deleteUserPreset(name: string): Promise<boolean> {
  const presetsPath = getUserPresetsPath();
  const userPresets = await getUserPresets();

  const index = userPresets.findIndex((p) => p.name === name);
  if (index < 0) return false;

  userPresets.splice(index, 1);
  await writeJson(presetsPath, { presets: userPresets });
  return true;
}

export async function getPresetChoices() {
  const presets = await getAllPresets();
  return presets.map((p) => ({
    title: `${p.name} - ${p.description}`,
    value: p.name,
    description: `${p.style} | ${p.stateLib}`,
  }));
}
