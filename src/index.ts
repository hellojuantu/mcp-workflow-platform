#!/usr/bin/env tsx

import { WorkflowEngine } from "./core/workflowEngine";
import { WorkflowDefinition } from "./types/types";

const workflow: WorkflowDefinition = {
  id: "text-processing-workflow",
  version: "1.0.0",
  name: "Text Processing Workflow",
  description: "Demonstrates text processing, conditional logic, and branching",
  steps: [
    {
      id: "add-greeting",
      type: "task",
      plugin: "add_prefix",
      tool: "add_prefix",
      input: {
        context: {
          text: {
            path: "$.input.text",
            required: true,
          },
          prefix: {
            path: "$.input.prefix",
            required: true,
          },
        },
      },
      output: {
        target: "greeting",
        transform: "content[0].text",
      },
      next: "check-length",
    },
    {
      id: "check-length",
      type: "choice",
      choices: [
        {
          type: "string-length",
          field: "$.greeting",
          value: 10,
          operator: "gt",
          next: "to-upper",
        },
        {
          type: "string-length",
          field: "$.greeting",
          value: 10,
          operator: "lte",
          next: "add-emphasis",
        },
      ],
    },
    {
      id: "add-emphasis",
      type: "task",
      plugin: "add_prefix",
      tool: "add_prefix",
      input: {
        context: {
          text: {
            path: "$.greeting",
            required: true,
          },
        },
        direct: {
          prefix: "! ",
        },
      },
      output: {
        target: "emphasized",
        transform: "content[0].text",
      },
      next: "to-upper",
    },
    {
      id: "to-upper",
      type: "task",
      plugin: "to_upper",
      tool: "to_upper",
      input: {
        context: {
          text: {
            path: "$.emphasized",
            default: "$.greeting",
          },
        },
      },
      output: {
        target: "final",
        transform: "content[0].text",
      },
      end: true,
    },
  ],
  startAt: "add-greeting",
};

const testCases = [
  {
    input: {
      text: "world",
      prefix: "Hello, ",
    },
    expected: {
      greeting: "Hello, world",
      emphasized: "! Hello, world",
      final: "! HELLO, WORLD",
    },
  },
  {
    input: {
      text: "very long text that exceeds ten characters",
      prefix: "Hi, ",
    },
    expected: {
      greeting: "Hi, very long text that exceeds ten characters",
      final: "HI, VERY LONG TEXT THAT EXCEEDS TEN CHARACTERS",
    },
  },
];

async function runTests() {
  const engine = new WorkflowEngine();

  for (const testCase of testCases) {
    console.log("\n🚀 Running test case:", testCase.input);
    const result = await engine.executeWorkflow(
      workflow,
      { input: testCase.input },
      console.log,
    );
    console.log("✅ Result:", result);
    console.log("📝 Expected:", testCase.expected);
  }
}

runTests().catch(console.error);
