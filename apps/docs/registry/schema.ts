export interface RegistryItem {
  name: string;
  type: "registry:ui" | "registry:hook" | "registry:lib";
  description: string;
  files: RegistryFile[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
}

export interface RegistryFile {
  path: string;
  type: "registry:ui" | "registry:hook" | "registry:lib";
}

export type Registry = RegistryItem[];
