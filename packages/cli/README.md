# Aster CLI

跨框架开发脚手架 - 项目创建与组件管理

## 安装

```bash
# 推荐使用 npx (无需安装)
npx aster@latest create my-app

# 或全局安装
npm install -g aster
```

## 命令

### 创建项目

```bash
# 交互式创建
npx aster create my-app

# 指定框架
npx aster create my-app --framework expo
npx aster create my-app --framework next
npx aster create my-app --framework vue
npx aster create my-app --framework nuxt

# 使用预设
npx aster create my-app --preset expo-starter

# 使用默认配置
npx aster create my-app -y
```

### 组件管理

```bash
# 添加组件
npx aster add button
npx aster add button card input

# 强制覆盖
npx aster add button --force

# 从第三方源添加
npx aster add github:user/repo/button
npx aster add @acme/button
npx aster add https://example.com/button.json

# 删除组件
npx aster remove button

# 更新组件
npx aster update button
npx aster update --all

# 查看差异
npx aster diff button
```

### 查看组件

```bash
# 列出所有可用组件
npx aster list

# 搜索组件
npx aster search button

# 查看配置信息
npx aster info
```

### 预设管理

```bash
# 列出所有预设
npx aster preset list

# 查看预设详情
npx aster preset info expo-starter

# 删除自定义预设
npx aster preset remove my-preset
```

### Registry 管理

```bash
# 添加第三方 registry
npx aster registry add @acme https://acme.com/registry

# 列出所有 registry
npx aster registry list

# 删除 registry
npx aster registry remove @acme
```

### 缓存管理

```bash
# 查看缓存状态
npx aster cache status

# 清理过期缓存
npx aster cache clean

# 清空所有缓存
npx aster cache clear
```

## 配置文件

项目根目录的 `aster.json`:

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
  "registries": {
    "@acme": "https://acme.com/registry"
  }
}
```

## 支持的框架

| 框架 | 样式方案 | 状态管理 |
|------|---------|---------|
| Expo (React Native) | NativeWind, StyleSheet | Zustand, Redux |
| Next.js | Tailwind, CSS Modules | Zustand, Jotai, Redux |
| Vue (Vite) | Tailwind, UnoCSS, CSS | Pinia |
| Nuxt | Tailwind, UnoCSS, CSS | Pinia |

## 内置预设

- `expo-starter` - Expo 基础模板 (NativeWind + Zustand)
- `expo-minimal` - Expo 最小模板 (StyleSheet)
- `expo-full` - Expo 完整模板 (全部功能)
- `next-starter` - Next.js 基础模板 (Tailwind + Zustand)
- `next-full` - Next.js 完整模板 (全部功能)
- `vue-starter` - Vue 基础模板 (Tailwind + Pinia)
- `nuxt-starter` - Nuxt 基础模板 (Tailwind + Pinia)

## License

MIT
