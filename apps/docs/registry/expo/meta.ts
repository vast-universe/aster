/**
 * Expo 框架元数据 - CLI 从这里获取配置选项
 */

export const expoMeta = {
  name: "expo",
  displayName: "Expo (React Native)",
  description: "使用 Expo 创建 React Native 项目",

  /** 默认路径 */
  defaultPaths: {
    ui: "components/ui",
    hooks: "hooks",
    lib: "lib",
  },

  /** 样式选项 */
  styles: [
    { title: "NativeWind (Tailwind)", value: "nativewind" },
    { title: "StyleSheet (零依赖)", value: "stylesheet" },
  ],

  /** 状态管理选项 */
  stateLibs: [
    { title: "不需要", value: "none" },
    { title: "Zustand (轻量)", value: "zustand" },
  ],

  /** 额外库选项 */
  extraLibs: [
    { title: "Axios - HTTP 请求", value: "axios" },
    { title: "TanStack Query - 数据请求", value: "tanstack" },
    { title: "i18next - 国际化", value: "i18n" },
    { title: "Toast - 消息提示", value: "toast" },
    { title: "Form - 表单验证", value: "form" },
    { title: "Husky + Prettier - 代码规范", value: "lint", selected: true },
  ],

  /** 创建项目命令 */
  createCommand: "npx create-expo-app@latest",

  /** 重置项目命令 */
  resetCommand: "echo Y | npm run reset-project",
};
