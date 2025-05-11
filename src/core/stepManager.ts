import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowContext,
  ChoiceRule,
  JsonValue,
  JsonObject,
  McpToolResponse,
  ComparisonOperator,
} from "../types/types";
import get from "lodash.get";
import { ToolExecutor } from "./toolExecutor";

export class StepManager {
  private toolExecutor: ToolExecutor;

  private constructor(toolExecutor: ToolExecutor) {
    this.toolExecutor = toolExecutor;
  }

  public static async create(): Promise<StepManager> {
    const toolExecutor = await ToolExecutor.create();
    return new StepManager(toolExecutor);
  }

  private resolveContextPath(
    path: string,
    context: WorkflowContext,
  ): JsonValue {
    if (!path) {
      throw new Error("Path cannot be empty");
    }

    if (!path.startsWith("$.")) {
      return path;
    }

    try {
      if (path.includes("?")) {
        const [condition, truePath, falsePath] = path
          .split(/[?:]/)
          .map((s) => s.trim());
        const conditionValue = this.resolveContextPath(condition, context);
        if (typeof conditionValue !== "boolean") {
          throw new Error(`Condition must evaluate to boolean: ${condition}`);
        }
        const selectedPath = conditionValue ? truePath : falsePath;
        return this.resolveContextPath(selectedPath, context);
      }

      const normalizedPath = path.slice(2);
      if (!normalizedPath) {
        throw new Error("Invalid path after normalization");
      }

      const value = get(context, normalizedPath);
      if (value === undefined) {
        throw new Error(
          `Path not found: ${path}, normalizedPath: ${normalizedPath}, context: ${JSON.stringify(context)}`,
        );
      }

      return value;
    } catch (error) {
      console.error(`Error resolving context path: ${path}`, error);
      return null;
    }
  }

  public async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<WorkflowContext> {
    console.log(
      `[Step: ${step.id}] Starting execution with type: ${step.type}`,
    );
    console.log(
      `[Step: ${step.id}] Context:`,
      JSON.stringify(context, null, 2),
    );

    if (step.type === "task" && step.plugin && step.tool) {
      const input = await this.prepareInput(step, context);
      console.log(`[Step: ${step.id}] Input:`, JSON.stringify(input, null, 2));

      const result = await this.toolExecutor.executeTool(
        step.plugin,
        step.tool,
        input,
      );
      console.log(
        `[Step: ${step.id}] Output:`,
        JSON.stringify(result, null, 2),
      );

      await this.processOutput(step, result, context);
    } else if (
      step.type === "choice" &&
      Array.isArray(step.choices) &&
      step.choices.length > 0
    ) {
      const choice = step.choices[0];
      const fieldValue = this.resolveContextPath(choice.field, context);
      const value = this.evaluateChoiceCondition(choice, fieldValue);
      if (step.output) {
        context[step.output] = value;
      }
    }

    console.log(`[Step: ${step.id}] Execution completed`);
    return context;
  }

  private async prepareInput(
    step: WorkflowStep,
    context: WorkflowContext,
  ): Promise<JsonObject> {
    if (!step.tool) {
      throw new Error("Tool name is required");
    }

    const toolDef = await this.toolExecutor.getTool(step.tool);
    if (!toolDef) {
      throw new Error(`Tool definition not found: ${step.tool}`);
    }

    const result: JsonObject = {};

    if (step.parameters) {
      for (const [paramName, paramValue] of Object.entries(step.parameters)) {
        const param = toolDef.parameters.find((p) => p.name === paramName);
        if (!param) {
          throw new Error(
            `Unknown parameter: ${paramName} for tool: ${step.tool}`,
          );
        }

        const value = this.resolveContextPath(paramValue as string, context);
        if (param.required && value === null) {
          throw new Error(
            `Required parameter not found: ${paramName} for tool: ${step.tool}`,
          );
        }

        result[paramName] = value !== null ? value : param.default;
      }
    }

    return result;
  }

  private async processOutput(
    step: WorkflowStep,
    result: McpToolResponse,
    context: WorkflowContext,
  ): Promise<void> {
    if (!step.output) {
      return;
    }

    if (!step.tool) {
      throw new Error("Tool name is required");
    }

    if (
      !result.content ||
      !Array.isArray(result.content) ||
      result.content.length === 0
    ) {
      throw new Error(`Tool ${step.tool} returned empty result`);
    }

    const output = result.content[0]?.text;
    if (output === undefined) {
      throw new Error(`Tool ${step.tool} returned no text content`);
    }

    context[step.output] = output;
  }

  private evaluateChoice(
    definition: WorkflowDefinition,
    step: WorkflowStep,
    context: WorkflowContext,
  ): WorkflowStep | undefined {
    if (!step.choices?.length) {
      console.warn(`No choices defined for step ${step.id}`);
      return undefined;
    }

    for (const choice of step.choices) {
      try {
        if (!choice.field || !choice.next) {
          console.warn(`Invalid choice rule: ${JSON.stringify(choice)}`);
          continue;
        }

        const fieldValue = this.resolveContextPath(choice.field, context);
        if (fieldValue === null) {
          console.warn(
            `Field not found: ${choice.field}, context: ${JSON.stringify(context)}`,
          );
          continue;
        }

        const result = this.evaluateChoiceCondition(choice, fieldValue);
        if (result) {
          const targetStep = this.findStepById(definition, choice.next);
          if (!targetStep) {
            throw new Error(`Target step "${choice.next}" not found`);
          }
          return targetStep;
        }
      } catch (error) {
        console.error(
          `Error evaluating choice: ${JSON.stringify(choice)}`,
          error instanceof Error ? error.message : "Unknown error",
        );
        continue;
      }
    }

    console.warn(`No matching choice found for step ${step.id}`);
    return undefined;
  }

  private evaluateChoiceCondition(
    choice: ChoiceRule,
    fieldValue: JsonValue,
  ): boolean {
    if (!choice.type) {
      console.warn("Choice type is missing");
      return false;
    }

    if (choice.type === "string-length" || choice.type === "number-compare") {
      if (!choice.operator) {
        console.warn(`Missing operator for ${choice.type} comparison`);
        return false;
      }
      if (!["gt", "gte", "lt", "lte", "eq", "neq"].includes(choice.operator)) {
        console.warn(`Invalid operator: ${choice.operator}`);
        return false;
      }
    }

    switch (choice.type) {
      case "string-length": {
        if (typeof fieldValue !== "string") {
          console.warn(
            `Expected string value for string-length comparison, got ${typeof fieldValue}`,
          );
          return false;
        }
        const value = choice.value as number;
        if (typeof value !== "number") {
          console.warn(
            `Expected number value for string-length comparison, got ${typeof value}`,
          );
          return false;
        }
        return this.compareValues(fieldValue.length, value, choice.operator);
      }
      case "number-compare": {
        if (typeof fieldValue !== "number") {
          console.warn(
            `Expected number value for number comparison, got ${typeof fieldValue}`,
          );
          return false;
        }
        const value = choice.value as number;
        if (typeof value !== "number") {
          console.warn(
            `Expected number value for number comparison, got ${typeof value}`,
          );
          return false;
        }
        return this.compareValues(fieldValue, value, choice.operator);
      }
      case "string-contains": {
        if (typeof fieldValue !== "string") {
          console.warn(
            `Expected string value for string-contains comparison, got ${typeof fieldValue}`,
          );
          return false;
        }
        if (typeof choice.value !== "string") {
          console.warn(
            `Expected string value for string-contains comparison, got ${typeof choice.value}`,
          );
          return false;
        }
        return fieldValue.includes(choice.value);
      }
      case "string-equals": {
        if (typeof fieldValue !== "string") {
          console.warn(
            `Expected string value for string-equals comparison, got ${typeof fieldValue}`,
          );
          return false;
        }
        if (typeof choice.value !== "string") {
          console.warn(
            `Expected string value for string-equals comparison, got ${typeof choice.value}`,
          );
          return false;
        }
        return fieldValue === choice.value;
      }
      case "value-exists": {
        return fieldValue !== undefined && fieldValue !== null;
      }
      default: {
        console.error(`Unsupported choice type: ${choice.type}`);
        return false;
      }
    }
  }

  private compareValues(
    a: number,
    b: number,
    operator?: ComparisonOperator,
  ): boolean {
    switch (operator) {
      case "gt":
        return a > b;
      case "gte":
        return a >= b;
      case "lt":
        return a < b;
      case "lte":
        return a <= b;
      case "eq":
        return a === b;
      case "neq":
        return a !== b;
      default:
        return false;
    }
  }

  public findStepById(
    definition: WorkflowDefinition,
    stepId: string,
  ): WorkflowStep | undefined {
    return definition.steps.find((step) => step.id === stepId);
  }

  public async getNextStep(
    definition: WorkflowDefinition,
    currentStep: WorkflowStep,
    context: WorkflowContext,
  ): Promise<WorkflowStep | undefined> {
    if (currentStep.type === "choice") {
      return this.evaluateChoice(definition, currentStep, context);
    }

    if (currentStep.next) {
      return this.findStepById(definition, currentStep.next);
    }

    return undefined;
  }
}
