import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Aster
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            React Native 版 shadcn/ui
            <br />
            通过 CLI 复制组件源码到你的项目
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/docs"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
            >
              开始使用
            </Link>
            <a
              href="https://github.com/vast-universe/aster"
              target="_blank"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">快速开始</h2>
          <div className="bg-gray-900 rounded-xl p-6 text-gray-100 font-mono text-sm">
            <div className="mb-2 text-gray-400"># 初始化</div>
            <div className="mb-4">npx aster init</div>
            <div className="mb-2 text-gray-400"># 添加组件</div>
            <div>npx aster add button input modal</div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-2xl mb-3">📦</div>
            <h3 className="font-semibold mb-2">复制源码</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              组件代码在你项目里，完全可控，想怎么改就怎么改
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-2xl mb-3">🎨</div>
            <h3 className="font-semibold mb-2">双风格支持</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              NativeWind (Tailwind) 或 StyleSheet (零依赖)，自由选择
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-2xl mb-3">🌙</div>
            <h3 className="font-semibold mb-2">暗黑模式</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              所有组件支持暗黑模式，开箱即用
            </p>
          </div>
        </div>

        {/* Components */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 text-center">可用组件 (20+)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { name: "button", label: "Button" },
              { name: "input", label: "Input" },
              { name: "textarea", label: "Textarea" },
              { name: "checkbox", label: "Checkbox" },
              { name: "radio", label: "Radio" },
              { name: "switch", label: "Switch" },
              { name: "select", label: "Select" },
              { name: "slider", label: "Slider" },
              { name: "avatar", label: "Avatar" },
              { name: "badge", label: "Badge" },
              { name: "card", label: "Card" },
              { name: "skeleton", label: "Skeleton" },
              { name: "divider", label: "Divider" },
              { name: "tabs", label: "Tabs" },
              { name: "modal", label: "Modal" },
              { name: "dialog", label: "Dialog" },
              { name: "action-sheet", label: "ActionSheet" },
              { name: "alert", label: "Alert" },
              { name: "toast", label: "Toast" },
              { name: "loading", label: "Loading" },
            ].map((item) => (
              <Link
                key={item.name}
                href={`/docs/components/${item.name}`}
                className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition text-center text-sm"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
