import { notFound } from "next/navigation";
import Link from "next/link";
import { getComponentItem, getComponents, getFrameworks } from "@/registry";

interface Props {
  params: Promise<{ name: string }>;
}

const componentDocs: Record<
  string,
  { description: string; usage: string; props: string }
> = {
  button: {
    description: "可点击的按钮组件，支持多种变体和尺寸。",
    usage: `import { Button } from "@/components/ui/button";

<Button variant="default" onPress={() => {}}>
  默认按钮
</Button>

<Button variant="outline" size="lg">
  大号边框按钮
</Button>

<Button variant="destructive" loading>
  加载中
</Button>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | "default" \\| "secondary" \\| "destructive" \\| "outline" \\| "ghost" | "default" | 按钮样式 |
| size | "sm" \\| "default" \\| "lg" | "default" | 按钮尺寸 |
| loading | boolean | false | 加载状态 |
| disabled | boolean | false | 禁用状态 |`,
  },
  input: {
    description: "文本输入框组件，支持错误状态。",
    usage: `import { Input } from "@/components/ui/input";

<Input placeholder="请输入..." />

<Input error placeholder="错误状态" />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| error | boolean | false | 错误状态 |
| ...TextInputProps | - | - | 继承 RN TextInput 所有属性 |`,
  },
  // ... 其他组件文档保持不变
};

export default async function ComponentPage({ params }: Props) {
  const { name } = await params;

  // 从 expo 框架获取组件 (默认展示 expo 的组件)
  const nativewindItem = getComponentItem("expo", "nativewind", name);
  const stylesheetItem = getComponentItem("expo", "stylesheet", name);

  if (!nativewindItem && !stylesheetItem) {
    notFound();
  }

  const item = nativewindItem || stylesheetItem;
  const docs = componentDocs[name];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/docs"
          className="mb-4 inline-block text-blue-500 hover:underline"
        >
          ← 返回文档
        </Link>

        <h1 className="mb-2 text-3xl font-bold capitalize">
          {name.replace("-", " ")}
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          {docs?.description || item?.description}
        </p>

        {/* 安装 */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">安装</h2>
          <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
            npx aster add {name}
          </div>
        </section>

        {/* 使用示例 */}
        {docs?.usage && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">使用示例</h2>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
              {docs.usage}
            </pre>
          </section>
        )}

        {/* Props */}
        {docs?.props && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Props</h2>
            <div className="overflow-x-auto">
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: docs.props
                    .split("\n")
                    .map((line) => `<p>${line}</p>`)
                    .join("")
                    .replace(/\|/g, " | "),
                }}
              />
            </div>
          </section>
        )}

        {/* 依赖 */}
        {item?.dependencies && item.dependencies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">依赖</h2>
            <div className="flex flex-wrap gap-2">
              {item.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="rounded bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"
                >
                  {dep}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const names = new Set<string>();

  // 从 expo 框架获取所有组件名
  for (const style of ["nativewind", "stylesheet"] as const) {
    const components = getComponents("expo", style);
    components.forEach((item) => {
      if (item.type === "registry:ui") {
        names.add(item.name);
      }
    });
  }

  return Array.from(names).map((name) => ({ name }));
}
