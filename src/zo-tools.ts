const API_BASE = "https://api.zo.computer/zo/tools";

export interface ZoToolResult {
  success: boolean;
  result: unknown;
  error: string | null;
  execution_time_ms?: number;
}

export interface ZoToolDefinition {
  name: string;
  description: string | null;
  display_name: string | null;
  args_schema: Record<string, unknown> | null;
}

function requireIdentityToken(): string {
  const token = process.env.ZO_CLIENT_IDENTITY_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "zo-mcp only runs on a Zo Computer. ZO_CLIENT_IDENTITY_TOKEN is not set.",
    );
  }
  return token;
}

export async function fetchToolCatalog(): Promise<ZoToolDefinition[]> {
  const response = await fetch(API_BASE, {
    headers: { authorization: requireIdentityToken() },
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to load Zo tools (${response.status}): ${bodyText}`);
  }

  const parsed = JSON.parse(bodyText) as { tools?: ZoToolDefinition[] };
  return parsed.tools ?? [];
}

export async function runZoTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ZoToolResult> {
  const response = await fetch(`${API_BASE}/${toolName}/run`, {
    method: "POST",
    headers: {
      authorization: requireIdentityToken(),
      "content-type": "application/json",
    },
    body: JSON.stringify({ args }),
  });

  const bodyText = await response.text();
  let parsed: ZoToolResult | { detail?: unknown };
  try {
    parsed = JSON.parse(bodyText) as ZoToolResult | { detail?: unknown };
  } catch {
    throw new Error(`Invalid JSON from Zo API (${response.status}): ${bodyText}`);
  }

  if (!response.ok) {
    throw new Error(
      `Zo tool ${toolName} failed (${response.status}): ${bodyText}`,
    );
  }

  return parsed as ZoToolResult;
}

export function formatToolResult(result: ZoToolResult): string {
  if (!result.success) {
    const err =
      typeof result.error === "string"
        ? result.error
        : JSON.stringify(result.error ?? result);
    throw new Error(err || "Tool call failed");
  }

  if (typeof result.result === "string") {
    return result.result;
  }

  return JSON.stringify(result.result, null, 2);
}
