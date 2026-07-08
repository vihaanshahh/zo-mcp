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
import { ToolCatalog } from "./catalog.js";
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

async function main(): Promise<void> {
  const catalog = new ToolCatalog();

  try {
    const tools = await catalog.refresh();
    process.stderr.write(
      `[zo-mcp] loaded ${tools.length} internal Zo tools\n`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[zo-mcp] startup failed: ${message}\n`);
    process.exit(1);
  }

  const server = new Server(
    { name: "zo-internal-mcp", version: readVersion() },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      await catalog.refresh();
    } catch (err) {
      process.stderr.write(
        `[zo-mcp] tool refresh failed: ${err instanceof Error ? err.message : err}\n`,
      );
    }
    return { tools: catalog.list() };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (!catalog.has(name)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Unknown tool: ${name}. Run tools/list to see the current Zo catalog.`,
            },
          ],
          isError: true,
        };
      }

      const payload = (args ?? {}) as Record<string, unknown>;
      const text = formatToolResult(await runZoTool(name, payload));
      return {
        content: [{ type: "text" as const, text }],
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
