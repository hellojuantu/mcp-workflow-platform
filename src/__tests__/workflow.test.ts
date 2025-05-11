import { WorkflowEngine } from '../core/workflowEngine';
import { WorkflowDefinition } from '../types/types';

const workflow: WorkflowDefinition = {
  id: 'text-processing-workflow',
  version: '1.0.0',
  name: 'Text Processing Workflow',
  description: 'Demonstrates text processing, conditional logic, and branching',
  steps: [
    {
      id: 'add-greeting',
      type: 'task',
      plugin: 'add_prefix',
      tool: 'add_prefix',
      parameters: {
        text: '$.input.text',
        prefix: '$.input.prefix',
      },
      output: 'greeting',
      next: 'check-length',
    },
    {
      id: 'check-length',
      type: 'choice',
      output: 'isLongText',
      choices: [
        {
          type: 'string-length',
          field: '$.greeting',
          value: 15,
          operator: 'gt',
          next: 'to-upper',
        },
        {
          type: 'string-length',
          field: '$.greeting',
          value: 15,
          operator: 'lte',
          next: 'add-emphasis',
        },
      ],
    },
    {
      id: 'add-emphasis',
      type: 'task',
      plugin: 'add_prefix',
      tool: 'add_prefix',
      parameters: {
        text: '$.greeting',
        prefix: '! ',
      },
      output: 'emphasized',
      next: 'to-upper',
    },
    {
      id: 'to-upper',
      type: 'task',
      plugin: 'to_upper',
      tool: 'to_upper',
      parameters: {
        text: '$.isLongText ? $.greeting : $.emphasized',
      },
      output: 'final',
      end: true,
    },
  ],
  startAt: 'add-greeting',
};

describe('Workflow Engine Tests', () => {
  const engine = new WorkflowEngine();
  const mockLog = jest.fn();

  beforeEach(() => {
    mockLog.mockClear();
  });

  const testCases = [
    {
      name: 'Basic Test - Short Text',
      input: {
        text: 'world',
        prefix: 'Hello, ',
      },
      expected: {
        input: {
          text: 'world',
          prefix: 'Hello, ',
        },
        greeting: 'Hello, world',
        isLongText: false,
        emphasized: '! Hello, world',
        final: '! HELLO, WORLD',
      },
    },
    {
      name: 'Basic Test - Long Text',
      input: {
        text: 'very long text that exceeds ten characters',
        prefix: 'Hi, ',
      },
      expected: {
        input: {
          text: 'very long text that exceeds ten characters',
          prefix: 'Hi, ',
        },
        greeting: 'Hi, very long text that exceeds ten characters',
        isLongText: true,
        final: 'HI, VERY LONG TEXT THAT EXCEEDS TEN CHARACTERS',
      },
    },
    {
      name: 'Basic Test - Empty Text',
      input: {
        text: '',
        prefix: 'Empty: ',
      },
      expected: {
        input: {
          text: '',
          prefix: 'Empty: ',
        },
        greeting: 'Empty: ',
        isLongText: false,
        emphasized: '! Empty: ',
        final: '! EMPTY: ',
      },
    },
    {
      name: 'Basic Test - Unicode Characters',
      input: {
        text: '你好世界',
        prefix: '中文: ',
      },
      expected: {
        input: {
          text: '你好世界',
          prefix: '中文: ',
        },
        greeting: '中文: 你好世界',
        isLongText: false,
        emphasized: '! 中文: 你好世界',
        final: '! 中文: 你好世界',
      },
    },
    {
      name: 'Boundary Test - Exactly 15 Characters',
      input: {
        text: '12345678901234',
        prefix: 'A',
      },
      expected: {
        input: {
          text: '12345678901234',
          prefix: 'A',
        },
        greeting: 'A12345678901234',
        isLongText: false,
        emphasized: '! A12345678901234',
        final: '! A12345678901234',
      },
    },
    {
      name: 'Boundary Test - Over 15 Characters',
      input: {
        text: '12345678901234',
        prefix: 'AB',
      },
      expected: {
        input: {
          text: '12345678901234',
          prefix: 'AB',
        },
        greeting: 'AB12345678901234',
        isLongText: true,
        final: 'AB12345678901234',
      },
    },
    {
      name: 'Boundary Test - Long Prefix',
      input: {
        text: 'short',
        prefix: 'This is a very long prefix: ',
      },
      expected: {
        input: {
          text: 'short',
          prefix: 'This is a very long prefix: ',
        },
        greeting: 'This is a very long prefix: short',
        isLongText: true,
        final: 'THIS IS A VERY LONG PREFIX: SHORT',
      },
    },
    {
      name: 'Boundary Test - Spaces',
      input: {
        text: '   spaces   ',
        prefix: 'Trim: ',
      },
      expected: {
        input: {
          text: '   spaces   ',
          prefix: 'Trim: ',
        },
        greeting: 'Trim:    spaces   ',
        isLongText: true,
        final: 'TRIM:    SPACES   ',
      },
    },
    {
      name: 'Boundary Test - Newlines',
      input: {
        text: 'line1\nline2',
        prefix: 'Multi: ',
      },
      expected: {
        input: {
          text: 'line1\nline2',
          prefix: 'Multi: ',
        },
        greeting: 'Multi: line1\nline2',
        isLongText: true,
        final: 'MULTI: LINE1\nLINE2',
      },
    },
    {
      name: 'Boundary Test - Special Characters',
      input: {
        text: '!@#$%^&*()',
        prefix: 'Special: ',
      },
      expected: {
        input: {
          text: '!@#$%^&*()',
          prefix: 'Special: ',
        },
        greeting: 'Special: !@#$%^&*()',
        isLongText: true,
        final: 'SPECIAL: !@#$%^&*()',
      },
    },
  ];

  test.each(testCases)('$name', async ({ input, expected }) => {
    const result = await engine.executeWorkflow(workflow, { input }, mockLog);
    expect(result).toEqual(expected);
  });

  describe('Error Cases', () => {
    test('Invalid Plugin', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            plugin: 'invalid_plugin',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Tool', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            tool: 'invalid_tool',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Missing Required Parameter', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            parameters: {
              text: '$.input.text',
            },
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Context Path', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            parameters: {
              text: '$.invalid.path',
              prefix: '$.input.prefix',
            },
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Choice Condition', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Missing Start Step', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        startAt: 'non-existent-step',
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Missing Next Step', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            next: 'non-existent-step',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Step Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            type: 'invalid-type' as any,
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Missing Required Step Properties', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
                    {
                      id: 'add-greeting',
                      type: 'task',
                    } as any,
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'invalid-type' as any,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 123, prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Value Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 'invalid' as any,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Operator', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 15,
                operator: 'invalid-operator' as any,
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Path', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.invalid.path',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Next Step', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'non-existent-step',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Missing', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
                            {
                              type: 'string-length' as const,
                              value: 15,
                              operator: 'gt',
                              next: 'to-upper',
                            } as any,
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Next Missing', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
                            {
                              type: 'string-length' as const,
                              field: '$.greeting',
                              value: 15,
                              operator: 'gt',
                            } as any,
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Type for Number Compare', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'number-compare' as const,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Type for String Contains', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-contains' as const,
                field: '$.greeting',
                value: 'test',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 123, prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Type for String Equals', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-equals' as const,
                field: '$.greeting',
                value: 'test',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 123, prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Field Type for Value Exists', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'value-exists' as const,
                field: '$.greeting',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 123, prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Task Output', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            output: 'invalid.output',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Output', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            output: 'invalid.output',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Step ID', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            id: '',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Duplicate Step ID', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          workflow.steps[0],
          {
            ...workflow.steps[0],
            id: 'add-greeting',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Step Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[0],
            type: 'invalid-type' as any,
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Step Properties', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            plugin: 'add_prefix',
            tool: 'add_prefix',
            parameters: {
              text: '$.input.text',
              prefix: '$.input.prefix',
            },
            output: 'greeting',
            next: 'check-length',
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    test('Invalid Workflow Definition - Invalid Choice Properties', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        ...workflow,
        steps: [
          {
            ...workflow.steps[1],
            choices: [
              {
                type: 'string-length' as const,
                field: '$.greeting',
                value: 15,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
        ],
      };

      await expect(
        engine.executeWorkflow(invalidWorkflow, { input: { text: 'test', prefix: 'test' } }, mockLog),
      ).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Field Type for Value Exists', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'value-exists',
                field: '$.invalid.path',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Field Type for String Length', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'string-length',
                field: '$.greeting',
                value: 10,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Field Type for Number Compare', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'number-compare',
                field: '$.greeting',
                value: 10,
                operator: 'gt',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Field Type for String Contains', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'string-contains',
                field: '$.greeting',
                value: 'test',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Field Type for String Equals', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'string-equals',
                field: '$.greeting',
                value: 'test',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Choice Type', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'invalid-type' as any,
                field: '$.greeting',
                value: 'test',
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Comparison Operator', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'string-length',
                field: '$.greeting',
                value: 10,
                operator: 'invalid-operator' as any,
                next: 'to-upper',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });

    it('Invalid Workflow Definition - Invalid Target Step', async () => {
      const invalidWorkflow: WorkflowDefinition = {
        id: 'test-workflow',
        version: '1.0',
        name: 'Test Workflow',
        startAt: 'add-greeting',
        steps: [
          {
            id: 'add-greeting',
            type: 'task',
            tool: 'add_prefix',
            parameters: {
              text: 'test',
              prefix: 'test',
            },
            next: 'check-length',
          },
          {
            id: 'check-length',
            type: 'choice',
            choices: [
              {
                type: 'string-length',
                field: '$.greeting',
                value: 10,
                operator: 'gt',
                next: 'non-existent-step',
              },
            ],
          },
          {
            id: 'to-upper',
            type: 'task',
            tool: 'to_upper',
            parameters: {
              text: '$.greeting',
            },
          },
        ],
      };

      await expect(engine.executeWorkflow(invalidWorkflow, {}, console.log)).rejects.toThrow();
    });
  });
});
