import type { Registry } from "../../../../schema";

export const lib: Registry = [
  {
    name: "utils",
    type: "registry:lib",
    description: "工具函数 (cn)",
    files: [{ path: "lib/aster-utils.ts", type: "registry:lib" }],
    dependencies: ["clsx", "tailwind-merge"],
  },
];
