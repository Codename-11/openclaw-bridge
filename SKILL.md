---
name: openclaw-bridge
description: "Bridge for Claude Code ↔ OpenClaw agent communication. MCP tools let Claude Code ask agents questions. Bridge module lets agents push messages to Claude Code sessions."
---

# openclaw-bridge Skill

## When to use this skill

Reference this skill when you need to:
- Ask a question to another OpenClaw agent from within Claude Code (use the `ask_agent` MCP tool)
- Check which agents are online (`list_agents`)
- Check a specific agent's status (`agent_status`)
- Send a message into an active Claude Code session from agent code (use the bridge HTTP API)

## MCP Tools (available in Claude Code)

Once the MCP server is registered (`claude mcp add openclaw -- npx openclaw-bridge mcp`), Claude Code gains:

### `ask_agent`
Send a message to an OpenClaw agent and get their response.
```
agent: "daemon" | "soren" | "ash" | "mira" | "jace" | "pip"
message: "Your question or task"
```

### `list_agents`
Returns all available agents registered with the gateway.

### `agent_status`
Check whether a specific agent is active.
```
agent: "ash"
```

## Bridge HTTP API (agent → Claude Code)

If the bridge module is running (port 9999), agents can push messages to a Claude Code session:

```
POST http://localhost:9999/message
{ "message": "Review this PR diff", "from": "daemon" }
→ { "response": "..." }

POST http://localhost:9999/session
{ "project": "/path/to/project" }
→ Creates a new CC session

GET http://localhost:9999/status
→ Session info
```

## Setup

```bash
npx openclaw-bridge setup      # Interactive wizard
npx openclaw-bridge start mcp  # Start MCP server
npx openclaw-bridge status     # Health check
```

Config lives at `~/.openclaw-bridge/config.json`.
Env vars: `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_TOKEN`.
