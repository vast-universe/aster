import type { Registry } from "../../../../schema";

export const lib: Registry = [
  {
    name: "colors",
    type: "registry:lib",
    description: "颜色常量定义",
    files: [{ path: "lib/colors.ts", type: "registry:lib" }],
    dependencies: [],
  },
];
