# Aster

跨框架开发脚手架 - 项目创建与组件管理

## 特点

- 📦 **多框架支持** - 支持 React Native、React、Vue 等多种框架
- 🎨 **组件管理** - 统一的组件添加、更新、删除流程
- 🔧 **插件化架构** - 通过插件扩展功能，支持社区贡献
- 📁 **模板系统** - 丰富的项目模板，支持自定义
- 🌙 **暗黑模式** - 所有组件支持暗黑模式
- ♿ **无障碍** - 内置 accessibility 支持
- 🌏 **国内镜像** - 支持国内镜像加速

## 快速开始

### 1. 创建项目

```bash
# 创建 React Native 项目
npx aster create my-rn-app --template expo-default

# 创建 Vue 项目
npx aster create my-vue-app --template vue3-ts

# 创建 React 项目
npx aster create my-react-app --template react-ts
```

### 2. 初始化配置

```bash
npx aster init
```

选择样式方案：
- **NativeWind** - 使用 Tailwind 语法，需要先配置 NativeWind
- **StyleSheet** - 纯 RN 原生样式，零外部依赖

### 3. 配置路径别名

在 `tsconfig.json` 中添加：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 4. 添加组件

```bash
npx aster add button
npx aster add button input modal
```

### 5. 使用组件

```tsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <Button variant="default" onPress={() => console.log("clicked")}>
      点击我
    </Button>
  );
}
```

## 可用组件 (20+)

| 分类 | 组件 |
|------|------|
| 表单 | Button, Input, Textarea, Checkbox, Radio, Switch, Select, Slider |
| 数据展示 | Avatar, Badge, Card, Skeleton |
| 布局 | Divider |
| 导航 | Tabs |
| 反馈 | Modal, Dialog, ActionSheet, Alert, Toast, Loading |

```bash
# 查看所有可用组件
npx aster list
```

## 命令

```bash
# 基础命令
npx aster init              # 初始化配置
npx aster add <component>   # 添加组件
npx aster add button --force # 覆盖已存在的文件
npx aster remove [component] # 删除组件
npx aster update            # 更新所有组件
npx aster update button     # 更新指定组件
npx aster list              # 列出所有组件
npx aster search [query]    # 搜索组件
npx aster diff              # 检查组件更新
npx aster info              # 显示配置信息

# 项目创建
npx aster create <project-name> --template <template> # 创建新项目

# 插件管理
npx aster plugin list     # 列出所有插件
npx aster plugin install  # 安装插件
npx aster plugin remove   # 删除插件

# Registry 管理
npx aster registry list     # 列出所有 registry
npx aster registry add      # 添加第三方 registry
npx aster registry remove   # 删除第三方 registry

# 缓存管理
npx aster cache status      # 显示缓存状态
npx aster cache clean       # 清理过期缓存
npx aster cache clear       # 清空所有缓存
```

## 第三方组件

Aster 支持从多种来源安装组件：

### GitHub Registry (推荐)

社区开发者只需创建 GitHub 仓库，无需部署服务器：

```bash
# 从 GitHub 仓库安装
npx aster add github:user/repo/component

# 指定版本/分支
npx aster add github:user/repo/component@v1.0.0
npx aster add github:user/repo/component@main
```

### 命名空间 Registry

配置第三方 HTTP API：

```bash
# 添加 registry
npx aster registry add @acme https://acme-ui.com/api/r

# 使用
npx aster add @acme/data-table
```

### 直接 URL

```bash
npx aster add https://example.com/api/r/component.json
```

### 本地文件

```bash
npx aster add ./my-component.json
```

## 创建第三方 Registry

### GitHub Registry (零成本)

创建一个 GitHub 仓库，结构如下：

```
my-components/
├── registry.json          # 组件索引
├── nativewind/            # NativeWind 风格
│   └── ui/
│       └── my-button.tsx
└── stylesheet/            # StyleSheet 风格
    └── ui/
        └── my-button.tsx
```

`registry.json` 格式：

```json
{
  "name": "my-components",
  "description": "我的 Aster 组件",
  "components": {
    "my-button": {
      "name": "my-button",
      "type": "registry:ui",
      "description": "自定义按钮",
      "files": ["ui/my-button.tsx"],
      "dependencies": [],
      "registryDependencies": ["@aster/button"]
    }
  }
}
```

用户安装：`npx aster add github:your-name/my-components/my-button`

## 配置文件

`aster.json`:

```json
{
  "$schema": "https://aster.dev/schema.json",
  "framework": "react-native",
  "style": "nativewind",
  "typescript": true,
  "paths": {
    "components": "components/ui",
    "lib": "lib"
  },
  "plugins": [
    "@aster/react-native-plugin"
  ]
}
```

## 主题定制

### NativeWind 风格

通过 `tailwind.config.js` 自定义主题：

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#6b7280",
        destructive: "#ef4444",
      },
    },
  },
};
```

### StyleSheet 风格

创建主题文件统一管理：

```ts
// lib/theme.ts
export const colors = {
  light: {
    primary: "#3b82f6",
    background: "#ffffff",
    foreground: "#111827",
  },
  dark: {
    primary: "#60a5fa",
    background: "#111827",
    foreground: "#f9fafb",
  },
};
```

## 风格对比

| NativeWind | StyleSheet |
|---|---|
| 语法 | Tailwind className | StyleSheet.create |
| 依赖 | nativewind, cva, clsx | 无 |
| 暗黑模式 | `dark:` 前缀 | 需手动处理 |
| 适合 | 熟悉 Tailwind 的开发者 | 追求零依赖 |

## 环境变量

```bash
# 自定义 API 地址 (用于私有部署)
ASTER_API_URL=https://your-domain.com/api/r
```

## License

MIT
# aster
