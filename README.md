# zo-mcp

**Internal MCP for terminal agents on your Zo Computer.**

Claude Code, Cursor, Codex, and other stdio MCP clients running **inside your Zo** get the same tools Zo chat has — files, shell, web, calendar, SMS, email, images, agents, the lot. No `/zo/ask` session. No access token from Settings. Just direct tool calls over the in-box identity token you already have.

This is the stdio counterpart to Zo's [official HTTP MCP](https://www.zo.computer/docs/mcp-server). Same tool names, same schemas, same backend. Different transport, and only works on your Zo.

## Why this exists

Zo chat can text you, read your files, hit Gmail, run bash. Terminal agents on the same box couldn't — they're stuck in a TTY with no bridge to Zo's tool layer.

Official Zo MCP fixes that from **outside** the box (HTTP + `zo_sk_` access token). **zo-mcp** fixes it from **inside** the box (stdio + `ZO_CLIENT_IDENTITY_TOKEN`).

## Requirements

- You must be on a Zo Computer (SSH session, Cursor on the box, Claude Code in the workspace, etc.)
- `ZO_CLIENT_IDENTITY_TOKEN` must be set — it is automatically on every Zo

If that env var isn't there, zo-mcp exits. It does not work from your laptop, CI, or anywhere off-box.

## Install on your Zo

Clone into your workspace (or anywhere on the box):

```bash
git clone https://github.com/vihaanshahh/zo-mcp.git
cd zo-mcp
npm install
```

Or one-shot via npx (still runs on the Zo — npx just fetches the package):

```bash
npx github:vihaanshahh/zo-mcp
```

## MCP setup

### Cursor / Claude Code (`.mcp.json`)

```json
{
  "mcpServers": {
    "zo": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/workspace/zo-mcp/dist/index.js"]
    }
  }
}
```

Adjust the path to wherever you cloned it. After `npm install`, `dist/` is built automatically.

### Claude Code CLI

```bash
claude mcp add zo -- node /home/workspace/zo-mcp/dist/index.js
```

Reload MCP. You should see ~80 tools — same catalog as `GET /zo/tools`.

## Tools

The server mirrors Zo's live tool catalog:

```
GET  https://api.zo.computer/zo/tools
POST https://api.zo.computer/zo/tools/{name}/run
```

Categories include:

- **Files** — `read_file`, `write_file`, `edit_file`, `grep_search`, …
- **Shell** — `bash`, …
- **Web** — `web_search`, `read_webpage`, …
- **Comms** — `send_sms_to_user`, `send_email_to_user`
- **Apps** — Google Calendar, Gmail, Linear, Spotify, …
- **Media** — `generate_image`, `transcribe_audio`, …
- **Automation** — `create_agent`, `list_agents`, …

Tool list refreshes on each `tools/list` call. Per-tool docs: [zo.computer/docs/tools](https://www.zo.computer/docs/tools/send-sms-to-user).

## CLI shortcut

Text yourself from a shell script without MCP:

```bash
zo-text "build finished on branch feature-x"
```

Wraps `send_sms_to_user` on the same internal route.

## vs official Zo MCP

| | **zo-mcp** (this) | **Official Zo MCP** |
|---|---|---|
| Where it runs | On your Zo only | Anywhere with network |
| Transport | stdio | HTTP |
| Auth | `ZO_CLIENT_IDENTITY_TOKEN` (automatic) | `zo_sk_` access token from Settings |
| Tool set | Full catalog via `/zo/tools` | Full catalog via `/mcp` |
| Use case | Terminal agents on the box | External clients, mcporter, OpenClaw bridge |

Use both if you want. They hit the same tools.

## Development

```bash
npm install
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js 2>/dev/null | head -c 500
```

## License

MIT
