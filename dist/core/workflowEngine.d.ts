import { WorkflowDefinition, WorkflowContext } from "../types/types";
export declare class WorkflowEngine {
    private plugins;
    private workflowDefinition?;
    loadPlugin(pluginName: string): Promise<void>;
    executeWorkflow(definition: WorkflowDefinition, context: WorkflowContext, log: (msg: string) => void): Promise<WorkflowContext>;
    private findStepById;
    private getNextStep;
    private executeStep;
    private evaluateChoice;
    private evaluateChoiceCondition;
    private compareValues;
    private prepareInput;
    private processOutput;
    private resolveContextPath;
    private executeTool;
}
