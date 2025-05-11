import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import mcpConfig from "../config/mcp.config.json";
import {
  JsonObject,
  McpToolResponse,
  McpToolListResponse,
  ToolDefinition,
  ToolParameter,
} from "../types/types";

interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export class ToolExecutor {
  private CLINET_NAME: string = "workflow-platform";

  private CLINET_VERSION: string = "1.0.0";

  private toolRegistry: Map<string, ToolDefinition> = new Map();

  private constructor() {}

  public static async create(): Promise<ToolExecutor> {
    const executor = new ToolExecutor();
    await executor.initialize();
    return executor;
  }

  private async initialize(): Promise<void> {
    const cfgs = (mcpConfig as McpConfig).mcpServers;
    const pluginNames = Object.keys(cfgs);

    for (const pluginName of pluginNames) {
      console.log(`[Tool] Registering tool: ${pluginName}`);
      await this.registerTool(pluginName);
      console.log(`[Tool] Successfully registered tool: ${pluginName}`);
    }

    console.log(
      `[Tool] All tools registered successfully: ${Array.from(this.toolRegistry.keys()).join(", ")}`,
    );
  }

  private async registerTool(pluginName: string): Promise<void> {
    try {
      const tools = await this.listTools(pluginName);
      tools.tools.forEach((tool) => {
        this.toolRegistry.set(tool.name, {
          name: tool.name,
          description: tool.description,
          parameters: this.convertInputSchemaToParameters(tool.inputSchema),
        });
      });
      console.log(`[Tool] Registered tool: ${pluginName}`);
    } catch (error) {
      console.error(`[Tool] Failed to register tool: ${pluginName}`, error);
      throw error;
    }
  }

  private convertInputSchemaToParameters(inputSchema: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
        required?: boolean;
        default?: unknown;
      }
    >;
    required?: string[];
  }): ToolParameter[] {
    const parameters: ToolParameter[] = [];
    if (inputSchema.properties) {
      Object.entries(inputSchema.properties).forEach(([name, schema]) => {
        parameters.push({
          name,
          type: schema.type as ToolParameter["type"],
          required: inputSchema.required?.includes(name) || false,
          description: schema.description || "",
          default: schema.default,
        });
      });
    }
    return parameters;
  }

  public async getTool(toolName: string): Promise<ToolDefinition> {
    const tool = this.toolRegistry.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return tool;
  }

  private async createClient(pluginName: string): Promise<Client> {
    const cfgs = (mcpConfig as McpConfig).mcpServers;
    const server = cfgs[pluginName];
    if (!server) {
      throw new Error(`MCP server config not found: ${pluginName}`);
    }

    if (!server.command) {
      throw new Error(`Missing command in MCP server config for ${pluginName}`);
    }

    if (!Array.isArray(server.args)) {
      throw new Error(`Invalid args in MCP server config for ${pluginName}`);
    }

    if (server.env && typeof server.env !== "object") {
      throw new Error(`Invalid env in MCP server config for ${pluginName}`);
    }

    const client = new Client({
      name: this.CLINET_NAME,
      version: this.CLINET_VERSION,
    });
    const transport = new StdioClientTransport({
      command: server.command,
      args: server.args,
      env: server.env,
    });

    try {
      await client.connect(transport);
      return client;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to connect to MCP plugin ${pluginName}: ${errorMessage}`,
      );
    }
  }

  private async listTools(pluginName: string): Promise<McpToolListResponse> {
    const client = await this.createClient(pluginName);
    try {
      const result = await client.listTools();
      if (!result) {
        throw new Error(`Plugin ${pluginName} returned no tools`);
      }
      return result as unknown as McpToolListResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to list tools for plugin ${pluginName}: ${errorMessage}`,
      );
    } finally {
      try {
        await client.close();
      } catch (e) {
        console.error(`Failed to close MCP plugin: ${pluginName}`, e);
      }
    }
  }

  public async executeTool(
    pluginName: string,
    toolName: string,
    input: JsonObject,
  ): Promise<McpToolResponse> {
    const client = await this.createClient(pluginName);
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: input,
      });

      if (!result) {
        throw new Error(`Tool ${toolName} returned no result`);
      }

      return result as McpToolResponse;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(
        `Failed to execute tool ${toolName} in plugin ${pluginName}: ${errorMessage}`,
      );
    } finally {
      try {
        await client.close();
      } catch (e) {
        console.error(`Failed to close MCP plugin: ${pluginName}`, e);
      }
    }
  }
}
