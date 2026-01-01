/**
 * 预设配置 - CLI 从这里获取预设列表
 */

export interface Preset {
  name: string;
  description: string;
  framework: "expo";
  style: string;
  stateLib: string;
  extraLibs: string[];
}

export const presets: Preset[] = [
  {
    name: "expo-starter",
    description: "Expo 基础模板 (NativeWind + Zustand)",
    framework: "expo",
    style: "nativewind",
    stateLib: "zustand",
    extraLibs: ["axios", "lint"],
  },
  {
    name: "expo-minimal",
    description: "Expo 最小模板 (StyleSheet)",
    framework: "expo",
    style: "stylesheet",
    stateLib: "none",
    extraLibs: ["lint"],
  },
  {
    name: "expo-full",
    description: "Expo 完整模板 (全部功能)",
    framework: "expo",
    style: "nativewind",
    stateLib: "zustand",
    extraLibs: ["axios", "tanstack", "i18n", "toast", "form", "lint"],
  },
];
