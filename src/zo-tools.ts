const API_BASE = "https://api.zo.computer/zo/tools";

export interface ZoToolResult {
  success: boolean;
  result: unknown;
  error: string | null;
  execution_time_ms?: number;
}

function resolveAuthToken(): string {
  const raw =
    process.env.ZO_CLIENT_IDENTITY_TOKEN ??
    process.env.ZO_ACCESS_TOKEN ??
    process.env.ZO_API_KEY;

  if (!raw?.trim()) {
    throw new Error(
      "Missing auth token. Set ZO_CLIENT_IDENTITY_TOKEN (on your Zo) or ZO_ACCESS_TOKEN / ZO_API_KEY.",
    );
  }

  const token = raw.trim();
  if (/^bearer\s+/i.test(token)) {
    return token;
  }

  // Access tokens from Settings are zo_sk_*; the in-box identity token is a JWT.
  if (token.startsWith("zo_sk_")) {
    return `Bearer ${token}`;
  }

  return token;
}

export async function runZoTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ZoToolResult> {
  const response = await fetch(`${API_BASE}/${toolName}/run`, {
    method: "POST",
    headers: {
      authorization: resolveAuthToken(),
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

  return JSON.stringify(result.result);
}
