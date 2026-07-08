# zo-mcp

Text and email yourself from terminal agents on your [Zo Computer](https://zo.computer).

If you're running Claude Code, Cursor, or another MCP client **inside your Zo**, it can do great work — but it can't ping you when something finishes. Zo chat can text you because it has `send_sms_to_user`. This gives your terminal agents the same hook, without calling `/zo/ask` or spinning up another Zo session.

Under the hood it hits Zo's internal tool route:

```
POST https://api.zo.computer/zo/tools/send_sms_to_user/run
```

Same path Zo uses. No LLM in the middle.

## Not the same as the official Zo MCP

Zo also ships a [full MCP server](https://www.zo.computer/docs/mcp-server) at `https://api.zo.computer/mcp` with every tool (files, calendar, web, etc.). That's HTTP transport + an access token from Settings.

**zo-mcp** is narrower on purpose:

- stdio MCP (works with Claude Code, Cursor, Codex, etc.)
- only messaging: `send_sms_to_user`, `send_email_to_user`
- meant for agents **on your Zo box**, using `ZO_CLIENT_IDENTITY_TOKEN` that's already in the environment
- no `/zo/ask` — just direct tool execution

Use the official MCP if you want the whole kitchen. Use this if you want terminal agents to text you.

## Install

```bash
npm install -g zo-mcp
```

Or run without installing:

```bash
npx zo-mcp
```

From source:

```bash
git clone https://github.com/vihaanshahh/zo-mcp.git
cd zo-mcp
npm install && npm run build
```

## Auth

On your Zo, `ZO_CLIENT_IDENTITY_TOKEN` is already set. Nothing to configure.

If you're calling from somewhere else (or testing manually), set one of:

| Variable | Where |
|---|---|
| `ZO_CLIENT_IDENTITY_TOKEN` | Auto-set on your Zo |
| `ZO_ACCESS_TOKEN` | [Settings → Advanced → Access Tokens](https://zo.computer/?t=settings&s=advanced) |
| `ZO_API_KEY` | Same token, alternate name some scripts use |

## MCP setup

### Cursor / Claude Code (`.mcp.json`)

```json
{
  "mcpServers": {
    "zo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "zo-mcp"]
    }
  }
}
```

If you installed globally, `"command": "zo-mcp"` works too.

### Claude Code CLI

```bash
claude mcp add zo -- npx -y zo-mcp
```

Reload MCP after adding. Your agent gets `send_sms_to_user` and `send_email_to_user`.

## CLI

Quick text from a shell script or cron job:

```bash
zo-text "deploy finished, branch is ready for review"
```

Same internal route as the MCP tool.

## Tools

### `send_sms_to_user`

| Field | Required | Notes |
|---|---|---|
| `message` | yes | Keep under ~160 words (Zo enforces SMS limits) |
| `contact_name` | no | Registered contact; omit to text yourself |
| `media_files` | no | Absolute paths for MMS attachments |

### `send_email_to_user`

| Field | Required | Notes |
|---|---|---|
| `subject` | yes | |
| `markdown_body` | yes | Markdown body |
| `attachments` | no | Absolute paths, 10MB total max |

## How it works

1. MCP client calls `send_sms_to_user` over stdio
2. zo-mcp POSTs to `/zo/tools/{tool}/run` with `{"args": {...}}`
3. Zo platform sends the SMS through whatever channel you already have wired up

Tool schemas are documented at [zo.computer/docs/tools](https://www.zo.computer/docs/tools/send-sms-to-user).

## Development

```bash
npm install
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node dist/index.js
```

## License

MIT
