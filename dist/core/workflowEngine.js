"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowEngine = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/client/stdio.js");
const mcp_config_json_1 = __importDefault(require("../config/mcp.config.json"));
class WorkflowEngine {
    plugins = new Map();
    workflowDefinition;
    async loadPlugin(pluginName) {
        const client = new index_js_1.Client({ name: pluginName, version: "1.0.0" });
        const tools = await client.listTools();
        const toolList = Array.isArray(tools) ? tools : [tools];
        this.plugins.set(pluginName, {
            name: pluginName,
            version: "1.0.0",
            tools: toolList.map((tool) => ({
                name: tool.name,
                type: tool.type,
                inputSchema: tool.inputSchema,
                outputSchema: tool.outputSchema,
            })),
        });
    }
    async executeWorkflow(definition, context, log) {
        this.workflowDefinition = definition;
        let currentStep = this.findStepById(definition.startAt);
        if (!currentStep) {
            throw new Error(`Start step "${definition.startAt}" not found`);
        }
        while (currentStep) {
            log(`[Step: ${currentStep.id}] Starting execution`);
            context = await this.executeStep(currentStep, context);
            if (currentStep.end) {
                log(`[Step: ${currentStep.id}] Workflow completed`);
                break;
            }
            const nextStep = await this.getNextStep(currentStep, context);
            if (!nextStep) {
                throw new Error(`Next step not found for step "${currentStep.id}"`);
            }
            currentStep = nextStep;
        }
        return context;
    }
    findStepById(stepId) {
        return this.workflowDefinition?.steps.find((step) => step.id === stepId);
    }
    async getNextStep(currentStep, context) {
        if (currentStep.type === "choice") {
            return this.evaluateChoice(currentStep, context);
        }
        if (currentStep.next) {
            return this.findStepById(currentStep.next);
        }
        return undefined;
    }
    async executeStep(step, context) {
        if (step.type === "task" && step.plugin && step.tool) {
            const input = await this.prepareInput(step.input, context);
            console.log(`[Step: ${step.id}] Input:`, JSON.stringify(input, null, 2));
            const result = await this.executeTool(step.plugin, step.tool, input);
            console.log(`[Step: ${step.id}] Output:`, JSON.stringify(result, null, 2));
            if (step.output) {
                context[step.output.target] = await this.processOutput(result, step.output.transform, step.output.filter);
            }
        }
        return context;
    }
    evaluateChoice(step, context) {
        if (!step.choices)
            return undefined;
        for (const choice of step.choices) {
            try {
                const fieldValue = this.resolveContextPath(choice.field, context);
                const result = this.evaluateChoiceCondition(choice, fieldValue);
                if (result) {
                    const targetStep = this.findStepById(choice.next);
                    if (!targetStep) {
                        throw new Error(`Target step "${choice.next}" not found`);
                    }
                    return targetStep;
                }
            }
            catch (error) {
                console.error(`Error evaluating choice: ${JSON.stringify(choice)}`, error);
                continue;
            }
        }
        return undefined;
    }
    evaluateChoiceCondition(choice, fieldValue) {
        switch (choice.type) {
            case "string-length": {
                if (typeof fieldValue !== "string") {
                    return false;
                }
                return this.compareValues(fieldValue.length, choice.value, choice.operator);
            }
            case "number-compare": {
                if (typeof fieldValue !== "number") {
                    return false;
                }
                return this.compareValues(fieldValue, choice.value, choice.operator);
            }
            case "string-contains": {
                if (typeof fieldValue !== "string" ||
                    typeof choice.value !== "string") {
                    return false;
                }
                return fieldValue.includes(choice.value);
            }
            case "string-equals": {
                if (typeof fieldValue !== "string" ||
                    typeof choice.value !== "string") {
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
    compareValues(a, b, operator) {
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
    async prepareInput(input, context) {
        if (!input)
            return {};
        const result = {};
        if (input.direct) {
            Object.assign(result, input.direct);
        }
        if (input.context) {
            for (const [key, config] of Object.entries(input.context)) {
                const value = this.resolveContextPath(config.path, context);
                if (config.required && value === undefined) {
                    throw new Error(`Required input "${key}" not found at path "${config.path}"`);
                }
                result[key] =
                    value !== undefined
                        ? value
                        : this.resolveContextPath(config.default, context);
            }
        }
        return result;
    }
    async processOutput(result, transform, filter) {
        let output = result;
        if (transform) {
            output = transform.split(".").reduce((obj, key) => {
                if (key.includes("[")) {
                    const [arrayKey, index] = key.split("[");
                    const idx = parseInt(index);
                    return obj[arrayKey]?.[idx];
                }
                return obj[key];
            }, output);
        }
        if (filter) {
            const condition = new Function("value", `return ${filter}`);
            if (!condition(output)) {
                console.error(`Filter failed: ${filter}`);
                return null;
            }
        }
        return output;
    }
    resolveContextPath(path, context) {
        if (!path) {
            console.error(`Path is empty: ${path}`);
            return undefined;
        }
        if (!path.startsWith("$.")) {
            console.error(`Path is not starts with $.: ${path}`);
            return undefined;
        }
        const parts = path.slice(2).split(".");
        let current = context;
        for (const part of parts) {
            if (current === undefined || current === null) {
                console.error(`Current is undefined or null: ${path}`);
                return undefined;
            }
            if (part.includes("[")) {
                const [key, indexStr] = part.split("[");
                const index = parseInt(indexStr);
                current = current[key]?.[index];
            }
            else {
                current = current[part];
            }
        }
        return current;
    }
    async executeTool(pluginName, toolName, input) {
        const cfgs = mcp_config_json_1.default.mcpServers;
        const server = cfgs[pluginName];
        if (!server) {
            throw new Error(`MCP server config not found: ${pluginName}`);
        }
        const transport = new stdio_js_1.StdioClientTransport({
            command: server.command,
            args: server.args,
            env: server.env,
        });
        const client = new index_js_1.Client({ name: pluginName, version: "1.0.0" });
        try {
            await client.connect(transport);
            const result = await client.callTool({
                name: toolName,
                arguments: input,
            });
            return result;
        }
        finally {
            try {
                await transport.close();
            }
            catch (e) {
                console.error(`Failed to close MCP plugin: ${pluginName}`, e);
            }
        }
    }
}
exports.WorkflowEngine = WorkflowEngine;
//# sourceMappingURL=workflowEngine.js.map