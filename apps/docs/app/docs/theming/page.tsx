import Link from "next/link";

export default function ThemingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/docs" className="text-blue-500 hover:underline mb-4 inline-block">
          ← 返回文档
        </Link>

        <h1 className="text-3xl font-bold mb-4">主题定制</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Aster UI 支持完全自定义主题，包括颜色、间距、圆角等。
        </p>

        {/* NativeWind 主题 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">NativeWind 风格</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            使用 Tailwind 配置文件自定义主题。
          </p>

          <h3 className="text-lg font-medium mb-2">1. 配置 tailwind.config.js</h3>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
{`// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // 自定义主色
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#ffffff",
        },
        // 自定义次要色
        secondary: {
          DEFAULT: "#6b7280",
          foreground: "#ffffff",
        },
        // 自定义危险色
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        // 背景色
        background: "#ffffff",
        foreground: "#111827",
        // 边框色
        border: "#e5e7eb",
        // 输入框
        input: "#e5e7eb",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
};`}
          </pre>

          <h3 className="text-lg font-medium mb-2">2. 暗黑模式</h3>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
{`// app/_layout.tsx
import { useColorScheme, View } from "react-native";

export default function Layout({ children }) {
  const colorScheme = useColorScheme();
  
  return (
    <View className={colorScheme === "dark" ? "dark" : ""}>
      {children}
    </View>
  );
}`}
          </pre>

          <h3 className="text-lg font-medium mb-2">3. 修改组件变体</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            直接编辑组件源码添加自定义变体：
          </p>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
{`// components/ui/button.tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        // 添加品牌色变体
        brand: "bg-purple-500 text-white",
        // 添加渐变变体
        gradient: "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
      },
    },
  }
);`}
          </pre>
        </section>

        {/* StyleSheet 主题 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">StyleSheet 风格</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            创建主题配置文件统一管理样式。
          </p>

          <h3 className="text-lg font-medium mb-2">1. 创建主题文件</h3>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
{`// lib/theme.ts
export const colors = {
  light: {
    primary: "#3b82f6",
    primaryForeground: "#ffffff",
    secondary: "#6b7280",
    secondaryForeground: "#ffffff",
    destructive: "#ef4444",
    destructiveForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#111827",
    border: "#e5e7eb",
    input: "#e5e7eb",
  },
  dark: {
    primary: "#60a5fa",
    primaryForeground: "#ffffff",
    secondary: "#9ca3af",
    secondaryForeground: "#ffffff",
    destructive: "#f87171",
    destructiveForeground: "#ffffff",
    background: "#111827",
    foreground: "#f9fafb",
    border: "#374151",
    input: "#374151",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};`}
          </pre>

          <h3 className="text-lg font-medium mb-2">2. 创建主题 Hook</h3>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto mb-4">
{`// lib/useTheme.ts
import { useColorScheme } from "react-native";
import { colors } from "./theme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  return {
    isDark,
    colors: isDark ? colors.dark : colors.light,
  };
}`}
          </pre>

          <h3 className="text-lg font-medium mb-2">3. 在组件中使用</h3>
          <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
{`// components/ui/button.tsx
import { useTheme } from "@/lib/useTheme";

export function Button({ variant = "default", ...props }) {
  const { colors } = useTheme();
  
  const variantStyles = {
    default: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    destructive: { backgroundColor: colors.destructive },
  };
  
  return (
    <Pressable style={[styles.base, variantStyles[variant]]} {...props}>
      {/* ... */}
    </Pressable>
  );
}`}
          </pre>
        </section>

        {/* 颜色参考 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">颜色参考</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Primary", color: "#3b82f6" },
              { name: "Secondary", color: "#6b7280" },
              { name: "Destructive", color: "#ef4444" },
              { name: "Success", color: "#22c55e" },
              { name: "Warning", color: "#f59e0b" },
              { name: "Info", color: "#06b6d4" },
              { name: "Background", color: "#ffffff" },
              { name: "Foreground", color: "#111827" },
            ].map((item) => (
              <div key={item.name} className="text-center">
                <div
                  className="w-full h-16 rounded-lg mb-2 border"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.color}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 最佳实践 */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">最佳实践</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
            <li>使用语义化颜色名称 (primary, secondary) 而非具体颜色 (blue, gray)</li>
            <li>为每个颜色定义 foreground 变体，确保文字可读性</li>
            <li>测试暗黑模式下的对比度</li>
            <li>保持组件间的视觉一致性</li>
            <li>使用设计系统工具 (如 Figma) 管理颜色</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
