# Aster 架构设计 V2

## 概述

Aster 是一个跨框架的组件库 CLI 工具，支持 UI 组件、Hooks、工具函数、配置片段的安装、管理和发布。

## 资源类型

```typescript
type RegistryType = 
  | 'registry:ui'      // UI 组件
  | 'registry:hook'    // Hooks
  | 'registry:lib'     // 工具函数
  | 'registry:config'; // 配置片段
```

## 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Cloudflare R2                                │
│                        (资源存储)                                    │
│                                                                     │
│  expo/                              @zhangsan/                      │
│  ├── index.json                     ├── index.json                  │
│  ├── meta.json                      │                               │
│  ├── components/nativewind/         ├── components/nativewind/      │
│  │   └── button/                    │   └── fancy-button/           │
│  │       ├── 1.0.0.json             │       └── latest.json         │
│  │       └── latest.json            │                               │
│  ├── hooks/                         ├── hooks/                      │
│  │   └── use-debounce/              │   └── use-toast/              │
│  │       └── latest.json            │       └── latest.json         │
│  ├── lib/                           ├── lib/                        │
│  │   └── utils/                     │   └── request/                │
│  │       └── latest.json            │       └── latest.json         │
│  └── configs/                       └── configs/                    │
│      └── nativewind/                    └── eslint/                 │
│          └── latest.json                    └── latest.json         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                         Docs API                                    │
│                         (代理 + 缓存)                                │
│                                                                     │
│  GET  /api/r/*                  获取资源 (缓存)                      │
│  GET  /api/r?type=ui            获取列表                            │
│  POST /api/registry/publish     发布资源                            │
│  GET  /api/auth/github          GitHub OAuth                        │
│  GET  /api/community            社区列表                            │
│  GET  /api/community/search     搜索                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                          数据库                                     │
│                          (元信息)                                    │
│                                                                     │
│  users                    namespaces              tokens            │
│  ├── id                   ├── id                  ├── id            │
│  ├── github_id            ├── user_id             ├── user_id       │
│  ├── github_username      ├── name                ├── token_hash    │
│  ├── email                ├── description         ├── scopes[]      │
│  └── avatar_url           ├── is_default          ├── expires_at    │
│                           └── verified            └── revoked       │
│                                                                     │
│  registry_items           registry_versions       downloads         │
│  ├── id                   ├── id                  ├── id            │
│  ├── namespace_id         ├── item_id             ├── item_id       │
│  ├── name                 ├── version             ├── version       │
│  ├── type                 ├── r2_path             ├── date          │
│  ├── style                ├── integrity           └── count         │
│  ├── description          ├── file_size                             │
│  ├── keywords[]           └── downloads           security_advisories│
│  ├── latest_version                               ├── id            │
│  ├── total_downloads      publish_logs            ├── severity      │
│  ├── is_official          ├── id                  ├── title         │
│  └── deprecated           ├── user_id             ├── affected_items│
│                           ├── item_count          └── patched_version│
│                           └── total_size                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                           CLI                                       │
│                                                                     │
│  认证: login, logout, whoami                                        │
│  使用: add, remove, list, search, update                            │
│  维护: registry create/build/publish                                │
│  命名空间: namespace create/list                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```


## 安装命令格式

```bash
# UI 组件 (默认类型)
npx aster add button                    # 官方
npx aster add @zhangsan/fancy-button    # 社区

# Hooks
npx aster add hook:use-debounce         # 官方
npx aster add @zhangsan/hook:use-toast  # 社区

# 工具函数
npx aster add lib:utils                 # 官方
npx aster add @zhangsan/lib:request     # 社区

# 配置片段
npx aster add config:nativewind         # 官方
npx aster add @zhangsan/config:eslint   # 社区

# 指定版本
npx aster add button@1.0.0
npx aster add @zhangsan/fancy-button@2.0.0
```

## API 路径设计

```
# 获取资源
GET /api/r/{name}?type=ui&style=nativewind&version=latest
GET /api/r/@{namespace}/{name}?type=ui&style=nativewind

# 获取列表
GET /api/r?type=ui&style=nativewind      # 官方 UI 组件列表
GET /api/r?type=hook                      # 官方 Hooks 列表
GET /api/r/@{namespace}                   # 某命名空间所有资源

# 搜索
GET /api/community/search?q=button&type=ui
```

## index.json 格式

```json
{
  "namespace": "zhangsan",
  "description": "张三的组件库",
  "version": "1.0.0",
  
  "components": [
    {
      "name": "fancy-button",
      "style": "nativewind",
      "description": "带动画的按钮",
      "latest": "1.0.0",
      "versions": ["1.0.0"]
    }
  ],
  
  "hooks": [
    {
      "name": "use-toast",
      "description": "Toast Hook",
      "latest": "1.0.0"
    }
  ],
  
  "lib": [
    {
      "name": "request",
      "description": "请求封装",
      "latest": "1.0.0"
    }
  ],
  
  "configs": [
    {
      "name": "eslint",
      "description": "ESLint 配置",
      "latest": "1.0.0"
    }
  ]
}
```

## 资源 JSON 格式

### UI 组件

```json
{
  "name": "button",
  "version": "1.0.0",
  "type": "registry:ui",
  "description": "按钮组件",
  "files": [
    {
      "path": "ui/button.tsx",
      "type": "registry:ui",
      "target": "components/ui/button.tsx",
      "content": "..."
    }
  ],
  "dependencies": ["react-native-reanimated"],
  "devDependencies": [],
  "registryDependencies": ["lib:utils"]
}
```

### Hook

```json
{
  "name": "use-debounce",
  "version": "1.0.0",
  "type": "registry:hook",
  "description": "防抖 Hook",
  "files": [
    {
      "path": "hooks/use-debounce.ts",
      "type": "registry:hook",
      "target": "hooks/use-debounce.ts",
      "content": "..."
    }
  ],
  "dependencies": []
}
```

### 工具函数

```json
{
  "name": "utils",
  "version": "1.0.0",
  "type": "registry:lib",
  "description": "工具函数",
  "files": [
    {
      "path": "lib/utils.ts",
      "type": "registry:lib",
      "target": "lib/utils.ts",
      "content": "..."
    }
  ],
  "dependencies": ["clsx", "tailwind-merge"]
}
```

### 配置片段

```json
{
  "name": "nativewind",
  "version": "1.0.0",
  "type": "registry:config",
  "description": "NativeWind 配置",
  "files": [
    {
      "path": "tailwind.config.js",
      "type": "registry:config",
      "target": "tailwind.config.js",
      "content": "..."
    },
    {
      "path": "global.css",
      "type": "registry:config",
      "target": "global.css",
      "content": "..."
    }
  ],
  "dependencies": ["nativewind", "tailwindcss"],
  "transforms": [
    {
      "file": "babel.config.js",
      "merge": { "plugins": ["nativewind/babel"] }
    }
  ],
  "postInstall": ["npx tailwindcss init"]
}
```

## 认证流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLI 登录流程                                  │
│                                                                     │
│  1. npx aster login                                                 │
│     ↓                                                               │
│  2. 打开浏览器 → https://aster.dev/api/auth/github?cli=1            │
│     ↓                                                               │
│  3. GitHub OAuth 授权                                               │
│     ↓                                                               │
│  4. 回调 → 创建/获取用户 → 生成 Token                                │
│     ↓                                                               │
│  5. 页面显示 Token，用户复制                                         │
│     ↓                                                               │
│  6. CLI 验证 Token → 保存到 ~/.aster/credentials.json               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Token 存储

```json
// ~/.aster/credentials.json
{
  "token": "xxx",
  "user": {
    "username": "zhangsan",
    "namespace": "zhangsan"
  }
}
```

## 版本管理

### 版本规则

- 遵循 Semver 规范: `major.minor.patch`
- 每次发布必须递增版本号
- `latest` 始终指向最新版本

### R2 版本存储

```
@zhangsan/components/nativewind/button/
├── 1.0.0.json
├── 1.0.1.json
├── 1.1.0.json
└── latest.json  → 指向 1.1.0.json 内容
```

### 版本安装

```bash
# 安装最新版
npx aster add @zhangsan/button

# 安装指定版本
npx aster add @zhangsan/button@1.0.0

# 更新到最新
npx aster update button
```

## 命名空间管理

### 默认命名空间

- 用户首次登录自动创建，名称 = GitHub 用户名
- 例: GitHub 用户 `zhangsan` → 命名空间 `@zhangsan`

### 自定义命名空间

```bash
# 创建新命名空间
npx aster namespace create my-team

# 发布到指定命名空间
npx aster registry publish --namespace my-team
```

### 命名空间规则

- 只能包含小写字母、数字、连字符
- 长度 3-30 字符
- 不能与已有命名空间重复
- 一个用户最多 5 个命名空间

## 缓存策略

### Redis 缓存层

```
┌─────────────────────────────────────────────────────────────────────┐
│                        缓存策略                                      │
│                                                                     │
│  请求 → Redis 缓存 (命中) → 返回                                     │
│           ↓ (未命中)                                                 │
│         R2 获取 → 存入 Redis (TTL: 1小时) → 返回                     │
│                                                                     │
│  发布时 → 清除相关缓存                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 缓存 Key 设计

```
component:{namespace}/components/{style}/{name}/{version}
index:{namespace}
meta:{namespace}
```

## 安全考虑

### 1. 代码安全

#### 1.1 存储格式安全

```
┌─────────────────────────────────────────────────────────────────────┐
│                        代码存储安全                                  │
│                                                                     │
│  ✅ 安全: 组件以 JSON 格式存储                                       │
│     - 代码作为字符串存储在 content 字段                              │
│     - 不会在服务端执行任何代码                                       │
│     - JSON 序列化自动转义特殊字符                                    │
│                                                                     │
│  ✅ 安全: 安装时才写入本地文件                                       │
│     - 用户可以在安装前预览代码                                       │
│     - 写入的是纯文本文件，不自动执行                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.2 代码扫描 (发布时)

```typescript
// 发布时进行基础安全扫描
const DANGEROUS_PATTERNS = [
  /eval\s*\(/,                    // eval 调用
  /new\s+Function\s*\(/,          // Function 构造器
  /child_process/,               // 子进程
  /require\s*\(\s*['"`]fs/,      // 文件系统访问
  /process\.env/,                // 环境变量访问
  /__dirname|__filename/,        // 路径泄露
  /fetch\s*\(\s*['"`]http/,      // 硬编码 HTTP 请求
];

function scanCode(content: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(`检测到潜在危险代码: ${pattern.source}`);
    }
  }
  
  return {
    safe: warnings.length === 0,
    warnings,
  };
}
```

#### 1.3 安装时警告

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  安全提示                                                        │
│                                                                     │
│  你正在安装社区组件 @zhangsan/fancy-button                           │
│                                                                     │
│  社区组件由第三方开发者维护，Aster 不对其安全性负责。                  │
│  建议在安装前检查源代码。                                            │
│                                                                     │
│  查看源码: npx aster view @zhangsan/fancy-button                    │
│                                                                     │
│  是否继续安装? (y/N)                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. 供应链安全

#### 2.1 命名空间保护

```typescript
// 保留命名空间列表 (禁止注册)
const RESERVED_NAMESPACES = [
  'expo',           // 官方
  'aster',          // 官方
  'react',          // 知名项目
  'react-native',
  'facebook',
  'google',
  'microsoft',
  'apple',
  'amazon',
  'aws',
  'admin',
  'root',
  'system',
  'official',
  // ... 更多保留名称
];

// 相似名称检测 (防止 typosquatting)
function checkSimilarNames(name: string): string[] {
  const similar: string[] = [];
  
  // 检查与官方组件的相似度
  for (const official of OFFICIAL_COMPONENTS) {
    const distance = levenshteinDistance(name, official);
    if (distance <= 2 && distance > 0) {
      similar.push(official);
    }
  }
  
  return similar;
}

// 发布时检查
if (similar.length > 0) {
  return Response.json({
    error: `名称 "${name}" 与官方组件 "${similar[0]}" 过于相似`,
    code: 'SIMILAR_NAME',
  }, { status: 400 });
}
```

#### 2.2 官方组件标识

```json
{
  "name": "button",
  "version": "1.0.0",
  "official": true,           // 官方标识
  "verified": true,           // 已验证
  "signature": "sha256:...",  // 签名
  // ...
}
```

```
CLI 显示:
┌─────────────────────────────────────────────────────────────────────┐
│  📦 button                                                          │
│  ✅ 官方组件                                                         │
│  版本: 1.0.0                                                        │
│  下载: 12,345                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  📦 @zhangsan/fancy-button                                          │
│  👤 社区组件 by zhangsan                                             │
│  版本: 1.0.0                                                        │
│  下载: 123                                                          │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.3 依赖锁定

```json
// aster.lock.json - 锁定已安装资源的完整性
{
  "lockfileVersion": 1,
  "resources": {
    "button": {
      "version": "1.0.0",
      "namespace": "expo",
      "integrity": "sha256-abc123...",
      "resolved": "https://r2.aster.dev/expo/components/nativewind/button/1.0.0.json"
    },
    "@zhangsan/fancy-button": {
      "version": "1.0.0",
      "namespace": "zhangsan",
      "integrity": "sha256-def456...",
      "resolved": "https://r2.aster.dev/@zhangsan/components/nativewind/fancy-button/1.0.0.json"
    }
  }
}
```

### 3. 认证安全

#### 3.1 Token 安全

```typescript
// Token 生成
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

function generateToken(): { token: string; hash: string } {
  const token = `aster_${nanoid(32)}`;  // 前缀便于识别
  const hash = createHash('sha256').update(token).digest('hex');
  
  return { token, hash };  // 只存储 hash，不存储原始 token
}

// Token 验证
async function verifyToken(token: string): Promise<User | null> {
  const hash = createHash('sha256').update(token).digest('hex');
  
  const { rows } = await sql`
    SELECT u.* FROM users u
    JOIN tokens t ON u.id = t.user_id
    WHERE t.token_hash = ${hash}
    AND (t.expires_at IS NULL OR t.expires_at > NOW())
    AND t.revoked = false
  `;
  
  if (rows[0]) {
    // 更新最后使用时间
    await sql`UPDATE tokens SET last_used_at = NOW() WHERE token_hash = ${hash}`;
  }
  
  return rows[0] || null;
}
```

#### 3.2 Token 管理

```sql
-- 扩展 tokens 表
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,  -- 只存储 hash
  name VARCHAR(50),
  scopes TEXT[],                           -- 权限范围
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),                  -- 创建时的 IP
  user_agent TEXT                          -- 创建时的 UA
);
```

```bash
# Token 管理命令
npx aster token list              # 列出所有 token
npx aster token create --name ci  # 创建新 token
npx aster token revoke <id>       # 撤销 token
```

#### 3.3 权限范围 (Scopes)

```typescript
const SCOPES = {
  'read': '读取公开资源',
  'publish': '发布资源',
  'delete': '删除资源',
  'namespace:create': '创建命名空间',
  'namespace:delete': '删除命名空间',
};

// 创建 token 时指定 scope
npx aster token create --name ci --scope publish
// 生成的 token 只能用于发布，不能删除
```

### 4. API 安全

#### 4.1 Rate Limiting

```typescript
// 分层限流策略
const rateLimits = {
  // 全局限流 (按 IP)
  global: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1m'),
    prefix: 'ratelimit:global',
  }),
  
  // 认证用户限流 (按用户)
  authenticated: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1m'),
    prefix: 'ratelimit:auth',
  }),
  
  // 发布限流 (更严格)
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1h'),
    prefix: 'ratelimit:publish',
  }),
  
  // 登录限流 (防暴力破解)
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15m'),
    prefix: 'ratelimit:login',
  }),
};
```

#### 4.2 请求验证

```typescript
// 请求签名验证 (CLI 请求)
function verifyRequestSignature(request: Request): boolean {
  const timestamp = request.headers.get('X-Aster-Timestamp');
  const signature = request.headers.get('X-Aster-Signature');
  const token = request.headers.get('Authorization')?.slice(7);
  
  if (!timestamp || !signature || !token) {
    return false;
  }
  
  // 检查时间戳 (防重放攻击)
  const requestTime = parseInt(timestamp);
  const now = Date.now();
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return false; // 超过 5 分钟
  }
  
  // 验证签名
  const payload = `${timestamp}:${token}`;
  const expectedSignature = createHmac('sha256', process.env.API_SECRET!)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

#### 4.3 输入验证

```typescript
import { z } from 'zod';

// 发布请求验证
const PublishSchema = z.object({
  namespace: z.string()
    .min(3).max(30)
    .regex(/^[a-z0-9-]+$/),
  
  index: z.object({
    namespace: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    components: z.array(z.object({
      name: z.string().min(1).max(50),
      style: z.string(),
      description: z.string().max(500).optional(),
    })).optional(),
    // ...
  }),
  
  resources: z.array(z.object({
    name: z.string(),
    type: z.enum(['components', 'hooks', 'lib', 'configs']),
    content: z.any(),
  })).max(50),  // 最多 50 个资源
});

// 使用
const result = PublishSchema.safeParse(body);
if (!result.success) {
  return Response.json({
    error: '请求格式错误',
    details: result.error.issues,
  }, { status: 400 });
}
```

### 5. 数据安全

#### 5.1 敏感数据处理

```typescript
// 日志脱敏
function sanitizeLog(data: any): any {
  const sensitiveKeys = ['token', 'password', 'secret', 'key', 'authorization'];
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeLog(sanitized[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}
```

#### 5.2 数据备份

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据备份策略                                  │
│                                                                     │
│  R2 存储:                                                           │
│  - Cloudflare 自动多区域复制                                         │
│  - 版本化存储 (每个版本独立文件)                                      │
│                                                                     │
│  数据库:                                                            │
│  - 每日自动备份                                                      │
│  - 保留 30 天                                                       │
│  - 支持 Point-in-time Recovery                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6. 安全响应

#### 6.1 漏洞报告

```markdown
# 安全漏洞报告

如果你发现 Aster 的安全漏洞，请通过以下方式报告:

- 邮箱: security@aster.dev
- 不要在公开 Issue 中披露漏洞详情

我们承诺:
- 24 小时内确认收到
- 7 天内提供初步评估
- 90 天内修复并发布
```

#### 6.2 安全公告

```typescript
// 安全公告 API
// GET /api/security/advisories
{
  "advisories": [
    {
      "id": "ASTER-2024-001",
      "severity": "high",
      "title": "XSS vulnerability in component preview",
      "affected": ["@zhangsan/fancy-button@1.0.0"],
      "patched": "1.0.1",
      "published": "2024-01-15",
      "description": "..."
    }
  ]
}

// CLI 安装时检查
npx aster add @zhangsan/fancy-button

⚠️  安全警告
该组件存在已知安全漏洞 (ASTER-2024-001)
建议安装修复版本: @zhangsan/fancy-button@1.0.1

是否继续安装旧版本? (y/N)
```

### 7. 发布限制

| 限制项 | 值 | 说明 |
|--------|-----|------|
| 单个文件大小 | 500KB | 防止超大文件 |
| 单次发布总大小 | 5MB | 防止资源滥用 |
| 每小时发布次数 | 10 | 防止刷版本 |
| 每日发布次数 | 50 | 防止滥用 |
| 命名空间数量 | 5 | 每用户最多 |
| 资源名称长度 | 50 | 防止过长名称 |
| 描述长度 | 500 | 防止过长描述 |

### 8. Token 安全

- Token 格式: `aster_` 前缀 + 32 位随机字符
- 只存储 SHA256 哈希，不存储原始 token
- 有效期 1 年，支持手动撤销
- 支持权限范围 (scopes)
- 记录创建 IP 和 User-Agent
- 敏感操作需要重新验证

## 错误处理

### CLI 错误码

| 错误码 | 说明 |
|--------|------|
| E001 | 未登录 |
| E002 | Token 过期 |
| E003 | 无权限 |
| E004 | 组件不存在 |
| E005 | 版本不存在 |
| E006 | 网络错误 |
| E007 | 配置文件错误 |

### API 错误响应

```json
{
  "error": "组件不存在",
  "code": "E004",
  "details": {
    "name": "button",
    "namespace": "zhangsan"
  }
}
```

## 依赖解析

### registryDependencies 格式

```typescript
// 支持的依赖格式
registryDependencies: [
  'lib:utils',                      // 官方资源
  '@zhangsan/lib:request',          // 社区资源
  'hook:use-debounce@1.0.0',        // 指定版本
  '@zhangsan/button@^2.0.0',        // 版本范围
]
```

### 依赖解析流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        依赖解析流程                                  │
│                                                                     │
│  1. 解析 registryDependencies 列表                                  │
│     ↓                                                               │
│  2. 检查本地是否已安装 (aster.json)                                  │
│     ↓                                                               │
│  3. 已安装 → 检查版本兼容性                                          │
│     - 兼容 → 跳过                                                   │
│     - 不兼容 → 提示用户选择                                          │
│     ↓                                                               │
│  4. 未安装 → 递归获取依赖                                            │
│     ↓                                                               │
│  5. 检测循环依赖 (维护 visited set)                                  │
│     ↓                                                               │
│  6. 拓扑排序，按顺序安装                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 循环依赖检测

```typescript
// 安装时检测循环依赖
function detectCircularDeps(
  name: string,
  deps: string[],
  visited: Set<string>,
  path: string[]
): string[] | null {
  if (visited.has(name)) {
    return [...path, name]; // 返回循环路径
  }
  
  visited.add(name);
  path.push(name);
  
  for (const dep of deps) {
    const result = detectCircularDeps(dep, getDeps(dep), visited, path);
    if (result) return result;
  }
  
  path.pop();
  return null;
}
```

### 版本冲突处理

```
场景: 安装 @zhangsan/button 依赖 lib:utils@1.0.0
      但本地已有 lib:utils@2.0.0

处理策略:
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  版本冲突                                                        │
│                                                                     │
│  @zhangsan/button 需要 lib:utils@1.0.0                              │
│  但本地已安装 lib:utils@2.0.0                                        │
│                                                                     │
│  请选择:                                                            │
│  (1) 保留本地版本 (可能导致兼容问题)                                  │
│  (2) 降级到 1.0.0                                                   │
│  (3) 取消安装                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 本地状态管理

### aster.json 格式

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
    "ui": {
      "button": { "version": "1.0.0", "namespace": "expo" },
      "card": { "version": "1.2.0", "namespace": "zhangsan" }
    },
    "hook": {
      "use-debounce": { "version": "1.0.0", "namespace": "expo" }
    },
    "lib": {
      "utils": { "version": "2.0.0", "namespace": "expo" }
    },
    "config": {}
  }
}
```

### 更新检测

```bash
# 检查更新
npx aster update --check

# 输出示例
┌─────────────────────────────────────────────────────────────────────┐
│  📦 可用更新                                                         │
│                                                                     │
│  button          1.0.0 → 1.1.0                                      │
│  @zhangsan/card  1.2.0 → 2.0.0 (major)                              │
│  use-debounce    1.0.0 → 1.0.1                                      │
│                                                                     │
│  运行 npx aster update 更新所有                                      │
│  运行 npx aster update button 更新指定资源                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## CLI 缓存

### 本地缓存目录

```
~/.aster/
├── credentials.json      # 认证信息
├── cache/
│   ├── index/           # 索引缓存
│   │   ├── expo.json
│   │   └── @zhangsan.json
│   └── resources/       # 资源缓存
│       ├── expo/
│       │   └── button-1.0.0.json
│       └── @zhangsan/
│           └── card-1.2.0.json
└── config.json          # CLI 全局配置
```

### 缓存策略

```typescript
// CLI 缓存配置
const CACHE_CONFIG = {
  index: {
    ttl: 5 * 60 * 1000,      // 索引缓存 5 分钟
    staleWhileRevalidate: true,
  },
  resource: {
    ttl: 24 * 60 * 60 * 1000, // 资源缓存 24 小时
    // 版本化资源永久缓存 (1.0.0.json)
    // latest.json 遵循 ttl
  },
};

// 离线模式
// 网络不可用时，使用本地缓存
async function fetchWithCache(url: string, cacheKey: string) {
  try {
    const response = await fetch(url, { timeout: 5000 });
    const data = await response.json();
    await saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    // 网络错误，尝试使用缓存
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log(chalk.yellow('⚠️  使用缓存数据 (离线模式)'));
      return cached;
    }
    throw error;
  }
}
```

## Config Transforms

### 支持的配置文件格式

| 格式 | 文件 | 合并策略 |
|------|------|----------|
| JSON | *.json | 深度合并 |
| JS (module.exports) | *.js | AST 合并 |
| JS (export default) | *.mjs, *.ts | AST 合并 |

### Transform 定义

```json
{
  "transforms": [
    {
      "file": "babel.config.js",
      "type": "js-module-exports",
      "merge": {
        "plugins": ["nativewind/babel"]
      }
    },
    {
      "file": "tsconfig.json",
      "type": "json",
      "merge": {
        "compilerOptions": {
          "jsxImportSource": "nativewind"
        }
      }
    },
    {
      "file": "app.json",
      "type": "json",
      "path": "expo.plugins",
      "append": ["nativewind/expo"]
    }
  ]
}
```

### Transform 执行流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Transform 执行流程                            │
│                                                                     │
│  1. 检查目标文件是否存在                                             │
│     - 不存在 → 创建新文件                                           │
│     - 存在 → 继续                                                   │
│     ↓                                                               │
│  2. 备份原文件 → .bak                                               │
│     ↓                                                               │
│  3. 解析文件内容                                                     │
│     - JSON → JSON.parse                                             │
│     - JS → AST 解析                                                 │
│     ↓                                                               │
│  4. 执行合并                                                         │
│     - merge: 深度合并对象                                           │
│     - append: 追加到数组                                            │
│     - prepend: 插入到数组开头                                        │
│     ↓                                                               │
│  5. 写入文件                                                         │
│     ↓                                                               │
│  6. 验证文件语法                                                     │
│     - 失败 → 回滚到备份                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 冲突处理

```typescript
// 合并冲突时的处理
interface MergeConflict {
  path: string;      // 冲突路径，如 "plugins[0]"
  existing: any;     // 现有值
  incoming: any;     // 新值
}

// 冲突提示
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  配置合并冲突                                                    │
│                                                                     │
│  文件: babel.config.js                                              │
│  路径: plugins[0]                                                   │
│                                                                     │
│  现有值: "react-native-reanimated/plugin"                           │
│  新值:   "nativewind/babel"                                         │
│                                                                     │
│  请选择:                                                            │
│  (1) 保留现有值                                                     │
│  (2) 使用新值                                                       │
│  (3) 两者都保留 (追加)                                               │
│  (4) 手动编辑                                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 搜索功能

### 数据库搜索字段

```sql
-- 扩展 registry_items 表
CREATE TABLE registry_items (
  id SERIAL PRIMARY KEY,
  namespace VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,        -- ui, hook, lib, config
  style VARCHAR(50),                -- nativewind, etc.
  description TEXT,
  keywords TEXT[],                  -- 搜索关键词
  readme TEXT,                      -- README 内容 (用于全文搜索)
  latest_version VARCHAR(20),
  downloads INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(namespace, name, type)
);

-- 全文搜索索引
CREATE INDEX idx_registry_items_search ON registry_items 
USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(keywords, ' '), '')));
```

### 搜索 API

```typescript
// GET /api/community/search?q=button&type=ui&sort=downloads
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type');
  const sort = searchParams.get('sort') || 'relevance';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  
  const { rows } = await sql`
    SELECT 
      namespace, name, type, style, description, 
      latest_version, downloads,
      ts_rank(
        to_tsvector('simple', name || ' ' || COALESCE(description, '')),
        plainto_tsquery('simple', ${q})
      ) as relevance
    FROM registry_items
    WHERE 
      (${q} = '' OR to_tsvector('simple', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('simple', ${q}))
      AND (${type}::text IS NULL OR type = ${type})
    ORDER BY 
      CASE WHEN ${sort} = 'downloads' THEN downloads END DESC,
      CASE WHEN ${sort} = 'relevance' THEN relevance END DESC,
      CASE WHEN ${sort} = 'newest' THEN created_at END DESC
    LIMIT ${limit}
    OFFSET ${(page - 1) * limit}
  `;
  
  return Response.json({ items: rows, page, limit });
}
```

## 发布验证

### 发布前检查清单

```typescript
interface PublishValidation {
  // 格式验证
  jsonValid: boolean;           // JSON 格式正确
  schemaValid: boolean;         // 符合 schema
  
  // 内容验证
  filesNotEmpty: boolean;       // 文件内容非空
  syntaxValid: boolean;         // 代码语法正确 (可选)
  
  // 依赖验证
  depsExist: boolean;           // registryDependencies 都存在
  noCyclicDeps: boolean;        // 无循环依赖
  
  // 版本验证
  versionIncremented: boolean;  // 版本号递增
  semverValid: boolean;         // 符合 semver
}
```

### 验证流程

```typescript
// packages/cli/src/commands/registry/build.ts
async function validateBeforeBuild(config: RegistryConfig) {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 1. 验证 namespace 格式
  if (!/^[a-z0-9-]{3,30}$/.test(config.namespace)) {
    errors.push('命名空间格式不正确');
  }
  
  // 2. 验证版本号
  if (config.version && !semver.valid(config.version)) {
    errors.push(`版本号 "${config.version}" 不符合 semver 规范`);
  }
  
  // 3. 验证文件存在
  for (const comp of config.components || []) {
    for (const file of comp.files) {
      if (!fileExists(file)) {
        errors.push(`文件不存在: ${file}`);
      }
    }
  }
  
  // 4. 验证依赖存在 (可选，需要网络)
  for (const comp of config.components || []) {
    for (const dep of comp.registryDependencies || []) {
      const exists = await checkDependencyExists(dep);
      if (!exists) {
        warnings.push(`依赖可能不存在: ${dep}`);
      }
    }
  }
  
  return { errors, warnings };
}
```

## 版本管理

### 版本发布规则

```typescript
// 发布 API 中的版本验证
async function validateVersion(namespace: string, name: string, newVersion: string) {
  // 获取当前最新版本
  const current = await getLatestVersion(namespace, name);
  
  if (!current) {
    // 首次发布，任何版本都可以
    return { valid: true };
  }
  
  // 检查版本是否递增
  if (!semver.gt(newVersion, current)) {
    return {
      valid: false,
      error: `版本必须大于当前版本 ${current}`,
    };
  }
  
  // 检查版本跳跃是否合理
  const diff = semver.diff(current, newVersion);
  if (diff === 'major') {
    // major 版本跳跃，给出警告
    return {
      valid: true,
      warning: `这是一个 major 版本更新 (${current} → ${newVersion})`,
    };
  }
  
  return { valid: true };
}
```

### 版本废弃

```typescript
// POST /api/registry/deprecate
export async function POST(request: Request) {
  const user = await verifyToken(request);
  const { namespace, name, version, message } = await request.json();
  
  // 验证权限
  // ...
  
  // 标记版本为废弃
  await sql`
    UPDATE registry_versions
    SET deprecated = true, deprecated_message = ${message}
    WHERE namespace = ${namespace} AND name = ${name} AND version = ${version}
  `;
  
  // 更新 R2 中的 JSON
  const resourcePath = `@${namespace}/components/.../${version}.json`;
  const content = await getFromR2(resourcePath);
  const json = JSON.parse(content);
  json.deprecated = true;
  json.deprecatedMessage = message;
  await uploadToR2(resourcePath, JSON.stringify(json));
  
  return Response.json({ success: true });
}
```

### 版本删除 (仅限 24 小时内)

```typescript
// DELETE /api/registry/version
export async function DELETE(request: Request) {
  const user = await verifyToken(request);
  const { namespace, name, version } = await request.json();
  
  // 检查发布时间
  const versionInfo = await getVersionInfo(namespace, name, version);
  const hoursSincePublish = (Date.now() - versionInfo.created_at) / (1000 * 60 * 60);
  
  if (hoursSincePublish > 24) {
    return Response.json(
      { error: '只能删除 24 小时内发布的版本' },
      { status: 400 }
    );
  }
  
  // 删除 R2 文件
  await deleteFromR2(`@${namespace}/.../${version}.json`);
  
  // 如果是 latest，更新 latest 指向
  if (versionInfo.is_latest) {
    const previousVersion = await getPreviousVersion(namespace, name, version);
    if (previousVersion) {
      const content = await getFromR2(`.../${previousVersion}.json`);
      await uploadToR2(`.../${latest}.json`, content);
    }
  }
  
  return Response.json({ success: true });
}
```

## Rate Limiting

### API 限流配置

```typescript
// apps/docs/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// 不同操作的限流配置
export const rateLimits = {
  // 发布: 每小时 10 次
  publish: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1h'),
    prefix: 'ratelimit:publish',
  }),
  
  // 下载: 每分钟 100 次
  download: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1m'),
    prefix: 'ratelimit:download',
  }),
  
  // 搜索: 每分钟 30 次
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1m'),
    prefix: 'ratelimit:search',
  }),
  
  // 认证: 每小时 20 次
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1h'),
    prefix: 'ratelimit:auth',
  }),
};

// 使用示例
export async function checkRateLimit(
  type: keyof typeof rateLimits,
  identifier: string
) {
  const { success, remaining, reset } = await rateLimits[type].limit(identifier);
  
  if (!success) {
    return {
      allowed: false,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    };
  }
  
  return { allowed: true, remaining };
}
```

### 限流响应

```json
{
  "error": "请求过于频繁",
  "code": "RATE_LIMITED",
  "retryAfter": 3600,
  "limit": 10,
  "remaining": 0
}
```

## 多框架支持预留

### R2 路径结构 (支持多框架)

```
aster-registry/
├── expo/                           # Expo 框架
│   ├── index.json
│   ├── meta.json
│   └── components/nativewind/button/...
│
├── vue/                            # Vue 框架 (预留)
│   ├── index.json
│   └── components/...
│
├── nuxt/                           # Nuxt 框架 (预留)
│   └── ...
│
└── @zhangsan/                      # 社区命名空间
    ├── expo/                       # 该用户的 Expo 组件
    │   └── components/...
    └── vue/                        # 该用户的 Vue 组件 (预留)
        └── components/...
```

### API 支持框架参数

```
GET /api/r/button?framework=expo&style=nativewind
GET /api/r/@zhangsan/button?framework=vue
```

### CLI 配置

```json
// aster.json
{
  "framework": "expo",    // 当前项目框架
  "style": "nativewind",
  // ...
}
```

## 组件预览

### 预览方案

```
┌─────────────────────────────────────────────────────────────────────┐
│                        组件预览架构                                  │
│                                                                     │
│  方案: Expo Snack 嵌入                                              │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │  Docs 页面   │ →  │  Snack API  │ →  │  Snack 预览  │             │
│  │  组件代码    │    │  创建 Snack │    │  iframe 嵌入 │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  优点:                                                              │
│  - 真实 React Native 环境                                           │
│  - 支持 iOS/Android/Web 预览                                        │
│  - 无需自建预览服务                                                  │
│  - Expo 官方维护                                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Snack 集成

```typescript
// apps/docs/components/component-preview.tsx
'use client';

import { useEffect, useState } from 'react';

interface ComponentPreviewProps {
  code: string;
  dependencies?: string[];
  name: string;
}

export function ComponentPreview({ code, dependencies, name }: ComponentPreviewProps) {
  const [snackUrl, setSnackUrl] = useState<string | null>(null);
  
  useEffect(() => {
    // 构建 Snack URL
    const files = {
      'App.tsx': {
        type: 'CODE',
        contents: generatePreviewCode(code, name),
      },
    };
    
    const snackParams = new URLSearchParams({
      platform: 'web',
      name: `Preview: ${name}`,
      dependencies: dependencies?.join(',') || '',
      files: JSON.stringify(files),
    });
    
    setSnackUrl(`https://snack.expo.dev/embedded?${snackParams}`);
  }, [code, dependencies, name]);
  
  if (!snackUrl) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />;
  }
  
  return (
    <iframe
      src={snackUrl}
      className="w-full h-96 rounded-lg border"
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  );
}

function generatePreviewCode(componentCode: string, name: string): string {
  return `
import React from 'react';
import { View, StyleSheet } from 'react-native';

// Component Code
${componentCode}

// Preview Wrapper
export default function App() {
  return (
    <View style={styles.container}>
      <${name} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
`;
}
```

### 静态预览备选

```typescript
// 对于不支持 Snack 的场景，使用静态截图
interface ComponentMeta {
  name: string;
  preview?: {
    type: 'snack' | 'image' | 'video';
    url?: string;           // 图片/视频 URL
    snackId?: string;       // Snack ID
    platforms?: ('ios' | 'android' | 'web')[];
  };
}

// R2 存储预览资源
// @zhangsan/previews/fancy-button/
// ├── ios.png
// ├── android.png
// └── web.png
```

## 组件文档格式

### 文档结构

```json
{
  "name": "button",
  "version": "1.0.0",
  "type": "registry:ui",
  "description": "可定制的按钮组件",
  
  // 文档内容
  "docs": {
    "description": "Button 组件支持多种变体和尺寸...",
    "installation": "npx aster add button",
    "usage": "import { Button } from '@/components/ui/button';",
    
    // Props 文档
    "props": [
      {
        "name": "variant",
        "type": "'default' | 'destructive' | 'outline' | 'ghost'",
        "default": "'default'",
        "description": "按钮样式变体"
      },
      {
        "name": "size",
        "type": "'sm' | 'md' | 'lg'",
        "default": "'md'",
        "description": "按钮尺寸"
      },
      {
        "name": "disabled",
        "type": "boolean",
        "default": "false",
        "description": "是否禁用"
      },
      {
        "name": "onPress",
        "type": "() => void",
        "required": true,
        "description": "点击回调"
      }
    ],
    
    // 示例代码
    "examples": [
      {
        "title": "基础用法",
        "code": "<Button onPress={() => {}}>点击我</Button>"
      },
      {
        "title": "不同变体",
        "code": "<>\n  <Button variant=\"default\">Default</Button>\n  <Button variant=\"destructive\">Destructive</Button>\n  <Button variant=\"outline\">Outline</Button>\n</>"
      },
      {
        "title": "不同尺寸",
        "code": "<>\n  <Button size=\"sm\">Small</Button>\n  <Button size=\"md\">Medium</Button>\n  <Button size=\"lg\">Large</Button>\n</>"
      }
    ],
    
    // 注意事项
    "notes": [
      "需要先安装 NativeWind 配置",
      "在 Android 上需要启用 New Architecture 以获得最佳性能"
    ],
    
    // 相关组件
    "related": ["icon-button", "link-button"]
  },
  
  // 预览配置
  "preview": {
    "type": "snack",
    "platforms": ["ios", "android", "web"],
    "defaultExample": 0
  },
  
  // 文件内容
  "files": [...],
  "dependencies": [...],
  "registryDependencies": [...]
}
```

### Props 类型自动提取

```typescript
// 构建时从 TypeScript 提取 Props
// packages/cli/src/commands/registry/build.ts

import { Project } from 'ts-morph';

function extractProps(filePath: string, componentName: string) {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  // 查找 Props 接口
  const propsInterface = sourceFile.getInterface(`${componentName}Props`);
  if (!propsInterface) return [];
  
  return propsInterface.getProperties().map(prop => ({
    name: prop.getName(),
    type: prop.getType().getText(),
    required: !prop.hasQuestionToken(),
    description: prop.getJsDocs()[0]?.getDescription() || '',
    default: extractDefaultValue(prop),
  }));
}
```

### 文档页面渲染

```typescript
// apps/docs/app/components/[name]/page.tsx
import { ComponentPreview } from '@/components/component-preview';
import { PropsTable } from '@/components/props-table';
import { CodeBlock } from '@/components/code-block';

export default async function ComponentPage({ params }: { params: { name: string } }) {
  const component = await fetchComponent(params.name);
  const { docs } = component;
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold">{component.name}</h1>
      <p className="text-gray-600 mt-2">{docs.description}</p>
      
      {/* 预览 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">预览</h2>
        <ComponentPreview
          code={component.files[0].content}
          dependencies={component.dependencies}
          name={component.name}
        />
      </section>
      
      {/* 安装 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">安装</h2>
        <CodeBlock language="bash">{docs.installation}</CodeBlock>
      </section>
      
      {/* 用法 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">用法</h2>
        <CodeBlock language="tsx">{docs.usage}</CodeBlock>
      </section>
      
      {/* Props */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Props</h2>
        <PropsTable props={docs.props} />
      </section>
      
      {/* 示例 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold">示例</h2>
        {docs.examples.map((example, i) => (
          <div key={i} className="mt-4">
            <h3 className="font-medium">{example.title}</h3>
            <CodeBlock language="tsx">{example.code}</CodeBlock>
            <ComponentPreview
              code={example.code}
              dependencies={component.dependencies}
              name={component.name}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
```

## 迁移兼容性

### CLI 版本兼容

```
┌─────────────────────────────────────────────────────────────────────┐
│                        版本兼容策略                                  │
│                                                                     │
│  CLI v1 (当前)          CLI v2 (新版)                               │
│  ├── GitHub Raw         ├── R2 存储                                 │
│  ├── 无认证             ├── GitHub OAuth                            │
│  └── 官方组件           └── 官方 + 社区组件                          │
│                                                                     │
│  兼容方案:                                                          │
│  1. API 保持向后兼容                                                 │
│  2. CLI v1 继续工作 (只能访问官方组件)                               │
│  3. 提示用户升级到 v2                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### API 版本管理

```typescript
// API 路由版本
// /api/r/button          → v2 (默认)
// /api/v1/r/button       → v1 兼容
// /api/v2/r/button       → v2 显式

// apps/docs/app/api/v1/r/[...path]/route.ts
// 保持与旧版 CLI 兼容
export async function GET(request: Request, { params }: { params: { path: string[] } }) {
  // 只返回官方组件，格式与 v1 一致
  const componentName = params.path[0];
  
  // 从 R2 获取，但返回 v1 格式
  const component = await fetchFromR2(`expo/components/nativewind/${componentName}/latest.json`);
  
  // 转换为 v1 格式
  return Response.json(convertToV1Format(component));
}

function convertToV1Format(v2Component: any) {
  return {
    name: v2Component.name,
    type: v2Component.type,
    files: v2Component.files,
    dependencies: v2Component.dependencies,
    // v1 没有的字段不返回
  };
}
```

### 配置文件迁移

```typescript
// packages/cli/src/utils/migrate.ts
import chalk from 'chalk';
import { readJson, writeJson, fileExists } from '../core/fs';

interface V1Config {
  style: string;
  tailwind?: { config: string; css: string };
  aliases?: { components: string; utils: string };
}

interface V2Config {
  $schema: string;
  style: string;
  framework: string;
  aliases: { components: string; hooks: string; lib: string };
  installed: Record<string, Record<string, any>>;
}

export async function migrateConfig(): Promise<boolean> {
  const v1ConfigPath = 'components.json';
  const v2ConfigPath = 'aster.json';
  
  // 检查是否需要迁移
  if (!fileExists(v1ConfigPath)) {
    return false;
  }
  
  if (fileExists(v2ConfigPath)) {
    console.log(chalk.yellow('aster.json 已存在，跳过迁移'));
    return false;
  }
  
  console.log(chalk.cyan('检测到旧版配置，正在迁移...\n'));
  
  const v1Config = await readJson<V1Config>(v1ConfigPath);
  
  const v2Config: V2Config = {
    $schema: 'https://aster.dev/schema/aster.json',
    style: v1Config.style || 'nativewind',
    framework: 'expo',
    aliases: {
      components: v1Config.aliases?.components || '@/components',
      hooks: '@/hooks',
      lib: v1Config.aliases?.utils || '@/lib',
    },
    installed: {
      ui: {},
      hook: {},
      lib: {},
      config: {},
    },
  };
  
  // 扫描已安装的组件
  const installedComponents = await scanInstalledComponents(v2Config.aliases.components);
  for (const comp of installedComponents) {
    v2Config.installed.ui[comp] = {
      version: 'unknown',
      namespace: 'expo',
      installedAt: new Date().toISOString(),
    };
  }
  
  await writeJson(v2ConfigPath, v2Config);
  
  console.log(chalk.green('✔ 迁移完成!'));
  console.log(chalk.dim(`  已创建 ${v2ConfigPath}`));
  console.log(chalk.dim(`  检测到 ${installedComponents.length} 个已安装组件\n`));
  
  return true;
}

async function scanInstalledComponents(componentsPath: string): Promise<string[]> {
  // 扫描组件目录，识别已安装的组件
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const uiPath = path.join(process.cwd(), componentsPath.replace('@/', ''), 'ui');
  
  try {
    const files = await fs.readdir(uiPath);
    return files
      .filter(f => f.endsWith('.tsx'))
      .map(f => f.replace('.tsx', ''));
  } catch {
    return [];
  }
}
```

### CLI 升级提示

```typescript
// packages/cli/src/utils/version-check.ts
import chalk from 'chalk';

const CURRENT_VERSION = '2.0.0';

export async function checkForUpdates() {
  try {
    const res = await fetch('https://registry.npmjs.org/aster/latest', {
      signal: AbortSignal.timeout(3000),
    });
    const { version: latestVersion } = await res.json();
    
    if (latestVersion !== CURRENT_VERSION) {
      console.log(chalk.yellow(`\n📦 新版本可用: ${latestVersion} (当前: ${CURRENT_VERSION})`));
      console.log(chalk.dim('   运行 npm install -g aster 更新\n'));
    }
  } catch {
    // 忽略检查失败
  }
}
```

## 错误恢复

### 安装事务

```
┌─────────────────────────────────────────────────────────────────────┐
│                        安装事务流程                                  │
│                                                                     │
│  1. 开始事务                                                        │
│     ├── 创建临时目录                                                │
│     └── 记录当前状态                                                │
│                                                                     │
│  2. 执行安装                                                        │
│     ├── 下载资源 → 临时目录                                         │
│     ├── 安装依赖 (npm/yarn/pnpm)                                    │
│     └── 写入文件 → 临时目录                                         │
│                                                                     │
│  3. 提交/回滚                                                       │
│     ├── 成功 → 移动文件到目标位置                                    │
│     └── 失败 → 删除临时目录，恢复状态                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 事务实现

```typescript
// packages/cli/src/core/transaction.ts
import path from 'path';
import { copyFile, removeDir, ensureDir, moveFile, fileExists } from './fs';

interface TransactionFile {
  source: string;      // 临时文件路径
  target: string;      // 目标文件路径
  backup?: string;     // 备份路径 (如果目标已存在)
}

export class InstallTransaction {
  private tempDir: string;
  private files: TransactionFile[] = [];
  private committed = false;
  private rolledBack = false;
  
  constructor() {
    this.tempDir = path.join(process.cwd(), '.aster-temp', Date.now().toString());
  }
  
  async begin() {
    await ensureDir(this.tempDir);
  }
  
  // 添加要安装的文件
  async addFile(targetPath: string, content: string) {
    const tempPath = path.join(this.tempDir, path.basename(targetPath));
    
    // 写入临时文件
    const fs = await import('fs/promises');
    await fs.writeFile(tempPath, content, 'utf-8');
    
    // 如果目标已存在，记录备份
    let backup: string | undefined;
    if (fileExists(targetPath)) {
      backup = `${targetPath}.bak`;
      await copyFile(targetPath, backup);
    }
    
    this.files.push({ source: tempPath, target: targetPath, backup });
  }
  
  // 提交事务
  async commit() {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already finished');
    }
    
    try {
      // 移动所有文件到目标位置
      for (const file of this.files) {
        await ensureDir(path.dirname(file.target));
        await moveFile(file.source, file.target);
      }
      
      // 删除备份
      for (const file of this.files) {
        if (file.backup && fileExists(file.backup)) {
          const fs = await import('fs/promises');
          await fs.unlink(file.backup);
        }
      }
      
      // 清理临时目录
      await removeDir(this.tempDir);
      
      this.committed = true;
    } catch (error) {
      // 提交失败，自动回滚
      await this.rollback();
      throw error;
    }
  }
  
  // 回滚事务
  async rollback() {
    if (this.committed || this.rolledBack) {
      return;
    }
    
    // 恢复备份
    for (const file of this.files) {
      if (file.backup && fileExists(file.backup)) {
        await moveFile(file.backup, file.target);
      } else if (fileExists(file.target)) {
        // 删除新创建的文件
        const fs = await import('fs/promises');
        await fs.unlink(file.target);
      }
    }
    
    // 清理临时目录
    await removeDir(this.tempDir);
    
    this.rolledBack = true;
  }
}
```

### 使用事务安装

```typescript
// packages/cli/src/core/installer.ts
import chalk from 'chalk';
import ora from 'ora';
import { InstallTransaction } from './transaction';
import { installDependencies } from './deps';

export async function installResources(
  resources: any[],
  options: { cwd: string }
) {
  const spinner = ora();
  const transaction = new InstallTransaction();
  
  try {
    // 1. 开始事务
    await transaction.begin();
    spinner.start('准备安装...');
    
    // 2. 写入文件到临时目录
    for (const resource of resources) {
      for (const file of resource.files) {
        const targetPath = path.join(options.cwd, file.target);
        await transaction.addFile(targetPath, file.content);
      }
    }
    spinner.succeed('文件准备完成');
    
    // 3. 安装 npm 依赖
    const allDeps = resources.flatMap(r => r.dependencies || []);
    const allDevDeps = resources.flatMap(r => r.devDependencies || []);
    
    if (allDeps.length > 0 || allDevDeps.length > 0) {
      spinner.start('安装依赖...');
      await installDependencies(allDeps, allDevDeps, options.cwd);
      spinner.succeed('依赖安装完成');
    }
    
    // 4. 提交事务
    spinner.start('完成安装...');
    await transaction.commit();
    spinner.succeed('安装完成!');
    
    return { success: true };
  } catch (error) {
    // 5. 回滚
    spinner.fail('安装失败，正在回滚...');
    await transaction.rollback();
    
    console.log(chalk.red(`\n错误: ${error.message}`));
    console.log(chalk.dim('所有更改已回滚\n'));
    
    return { success: false, error };
  }
}
```

### 网络中断恢复

```typescript
// packages/cli/src/utils/retry.ts

interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoff?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    onRetry,
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // 只重试网络错误
      if (!isNetworkError(error)) {
        throw error;
      }
      
      onRetry?.(lastError, attempt);
      
      // 等待后重试
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await sleep(waitTime);
    }
  }
  
  throw lastError!;
}

function isNetworkError(error: any): boolean {
  return (
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.name === 'AbortError' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 断点续传

```typescript
// packages/cli/src/utils/resume.ts
import path from 'path';
import { readJson, writeJson, fileExists, removeFile } from '../core/fs';

const RESUME_FILE = '.aster-resume.json';

interface ResumeState {
  operation: 'add' | 'update' | 'remove';
  resources: string[];
  completed: string[];
  startedAt: string;
}

export async function saveResumeState(state: ResumeState) {
  await writeJson(RESUME_FILE, state);
}

export async function loadResumeState(): Promise<ResumeState | null> {
  if (!fileExists(RESUME_FILE)) {
    return null;
  }
  return readJson<ResumeState>(RESUME_FILE);
}

export async function clearResumeState() {
  if (fileExists(RESUME_FILE)) {
    await removeFile(RESUME_FILE);
  }
}

export async function markCompleted(resourceName: string) {
  const state = await loadResumeState();
  if (state) {
    state.completed.push(resourceName);
    await saveResumeState(state);
  }
}

// 使用示例
export async function addWithResume(resources: string[]) {
  // 检查是否有未完成的操作
  const resumeState = await loadResumeState();
  
  if (resumeState && resumeState.operation === 'add') {
    const pending = resumeState.resources.filter(
      r => !resumeState.completed.includes(r)
    );
    
    if (pending.length > 0) {
      console.log(chalk.yellow(`\n检测到未完成的安装 (${pending.length} 个资源)`));
      
      const { resume } = await prompts({
        type: 'confirm',
        name: 'resume',
        message: '是否继续上次的安装?',
        initial: true,
      });
      
      if (resume) {
        resources = pending;
      } else {
        await clearResumeState();
      }
    }
  }
  
  // 保存状态
  await saveResumeState({
    operation: 'add',
    resources,
    completed: [],
    startedAt: new Date().toISOString(),
  });
  
  // 执行安装
  for (const resource of resources) {
    await installResource(resource);
    await markCompleted(resource);
  }
  
  // 清理状态
  await clearResumeState();
}
```

## 实现优先级

### P0 - 核心功能 (必须)

1. R2 存储接入
2. 数据库 Schema
3. GitHub OAuth
4. CLI login/logout/whoami
5. CLI registry build/publish
6. 获取组件 API
7. 本地状态管理 (aster.json)
8. 组件文档格式
9. 安装事务和错误恢复
10. 迁移兼容性

### P1 - 增强功能 (重要)

1. 版本管理 (递增验证、废弃)
2. 命名空间管理
3. Redis 缓存
4. 下载统计
5. 依赖解析和循环检测
6. CLI 本地缓存
7. 组件预览 (Expo Snack)
8. 断点续传

### P2 - 扩展功能 (后续)

1. Config transforms
2. 搜索功能 (全文搜索)
3. Rate limiting
4. 版本删除
5. Docs 社区展示页
6. 多框架支持
7. Props 自动提取
