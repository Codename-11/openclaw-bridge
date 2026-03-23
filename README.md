# openclaw-bridge

**openclaw-bridge** is a modular CLI package that bridges Claude Code and OpenClaw AI agents. It absorbs the functionality of `openclaw-mcp` and extends it with a full module architecture — MCP tools for querying agents from Claude Code, an HTTP bridge for pushing messages into Claude Code sessions from agent code, and a placeholder relay module for future Voxel device support.

## Quick Setup

```bash
git clone https://github.com/Codename-11/openclaw-bridge
cd openclaw-bridge
npm install && npm run build
npx openclaw-bridge setup
```

## Modules

| Module | Description |
|--------|-------------|
| **mcp** | MCP stdio server — exposes `ask_agent`, `list_agents`, `agent_status` tools to Claude Code |
| **bridge** | HTTP server (port 9999) — wraps Claude Code SDK session, lets agents send messages into CC |
| **relay** | Placeholder for future Voxel device relay (not implemented) |

## Claude Code Integration

After running `setup`, the wizard will offer to register the MCP server automatically. Or do it manually:

```bash
claude mcp add openclaw -- npx openclaw-bridge mcp
```

In Claude Code's `settings.json` (if needed manually):
```json
{
  "mcpServers": {
    "openclaw": {
      "command": "npx",
      "args": ["openclaw-bridge", "mcp"]
    }
  }
}
```

Once registered, Claude Code gains access to:
- **`ask_agent`** — Send a message to an OpenClaw agent and get their reply
- **`list_agents`** — List all available agents
- **`agent_status`** — Check a specific agent's status

## CLI Reference

```bash
openclaw-bridge setup              # Interactive setup wizard
openclaw-bridge start mcp          # Start MCP module only
openclaw-bridge start bridge       # Start bridge module only
openclaw-bridge start mcp bridge   # Start both
openclaw-bridge start --all        # Start all enabled modules
openclaw-bridge mcp                # Direct MCP stdio (for Claude Code settings.json)
openclaw-bridge status             # Gateway + module health check
openclaw-bridge --version          # Version
openclaw-bridge --help             # Usage
```

## Config Reference

Config lives at `~/.openclaw-bridge/config.json`:

```json
{
  "gateway": {
    "url": "http://172.16.24.250:18789",
    "token": "your-gateway-token"
  },
  "modules": {
    "mcp": { "enabled": true },
    "bridge": {
      "enabled": false,
      "port": 9999,
      "defaultProject": "/path/to/your/project"
    },
    "relay": { "enabled": false }
  }
}
```

**Environment variable overrides:**
- `OPENCLAW_GATEWAY_URL` — overrides `gateway.url`
- `OPENCLAW_GATEWAY_TOKEN` — overrides `gateway.token`

## Bridge HTTP API

When the bridge module is running (default port 9999):

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Simple health check |
| GET | `/status` | — | Session info |
| POST | `/session` | `{ "project": "/path" }` or `{ "resume": "sessionId" }` | Create or resume CC session |
| POST | `/message` | `{ "message": "...", "from": "daemon" }` | Send to active CC session |

## Architecture

```
openclaw-bridge/
├── bin/
│   └── openclaw-bridge.mjs     ← CLI entry point
├── src/
│   ├── core/
│   │   ├── config.ts           ← Config loader + env overrides
│   │   ├── gateway.ts          ← OpenClaw gateway client
│   │   └── logger.ts           ← Structured stderr logging
│   ├── modules/
│   │   ├── mcp/                ← MCP stdio server
│   │   ├── bridge/             ← CC SDK session + HTTP listener
│   │   └── relay/              ← Placeholder
│   ├── cli/
│   │   ├── setup.ts            ← Interactive setup wizard
│   │   ├── start.ts            ← Module orchestration
│   │   └── status.ts           ← Health check
│   ├── types.ts                ← BridgeModule interface
│   └── index.ts                ← Programmatic API
└── dist/                       ← Compiled output
```

## License

MIT
