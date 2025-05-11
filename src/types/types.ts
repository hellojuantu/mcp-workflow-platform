export interface McpToolDefinition {
  name: string;
  type: "tool" | "resource" | "prompt";
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface McpPluginDefinition {
  name: string;
  version: string;
  tools: McpToolDefinition[];
}

export interface WorkflowContext {
  [key: string]: any;
}

export interface WorkflowStepInput {
  direct?: Record<string, any>;
  context?: {
    [key: string]: {
      path: string;
      default?: any;
      required?: boolean;
    };
  };
}

export interface WorkflowStepOutput {
  target: string;
  transform?: string;
  filter?: string;
}

export interface WorkflowStep {
  id: string;
  type: "task" | "choice" | "parallel" | "map";
  plugin?: string;
  tool?: string;
  input?: WorkflowStepInput;
  output?: WorkflowStepOutput;
  choices?: ChoiceRule[];
  next?: string;
  end?: boolean;
}

export type ChoiceType =
  | "string-length"
  | "number-compare"
  | "string-contains"
  | "string-equals"
  | "value-exists";

export interface ChoiceRule {
  type: ChoiceType;
  field: string;
  value?: any;
  operator?: "gt" | "gte" | "lt" | "lte" | "eq" | "neq";
  next: string;
}

export interface WorkflowDefinition {
  id: string;
  version: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  startAt: string;
}
