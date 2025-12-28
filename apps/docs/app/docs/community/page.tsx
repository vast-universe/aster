import Link from "next/link";

// 社区组件数据 (后续可以改为从 API 或 JSON 文件读取)
const communityRegistries = [
  {
    name: "示例组件库",
    namespace: "github:aster/examples",
    description: "官方示例组件，展示如何创建第三方 registry",
    author: "Aster Team",
    github: "https://github.com/aster/examples",
    components: ["fancy-button", "gradient-card", "animated-list"],
    tags: ["官方", "示例"],
  },
  // 以下为示例数据，实际社区组件上线后替换
  {
    name: "Aster Charts",
    namespace: "github:community/aster-charts",
    description: "React Native 图表组件，基于 react-native-svg",
    author: "Community",
    github: "https://github.com/community/aster-charts",
    components: ["line-chart", "bar-chart", "pie-chart"],
    tags: ["图表", "数据可视化"],
    placeholder: true,
  },
  {
    name: "Aster Animations",
    namespace: "github:community/aster-animations",
    description: "高性能动画组件，基于 Reanimated",
    author: "Community",
    github: "https://github.com/community/aster-animations",
    components: ["fade-in", "slide-up", "spring-modal"],
    tags: ["动画", "Reanimated"],
    placeholder: true,
  },
  {
    name: "Aster Forms",
    namespace: "github:community/aster-forms",
    description: "表单增强组件，集成 react-hook-form",
    author: "Community",
    github: "https://github.com/community/aster-forms",
    components: ["form-field", "date-picker", "file-upload"],
    tags: ["表单", "验证"],
    placeholder: true,
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="/docs"
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          ← 返回文档
        </Link>

        <h1 className="text-3xl font-bold mb-2">社区组件</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          由社区贡献的第三方组件库，可直接通过 CLI 安装使用
        </p>

        {/* 使用说明 */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mb-8">
          <h3 className="font-medium mb-2">📦 如何使用社区组件</h3>
          <pre className="bg-gray-900 rounded p-3 text-gray-100 text-sm overflow-x-auto">
            {`# GitHub Registry (推荐)
npx aster add github:user/repo/component

# 指定版本
npx aster add github:user/repo/component@v1.0.0`}
          </pre>
        </div>

        {/* 组件库列表 */}
        <div className="space-y-6">
          {communityRegistries.map((registry) => (
            <div
              key={registry.namespace}
              className={`border rounded-lg p-6 ${
                registry.placeholder
                  ? "border-dashed border-gray-300 dark:border-gray-700 opacity-60"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {registry.name}
                    {registry.placeholder && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                        即将推出
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    by {registry.author}
                  </p>
                </div>
                {registry.github && !registry.placeholder && (
                  <a
                    href={registry.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    GitHub →
                  </a>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {registry.description}
              </p>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {registry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 组件列表 */}
              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  包含组件:
                </p>
                <div className="flex flex-wrap gap-2">
                  {registry.components.map((comp) => (
                    <code
                      key={comp}
                      className="text-xs px-2 py-1 bg-gray-900 text-gray-100 rounded"
                    >
                      {comp}
                    </code>
                  ))}
                </div>
              </div>

              {/* 安装命令 */}
              {!registry.placeholder && (
                <div className="bg-gray-900 rounded p-3">
                  <code className="text-sm text-gray-100">
                    npx aster add {registry.namespace}/{registry.components[0]}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 贡献指南 */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">🤝 贡献你的组件</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            想要将你的组件库添加到社区列表？只需要：
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 mb-6">
            <li>创建一个 GitHub 仓库，按照 registry 结构组织组件</li>
            <li>
              提交 PR 到{" "}
              <a
                href="https://github.com/aster/aster"
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                aster/aster
              </a>{" "}
              仓库
            </li>
            <li>在 PR 中添加你的组件库信息</li>
          </ol>

          <h3 className="font-medium mb-2">Registry 结构要求</h3>
          <pre className="bg-gray-900 rounded p-4 text-gray-100 text-sm overflow-x-auto">
            {`my-components/
├── registry.json          # 组件索引
├── nativewind/            # NativeWind 风格
│   └── ui/
│       └── my-component.tsx
└── stylesheet/            # StyleSheet 风格 (可选)
    └── ui/
        └── my-component.tsx`}
          </pre>

          <h3 className="font-medium mb-2">registry.json 格式</h3>
          <pre className="bg-gray-900 rounded p-4 text-gray-100 text-sm overflow-x-auto">
            {`{
  "name": "my-components",
  "description": "我的 Aster 组件",
  "components": {
    "my-button": {
      "name": "my-button",
      "type": "registry:ui",
      "description": "自定义按钮",
      "files": ["ui/my-button.tsx"],
      "dependencies": [],
      "registryDependencies": ["button"]
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
