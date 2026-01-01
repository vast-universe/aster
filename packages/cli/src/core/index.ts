/**
 * Core 模块统一导出
 */

// 依赖解析
export {
  DependencyResolver,
  parseResourceRef,
  getResourceKey,
  type ResolvedResource,
} from "./resolver";

// 事务管理
export { InstallTransaction, recoverTransaction } from "./transaction";

// 安全检查
export {
  scanCode,
  scanComponent,
  printSecurityReport,
  validateNamespace,
  validateComponentName,
  type SecurityIssue,
  type SecurityReport,
} from "./security";
