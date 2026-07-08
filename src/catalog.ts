import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { fetchToolCatalog, type ZoToolDefinition } from "./zo-tools.js";

function toolDescription(tool: ZoToolDefinition): string {
  const label = tool.display_name?.trim();
  const body = tool.description?.trim();

  if (label && body) {
    return `${label}. ${body}`;
  }
  if (body) {
    return body;
  }
  if (label) {
    return label;
  }
  return `Zo tool: ${tool.name}`;
}

function toolInputSchema(
  argsSchema: ZoToolDefinition["args_schema"],
): Tool["inputSchema"] {
  if (argsSchema && typeof argsSchema === "object") {
    return argsSchema as Tool["inputSchema"];
  }

  return {
    type: "object",
    properties: {},
  };
}

export function toMcpTool(tool: ZoToolDefinition): Tool {
  return {
    name: tool.name,
    description: toolDescription(tool),
    inputSchema: toolInputSchema(tool.args_schema),
  };
}

export class ToolCatalog {
  private tools: Tool[] = [];
  private names = new Set<string>();

  async refresh(): Promise<Tool[]> {
    const catalog = await fetchToolCatalog();
    this.tools = catalog.map(toMcpTool);
    this.names = new Set(catalog.map((tool) => tool.name));
    return this.tools;
  }

  list(): Tool[] {
    return this.tools;
  }

  has(name: string): boolean {
    return this.names.has(name);
  }
}
