import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "to_upper",
    version: "1.0.0"
});

server.tool(
    "to_upper",
    { text: z.string() },
    async ({ text }) => ({
        content: [
            {
                type: "text",
                text: text.toUpperCase()
            }
        ]
    })
);

const transport = new StdioServerTransport();
await server.connect(transport);