#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { formatToolResult, runZoTool } from "./zo-tools.js";

function readVersion(): string {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(
      readFileSync(join(dir, "..", "package.json"), "utf-8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

const TOOLS = [
  {
    name: "send_sms_to_user",
    description:
      "Send an SMS to the Zo owner (or a registered contact). Calls Zo's internal send_sms_to_user tool directly — no /zo/ask session. Keep messages under 160 words.",
    inputSchema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "Text body to send.",
        },
        contact_name: {
          type: "string",
          description:
            "Optional registered contact name. Omit to text the Zo owner.",
        },
        media_files: {
          type: "array",
          items: { type: "string" },
          description: "Optional absolute file paths to attach as MMS.",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "send_email_to_user",
    description:
      "Send an email to the Zo owner. Calls Zo's internal send_email_to_user tool directly — no /zo/ask session.",
    inputSchema: {
      type: "object" as const,
      properties: {
        subject: {
          type: "string",
          description: "Email subject line.",
        },
        markdown_body: {
          type: "string",
          description: "Email body in Markdown.",
        },
        attachments: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional absolute file paths to attach (max 10MB total).",
        },
      },
      required: ["subject", "markdown_body"],
    },
  },
] as const;

async function main(): Promise<void> {
  const server = new Server(
    { name: "zo-mcp", version: readVersion() },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((tool) => ({ ...tool })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const payload = (args ?? {}) as Record<string, unknown>;

      if (name === "send_sms_to_user" || name === "send_email_to_user") {
        const text = formatToolResult(await runZoTool(name, payload));
        return {
          content: [{ type: "text" as const, text }],
        };
      }

      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`[zo-mcp] fatal: ${err}\n`);
  process.exit(1);
});
