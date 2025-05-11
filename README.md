# Workflow Platform

[English](README.md) | [中文](README.zh-CN.md)

A flexible and extensible TypeScript workflow engine.

## Features

* Plugin-based architecture
* Built-in condition types
* Context-driven data flow
* Type-safe workflow definitions
* Extensible plugin system

## Installation

```bash
npm install
```

## Usage

### Define a Workflow

```typescript
import { WorkflowDefinition } from 'your-workflow-package';

const workflow: WorkflowDefinition = {
  id: "example-workflow",
  version: "1.0.0",
  name: "Example Workflow",
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
    // …add more steps as needed…
  ],
  startAt: "step1"
};
```

### Execute the Workflow

```typescript
import { WorkflowEngine } from 'your-workflow-package';

const engine = new WorkflowEngine();
const result = await engine.executeWorkflow(
  workflow,
  { input: { text: "Hello" } },
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

## Input / Output

### Input Types

* Literal values
* Context-path values (`$.some.path`)
* Required fields
* Default values

### Output Types

* Target fields
* Transformation expressions
* Filter conditions

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.