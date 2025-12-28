import Link from "next/link";

const components = [
  { name: "button", label: "Button", category: "表单" },
  { name: "input", label: "Input", category: "表单" },
  { name: "textarea", label: "Textarea", category: "表单" },
  { name: "checkbox", label: "Checkbox", category: "表单" },
  { name: "radio", label: "Radio", category: "表单" },
  { name: "switch", label: "Switch", category: "表单" },
  { name: "select", label: "Select", category: "表单" },
  { name: "slider", label: "Slider", category: "表单" },
  { name: "avatar", label: "Avatar", category: "数据展示" },
  { name: "badge", label: "Badge", category: "数据展示" },
  { name: "card", label: "Card", category: "数据展示" },
  { name: "skeleton", label: "Skeleton", category: "数据展示" },
  { name: "divider", label: "Divider", category: "布局" },
  { name: "tabs", label: "Tabs", category: "导航" },
  { name: "modal", label: "Modal", category: "反馈" },
  { name: "dialog", label: "Dialog", category: "反馈" },
  { name: "action-sheet", label: "ActionSheet", category: "反馈" },
  { name: "alert", label: "Alert", category: "反馈" },
  { name: "toast", label: "Toast", category: "反馈" },
  { name: "loading", label: "Loading", category: "反馈" },
];

const categories = ["表单", "数据展示", "布局", "导航", "反馈"];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">组件文档</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          20+ React Native 组件，支持 NativeWind 和 StyleSheet 两种风格
        </p>

        {/* 快速链接 */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/docs/theming"
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition text-sm font-medium"
          >
            🎨 主题定制
          </Link>
          <Link
            href="/docs/community"
            className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition text-sm font-medium"
          >
            🌍 社区组件
          </Link>
          <Link
            href="https://github.com/vast-universe/aster"
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 transition text-sm font-medium"
            target="_blank"
          >
            GitHub
          </Link>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {category}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {components
                .filter((c) => c.category === category)
                .map((component) => (
                  <Link
                    key={component.name}
                    href={`/docs/components/${component.name}`}
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition text-center"
                  >
                    <span className="text-sm font-medium">{component.label}</span>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
