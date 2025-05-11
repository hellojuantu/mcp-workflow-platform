import { WorkflowDefinition, WorkflowContext } from "../types/types";
import { StepManager } from "./stepManager";

export class WorkflowEngine {
  private stepManager: StepManager;

  private constructor(stepManager: StepManager) {
    this.stepManager = stepManager;
  }

  public static async create(): Promise<WorkflowEngine> {
    const stepManager = await StepManager.create();
    return new WorkflowEngine(stepManager);
  }

  async executeWorkflow(
    definition: WorkflowDefinition,
    context: WorkflowContext,
    log: (msg: string) => void,
  ): Promise<WorkflowContext> {
    let currentStep = this.stepManager.findStepById(
      definition,
      definition.startAt,
    );
    let stepCount = 0;
    const maxSteps = definition.steps.length * 2;

    if (!currentStep) {
      throw new Error(`Start step "${definition.startAt}" not found`);
    }

    while (currentStep) {
      stepCount++;
      if (stepCount > maxSteps) {
        throw new Error("Maximum step execution count exceeded");
      }

      log(
        `[Step: ${currentStep.id}] Starting execution (${stepCount}/${maxSteps})`,
      );
      context = await this.stepManager.executeStep(currentStep, context);

      if (currentStep.end) {
        log(`[Step: ${currentStep.id}] Workflow completed`);
        break;
      }

      const nextStep = await this.stepManager.getNextStep(
        definition,
        currentStep,
        context,
      );
      if (!nextStep) {
        throw new Error(`Next step not found for step "${currentStep.id}"`);
      }

      currentStep = nextStep;
    }

    return context;
  }
}
