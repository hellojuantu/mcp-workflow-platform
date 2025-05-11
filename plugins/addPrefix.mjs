import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "add_prefix",
    version: "1.0.0"
});

server.tool(
    "add_prefix",
    {
        text: z.string(),
        prefix: z.string()
    },
    async ({ text, prefix }) => ({
        content: [
            {
                type: "text",
                text: `${prefix}${text}`
            }
        ]
    })
);

const transport = new StdioServerTransport();
await server.connect(transport);