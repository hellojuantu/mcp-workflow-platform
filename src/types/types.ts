import { z } from 'zod';

// MCP Plugin Types
export const McpContentSchema = z
  .object({
    type: z.string(),
    text: z.string(),
  })
  .catchall(z.any());

export const McpToolResponseSchema = z
  .object({
    content: z.array(McpContentSchema),
  })
  .catchall(z.any());

// Basic Type Definitions
export const JsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const JsonValueSchema = z.union([
  JsonPrimitiveSchema,
  z.record(z.any()),
  z.array(z.any()),
]);

export const JsonObjectSchema = z.record(JsonValueSchema);
export const JsonArraySchema = z.array(JsonValueSchema);

// Workflow Context
export const WorkflowContextSchema = JsonObjectSchema;

// Workflow Input/Output
export const WorkflowStepInputSchema = z.object({
  direct: JsonObjectSchema.optional(),
  context: z
    .record(
      z.object({
        path: z.string(),
        default: z.string().optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const WorkflowStepOutputSchema = z.object({
  target: z.string(),
  transform: z.string().optional(),
  filter: z.string().optional(),
});

// Choice Rules
export const ComparisonOperatorSchema = z.enum([
  'gt',
  'gte',
  'lt',
  'lte',
  'eq',
  'neq',
]);

export const ChoiceTypeSchema = z.enum([
  'string-length',
  'number-compare',
  'string-contains',
  'string-equals',
  'value-exists',
]);

export const ChoiceRuleSchema = z.object({
  type: ChoiceTypeSchema,
  field: z.string(),
  value: JsonValueSchema.optional(),
  operator: ComparisonOperatorSchema.optional(),
  next: z.string(),
});

// Workflow step types
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['task', 'choice', 'parallel', 'map']),
  plugin: z.string().min(1).optional(),
  tool: z.string().min(1).optional(),
  parameters: z.record(z.unknown()).optional(),
  output: z.string().min(1).optional(),
  next: z.string().min(1).optional(),
  end: z.boolean().optional(),
  choices: z.array(ChoiceRuleSchema).optional(),
});

// Workflow Definition
export const WorkflowDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  steps: z.array(WorkflowStepSchema),
  startAt: z.string(),
});

// Type exports
export type McpContent = z.infer<typeof McpContentSchema>;
export type McpToolResponse = z.infer<typeof McpToolResponseSchema>;
export type JsonPrimitive = z.infer<typeof JsonPrimitiveSchema>;
export type JsonValue = z.infer<typeof JsonValueSchema>;
export type JsonObject = z.infer<typeof JsonObjectSchema>;
export type JsonArray = z.infer<typeof JsonArraySchema>;
export type WorkflowContext = z.infer<typeof WorkflowContextSchema>;
export type WorkflowStepInput = z.infer<typeof WorkflowStepInputSchema>;
export type WorkflowStepOutput = z.infer<typeof WorkflowStepOutputSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type ChoiceRule = z.infer<typeof ChoiceRuleSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type ComparisonOperator = z.infer<typeof ComparisonOperatorSchema>;
export type ChoiceType = z.infer<typeof ChoiceTypeSchema>;

// Tool registry types
export interface ToolInputMapping {
  inputPath: string; // 工具输入参数的路径
  contextPath: string; // 工作流上下文中的路径
  required?: boolean;
  default?: string;
}

export interface ToolOutputMapping {
  outputPath: string; // 工具输出结果的路径
  contextPath: string; // 工作流上下文中的路径
}

// Tool definition types
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any;
  description?: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  returns: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description?: string;
  };
}
