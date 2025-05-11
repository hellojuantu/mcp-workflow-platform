# 工作流平台

[English](README.md) | [中文](README.zh-CN.md)

一个灵活且可扩展的 TypeScript 工作流引擎。

## 特性

- 基于插件架构
- 内置条件类型
- 基于上下文的数据流
- 类型安全的工作流定义
- 可扩展的插件系统

## 安装

```bash
npm install
```

## 使用方法

### 定义工作流

```typescript
const workflow: WorkflowDefinition = {
    id: "example-workflow",
    version: "1.0.0",
    name: "示例工作流",
    steps: [
        {
            id: "step1",
            type: "task",
            plugin: "example_plugin",
            tool: "example_tool",
            input: {
                context: {
                    text: {
                        path: "$.input.text",
                        required: true
                    }
                }
            },
            output: {
                target: "result",
                transform: "content[0].text"
            },
            next: "step2"
        }
    ],
    startAt: "step1"
};
```

### 执行工作流

```typescript
const engine = new WorkflowEngine();
const result = await engine.executeWorkflow(workflow, { input: { text: "Hello" } }, console.log);
```

## 内置条件类型

- `string-length`: 字符串长度比较
- `number-compare`: 数字比较
- `string-contains`: 字符串包含
- `string-equals`: 字符串相等
- `value-exists`: 值是否存在

## 输入/输出

### 输入类型
- 直接值
- 带路径的上下文值
- 必需字段
- 默认值

### 输出类型
- 目标字段
- 转换表达式
- 过滤条件

## 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件。 