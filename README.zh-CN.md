# 工作流平台

[English](README.md) | [中文](README.zh-CN.md)

一个灵活且可扩展的 TypeScript 工作流引擎，支持 MCP（多云平台）集成。

## 特性

* 基于插件架构，支持 MCP
* 内置条件类型
* 上下文驱动的数据流
* 类型安全的工作流定义
* 可扩展的插件系统
* MCP 服务器集成，支持云操作

## 安装

```bash
npm install
```

## 使用

### 定义工作流

```typescript
import { WorkflowDefinition } from './types/types';

const workflow: WorkflowDefinition = {
    id: 'example-workflow',
    version: '1.0',
    name: 'Example Workflow',
    steps: [
        {
            id: 'step1',
            type: 'task',
            plugin: 'mcp_plugin',
            tool: 'mcp_tool',
            input: {
                context: {
                    server: {
                        path: '$.input.server',
                        required: true
                    }
                }
            },
            output: {
                target: 'result',
                transform: 'content[0].status'
            },
            next: 'step2'
        }
        // ... 添加更多步骤 ...
    ],
    startAt: 'step1'
};
```

### 执行工作流

```typescript
import { WorkflowEngine } from './core/workflowEngine';

const engine = new WorkflowEngine();
const result = await engine.executeWorkflow(
    workflow,
    { input: { server: 'mcp-server-1' } },
    console.log
);

console.log('工作流结果:', result);
```

## 内置条件类型

* `string-length`  — 比较字符串长度
* `number-compare` — 比较数字
* `string-contains`— 检查字符串是否包含子串
* `string-equals`  — 检查两个字符串是否相等
* `value-exists`   — 检查值是否存在

## MCP 集成

平台提供与 MCP 服务器的无缝集成：

* 服务器配置管理
* 云资源操作
* 多云部署支持
* 服务器状态监控
* 资源扩展能力

## 输入/输出

### 输入类型

* 字面量值
* 上下文路径值 (`$.some.path`)
* 必填字段
* 默认值
* MCP 服务器配置

### 输出类型

* 目标字段
* 转换表达式
* 过滤条件
* MCP 操作结果

## 许可证

本项目采用 MIT 许可证。详情请参见 [LICENSE](LICENSE) 文件。 