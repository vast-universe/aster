/** 支持的框架 (目前只有 Expo) */
export type Framework = "expo";

/** 支持的样式 */
export type Style = "nativewind" | "stylesheet";

/** Registry 项类型 */
export type RegistryType =
  | "registry:ui"
  | "registry:hook"
  | "registry:lib"
  | "registry:config";

/** 文件转换 (仅 config 类型) */
export interface FileTransform {
  /** 要修改的文件 */
  file: string;
  /** JSON 深度合并 */
  merge?: Record<string, unknown>;
  /** 数组追加 */
  append?: { key: string; value: string };
}

/** Registry 文件 */
export interface RegistryFile {
  /** 文件路径 (相对于框架目录) */
  path: string;
  /** 文件类型 */
  type: RegistryType;
  /** 目标路径 (安装到项目的路径，可选) */
  target?: string;
  /** 文件内容 (构建时填充) */
  content?: string;
}

/** Registry 项 */
export interface RegistryItem {
  /** 名称 */
  name: string;
  /** 类型 */
  type: RegistryType;
  /** 描述 */
  description: string;
  /** 文件列表 */
  files: RegistryFile[];
  /** 生产依赖 */
  dependencies?: string[];
  /** 开发依赖 */
  devDependencies?: string[];
  /** Registry 依赖 */
  registryDependencies?: string[];
  /** 文件转换 (仅 config 类型) */
  transforms?: FileTransform[];
  /** 安装后命令 (仅 config 类型) */
  postInstall?: string[];
}

export type Registry = RegistryItem[];

/** 框架 Registry 结构 */
export interface FrameworkRegistry {
  /** 框架名称 */
  name: Framework;
  /** 显示名称 */
  displayName: string;
  /** 支持的样式 */
  styles: Style[];
  /** 配置片段 */
  configs: Registry;
  /** 组件 (按样式分) */
  components: Record<Style, Registry>;
}
