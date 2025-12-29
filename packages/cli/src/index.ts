#!/usr/bin/env node
import { Command } from "commander";
import { create } from "./commands/create";
import { init } from "./commands/init";
import { add } from "./commands/add";
import { list } from "./commands/list";
import { diff } from "./commands/diff";
import { info } from "./commands/info";
import { remove } from "./commands/remove";
import { update } from "./commands/update";
import { search } from "./commands/search";
import { registryAdd, registryRemove, registryList } from "./commands/registry";
import { cacheStatus, cacheClean, cacheClear } from "./commands/cache";
import { presetList, presetInfo, presetRemove } from "./commands/preset";

const program = new Command();

program
  .name("aster")
  .description("跨框架开发脚手架 - 项目创建与组件管理")
  .version("0.1.0");

program
  .command("create")
  .description("创建新项目")
  .argument("[project-name]", "项目名称")
  .option("-y, --yes", "使用默认配置")
  .option("-f, --framework <name>", "指定框架 (expo/next/vue)")
  .option("-p, --preset <name>", "使用预设配置")
  .option("-t, --template <name>", "使用指定模板")
  .action(create);

program
  .command("init")
  .description("初始化 Aster 配置")
  .action(init);

program
  .command("add")
  .description("添加组件到项目")
  .argument("<components...>", "组件名称 (支持 github:user/repo/name, @namespace/name, URL)")
  .option("-f, --force", "覆盖已存在的文件")
  .option("--skip-export", "跳过自动更新 index.ts 导出")
  .action(add);

program
  .command("remove")
  .description("删除已安装的组件")
  .argument("[components...]", "组件名称 (可选，不填则交互选择)")
  .option("-y, --yes", "跳过确认")
  .action(remove);

program
  .command("update")
  .description("更新已安装的组件")
  .argument("[components...]", "组件名称 (可选)")
  .option("-a, --all", "更新所有组件")
  .option("-f, --force", "强制更新，跳过确认")
  .action(update);

program
  .command("list")
  .description("列出所有可用组件")
  .action(list);

program
  .command("search")
  .description("搜索组件")
  .argument("[query]", "搜索关键词")
  .action(search);

program
  .command("diff")
  .description("检查组件更新")
  .argument("[component]", "组件名称 (可选，不填则检查所有)")
  .action(diff);

program
  .command("info")
  .description("显示当前配置信息")
  .action(info);

// Registry 子命令
const registry = program
  .command("registry")
  .description("管理第三方 registry");

registry
  .command("add")
  .description("添加第三方 registry")
  .argument("[name]", "Registry 名称 (如 @acme)")
  .argument("[url]", "Registry URL")
  .action(registryAdd);

registry
  .command("remove")
  .description("删除第三方 registry")
  .argument("[name]", "Registry 名称")
  .action(registryRemove);

registry
  .command("list")
  .description("列出所有 registry")
  .action(registryList);

// Cache 子命令
const cache = program
  .command("cache")
  .description("管理离线缓存");

cache
  .command("status")
  .description("显示缓存状态")
  .action(cacheStatus);

cache
  .command("clean")
  .description("清理过期缓存")
  .action(cacheClean);

cache
  .command("clear")
  .description("清空所有缓存")
  .action(cacheClear);

// Preset 子命令
const preset = program
  .command("preset")
  .description("管理项目预设");

preset
  .command("list")
  .description("列出所有预设")
  .action(presetList);

preset
  .command("info")
  .description("显示预设详情")
  .argument("[name]", "预设名称")
  .action(presetInfo);

preset
  .command("remove")
  .description("删除自定义预设")
  .argument("[name]", "预设名称")
  .action(presetRemove);

program.parse();
