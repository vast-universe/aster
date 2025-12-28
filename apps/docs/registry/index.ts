import { registry as nativewindRegistry } from "./nativewind/registry";
import { registry as stylesheetRegistry } from "./stylesheet/registry";
import type { RegistryItem } from "./schema";

export type Style = "nativewind" | "stylesheet";

export const registries: Record<Style, RegistryItem[]> = {
  nativewind: nativewindRegistry,
  stylesheet: stylesheetRegistry,
};

export function getRegistry(style: Style): RegistryItem[] {
  return registries[style] || [];
}

export function getRegistryItem(
  name: string,
  style: Style
): RegistryItem | undefined {
  const registry = getRegistry(style);
  return registry.find((item) => item.name === name);
}

export function getAllComponents(style: Style): RegistryItem[] {
  return getRegistry(style);
}

export function getStyles(): Style[] {
  return Object.keys(registries) as Style[];
}
