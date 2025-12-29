import { ui } from "./ui/_registry";
import { lib } from "./lib/_registry";
import type { Registry } from "../../../schema";

export const registry: Registry = [...ui, ...lib];
