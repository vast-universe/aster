# Aster

跨框架组件库 CLI - 安装、管理和发布 UI 组件、Hooks、工具函数

## 特点

- 🚀 **项目创建** - 一键创建企业级项目模板
- 📦 **组件管理** - 统一的组件添加、更新、删除流程
- 🎨 **多种资源** - 支持 UI 组件、Hooks、工具函数、配置片段
- 🌐 **社区生态** - 官方组件 + 社区组件，支持命名空间
- 🔀 **跨框架** - 支持 Expo/React Native，预留 Vue/Nuxt 扩展
- 🔒 **安全检查** - 社区组件安装前自动安全扫描
- 🔄 **事务安装** - 安装失败自动回滚，保证项目完整性

## 快速开始

### 1. 创建项目

```bash
# 交互式创建
npx aster create my-app

# 指定模板
npx aster create my-app --starter standard

# 使用默认配置
npx aster create my-app --yes
```

### 2. 添加组件

```bash
# 官方组件
npx aster add button
npx aster add button input modal

# 指定版本
npx aster add button@1.0.0
npx aster add @vast-universe/button@1.0.0

# 社区组件
npx aster add @zhangsan/fancy-button

# Hooks
npx aster add hook:use-debounce

# 工具函数
npx aster add lib:utils
```

### 3. 使用组件

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

## 命令

### 项目命令

```bash
npx aster create [name]     # 创建新项目
npx aster init              # 初始化配置 (已有项目)
```

### 基础命令

```bash
npx aster init              # 初始化配置
npx aster add <items>       # 添加资源
npx aster remove [items]    # 删除资源
npx aster update [items]    # 更新资源
npx aster list              # 列出资源
npx aster search [query]    # 搜索资源
npx aster diff [item]       # 检查更新
npx aster view <item>       # 预览代码
npx aster info              # 显示配置
```

### 认证命令

```bash
npx aster login             # 登录 (GitHub OAuth)
npx aster logout            # 退出登录
npx aster whoami            # 查看当前用户
```

### Token 管理

```bash
npx aster token list        # 列出所有 Token
npx aster token create      # 创建新 Token
npx aster token revoke <id> # 撤销 Token
```

### 命名空间

```bash
npx aster namespace create <name>  # 创建命名空间
npx aster namespace list           # 列出我的命名空间
npx aster namespace delete <name>  # 删除命名空间
```

### 发布组件

```bash
npx aster registry create [name]   # 创建 Registry 项目
npx aster registry build           # 构建
npx aster registry publish         # 发布
```

### 其他

```bash
npx aster recover           # 恢复未完成的安装事务
```

## 资源类型

| 类型 | 前缀 | 示例 |
|------|------|------|
| UI 组件 | (无) | `button`, `@zhangsan/card` |
| Hooks | `hook:` | `hook:use-debounce` |
| 工具函数 | `lib:` | `lib:utils` |
| 配置片段 | `config:` | `config:nativewind` |

## 配置文件

`aster.json`:

```json
{
  "$schema": "https://aster.dev/schema/aster.json",
  "style": "nativewind",
  "framework": "expo",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib"
  },
  "installed": {
    "ui": {},
    "hook": {},
    "lib": {},
    "config": {}
  }
}
```

## 发布自己的组件

### 1. 创建项目

```bash
npx aster registry create my-components
cd my-components
```

### 2. 编辑配置

`registry.config.ts`:

```typescript
export default {
  namespace: "my-namespace",
  description: "我的组件库",
  frameworks: ["expo"],
  
  components: [
    {
      name: "fancy-button",
      version: "1.0.0",  // 每个组件独立版本
      style: "nativewind",
      description: "带动画的按钮",
      files: [
        "src/components/nativewind/fancy-button/fancy-button.tsx",
        "src/components/nativewind/fancy-button/index.ts",
      ],
      dependencies: ["react-native-reanimated"],
      registryDependencies: ["lib:utils"],
    },
  ],
  
  hooks: [
    {
      name: "use-toast",
      version: "1.0.0",
      description: "Toast Hook",
      files: [
        "src/hooks/use-toast/use-toast.ts",
        "src/hooks/use-toast/index.ts",
      ],
    },
  ],
  
  lib: [
    {
      name: "utils",
      version: "1.0.0",
      description: "工具函数",
      files: ["src/lib/utils.ts"],
      dependencies: ["clsx", "tailwind-merge"],
    },
  ],
};
```

### 3. 构建和发布

```bash
npx aster registry build
npx aster registry publish
```

## 环境变量

```bash
# 自定义 API 地址
ASTER_API_URL=https://your-domain.com

# 使用 Token 认证 (CI/CD)
ASTER_TOKEN=your-token
```

## License

MIT
