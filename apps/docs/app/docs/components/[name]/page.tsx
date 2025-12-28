import { notFound } from "next/navigation";
import Link from "next/link";
import { getRegistryItem, getStyles } from "@/registry";

interface Props {
  params: Promise<{ name: string }>;
}

const componentDocs: Record<string, { description: string; usage: string; props: string }> = {
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
  textarea: {
    description: "多行文本输入框组件。",
    usage: `import { Textarea } from "@/components/ui/textarea";

<Textarea placeholder="请输入内容..." />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| error | boolean | false | 错误状态 |`,
  },
  checkbox: {
    description: "复选框组件。",
    usage: `import { Checkbox } from "@/components/ui/checkbox";

const [checked, setChecked] = useState(false);

<Checkbox checked={checked} onChange={setChecked} label="同意协议" />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| checked | boolean | false | 选中状态 |
| onChange | (checked: boolean) => void | - | 变化回调 |
| label | string | - | 标签文字 |
| disabled | boolean | false | 禁用状态 |`,
  },
  radio: {
    description: "单选框组件。",
    usage: `import { RadioGroup } from "@/components/ui/radio";

const [value, setValue] = useState("a");

<RadioGroup
  options={[
    { label: "选项 A", value: "a" },
    { label: "选项 B", value: "b" },
  ]}
  value={value}
  onChange={setValue}
/>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options | RadioOption[] | - | 选项列表 |
| value | string | - | 当前值 |
| onChange | (value: string) => void | - | 变化回调 |`,
  },
  switch: {
    description: "开关组件。",
    usage: `import { Switch } from "@/components/ui/switch";

const [enabled, setEnabled] = useState(false);

<Switch checked={enabled} onChange={setEnabled} />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| checked | boolean | false | 开关状态 |
| onChange | (checked: boolean) => void | - | 变化回调 |
| disabled | boolean | false | 禁用状态 |`,
  },
  select: {
    description: "下拉选择组件。",
    usage: `import { Select } from "@/components/ui/select";

const [value, setValue] = useState("");

<Select
  options={[
    { label: "选项 1", value: "1" },
    { label: "选项 2", value: "2" },
  ]}
  value={value}
  onChange={setValue}
  placeholder="请选择"
/>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| options | SelectOption[] | - | 选项列表 |
| value | string | - | 当前值 |
| onChange | (value: string) => void | - | 变化回调 |
| placeholder | string | "请选择" | 占位文字 |`,
  },
  slider: {
    description: "滑块组件。",
    usage: `import { Slider } from "@/components/ui/slider";

const [value, setValue] = useState(50);

<Slider value={value} onChange={setValue} min={0} max={100} showValue />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | number | 0 | 当前值 |
| min | number | 0 | 最小值 |
| max | number | 100 | 最大值 |
| step | number | 1 | 步长 |
| onChange | (value: number) => void | - | 变化回调 |
| showValue | boolean | false | 显示当前值 |`,
  },
  avatar: {
    description: "头像组件，支持图片和文字。",
    usage: `import { Avatar } from "@/components/ui/avatar";

<Avatar src="https://example.com/avatar.jpg" />

<Avatar fallback="JD" />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| src | string | - | 图片地址 |
| fallback | string | - | 后备文字 |
| size | number | 40 | 尺寸 |`,
  },
  badge: {
    description: "徽章组件。",
    usage: `import { Badge } from "@/components/ui/badge";

<Badge>默认</Badge>
<Badge variant="secondary">次要</Badge>
<Badge variant="destructive">危险</Badge>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | "default" \\| "secondary" \\| "destructive" \\| "outline" | "default" | 样式变体 |`,
  },
  card: {
    description: "卡片容器组件。",
    usage: `import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
</Card>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| children | ReactNode | - | 子元素 |`,
  },
  skeleton: {
    description: "骨架屏加载占位组件。",
    usage: `import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

<Skeleton width={100} height={100} circle />

<SkeletonText lines={3} />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| width | number \\| string | "100%" | 宽度 |
| height | number \\| string | 20 | 高度 |
| circle | boolean | false | 圆形 |`,
  },
  divider: {
    description: "分割线组件。",
    usage: `import { Divider } from "@/components/ui/divider";

<Divider />

<Divider>或</Divider>

<Divider orientation="vertical" />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| orientation | "horizontal" \\| "vertical" | "horizontal" | 方向 |
| children | ReactNode | - | 中间文字 |`,
  },
  tabs: {
    description: "标签页组件。",
    usage: `import { Tabs } from "@/components/ui/tabs";

<Tabs
  tabs={[
    { key: "1", label: "标签1", content: <Text>内容1</Text> },
    { key: "2", label: "标签2", content: <Text>内容2</Text> },
  ]}
  defaultKey="1"
/>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| tabs | Tab[] | - | 标签配置 |
| defaultKey | string | - | 默认选中 |
| onChange | (key: string) => void | - | 切换回调 |`,
  },
  modal: {
    description: "模态框组件。",
    usage: `import { Modal } from "@/components/ui/modal";

const [visible, setVisible] = useState(false);

<Modal visible={visible} onClose={() => setVisible(false)} title="标题">
  内容
</Modal>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | - | 显示状态 |
| onClose | () => void | - | 关闭回调 |
| title | string | - | 标题 |`,
  },
  "action-sheet": {
    description: "操作菜单组件。",
    usage: `import { ActionSheet } from "@/components/ui/action-sheet";

<ActionSheet
  visible={visible}
  onClose={() => setVisible(false)}
  title="选择操作"
  options={[
    { label: "编辑", onPress: handleEdit },
    { label: "删除", onPress: handleDelete, destructive: true },
  ]}
/>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| visible | boolean | - | 显示状态 |
| onClose | () => void | - | 关闭回调 |
| title | string | - | 标题 |
| options | ActionSheetOption[] | - | 选项列表 |`,
  },
  alert: {
    description: "警告提示组件。",
    usage: `import { Alert } from "@/components/ui/alert";

<Alert variant="info" title="提示">这是一条提示信息</Alert>

<Alert variant="error" onClose={() => {}}>错误信息</Alert>`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| variant | "default" \\| "info" \\| "success" \\| "warning" \\| "error" | "default" | 类型 |
| title | string | - | 标题 |
| onClose | () => void | - | 关闭回调 |`,
  },
  toast: {
    description: "消息提示组件。",
    usage: `import { ToastProvider, useToast } from "@/components/ui/toast";

// 在根组件包裹 Provider
<ToastProvider>
  <App />
</ToastProvider>

// 使用
const { show } = useToast();
show({ message: "操作成功", type: "success" });`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| message | string | - | 消息内容 |
| type | "default" \\| "success" \\| "error" \\| "warning" | "default" | 类型 |
| duration | number | 3000 | 显示时长 |`,
  },
  loading: {
    description: "加载指示器组件。",
    usage: `import { Loading } from "@/components/ui/loading";

<Loading />

<Loading size="large" text="加载中..." />`,
    props: `| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| size | "small" \\| "large" | "small" | 尺寸 |
| color | string | - | 颜色 |
| text | string | - | 文字 |`,
  },
};

export default async function ComponentPage({ params }: Props) {
  const { name } = await params;
  
  const nativewindItem = getRegistryItem(name, "nativewind");
  const stylesheetItem = getRegistryItem(name, "stylesheet");
  
  if (!nativewindItem && !stylesheetItem) {
    notFound();
  }
  
  const item = nativewindItem || stylesheetItem;
  const docs = componentDocs[name];
  
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link href="/docs" className="text-blue-500 hover:underline mb-4 inline-block">
          ← 返回文档
        </Link>
        
        <h1 className="text-3xl font-bold mb-2 capitalize">{name.replace("-", " ")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {docs?.description || item?.description}
        </p>
        
        {/* 安装 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">安装</h2>
          <div className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm">
            npx aster add {name}
          </div>
        </section>
        
        {/* 使用示例 */}
        {docs?.usage && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">使用示例</h2>
            <pre className="bg-gray-900 rounded-lg p-4 text-gray-100 font-mono text-sm overflow-x-auto">
              {docs.usage}
            </pre>
          </section>
        )}
        
        {/* Props */}
        {docs?.props && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Props</h2>
            <div className="overflow-x-auto">
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: docs.props
                    .split("\n")
                    .map(line => `<p>${line}</p>`)
                    .join("")
                    .replace(/\|/g, " | ")
                }}
              />
            </div>
          </section>
        )}
        
        {/* 依赖 */}
        {item?.dependencies && item.dependencies.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">依赖</h2>
            <div className="flex flex-wrap gap-2">
              {item.dependencies.map((dep) => (
                <span
                  key={dep}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm"
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
  const styles = getStyles();
  const names = new Set<string>();
  
  for (const style of styles) {
    const { getRegistry } = await import("@/registry");
    const registry = getRegistry(style);
    registry.forEach(item => {
      if (item.type === "registry:ui") {
        names.add(item.name);
      }
    });
  }
  
  return Array.from(names).map(name => ({ name }));
}
