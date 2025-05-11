import { z } from "zod";

// MCP Plugin Types
export const McpContentSchema = z
  .object({
    type: z.string(),
    text: z.string(),
  })
  .catchall(z.unknown());

export const McpToolResponseSchema = z
  .object({
    content: z.array(McpContentSchema),
  })
  .catchall(z.unknown());

// Basic Type Definitions
export const JsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.record(z.unknown()),
  z.array(z.unknown()),
]);

export const JsonObjectSchema = z.record(JsonValueSchema);

// Workflow Context
export const WorkflowContextSchema = JsonObjectSchema;

// Choice Rules
export const ComparisonOperatorSchema = z.enum([
  "gt",
  "gte",
  "lt",
  "lte",
  "eq",
  "neq",
]);

export const ChoiceTypeSchema = z.enum([
  "string-length",
  "number-compare",
  "string-contains",
  "string-equals",
  "value-exists",
]);

export const ChoiceRuleSchema = z.object({
  type: ChoiceTypeSchema,
  field: z.string(),
  value: JsonValueSchema.optional(),
  operator: ComparisonOperatorSchema.optional(),
  next: z.string(),
  setTo: z.enum(["true", "false"]).optional(),
});

// Workflow step types
export const WorkflowStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["task", "choice", "parallel", "map"]),
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
export type JsonValue = z.infer<typeof JsonValueSchema>;
export type JsonObject = z.infer<typeof JsonObjectSchema>;
export type WorkflowContext = z.infer<typeof WorkflowContextSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type ChoiceRule = z.infer<typeof ChoiceRuleSchema>;
export type WorkflowDefinition = z.infer<typeof WorkflowDefinitionSchema>;
export type ComparisonOperator = z.infer<typeof ComparisonOperatorSchema>;
export type ChoiceType = z.infer<typeof ChoiceTypeSchema>;

// Tool definition types
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
  default?: unknown;
  description?: string;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface McpToolListResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: {
      type: string;
      properties: Record<
        string,
        {
          type: string;
          description: string;
          required?: boolean;
        }
      >;
      required?: string[];
    };
  }>;
}
