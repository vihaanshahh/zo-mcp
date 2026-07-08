#!/usr/bin/env node
import { formatToolResult, runZoTool } from "./zo-tools.js";

async function main(): Promise<void> {
  const message = process.argv.slice(2).join(" ").trim();
  if (!message) {
    process.stderr.write("Usage: zo-text <message>\n");
    process.exit(1);
  }

  const result = formatToolResult(
    await runZoTool("send_sms_to_user", { message }),
  );
  process.stdout.write(`${result}\n`);
}

main().catch((err) => {
  process.stderr.write(`Error: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
