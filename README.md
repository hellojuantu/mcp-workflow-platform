# Workflow Platform

[English](README.md) | [中文](README.zh-CN.md)

A flexible and extensible TypeScript workflow engine with MCP (Multi-Cloud Platform) integration.

## Features

* Plugin-based architecture with MCP support
* Built-in condition types
* Context-driven data flow
* Type-safe workflow definitions
* Extensible plugin system
* MCP server integration for cloud operations

## Installation

```bash
npm install
```

## Usage

### Define a Workflow

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
        // ... add more steps ...
    ],
    startAt: 'step1'
};
```

### Execute the Workflow

```typescript
import { WorkflowEngine } from './core/workflowEngine';

const engine = new WorkflowEngine();
const result = await engine.executeWorkflow(
    workflow,
    { input: { server: 'mcp-server-1' } },
    console.log
);

console.log('Workflow result:', result);
```

## Built-in Condition Types

* `string-length`  — compare string length
* `number-compare` — compare numbers
* `string-contains`— check if string contains a substring
* `string-equals`  — check if two strings are equal
* `value-exists`   — check if a value exists

## MCP Integration

The platform provides seamless integration with MCP servers:

* Server configuration management
* Cloud resource operations
* Multi-cloud deployment support
* Server status monitoring
* Resource scaling capabilities

## Input / Output

### Input Types

* Literal values
* Context-path values (`$.some.path`)
* Required fields
* Default values
* MCP server configurations

### Output Types

* Target fields
* Transformation expressions
* Filter conditions
* MCP operation results

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.