# Aster V2 实现计划

## 第一步：R2 存储接入

### 1.1 创建 R2 Bucket

在 Cloudflare Dashboard 创建：
- Bucket 名称: `aster-registry`
- 开启公开访问
- 绑定自定义域名: `r2.aster.dev`

### 1.2 环境变量

```env
# .env.local
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=aster-registry
R2_PUBLIC_URL=https://r2.aster.dev
```

### 1.3 R2 工具类

```typescript
// apps/docs/lib/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(key: string, content: string) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: content,
    ContentType: 'application/json',
  }));
}

export async function getFromR2(key: string) {
  const response = await r2.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }));
  return response.Body?.transformToString();
}

export async function deleteFromR2(key: string) {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  }));
}
```


---

## 第二步：数据库设计

### 2.1 选择数据库

推荐: **Vercel Postgres** 或 **Supabase**
- 免费额度足够
- 和 Vercel 部署集成好

### 2.2 数据库 Schema

```sql
-- =====================================================
-- 用户表
-- =====================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  github_id VARCHAR(50) UNIQUE NOT NULL,
  github_username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  avatar_url VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 命名空间表
-- =====================================================
CREATE TABLE namespaces (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,        -- 是否已验证
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- Token 表 (安全增强)
-- =====================================================
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,  -- 只存储 SHA256 哈希
  name VARCHAR(50),
  scopes TEXT[],                           -- 权限范围: ['read', 'publish', 'delete']
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  revoked BOOLEAN DEFAULT false,           -- 是否已撤销
  revoked_at TIMESTAMP,
  ip_address VARCHAR(45),                  -- 创建时的 IP
  user_agent TEXT                          -- 创建时的 UA
);

-- =====================================================
-- 资源表 (组件/Hooks/Lib/Config 元信息)
-- =====================================================
CREATE TABLE registry_items (
  id SERIAL PRIMARY KEY,
  namespace_id INT REFERENCES namespaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,               -- ui, hook, lib, config
  style VARCHAR(50),                       -- nativewind, etc. (UI 组件需要)
  description TEXT,
  keywords TEXT[],                         -- 搜索关键词
  latest_version VARCHAR(20),
  total_downloads INT DEFAULT 0,
  is_official BOOLEAN DEFAULT false,       -- 是否官方组件
  deprecated BOOLEAN DEFAULT false,        -- 是否已废弃
  deprecated_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(namespace_id, name, type, style)
);

-- =====================================================
-- 版本表
-- =====================================================
CREATE TABLE registry_versions (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES registry_items(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  r2_path VARCHAR(500) NOT NULL,           -- R2 存储路径
  file_size INT,                           -- 文件大小 (bytes)
  integrity VARCHAR(100),                  -- SHA256 完整性校验
  downloads INT DEFAULT 0,
  deprecated BOOLEAN DEFAULT false,
  deprecated_message TEXT,
  published_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(item_id, version)
);

-- =====================================================
-- 下载统计表 (按日聚合)
-- =====================================================
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES registry_items(id) ON DELETE CASCADE,
  version VARCHAR(20),
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 1,
  
  UNIQUE(item_id, version, date)
);

-- =====================================================
-- 安全公告表
-- =====================================================
CREATE TABLE security_advisories (
  id SERIAL PRIMARY KEY,
  severity VARCHAR(20) NOT NULL,           -- critical, high, medium, low
  title VARCHAR(200) NOT NULL,
  description TEXT,
  affected_items INT[],                    -- 受影响的 registry_items.id
  affected_versions TEXT[],                -- 受影响的版本范围
  patched_version VARCHAR(20),             -- 修复版本
  cve_id VARCHAR(50),                      -- CVE 编号 (如有)
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 发布限流记录表
-- =====================================================
CREATE TABLE publish_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  namespace_id INT REFERENCES namespaces(id) ON DELETE CASCADE,
  item_count INT,                          -- 发布的资源数量
  total_size INT,                          -- 总大小 (bytes)
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
-- 用户和命名空间
CREATE INDEX idx_namespaces_user_id ON namespaces(user_id);
CREATE INDEX idx_namespaces_name ON namespaces(name);

-- Token
CREATE INDEX idx_tokens_user_id ON tokens(user_id);
CREATE INDEX idx_tokens_hash ON tokens(token_hash);

-- 资源
CREATE INDEX idx_registry_items_namespace ON registry_items(namespace_id);
CREATE INDEX idx_registry_items_type ON registry_items(type);
CREATE INDEX idx_registry_items_name ON registry_items(name);
CREATE INDEX idx_registry_items_downloads ON registry_items(total_downloads DESC);

-- 全文搜索索引
CREATE INDEX idx_registry_items_search ON registry_items 
USING GIN (to_tsvector('simple', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(keywords, ' '), '')));

-- 版本
CREATE INDEX idx_registry_versions_item ON registry_versions(item_id);
CREATE INDEX idx_registry_versions_version ON registry_versions(item_id, version);

-- 下载统计
CREATE INDEX idx_downloads_item ON downloads(item_id);
CREATE INDEX idx_downloads_date ON downloads(date);

-- 发布日志
CREATE INDEX idx_publish_logs_user ON publish_logs(user_id);
CREATE INDEX idx_publish_logs_time ON publish_logs(created_at);
```

### 2.3 数据库工具类

```typescript
// apps/docs/lib/db.ts
import { sql } from '@vercel/postgres';

// =====================================================
// 用户
// =====================================================
export async function getUserByGithubId(githubId: string) {
  const { rows } = await sql`
    SELECT * FROM users WHERE github_id = ${githubId}
  `;
  return rows[0];
}

export async function createUser(data: {
  githubId: string;
  githubUsername: string;
  email?: string;
  avatarUrl?: string;
}) {
  const { rows } = await sql`
    INSERT INTO users (github_id, github_username, email, avatar_url)
    VALUES (${data.githubId}, ${data.githubUsername}, ${data.email}, ${data.avatarUrl})
    RETURNING *
  `;
  return rows[0];
}

// 命名空间
export async function getNamespacesByUserId(userId: number) {
  const { rows } = await sql`
    SELECT * FROM namespaces WHERE user_id = ${userId}
  `;
  return rows;
}

export async function createNamespace(userId: number, name: string, isDefault = false) {
  const { rows } = await sql`
    INSERT INTO namespaces (user_id, name, is_default)
    VALUES (${userId}, ${name}, ${isDefault})
    RETURNING *
  `;
  return rows[0];
}

export async function getNamespaceByName(name: string) {
  const { rows } = await sql`
    SELECT n.*, u.github_username 
    FROM namespaces n
    JOIN users u ON n.user_id = u.id
    WHERE n.name = ${name}
  `;
  return rows[0];
}

// Token
export async function createToken(userId: number, token: string, name?: string) {
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1年有效期
  
  const { rows } = await sql`
    INSERT INTO tokens (user_id, token, name, expires_at)
    VALUES (${userId}, ${token}, ${name}, ${expiresAt})
    RETURNING *
  `;
  return rows[0];
}

export async function getUserByToken(token: string) {
  const { rows } = await sql`
    SELECT u.* FROM users u
    JOIN tokens t ON u.id = t.user_id
    WHERE t.token_hash = ${tokenHash} 
    AND (t.expires_at IS NULL OR t.expires_at > NOW())
    AND t.revoked = false
  `;
  
  if (rows[0]) {
    // 更新最后使用时间
    await sql`UPDATE tokens SET last_used_at = NOW() WHERE token_hash = ${tokenHash}`;
  }
  
  return rows[0];
}

// =====================================================
// 资源 (Registry Items)
// =====================================================
export async function getRegistryItem(namespaceId: number, name: string, type: string, style?: string) {
  const { rows } = await sql`
    SELECT * FROM registry_items 
    WHERE namespace_id = ${namespaceId} 
    AND name = ${name} 
    AND type = ${type}
    AND (${style}::text IS NULL OR style = ${style})
  `;
  return rows[0];
}

export async function createRegistryItem(data: {
  namespaceId: number;
  name: string;
  type: string;
  style?: string;
  description?: string;
  keywords?: string[];
  latestVersion: string;
  isOfficial?: boolean;
}) {
  const { rows } = await sql`
    INSERT INTO registry_items (
      namespace_id, name, type, style, description, keywords, latest_version, is_official
    ) VALUES (
      ${data.namespaceId}, ${data.name}, ${data.type}, ${data.style}, 
      ${data.description}, ${data.keywords}, ${data.latestVersion}, ${data.isOfficial || false}
    )
    ON CONFLICT (namespace_id, name, type, style) 
    DO UPDATE SET 
      description = EXCLUDED.description,
      keywords = EXCLUDED.keywords,
      latest_version = EXCLUDED.latest_version,
      updated_at = NOW()
    RETURNING *
  `;
  return rows[0];
}

export async function updateRegistryItemDownloads(itemId: number) {
  await sql`
    UPDATE registry_items 
    SET total_downloads = total_downloads + 1 
    WHERE id = ${itemId}
  `;
}

// =====================================================
// 版本
// =====================================================
export async function createVersion(data: {
  itemId: number;
  version: string;
  r2Path: string;
  fileSize?: number;
  integrity?: string;
}) {
  const { rows } = await sql`
    INSERT INTO registry_versions (item_id, version, r2_path, file_size, integrity)
    VALUES (${data.itemId}, ${data.version}, ${data.r2Path}, ${data.fileSize}, ${data.integrity})
    RETURNING *
  `;
  return rows[0];
}

export async function getVersions(itemId: number) {
  const { rows } = await sql`
    SELECT * FROM registry_versions 
    WHERE item_id = ${itemId} 
    ORDER BY published_at DESC
  `;
  return rows;
}

export async function deprecateVersion(itemId: number, version: string, message?: string) {
  await sql`
    UPDATE registry_versions 
    SET deprecated = true, deprecated_message = ${message}
    WHERE item_id = ${itemId} AND version = ${version}
  `;
}

// =====================================================
// 下载统计
// =====================================================
export async function incrementDownload(itemId: number, version: string) {
  // 更新每日统计
  await sql`
    INSERT INTO downloads (item_id, version, count)
    VALUES (${itemId}, ${version}, 1)
    ON CONFLICT (item_id, version, date)
    DO UPDATE SET count = downloads.count + 1
  `;
  
  // 更新版本下载数
  await sql`
    UPDATE registry_versions 
    SET downloads = downloads + 1 
    WHERE item_id = ${itemId} AND version = ${version}
  `;
  
  // 更新总下载数
  await updateRegistryItemDownloads(itemId);
}

export async function getDownloadStats(itemId: number, days = 30) {
  const { rows } = await sql`
    SELECT date, SUM(count) as count
    FROM downloads 
    WHERE item_id = ${itemId} 
    AND date >= CURRENT_DATE - ${days}
    GROUP BY date
    ORDER BY date
  `;
  return rows;
}

// =====================================================
// 搜索
// =====================================================
export async function searchRegistryItems(query: string, options: {
  type?: string;
  style?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const { type, style, limit = 20, offset = 0 } = options;
  
  const { rows } = await sql`
    SELECT 
      ri.*, n.name as namespace_name,
      ts_rank(
        to_tsvector('simple', ri.name || ' ' || COALESCE(ri.description, '')),
        plainto_tsquery('simple', ${query})
      ) as relevance
    FROM registry_items ri
    JOIN namespaces n ON ri.namespace_id = n.id
    WHERE 
      (${query} = '' OR to_tsvector('simple', ri.name || ' ' || COALESCE(ri.description, '')) @@ plainto_tsquery('simple', ${query}))
      AND (${type}::text IS NULL OR ri.type = ${type})
      AND (${style}::text IS NULL OR ri.style = ${style})
      AND ri.deprecated = false
    ORDER BY ri.is_official DESC, relevance DESC, ri.total_downloads DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return rows;
}

// =====================================================
// 发布日志 (限流用)
// =====================================================
export async function logPublish(data: {
  userId: number;
  namespaceId: number;
  itemCount: number;
  totalSize: number;
  ipAddress?: string;
}) {
  await sql`
    INSERT INTO publish_logs (user_id, namespace_id, item_count, total_size, ip_address)
    VALUES (${data.userId}, ${data.namespaceId}, ${data.itemCount}, ${data.totalSize}, ${data.ipAddress})
  `;
}

export async function getRecentPublishCount(userId: number, hours = 1) {
  const { rows } = await sql`
    SELECT COUNT(*) as count
    FROM publish_logs 
    WHERE user_id = ${userId} 
    AND created_at >= NOW() - INTERVAL '${hours} hours'
  `;
  return parseInt(rows[0].count);
}

// =====================================================
// 安全公告
// =====================================================
export async function getSecurityAdvisories(itemIds?: number[]) {
  if (itemIds && itemIds.length > 0) {
    const { rows } = await sql`
      SELECT * FROM security_advisories 
      WHERE published_at IS NOT NULL
      AND affected_items && ${itemIds}
      ORDER BY published_at DESC
    `;
    return rows;
  }
  
  const { rows } = await sql`
    SELECT * FROM security_advisories 
    WHERE published_at IS NOT NULL
    ORDER BY published_at DESC
    LIMIT 50
  `;
  return rows;
}
```


---

## 第三步：GitHub OAuth 认证

### 3.1 创建 GitHub OAuth App

1. GitHub Settings → Developer settings → OAuth Apps
2. 创建新应用:
   - Application name: Aster
   - Homepage URL: https://aster.dev
   - Authorization callback URL: https://aster.dev/api/auth/github/callback

### 3.2 环境变量

```env
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

### 3.3 认证 API

```typescript
// apps/docs/app/api/auth/github/route.ts
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cli = searchParams.get('cli'); // CLI 登录标记
  
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/github/callback`,
    scope: 'read:user user:email',
    state: cli ? 'cli' : 'web',
  });
  
  redirect(`https://github.com/login/oauth/authorize?${params}`);
}
```

```typescript
// apps/docs/app/api/auth/github/callback/route.ts
import { createUser, getUserByGithubId, createToken, createNamespace } from '@/lib/db';
import { nanoid } from 'nanoid';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  // 1. 获取 access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token } = await tokenRes.json();
  
  // 2. 获取用户信息
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const githubUser = await userRes.json();
  
  // 3. 创建或获取用户
  let user = await getUserByGithubId(githubUser.id.toString());
  if (!user) {
    user = await createUser({
      githubId: githubUser.id.toString(),
      githubUsername: githubUser.login,
      email: githubUser.email,
      avatarUrl: githubUser.avatar_url,
    });
    // 创建默认命名空间
    await createNamespace(user.id, githubUser.login, true);
  }
  
  // 4. 生成 token
  const token = nanoid(32);
  await createToken(user.id, token, state === 'cli' ? 'CLI Token' : 'Web Token');
  
  // 5. 返回
  if (state === 'cli') {
    // CLI 登录，显示 token 让用户复制
    return new Response(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h1>登录成功!</h1>
          <p>请复制以下 token 到终端:</p>
          <code style="background: #f0f0f0; padding: 10px 20px; font-size: 18px;">${token}</code>
          <p style="color: #666; margin-top: 20px;">此页面可以关闭</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
  
  // Web 登录，设置 cookie 并跳转
  const response = redirect('/');
  response.cookies.set('token', token, { httpOnly: true, secure: true });
  return response;
}
```

### 3.4 验证中间件

```typescript
// apps/docs/lib/auth.ts
import { getUserByToken } from './db';

export async function verifyToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.slice(7);
  return getUserByToken(token);
}
```


---

## 第四步：CLI 认证命令

### 4.1 登录命令

```typescript
// packages/cli/src/commands/auth.ts
import open from 'open';
import chalk from 'chalk';
import prompts from 'prompts';
import { writeCredentials, readCredentials } from '../utils/credentials';

const API_URL = process.env.ASTER_API_URL || 'https://aster.dev';

export async function login() {
  console.log(chalk.cyan('\n🔐 登录 Aster\n'));
  
  // 打开浏览器
  const authUrl = `${API_URL}/api/auth/github?cli=1`;
  console.log(chalk.dim('正在打开浏览器...'));
  await open(authUrl);
  
  // 等待用户输入 token
  const { token } = await prompts({
    type: 'text',
    name: 'token',
    message: '请粘贴 token:',
  });
  
  if (!token) {
    console.log(chalk.yellow('已取消'));
    return;
  }
  
  // 验证 token
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    console.log(chalk.red('Token 无效'));
    return;
  }
  
  const user = await res.json();
  
  // 保存 token
  await writeCredentials({ token });
  
  console.log(chalk.green(`\n✔ 登录成功!`));
  console.log(chalk.dim(`  用户: ${user.github_username}`));
  console.log(chalk.dim(`  命名空间: @${user.github_username}\n`));
}

export async function logout() {
  await writeCredentials({ token: null });
  console.log(chalk.green('\n✔ 已退出登录\n'));
}

export async function whoami() {
  const credentials = await readCredentials();
  
  if (!credentials?.token) {
    console.log(chalk.yellow('\n未登录，请运行 npx aster login\n'));
    return;
  }
  
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${credentials.token}` },
  });
  
  if (!res.ok) {
    console.log(chalk.yellow('\nToken 已过期，请重新登录\n'));
    return;
  }
  
  const user = await res.json();
  
  console.log(chalk.cyan('\n👤 当前用户\n'));
  console.log(`  用户名: ${user.github_username}`);
  console.log(`  邮箱: ${user.email || '未设置'}`);
  console.log(`  命名空间: ${user.namespaces.map((n: any) => '@' + n.name).join(', ')}`);
  console.log();
}
```

### 4.2 凭证管理

```typescript
// packages/cli/src/utils/credentials.ts
import path from 'path';
import os from 'os';
import { readJson, writeJson, fileExists } from '../core/fs';

const CREDENTIALS_PATH = path.join(os.homedir(), '.aster', 'credentials.json');

interface Credentials {
  token: string | null;
}

export async function readCredentials(): Promise<Credentials | null> {
  if (!fileExists(CREDENTIALS_PATH)) {
    return null;
  }
  return readJson<Credentials>(CREDENTIALS_PATH);
}

export async function writeCredentials(credentials: Credentials) {
  await writeJson(CREDENTIALS_PATH, credentials);
}

export async function getToken(): Promise<string | null> {
  const credentials = await readCredentials();
  return credentials?.token || null;
}
```


---

## 第五步：CLI Registry 命令

### 5.1 创建 Registry 项目

```typescript
// packages/cli/src/commands/registry/create.ts
import path from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import { writeFile, writeJson } from '../../core/fs';

const TEMPLATE_PACKAGE_JSON = {
  name: 'my-aster-registry',
  version: '1.0.0',
  scripts: {
    build: 'aster registry build',
    publish: 'aster registry publish',
  },
};

const TEMPLATE_CONFIG = `import { defineConfig } from 'aster';

export default defineConfig({
  namespace: 'my-namespace',
  frameworks: ['expo'],
  components: [
    {
      name: 'example-button',
      style: 'nativewind',
      description: '示例按钮组件',
      files: ['src/components/nativewind/ui/example-button.tsx'],
      dependencies: [],
    },
  ],
});
`;

const TEMPLATE_COMPONENT = `import { Pressable, Text } from 'react-native';

interface ExampleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
}

export function ExampleButton({ children, onPress }: ExampleButtonProps) {
  return (
    <Pressable
      className="bg-blue-500 px-4 py-2 rounded-lg active:bg-blue-600"
      onPress={onPress}
    >
      <Text className="text-white font-semibold text-center">{children}</Text>
    </Pressable>
  );
}
`;

export async function registryCreate(name?: string) {
  console.log(chalk.cyan('\n📦 创建 Registry 项目\n'));
  
  if (!name) {
    const answer = await prompts({
      type: 'text',
      name: 'name',
      message: '项目名称:',
      initial: 'my-aster-registry',
    });
    name = answer.name;
  }
  
  if (!name) {
    console.log(chalk.yellow('已取消'));
    return;
  }
  
  const targetDir = path.resolve(process.cwd(), name);
  
  // 创建目录结构
  await writeJson(path.join(targetDir, 'package.json'), {
    ...TEMPLATE_PACKAGE_JSON,
    name,
  });
  
  await writeFile(path.join(targetDir, 'registry.config.ts'), TEMPLATE_CONFIG);
  
  await writeFile(
    path.join(targetDir, 'src/components/nativewind/ui/example-button.tsx'),
    TEMPLATE_COMPONENT
  );
  
  console.log(chalk.green(`\n✔ 项目创建成功!\n`));
  console.log(chalk.dim('下一步:'));
  console.log(chalk.white(`  cd ${name}`));
  console.log(chalk.white('  npm install'));
  console.log(chalk.white('  # 编辑 registry.config.ts 和组件'));
  console.log(chalk.white('  npx aster registry build'));
  console.log(chalk.white('  npx aster registry publish\n'));
}
```

### 5.2 构建命令

```typescript
// packages/cli/src/commands/registry/build.ts
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { readFile, writeJson, fileExists } from '../../core/fs';

type ResourceType = 'ui' | 'hook' | 'lib' | 'config';

interface ResourceConfig {
  name: string;
  type: ResourceType;
  style?: string;        // UI 组件需要
  description?: string;
  files: string[];
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  transforms?: any[];    // Config 类型需要
  postInstall?: string[];
}

interface RegistryConfig {
  namespace: string;
  version?: string;
  frameworks: string[];
  // 支持多种资源类型
  components?: ResourceConfig[];  // UI 组件
  hooks?: ResourceConfig[];       // Hooks
  lib?: ResourceConfig[];         // 工具函数
  configs?: ResourceConfig[];     // 配置片段
}

// 资源类型映射
const TYPE_MAP: Record<ResourceType, { dir: string; registryType: string; targetDir: string }> = {
  ui: { dir: 'components', registryType: 'registry:ui', targetDir: 'components/ui' },
  hook: { dir: 'hooks', registryType: 'registry:hook', targetDir: 'hooks' },
  lib: { dir: 'lib', registryType: 'registry:lib', targetDir: 'lib' },
  config: { dir: 'configs', registryType: 'registry:config', targetDir: '' },
};

async function buildResource(
  resource: ResourceConfig,
  type: ResourceType,
  version: string,
  distDir: string,
  spinner: ora.Ora
) {
  const typeInfo = TYPE_MAP[type];
  spinner.start(`构建 ${type}:${resource.name}...`);
  
  // 读取源文件
  const files = await Promise.all(
    resource.files.map(async (filePath) => {
      const fullPath = path.resolve(filePath);
      const content = await readFile(fullPath);
      const fileName = path.basename(filePath);
      
      return {
        path: `${typeInfo.targetDir}/${fileName}`.replace(/^\//, ''),
        type: typeInfo.registryType,
        target: type === 'config' ? fileName : `${typeInfo.targetDir}/${fileName}`,
        content,
      };
    })
  );
  
  // 生成资源 JSON
  const resourceJson: any = {
    name: resource.name,
    version,
    type: typeInfo.registryType,
    description: resource.description || '',
    files,
    dependencies: resource.dependencies || [],
    devDependencies: resource.devDependencies || [],
    registryDependencies: resource.registryDependencies || [],
  };
  
  // Config 类型额外字段
  if (type === 'config') {
    if (resource.transforms) resourceJson.transforms = resource.transforms;
    if (resource.postInstall) resourceJson.postInstall = resource.postInstall;
  }
  
  // 确定输出路径
  let outputDir: string;
  if (type === 'ui' && resource.style) {
    outputDir = path.join(distDir, typeInfo.dir, resource.style, resource.name);
  } else {
    outputDir = path.join(distDir, typeInfo.dir, resource.name);
  }
  
  // 写入文件
  await writeJson(path.join(outputDir, 'latest.json'), resourceJson);
  await writeJson(path.join(outputDir, `${version}.json`), resourceJson);
  
  spinner.succeed(`${type}:${resource.name} 构建完成`);
  
  return {
    name: resource.name,
    type,
    style: resource.style,
    description: resource.description,
    latest: version,
    versions: [version],
  };
}

export async function registryBuild() {
  const spinner = ora();
  
  console.log(chalk.cyan('\n🔨 构建 Registry\n'));
  
  // 1. 读取配置
  const configPath = path.resolve('registry.config.ts');
  if (!fileExists(configPath)) {
    console.log(chalk.red('找不到 registry.config.ts'));
    return;
  }
  
  spinner.start('读取配置...');
  const config: RegistryConfig = (await import(configPath)).default;
  spinner.succeed('配置读取完成');
  
  const distDir = path.resolve('dist');
  const version = config.version || '1.0.0';
  
  // 2. 构建所有资源
  const results = {
    components: [] as any[],
    hooks: [] as any[],
    lib: [] as any[],
    configs: [] as any[],
  };
  
  // UI 组件
  if (config.components?.length) {
    for (const comp of config.components) {
      const result = await buildResource({ ...comp, type: 'ui' }, 'ui', version, distDir, spinner);
      results.components.push(result);
    }
  }
  
  // Hooks
  if (config.hooks?.length) {
    for (const hook of config.hooks) {
      const result = await buildResource({ ...hook, type: 'hook' }, 'hook', version, distDir, spinner);
      results.hooks.push(result);
    }
  }
  
  // Lib
  if (config.lib?.length) {
    for (const lib of config.lib) {
      const result = await buildResource({ ...lib, type: 'lib' }, 'lib', version, distDir, spinner);
      results.lib.push(result);
    }
  }
  
  // Configs
  if (config.configs?.length) {
    for (const cfg of config.configs) {
      const result = await buildResource({ ...cfg, type: 'config' }, 'config', version, distDir, spinner);
      results.configs.push(result);
    }
  }
  
  // 3. 生成 index.json
  const indexJson = {
    namespace: config.namespace,
    version,
    ...results,
  };
  
  await writeJson(path.join(distDir, 'index.json'), indexJson);
  
  const total = results.components.length + results.hooks.length + results.lib.length + results.configs.length;
  console.log(chalk.green(`\n✔ 构建完成! 共 ${total} 个资源\n`));
  console.log(chalk.dim(`  UI 组件: ${results.components.length}`));
  console.log(chalk.dim(`  Hooks: ${results.hooks.length}`));
  console.log(chalk.dim(`  工具函数: ${results.lib.length}`));
  console.log(chalk.dim(`  配置: ${results.configs.length}`));
  console.log(chalk.dim(`\n  输出目录: dist/\n`));
}
```


### 5.3 发布命令

```typescript
// packages/cli/src/commands/registry/publish.ts
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { readJson, fileExists, readdir } from '../../core/fs';
import { getToken } from '../../utils/credentials';

const API_URL = process.env.ASTER_API_URL || 'https://aster.dev';

type ResourceType = 'components' | 'hooks' | 'lib' | 'configs';

async function collectResources(distDir: string, type: ResourceType, index: any) {
  const resources: any[] = [];
  const items = index[type] || [];
  
  for (const item of items) {
    let resourcePath: string;
    
    if (type === 'components' && item.style) {
      resourcePath = path.join(distDir, type, item.style, item.name, 'latest.json');
    } else {
      resourcePath = path.join(distDir, type, item.name, 'latest.json');
    }
    
    if (fileExists(resourcePath)) {
      const content = await readJson<any>(resourcePath);
      resources.push({
        name: item.name,
        type,
        style: item.style,
        version: content.version,
        content,
      });
    }
  }
  
  return resources;
}

export async function registryPublish(options: { namespace?: string }) {
  const spinner = ora();
  
  console.log(chalk.cyan('\n🚀 发布 Registry\n'));
  
  // 1. 检查登录
  const token = await getToken();
  if (!token) {
    console.log(chalk.red('请先登录: npx aster login'));
    return;
  }
  
  // 2. 检查 dist 目录
  const distDir = path.resolve('dist');
  const indexPath = path.join(distDir, 'index.json');
  
  if (!fileExists(indexPath)) {
    console.log(chalk.red('找不到 dist/index.json，请先运行 npx aster registry build'));
    return;
  }
  
  // 3. 读取构建产物
  spinner.start('读取构建产物...');
  
  const index = await readJson<any>(indexPath);
  const namespace = options.namespace || index.namespace;
  
  // 收集所有资源
  const allResources: any[] = [];
  
  const components = await collectResources(distDir, 'components', index);
  const hooks = await collectResources(distDir, 'hooks', index);
  const lib = await collectResources(distDir, 'lib', index);
  const configs = await collectResources(distDir, 'configs', index);
  
  allResources.push(...components, ...hooks, ...lib, ...configs);
  
  spinner.succeed(`读取完成: ${allResources.length} 个资源`);
  console.log(chalk.dim(`  UI 组件: ${components.length}`));
  console.log(chalk.dim(`  Hooks: ${hooks.length}`));
  console.log(chalk.dim(`  工具函数: ${lib.length}`));
  console.log(chalk.dim(`  配置: ${configs.length}`));
  
  // 4. 上传到服务器
  spinner.start('上传中...');
  
  const res = await fetch(`${API_URL}/api/registry/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      namespace,
      index,
      resources: allResources,
    }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    spinner.fail(`发布失败: ${error.message}`);
    return;
  }
  
  spinner.succeed('发布成功!');
  
  console.log(chalk.green(`\n✔ 已发布到 @${namespace}\n`));
  console.log(chalk.dim('用户可以通过以下命令安装:'));
  
  for (const r of components) {
    console.log(chalk.white(`  npx aster add @${namespace}/${r.name}`));
  }
  for (const r of hooks) {
    console.log(chalk.white(`  npx aster add @${namespace}/hook:${r.name}`));
  }
  for (const r of lib) {
    console.log(chalk.white(`  npx aster add @${namespace}/lib:${r.name}`));
  }
  for (const r of configs) {
    console.log(chalk.white(`  npx aster add @${namespace}/config:${r.name}`));
  }
  console.log();
}
```

---

## 第六步：发布 API

```typescript
// apps/docs/app/api/registry/publish/route.ts
import { verifyToken } from '@/lib/auth';
import { getNamespacesByUserId, getNamespaceByName } from '@/lib/db';
import { uploadToR2 } from '@/lib/r2';
import { revalidatePath } from 'next/cache';

// 资源类型到目录的映射
const TYPE_DIR_MAP: Record<string, string> = {
  components: 'components',
  hooks: 'hooks',
  lib: 'lib',
  configs: 'configs',
};

export async function POST(request: Request) {
  // 1. 验证身份
  const user = await verifyToken(request);
  if (!user) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }
  
  const { namespace, index, resources } = await request.json();
  
  // 2. 验证命名空间所有权
  const ns = await getNamespaceByName(namespace);
  if (!ns || ns.user_id !== user.id) {
    return Response.json({ error: '无权限发布到此命名空间' }, { status: 403 });
  }
  
  // 3. 验证大小限制
  const totalSize = JSON.stringify(resources).length;
  if (totalSize > 5 * 1024 * 1024) { // 5MB 限制
    return Response.json({ error: '内容过大，最大 5MB' }, { status: 400 });
  }
  
  // 验证单个资源大小
  for (const resource of resources) {
    const size = JSON.stringify(resource.content).length;
    if (size > 500 * 1024) { // 500KB 限制
      return Response.json({ 
        error: `资源 "${resource.name}" 过大，单个资源最大 500KB` 
      }, { status: 400 });
    }
  }
  
  try {
    // 4. 上传 index.json
    await uploadToR2(`@${namespace}/index.json`, JSON.stringify(index));
    
    // 5. 上传每个资源
    for (const resource of resources) {
      const typeDir = TYPE_DIR_MAP[resource.type] || resource.type;
      let basePath: string;
      
      // UI 组件需要 style 子目录
      if (resource.type === 'components' && resource.style) {
        basePath = `@${namespace}/${typeDir}/${resource.style}/${resource.name}`;
      } else {
        basePath = `@${namespace}/${typeDir}/${resource.name}`;
      }
      
      // 上传 latest.json
      await uploadToR2(`${basePath}/latest.json`, JSON.stringify(resource.content));
      
      // 上传版本文件
      await uploadToR2(`${basePath}/${resource.version}.json`, JSON.stringify(resource.content));
    }
    
    // 6. 清除缓存
    revalidatePath(`/api/r/@${namespace}`);
    
    return Response.json({ 
      success: true,
      published: resources.length,
      namespace: `@${namespace}`,
    });
  } catch (error) {
    console.error('发布失败:', error);
    return Response.json({ error: '发布失败' }, { status: 500 });
  }
}
```


---

## 第七步：修改获取组件 API

```typescript
// apps/docs/app/api/r/[...path]/route.ts
import { Redis } from '@upstash/redis';
import { incrementDownload } from '@/lib/db';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://r2.aster.dev';

// 解析资源类型
// button → { type: 'ui', name: 'button' }
// hook:use-debounce → { type: 'hook', name: 'use-debounce' }
// lib:utils → { type: 'lib', name: 'utils' }
// config:nativewind → { type: 'config', name: 'nativewind' }
function parseResourceName(name: string): { type: string; name: string } {
  if (name.startsWith('hook:')) {
    return { type: 'hook', name: name.slice(5) };
  }
  if (name.startsWith('lib:')) {
    return { type: 'lib', name: name.slice(4) };
  }
  if (name.startsWith('config:')) {
    return { type: 'config', name: name.slice(7) };
  }
  return { type: 'ui', name };
}

// 资源类型到目录的映射
const TYPE_DIR_MAP: Record<string, string> = {
  ui: 'components',
  hook: 'hooks',
  lib: 'lib',
  config: 'configs',
};

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const { searchParams } = new URL(request.url);
  const style = searchParams.get('style') || 'nativewind';
  const version = searchParams.get('version') || 'latest';
  
  // 解析路径
  // /api/r/button → expo/components/nativewind/button/latest.json
  // /api/r/hook:use-debounce → expo/hooks/use-debounce/latest.json
  // /api/r/@zhangsan/button → @zhangsan/components/nativewind/button/latest.json
  // /api/r/@zhangsan/hook:use-toast → @zhangsan/hooks/use-toast/latest.json
  
  const pathParts = params.path;
  let r2Path: string;
  let namespace: string;
  let resourceName: string;
  let resourceType: string;
  
  if (pathParts[0].startsWith('@')) {
    // 社区资源
    namespace = pathParts[0].slice(1);
    const parsed = parseResourceName(pathParts[1]);
    resourceName = parsed.name;
    resourceType = parsed.type;
  } else {
    // 官方资源
    namespace = 'expo';
    const parsed = parseResourceName(pathParts[0]);
    resourceName = parsed.name;
    resourceType = parsed.type;
  }
  
  const typeDir = TYPE_DIR_MAP[resourceType];
  
  // UI 组件需要 style 子目录
  if (resourceType === 'ui') {
    r2Path = namespace === 'expo'
      ? `expo/${typeDir}/${style}/${resourceName}/${version}.json`
      : `@${namespace}/${typeDir}/${style}/${resourceName}/${version}.json`;
  } else {
    r2Path = namespace === 'expo'
      ? `expo/${typeDir}/${resourceName}/${version}.json`
      : `@${namespace}/${typeDir}/${resourceName}/${version}.json`;
  }
  
  const cacheKey = `resource:${r2Path}`;
  
  // 1. 查缓存
  const cached = await redis.get(cacheKey);
  if (cached) {
    // 统计下载
    await incrementDownload(namespace, resourceName, version);
    return Response.json(cached);
  }
  
  // 2. 从 R2 获取
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/${r2Path}`);
    
    if (!res.ok) {
      const typeLabel = resourceType === 'ui' ? '组件' : 
                        resourceType === 'hook' ? 'Hook' :
                        resourceType === 'lib' ? '工具函数' : '配置';
      return Response.json(
        { error: `${typeLabel} "${resourceName}" 不存在` },
        { status: 404 }
      );
    }
    
    const data = await res.json();
    
    // 3. 存缓存 (1小时)
    await redis.set(cacheKey, data, { ex: 3600 });
    
    // 4. 统计下载
    await incrementDownload(namespace, resourceName, version);
    
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: '获取资源失败' },
      { status: 500 }
    );
  }
}
```

---

## 第八步：修改 CLI 获取组件

```typescript
// packages/cli/src/services/registry.ts
import type { Style } from '../types/config';
import type { RegistryItem } from '../types/registry';

const API_URL = process.env.ASTER_API_URL || 'https://aster.dev/api/r';

export type ResourceType = 'ui' | 'hook' | 'lib' | 'config';

// 解析资源名称
// button → { namespace: null, type: 'ui', name: 'button', version: 'latest' }
// @zhangsan/button → { namespace: 'zhangsan', type: 'ui', name: 'button', version: 'latest' }
// hook:use-debounce → { namespace: null, type: 'hook', name: 'use-debounce', version: 'latest' }
// @zhangsan/hook:use-toast@1.0.0 → { namespace: 'zhangsan', type: 'hook', name: 'use-toast', version: '1.0.0' }
export function parseResourceIdentifier(input: string): {
  namespace: string | null;
  type: ResourceType;
  name: string;
  version: string;
} {
  let namespace: string | null = null;
  let remaining = input;
  
  // 解析命名空间
  if (remaining.startsWith('@')) {
    const slashIndex = remaining.indexOf('/');
    if (slashIndex > 0) {
      namespace = remaining.slice(1, slashIndex);
      remaining = remaining.slice(slashIndex + 1);
    }
  }
  
  // 解析版本
  let version = 'latest';
  const atIndex = remaining.lastIndexOf('@');
  if (atIndex > 0) {
    version = remaining.slice(atIndex + 1);
    remaining = remaining.slice(0, atIndex);
  }
  
  // 解析类型
  let type: ResourceType = 'ui';
  if (remaining.startsWith('hook:')) {
    type = 'hook';
    remaining = remaining.slice(5);
  } else if (remaining.startsWith('lib:')) {
    type = 'lib';
    remaining = remaining.slice(4);
  } else if (remaining.startsWith('config:')) {
    type = 'config';
    remaining = remaining.slice(7);
  }
  
  return { namespace, type, name: remaining, version };
}

// 构建 API 路径
function buildApiPath(parsed: ReturnType<typeof parseResourceIdentifier>): string {
  const { namespace, type, name } = parsed;
  
  // 构建资源标识
  let resourceId = name;
  if (type !== 'ui') {
    resourceId = `${type}:${name}`;
  }
  
  // 构建完整路径
  if (namespace) {
    return `@${namespace}/${resourceId}`;
  }
  return resourceId;
}

export async function fetchResource(
  input: string,
  style: Style
): Promise<RegistryItem> {
  const parsed = parseResourceIdentifier(input);
  const apiPath = buildApiPath(parsed);
  
  const params = new URLSearchParams({ 
    style, 
    version: parsed.version,
  });
  
  const url = `${API_URL}/${apiPath}?${params}`;
  
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      const typeLabel = parsed.type === 'ui' ? '组件' : 
                        parsed.type === 'hook' ? 'Hook' :
                        parsed.type === 'lib' ? '工具函数' : '配置';
      throw new Error(`${typeLabel} "${parsed.name}" 不存在`);
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `获取资源失败`);
  }
  
  return response.json();
}

// 兼容旧 API
export async function fetchComponent(
  name: string,
  style: Style,
  version = 'latest'
): Promise<RegistryItem> {
  return fetchResource(`${name}@${version}`, style);
}

export async function fetchRegistry(style: Style): Promise<RegistryItem[]> {
  const params = new URLSearchParams({ style });
  const response = await fetch(`${API_URL}?${params}`);
  
  if (!response.ok) {
    throw new Error('获取组件列表失败');
  }
  
  return response.json();
}
```

---

## 第九步：注册 CLI 命令

```typescript
// packages/cli/src/index.ts
import { program } from 'commander';
import { login, logout, whoami } from './commands/auth';
import { registryCreate } from './commands/registry/create';
import { registryBuild } from './commands/registry/build';
import { registryPublish } from './commands/registry/publish';
import { namespaceCreate, namespaceList } from './commands/namespace';

// ... 现有命令 ...

// 认证命令
program.command('login').description('登录 Aster').action(login);
program.command('logout').description('退出登录').action(logout);
program.command('whoami').description('查看当前用户').action(whoami);

// Registry 命令
const registry = program.command('registry').description('管理组件 Registry');

registry
  .command('create [name]')
  .description('创建 Registry 项目')
  .action(registryCreate);

registry
  .command('build')
  .description('构建 Registry')
  .action(registryBuild);

registry
  .command('publish')
  .description('发布 Registry')
  .option('-n, --namespace <namespace>', '指定命名空间')
  .action(registryPublish);

// 命名空间命令
const namespace = program.command('namespace').description('管理命名空间');

namespace
  .command('create <name>')
  .description('创建命名空间')
  .action(namespaceCreate);

namespace
  .command('list')
  .description('列出命名空间')
  .action(namespaceList);
```

---

## 第十步：命名空间命令

```typescript
// packages/cli/src/commands/namespace.ts
import chalk from 'chalk';
import ora from 'ora';
import { getToken } from '../utils/credentials';

const API_URL = process.env.ASTER_API_URL || 'https://aster.dev';

export async function namespaceCreate(name: string) {
  const spinner = ora();
  
  console.log(chalk.cyan('\n📦 创建命名空间\n'));
  
  // 检查登录
  const token = await getToken();
  if (!token) {
    console.log(chalk.red('请先登录: npx aster login'));
    return;
  }
  
  // 验证名称格式
  if (!/^[a-z0-9-]{3,30}$/.test(name)) {
    console.log(chalk.red('命名空间名称只能包含小写字母、数字、连字符，长度 3-30'));
    return;
  }
  
  spinner.start('创建中...');
  
  const res = await fetch(`${API_URL}/api/namespace`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    spinner.fail(`创建失败: ${error.message}`);
    return;
  }
  
  spinner.succeed('创建成功!');
  console.log(chalk.green(`\n✔ 命名空间 @${name} 已创建\n`));
}

export async function namespaceList() {
  const spinner = ora();
  
  // 检查登录
  const token = await getToken();
  if (!token) {
    console.log(chalk.red('请先登录: npx aster login'));
    return;
  }
  
  spinner.start('获取中...');
  
  const res = await fetch(`${API_URL}/api/namespace`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    spinner.fail('获取失败');
    return;
  }
  
  const namespaces = await res.json();
  spinner.stop();
  
  console.log(chalk.cyan('\n📦 我的命名空间\n'));
  
  for (const ns of namespaces) {
    const defaultTag = ns.is_default ? chalk.dim(' (默认)') : '';
    console.log(`  @${ns.name}${defaultTag}`);
  }
  console.log();
}
```

---

## 第十一步：依赖解析器

```typescript
// packages/cli/src/core/dependency-resolver.ts
import chalk from 'chalk';
import prompts from 'prompts';
import semver from 'semver';
import { fetchResource, parseResourceIdentifier } from '../services/registry';
import { readAsterConfig } from '../utils/aster-config';
import type { Style } from '../types/config';

interface ResolvedDep {
  identifier: string;
  namespace: string | null;
  type: string;
  name: string;
  version: string;
  resource: any;
}

interface DependencyGraph {
  nodes: Map<string, ResolvedDep>;
  edges: Map<string, string[]>; // name -> dependencies
}

export class DependencyResolver {
  private style: Style;
  private graph: DependencyGraph = { nodes: new Map(), edges: new Map() };
  
  constructor(style: Style) {
    this.style = style;
  }
  
  async resolve(identifiers: string[]): Promise<ResolvedDep[]> {
    // 1. 构建依赖图
    for (const id of identifiers) {
      await this.buildGraph(id, []);
    }
    
    // 2. 检测循环依赖
    const cycle = this.detectCycle();
    if (cycle) {
      throw new Error(`检测到循环依赖: ${cycle.join(' → ')}`);
    }
    
    // 3. 拓扑排序
    const sorted = this.topologicalSort();
    
    // 4. 检查版本冲突
    await this.checkVersionConflicts(sorted);
    
    return sorted;
  }
  
  private async buildGraph(identifier: string, path: string[]) {
    const key = this.normalizeKey(identifier);
    
    if (this.graph.nodes.has(key)) {
      return;
    }
    
    // 检测循环
    if (path.includes(key)) {
      throw new Error(`检测到循环依赖: ${[...path, key].join(' → ')}`);
    }
    
    // 获取资源
    const resource = await fetchResource(identifier, this.style);
    const parsed = parseResourceIdentifier(identifier);
    
    const node: ResolvedDep = {
      identifier,
      namespace: parsed.namespace,
      type: parsed.type,
      name: parsed.name,
      version: resource.version,
      resource,
    };
    
    this.graph.nodes.set(key, node);
    this.graph.edges.set(key, []);
    
    // 递归解析依赖
    const deps = resource.registryDependencies || [];
    for (const dep of deps) {
      const depKey = this.normalizeKey(dep);
      this.graph.edges.get(key)!.push(depKey);
      await this.buildGraph(dep, [...path, key]);
    }
  }
  
  private normalizeKey(identifier: string): string {
    const parsed = parseResourceIdentifier(identifier);
    const ns = parsed.namespace || 'expo';
    return `${ns}/${parsed.type}:${parsed.name}`;
  }
  
  private detectCycle(): string[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];
    
    const dfs = (node: string): string[] | null => {
      visited.add(node);
      recStack.add(node);
      path.push(node);
      
      for (const neighbor of this.graph.edges.get(node) || []) {
        if (!visited.has(neighbor)) {
          const result = dfs(neighbor);
          if (result) return result;
        } else if (recStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          return [...path.slice(cycleStart), neighbor];
        }
      }
      
      path.pop();
      recStack.delete(node);
      return null;
    };
    
    for (const node of this.graph.nodes.keys()) {
      if (!visited.has(node)) {
        const cycle = dfs(node);
        if (cycle) return cycle;
      }
    }
    
    return null;
  }
  
  private topologicalSort(): ResolvedDep[] {
    const visited = new Set<string>();
    const result: ResolvedDep[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      
      for (const dep of this.graph.edges.get(node) || []) {
        visit(dep);
      }
      
      result.push(this.graph.nodes.get(node)!);
    };
    
    for (const node of this.graph.nodes.keys()) {
      visit(node);
    }
    
    return result;
  }
  
  private async checkVersionConflicts(deps: ResolvedDep[]) {
    const config = await readAsterConfig();
    if (!config?.installed) return;
    
    for (const dep of deps) {
      const typeKey = dep.type as keyof typeof config.installed;
      const installed = config.installed[typeKey]?.[dep.name];
      if (!installed) continue;
      
      if (installed.version !== dep.version) {
        console.log(chalk.yellow(`\n⚠️  版本冲突`));
        console.log(`  ${dep.type}:${dep.name}`);
        console.log(`  本地: ${installed.version}`);
        console.log(`  需要: ${dep.version}\n`);
        
        const { action } = await prompts({
          type: 'select',
          name: 'action',
          message: '请选择:',
          choices: [
            { title: '保留本地版本', value: 'keep' },
            { title: `更新到 ${dep.version}`, value: 'update' },
            { title: '取消安装', value: 'cancel' },
          ],
        });
        
        if (action === 'cancel') {
          throw new Error('用户取消安装');
        }
        
        if (action === 'keep') {
          deps.splice(deps.indexOf(dep), 1);
        }
      }
    }
  }
}
```

---

## 第十二步：本地状态管理

```typescript
// packages/cli/src/utils/aster-config.ts
import path from 'path';
import { readJson, writeJson, fileExists } from '../core/fs';

const CONFIG_FILE = 'aster.json';

export interface InstalledResource {
  version: string;
  namespace: string;
  installedAt: string;
}

export interface AsterConfig {
  $schema?: string;
  style: string;
  framework: string;
  aliases: {
    components: string;
    hooks: string;
    lib: string;
  };
  installed: {
    ui: Record<string, InstalledResource>;
    hook: Record<string, InstalledResource>;
    lib: Record<string, InstalledResource>;
    config: Record<string, InstalledResource>;
  };
}

const DEFAULT_CONFIG: AsterConfig = {
  $schema: 'https://aster.dev/schema/aster.json',
  style: 'nativewind',
  framework: 'expo',
  aliases: {
    components: '@/components',
    hooks: '@/hooks',
    lib: '@/lib',
  },
  installed: {
    ui: {},
    hook: {},
    lib: {},
    config: {},
  },
};

export async function readAsterConfig(): Promise<AsterConfig | null> {
  const configPath = path.resolve(CONFIG_FILE);
  if (!fileExists(configPath)) {
    return null;
  }
  return readJson<AsterConfig>(configPath);
}

export async function writeAsterConfig(config: AsterConfig) {
  const configPath = path.resolve(CONFIG_FILE);
  await writeJson(configPath, config);
}

export async function ensureAsterConfig(): Promise<AsterConfig> {
  let config = await readAsterConfig();
  if (!config) {
    config = { ...DEFAULT_CONFIG };
    await writeAsterConfig(config);
  }
  return config;
}

export async function markInstalled(
  type: 'ui' | 'hook' | 'lib' | 'config',
  name: string,
  version: string,
  namespace: string
) {
  const config = await ensureAsterConfig();
  config.installed[type][name] = {
    version,
    namespace,
    installedAt: new Date().toISOString(),
  };
  await writeAsterConfig(config);
}

export async function markRemoved(
  type: 'ui' | 'hook' | 'lib' | 'config',
  name: string
) {
  const config = await readAsterConfig();
  if (config?.installed[type][name]) {
    delete config.installed[type][name];
    await writeAsterConfig(config);
  }
}

export async function getInstalledResources() {
  const config = await readAsterConfig();
  if (!config) return [];
  
  const resources: Array<{
    type: string;
    name: string;
    version: string;
    namespace: string;
  }> = [];
  
  for (const [type, items] of Object.entries(config.installed)) {
    for (const [name, info] of Object.entries(items)) {
      resources.push({ type, name, ...info });
    }
  }
  
  return resources;
}
```

---

## 第十三步：CLI 本地缓存

```typescript
// packages/cli/src/utils/local-cache.ts
import path from 'path';
import os from 'os';
import { readJson, writeJson, fileExists, ensureDir } from '../core/fs';

const CACHE_DIR = path.join(os.homedir(), '.aster', 'cache');
const INDEX_CACHE_TTL = 5 * 60 * 1000;      // 5 分钟
const RESOURCE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version?: string;
}

export class LocalCache {
  private indexDir = path.join(CACHE_DIR, 'index');
  private resourceDir = path.join(CACHE_DIR, 'resources');
  
  async getIndex(namespace: string): Promise<any | null> {
    const cachePath = path.join(this.indexDir, `${namespace}.json`);
    return this.get(cachePath, INDEX_CACHE_TTL);
  }
  
  async setIndex(namespace: string, data: any) {
    const cachePath = path.join(this.indexDir, `${namespace}.json`);
    await this.set(cachePath, data);
  }
  
  async getResource(namespace: string, name: string, version: string): Promise<any | null> {
    const cachePath = path.join(this.resourceDir, namespace, `${name}-${version}.json`);
    
    // 版本化资源永久有效
    if (version !== 'latest') {
      return this.get(cachePath, Infinity);
    }
    
    return this.get(cachePath, RESOURCE_CACHE_TTL);
  }
  
  async setResource(namespace: string, name: string, version: string, data: any) {
    const cachePath = path.join(this.resourceDir, namespace, `${name}-${version}.json`);
    await this.set(cachePath, data, version);
  }
  
  private async get<T>(cachePath: string, ttl: number): Promise<T | null> {
    if (!fileExists(cachePath)) {
      return null;
    }
    
    try {
      const entry = await readJson<CacheEntry<T>>(cachePath);
      
      if (entry.version && entry.version !== 'latest') {
        return entry.data;
      }
      
      if (Date.now() - entry.timestamp > ttl) {
        return null;
      }
      
      return entry.data;
    } catch {
      return null;
    }
  }
  
  private async set<T>(cachePath: string, data: T, version?: string) {
    await ensureDir(path.dirname(cachePath));
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version,
    };
    
    await writeJson(cachePath, entry);
  }
  
  async clear() {
    const fs = await import('fs/promises');
    await fs.rm(CACHE_DIR, { recursive: true, force: true });
  }
}

export const localCache = new LocalCache();
```

---

## 第十四步：Config Transforms

```typescript
// packages/cli/src/core/transforms.ts
import path from 'path';
import chalk from 'chalk';
import { readFile, writeFile, fileExists, copyFile } from './fs';

interface Transform {
  file: string;
  type?: 'json' | 'js-module-exports' | 'js-export-default';
  merge?: Record<string, any>;
  path?: string;
  append?: any[];
  prepend?: any[];
}

export async function applyTransforms(transforms: Transform[], cwd: string) {
  for (const transform of transforms) {
    const filePath = path.join(cwd, transform.file);
    
    console.log(chalk.dim(`  处理 ${transform.file}...`));
    
    const type = transform.type || detectFileType(transform.file);
    
    // 备份原文件
    if (fileExists(filePath)) {
      await copyFile(filePath, `${filePath}.bak`);
    }
    
    try {
      if (type === 'json') {
        await applyJsonTransform(filePath, transform);
      } else {
        await applyJsTransform(filePath, transform, type);
      }
    } catch (error) {
      // 回滚
      if (fileExists(`${filePath}.bak`)) {
        await copyFile(`${filePath}.bak`, filePath);
      }
      throw error;
    }
  }
}

function detectFileType(file: string): Transform['type'] {
  if (file.endsWith('.json')) return 'json';
  if (file.endsWith('.mjs') || file.endsWith('.ts')) return 'js-export-default';
  return 'js-module-exports';
}

async function applyJsonTransform(filePath: string, transform: Transform) {
  let content: any = {};
  
  if (fileExists(filePath)) {
    content = JSON.parse(await readFile(filePath));
  }
  
  if (transform.path) {
    const parts = transform.path.split('.');
    let target = content;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    
    const lastKey = parts[parts.length - 1];
    
    if (transform.append) {
      if (!Array.isArray(target[lastKey])) target[lastKey] = [];
      target[lastKey].push(...transform.append);
    } else if (transform.prepend) {
      if (!Array.isArray(target[lastKey])) target[lastKey] = [];
      target[lastKey].unshift(...transform.prepend);
    } else if (transform.merge) {
      target[lastKey] = deepMerge(target[lastKey] || {}, transform.merge);
    }
  } else if (transform.merge) {
    content = deepMerge(content, transform.merge);
  }
  
  await writeFile(filePath, JSON.stringify(content, null, 2));
}

async function applyJsTransform(
  filePath: string,
  transform: Transform,
  type: 'js-module-exports' | 'js-export-default'
) {
  // 简化实现：使用正则替换
  let code = '';
  
  if (fileExists(filePath)) {
    code = await readFile(filePath);
  } else {
    code = type === 'js-module-exports'
      ? 'module.exports = {};'
      : 'export default {};';
  }
  
  if (transform.merge) {
    for (const [key, value] of Object.entries(transform.merge)) {
      const valueStr = JSON.stringify(value);
      
      // 查找现有属性
      const propRegex = new RegExp(`(${key}\\s*:\\s*)(\\[.*?\\])`, 's');
      const match = code.match(propRegex);
      
      if (match && Array.isArray(value)) {
        // 合并数组
        const existing = JSON.parse(match[2]);
        const merged = [...existing, ...value];
        code = code.replace(propRegex, `$1${JSON.stringify(merged)}`);
      } else {
        // 添加新属性
        const insertRegex = type === 'js-module-exports'
          ? /(module\.exports\s*=\s*\{)/
          : /(export\s+default\s*\{)/;
        code = code.replace(insertRegex, `$1\n  ${key}: ${valueStr},`);
      }
    }
  }
  
  await writeFile(filePath, code);
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (Array.isArray(source[key])) {
      result[key] = [...(result[key] || []), ...source[key]];
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}
```

---

## 第十五步：更新检测命令

```typescript
// packages/cli/src/commands/check-updates.ts
import chalk from 'chalk';
import ora from 'ora';
import semver from 'semver';
import { getInstalledResources } from '../utils/aster-config';
import { fetchResource } from '../services/registry';

interface UpdateInfo {
  type: string;
  name: string;
  namespace: string;
  currentVersion: string;
  latestVersion: string;
  updateType: 'major' | 'minor' | 'patch';
}

export async function checkUpdates(): Promise<UpdateInfo[]> {
  const spinner = ora('检查更新...').start();
  
  const installed = await getInstalledResources();
  if (installed.length === 0) {
    spinner.info('没有已安装的资源');
    return [];
  }
  
  const updates: UpdateInfo[] = [];
  
  for (const item of installed) {
    try {
      const identifier = item.namespace === 'expo'
        ? `${item.type === 'ui' ? '' : item.type + ':'}${item.name}`
        : `@${item.namespace}/${item.type === 'ui' ? '' : item.type + ':'}${item.name}`;
      
      const latest = await fetchResource(identifier, 'nativewind');
      
      if (semver.gt(latest.version, item.version)) {
        updates.push({
          type: item.type,
          name: item.name,
          namespace: item.namespace,
          currentVersion: item.version,
          latestVersion: latest.version,
          updateType: semver.diff(item.version, latest.version) as any,
        });
      }
    } catch {
      // 忽略获取失败的资源
    }
  }
  
  spinner.stop();
  
  if (updates.length === 0) {
    console.log(chalk.green('\n✔ 所有资源都是最新版本\n'));
    return [];
  }
  
  console.log(chalk.cyan('\n📦 可用更新\n'));
  
  for (const update of updates) {
    const typeLabel = update.updateType === 'major' ? chalk.red('major') :
                      update.updateType === 'minor' ? chalk.yellow('minor') :
                      chalk.green('patch');
    
    const name = update.namespace === 'expo'
      ? update.name
      : `@${update.namespace}/${update.name}`;
    
    console.log(
      `  ${name.padEnd(30)} ${update.currentVersion} → ${update.latestVersion} (${typeLabel})`
    );
  }
  
  console.log(chalk.dim('\n运行 npx aster update 更新所有'));
  console.log(chalk.dim('运行 npx aster update <name> 更新指定资源\n'));
  
  return updates;
}
```

---

## 第十六步：发布验证

```typescript
// packages/cli/src/commands/registry/validate.ts
import path from 'path';
import chalk from 'chalk';
import semver from 'semver';
import { fileExists, readFile } from '../../core/fs';
import { fetchResource } from '../../services/registry';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateRegistry(configPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!fileExists(configPath)) {
    errors.push('找不到 registry.config.ts');
    return { valid: false, errors, warnings };
  }
  
  let config: any;
  try {
    config = (await import(configPath)).default;
  } catch (e) {
    errors.push(`配置文件解析失败: ${e}`);
    return { valid: false, errors, warnings };
  }
  
  // 验证 namespace
  if (!config.namespace) {
    errors.push('缺少 namespace');
  } else if (!/^[a-z0-9-]{3,30}$/.test(config.namespace)) {
    errors.push('namespace 格式不正确');
  }
  
  // 验证版本号
  if (config.version && !semver.valid(config.version)) {
    errors.push(`版本号 "${config.version}" 不符合 semver 规范`);
  }
  
  // 验证资源
  const allResources = [
    ...(config.components || []).map((c: any) => ({ ...c, _type: 'ui' })),
    ...(config.hooks || []).map((c: any) => ({ ...c, _type: 'hook' })),
    ...(config.lib || []).map((c: any) => ({ ...c, _type: 'lib' })),
    ...(config.configs || []).map((c: any) => ({ ...c, _type: 'config' })),
  ];
  
  for (const resource of allResources) {
    if (!resource.name) {
      errors.push(`${resource._type} 缺少 name`);
      continue;
    }
    
    if (!/^[a-z0-9-]+$/.test(resource.name)) {
      errors.push(`${resource._type}:${resource.name} 名称格式不正确`);
    }
    
    for (const file of resource.files || []) {
      const fullPath = path.resolve(file);
      if (!fileExists(fullPath)) {
        errors.push(`文件不存在: ${file}`);
      } else {
        const content = await readFile(fullPath);
        if (content.length > 500 * 1024) {
          errors.push(`文件过大: ${file} (最大 500KB)`);
        }
      }
    }
    
    for (const dep of resource.registryDependencies || []) {
      try {
        await fetchResource(dep, 'nativewind');
      } catch {
        warnings.push(`依赖可能不存在: ${dep}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors, warnings };
}
```

---

## 第十七步：安全防护实现

### 17.1 代码安全扫描

```typescript
// apps/docs/lib/security/code-scanner.ts

const DANGEROUS_PATTERNS = [
  { pattern: /eval\s*\(/, name: 'eval', severity: 'high' },
  { pattern: /new\s+Function\s*\(/, name: 'Function constructor', severity: 'high' },
  { pattern: /child_process/, name: 'child_process', severity: 'high' },
  { pattern: /require\s*\(\s*['"`]fs/, name: 'fs module', severity: 'medium' },
  { pattern: /process\.env/, name: 'process.env', severity: 'low' },
  { pattern: /__dirname|__filename/, name: 'path disclosure', severity: 'low' },
  { pattern: /innerHTML\s*=/, name: 'innerHTML assignment', severity: 'medium' },
  { pattern: /dangerouslySetInnerHTML/, name: 'dangerouslySetInnerHTML', severity: 'medium' },
];

interface ScanResult {
  safe: boolean;
  issues: Array<{ pattern: string; severity: 'high' | 'medium' | 'low'; line?: number }>;
}

export function scanCode(content: string): ScanResult {
  const issues: ScanResult['issues'] = [];
  const lines = content.split('\n');
  
  for (const { pattern, name, severity } of DANGEROUS_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        issues.push({ pattern: name, severity, line: i + 1 });
      }
    }
  }
  
  const hasHighSeverity = issues.some(i => i.severity === 'high');
  return { safe: !hasHighSeverity, issues };
}
```

### 17.2 命名空间保护

```typescript
// apps/docs/lib/security/namespace-guard.ts

const RESERVED_NAMESPACES = new Set([
  'expo', 'aster', 'official', 'react', 'react-native', 'vue', 'nuxt', 'next',
  'facebook', 'google', 'microsoft', 'apple', 'amazon', 'aws',
  'admin', 'root', 'system', 'api', 'www', 'app',
]);

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i-1] === a[j-1]
        ? matrix[i-1][j-1]
        : Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

export function validateNamespace(name: string): { valid: boolean; error?: string; warnings?: string[] } {
  if (!/^[a-z0-9-]{3,30}$/.test(name)) {
    return { valid: false, error: '命名空间只能包含小写字母、数字、连字符，长度 3-30' };
  }
  
  if (RESERVED_NAMESPACES.has(name)) {
    return { valid: false, error: `"${name}" 是保留名称` };
  }
  
  const warnings: string[] = [];
  for (const reserved of RESERVED_NAMESPACES) {
    if (levenshteinDistance(name, reserved) <= 2 && name !== reserved) {
      warnings.push(`名称与 "${reserved}" 相似`);
    }
  }
  
  return { valid: true, warnings: warnings.length > 0 ? warnings : undefined };
}
```

### 17.3 Token 安全

```typescript
// apps/docs/lib/security/token.ts
import { createHash, randomBytes } from 'crypto';
import { sql } from '@vercel/postgres';

const TOKEN_PREFIX = 'aster_';

export function generateToken(): { token: string; hash: string } {
  const random = randomBytes(24).toString('base64url');
  const token = `${TOKEN_PREFIX}${random}`;
  const hash = createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

export async function verifyToken(token: string) {
  if (!token.startsWith(TOKEN_PREFIX)) {
    return { valid: false, error: 'Invalid token format' };
  }
  
  const hash = createHash('sha256').update(token).digest('hex');
  
  const { rows } = await sql`
    SELECT t.*, u.github_username, u.email
    FROM tokens t JOIN users u ON t.user_id = u.id
    WHERE t.token_hash = ${hash} AND t.revoked = false
    AND (t.expires_at IS NULL OR t.expires_at > NOW())
  `;
  
  if (rows.length === 0) {
    return { valid: false, error: 'Token not found or expired' };
  }
  
  await sql`UPDATE tokens SET last_used_at = NOW() WHERE id = ${rows[0].id}`;
  
  return { valid: true, user: rows[0] };
}
```

### 17.4 Rate Limiting

```typescript
// apps/docs/lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const rateLimiters = {
  global: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1000, '1m'), prefix: 'rl:global' }),
  download: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1m'), prefix: 'rl:download' }),
  publish: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1h'), prefix: 'rl:publish' }),
  login: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15m'), prefix: 'rl:login' }),
};

export async function checkRateLimit(type: keyof typeof rateLimiters, identifier: string) {
  const result = await rateLimiters[type].limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
```

### 17.5 输入验证

```typescript
// apps/docs/lib/security/validation.ts
import { z } from 'zod';

export const PublishRequestSchema = z.object({
  namespace: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
  index: z.object({
    namespace: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    components: z.array(z.any()).optional(),
    hooks: z.array(z.any()).optional(),
    lib: z.array(z.any()).optional(),
    configs: z.array(z.any()).optional(),
  }),
  resources: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(['components', 'hooks', 'lib', 'configs']),
    content: z.object({
      files: z.array(z.object({
        path: z.string(),
        content: z.string().max(500 * 1024),
      })),
    }),
  })).max(50),
});
```

### 17.6 CLI 安全检查

```typescript
// packages/cli/src/utils/security.ts
import chalk from 'chalk';
import prompts from 'prompts';

export async function showSecurityWarning(namespace: string, name: string): Promise<boolean> {
  if (namespace === 'expo') return true;
  
  console.log(chalk.yellow('\n⚠️  安全提示\n'));
  console.log(`你正在安装社区组件 ${chalk.cyan(`@${namespace}/${name}`)}\n`);
  console.log(chalk.dim('社区组件由第三方开发者维护，Aster 不对其安全性负责。'));
  console.log(chalk.dim(`查看源码: npx aster view @${namespace}/${name}\n`));
  
  const { confirm } = await prompts({
    type: 'confirm',
    name: 'confirm',
    message: '是否继续安装?',
    initial: false,
  });
  
  return confirm;
}
```

---

## 实现顺序

### 阶段一：基础设施 (1-2 天)

1. **R2 存储** - 创建 bucket，配置环境变量，实现工具类
2. **数据库** - 创建表，实现工具类
3. **Redis 缓存** - 配置 Upstash Redis

### 阶段二：认证系统 (1 天)

4. **GitHub OAuth** - 创建 OAuth App，实现认证 API
5. **CLI 认证** - login/logout/whoami 命令
6. **凭证管理** - ~/.aster/credentials.json
7. **Token 安全** - 哈希存储、权限范围

### 阶段三：发布系统 (2 天)

8. **CLI Registry** - create/build/publish 命令
9. **发布 API** - /api/registry/publish
10. **命名空间** - create/list 命令和 API
11. **发布验证** - 格式、大小、版本验证
12. **代码扫描** - 危险代码检测
13. **组件文档格式** - Props、示例、预览配置

### 阶段四：获取系统 (1-2 天)

14. **获取 API** - 修改 /api/r/* 从 R2 获取，支持多资源类型
15. **CLI 获取** - 修改 registry.ts 支持多资源类型
16. **依赖解析** - 循环检测、拓扑排序、版本冲突处理
17. **本地状态** - aster.json 管理已安装资源
18. **安装事务** - 原子安装、错误回滚

### 阶段五：安全防护 (1-2 天)

19. **Rate Limiting** - API 限流
20. **命名空间保护** - 保留名称、相似名称检测
21. **输入验证** - Zod schema 验证
22. **CLI 安全提示** - 社区组件安装警告

### 阶段六：增强功能 (2 天)

23. **CLI 本地缓存** - 离线支持、缓存策略
24. **更新检测** - check-updates 命令
25. **Config Transforms** - JSON/JS 配置文件合并
26. **安全公告** - 漏洞通知系统
27. **断点续传** - 网络中断恢复

### 阶段七：迁移兼容 (1 天)

28. **API 版本兼容** - v1/v2 API 共存
29. **配置文件迁移** - components.json → aster.json
30. **CLI 升级提示** - 版本检查

### 阶段八：预览和文档 (2 天)

31. **Expo Snack 集成** - 组件预览
32. **文档页面** - Props 表格、示例展示
33. **社区展示页** - 社区组件列表

### 阶段九：测试和上线 (1-2 天)

34. **迁移官方组件** - 把现有组件上传到 R2
35. **完整流程测试** - 登录 → 创建 → 构建 → 发布 → 安装
36. **安全测试** - 渗透测试、限流测试
37. **文档更新** - 更新 README 和使用文档

---

## 第十八步：安装事务

```typescript
// packages/cli/src/core/transaction.ts
import path from 'path';
import { copyFile, removeDir, ensureDir, moveFile, fileExists } from './fs';

interface TransactionFile {
  source: string;
  target: string;
  backup?: string;
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
  
  async addFile(targetPath: string, content: string) {
    const tempPath = path.join(this.tempDir, path.basename(targetPath));
    const fs = await import('fs/promises');
    await fs.writeFile(tempPath, content, 'utf-8');
    
    let backup: string | undefined;
    if (fileExists(targetPath)) {
      backup = `${targetPath}.bak`;
      await copyFile(targetPath, backup);
    }
    
    this.files.push({ source: tempPath, target: targetPath, backup });
  }
  
  async commit() {
    if (this.committed || this.rolledBack) {
      throw new Error('Transaction already finished');
    }
    
    try {
      for (const file of this.files) {
        await ensureDir(path.dirname(file.target));
        await moveFile(file.source, file.target);
      }
      
      for (const file of this.files) {
        if (file.backup && fileExists(file.backup)) {
          const fs = await import('fs/promises');
          await fs.unlink(file.backup);
        }
      }
      
      await removeDir(this.tempDir);
      this.committed = true;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
  
  async rollback() {
    if (this.committed || this.rolledBack) return;
    
    for (const file of this.files) {
      if (file.backup && fileExists(file.backup)) {
        await moveFile(file.backup, file.target);
      } else if (fileExists(file.target)) {
        const fs = await import('fs/promises');
        await fs.unlink(file.target);
      }
    }
    
    await removeDir(this.tempDir);
    this.rolledBack = true;
  }
}
```

---

## 第十九步：迁移工具

```typescript
// packages/cli/src/utils/migrate.ts
import chalk from 'chalk';
import { readJson, writeJson, fileExists } from '../core/fs';

interface V1Config {
  style: string;
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
  
  if (!fileExists(v1ConfigPath)) return false;
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
    installed: { ui: {}, hook: {}, lib: {}, config: {} },
  };
  
  // 扫描已安装组件
  const installed = await scanInstalledComponents(v2Config.aliases.components);
  for (const comp of installed) {
    v2Config.installed.ui[comp] = {
      version: 'unknown',
      namespace: 'expo',
      installedAt: new Date().toISOString(),
    };
  }
  
  await writeJson(v2ConfigPath, v2Config);
  
  console.log(chalk.green('✔ 迁移完成!'));
  console.log(chalk.dim(`  检测到 ${installed.length} 个已安装组件\n`));
  
  return true;
}

async function scanInstalledComponents(componentsPath: string): Promise<string[]> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const uiPath = path.join(process.cwd(), componentsPath.replace('@/', ''), 'ui');
  
  try {
    const files = await fs.readdir(uiPath);
    return files.filter(f => f.endsWith('.tsx')).map(f => f.replace('.tsx', ''));
  } catch {
    return [];
  }
}
```

---

## 第二十步：组件预览

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
    const files = {
      'App.tsx': {
        type: 'CODE',
        contents: generatePreviewCode(code, name),
      },
    };
    
    const params = new URLSearchParams({
      platform: 'web',
      name: `Preview: ${name}`,
      dependencies: dependencies?.join(',') || '',
      files: JSON.stringify(files),
    });
    
    setSnackUrl(`https://snack.expo.dev/embedded?${params}`);
  }, [code, dependencies, name]);
  
  if (!snackUrl) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />;
  }
  
  return (
    <iframe
      src={snackUrl}
      className="w-full h-96 rounded-lg border"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  );
}

function generatePreviewCode(componentCode: string, name: string): string {
  return `
import React from 'react';
import { View, StyleSheet } from 'react-native';

${componentCode}

export default function App() {
  return (
    <View style={styles.container}>
      <${name} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
`;
}
```

---

## 第二十一步：断点续传

```typescript
// packages/cli/src/utils/resume.ts
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
  if (!fileExists(RESUME_FILE)) return null;
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
```

---

## 环境变量汇总

```env
# R2 存储
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=aster-registry
R2_PUBLIC_URL=https://r2.aster.dev

# 数据库 (Vercel Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Redis 缓存 (Upstash)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# 应用
NEXT_PUBLIC_URL=https://aster.dev
```

---

## Registry 配置示例

```typescript
// registry.config.ts - 完整示例
import { defineConfig } from 'aster';

export default defineConfig({
  namespace: 'my-namespace',
  version: '1.0.0',
  frameworks: ['expo'],
  
  // UI 组件
  components: [
    {
      name: 'fancy-button',
      style: 'nativewind',
      description: '带动画的按钮组件',
      files: ['src/components/nativewind/ui/fancy-button.tsx'],
      dependencies: ['react-native-reanimated'],
      registryDependencies: ['lib:utils'],
    },
    {
      name: 'card',
      style: 'nativewind',
      description: '卡片组件',
      files: ['src/components/nativewind/ui/card.tsx'],
    },
  ],
  
  // Hooks
  hooks: [
    {
      name: 'use-toast',
      description: 'Toast 提示 Hook',
      files: ['src/hooks/use-toast.ts'],
      dependencies: [],
    },
    {
      name: 'use-async',
      description: '异步状态管理 Hook',
      files: ['src/hooks/use-async.ts'],
    },
  ],
  
  // 工具函数
  lib: [
    {
      name: 'request',
      description: '请求封装',
      files: ['src/lib/request.ts'],
      dependencies: ['axios'],
    },
  ],
  
  // 配置片段
  configs: [
    {
      name: 'eslint',
      description: 'ESLint 配置',
      files: ['src/configs/.eslintrc.js'],
      dependencies: ['eslint', '@typescript-eslint/parser'],
    },
  ],
});
```


---

## 实现进度跟踪

### CLI 实现状态

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| **认证** | | | |
| credentials | `src/utils/credentials.ts` | ✅ 完成 | Token 存储管理 |
| auth commands | `src/commands/auth.ts` | ✅ 完成 | login/logout/whoami |
| **命名空间** | | | |
| namespace commands | `src/commands/namespace.ts` | ✅ 完成 | create/list/delete |
| **Registry 发布** | | | |
| registry create | `src/commands/registry/create.ts` | ✅ 完成 | 创建 Registry 项目 |
| registry build | `src/commands/registry/build.ts` | ✅ 完成 | 构建 Registry |
| registry publish | `src/commands/registry/publish.ts` | ✅ 完成 | 发布到服务器 |
| **核心模块** | | | |
| transaction | `src/core/transaction.ts` | ✅ 完成 | 安装事务管理 |
| dependency-resolver | `src/core/dependency-resolver.ts` | ✅ 完成 | 依赖解析 |
| **工具** | | | |
| aster-config | `src/utils/aster-config.ts` | ✅ 完成 | aster.json 管理 |
| security | `src/utils/security.ts` | ✅ 完成 | 安全检查 |
| **服务** | | | |
| registry service | `src/services/registry.ts` | ✅ 完成 | V2 API 支持 |
| **命令** | | | |
| add-v2 | `src/commands/add-v2.ts` | ✅ 完成 | V2 add 命令 |
| recover | `src/commands/recover.ts` | ✅ 完成 | 事务恢复 |
| index | `src/index.ts` | ✅ 完成 | 命令注册 |
| **类型** | | | |
| v2 types | `src/types/v2.ts` | ✅ 完成 | V2 类型定义 |

### 待实现

| 模块 | 说明 | 优先级 |
|------|------|--------|
| API 服务端 | GitHub OAuth, Registry API | P0 |
| R2 存储 | 组件存储服务 | P0 |
| 数据库 | PostgreSQL 表创建 | P0 |
| Docs 更新 | 组件预览、文档展示 | P1 |
| 迁移工具 | V1 → V2 迁移 | P2 |

### 依赖安装

运行以下命令安装新增依赖：

```bash
cd aster/packages/cli
pnpm install
```

新增依赖：
- `open` - 打开浏览器
- `fs-extra` - 文件系统操作
- `semver` - 版本管理
- `glob` - 文件匹配
