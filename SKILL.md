---
name: openclaw-bridge
description: "Bridge for Claude Code ↔ OpenClaw agent communication. MCP tools let Claude Code ask agents questions, read/send Discord messages, send notifications, check steering, manage project memory, and announce status."
---

# openclaw-bridge Skill

## When to use this skill

Reference this skill when you need to:
- Ask a question to another OpenClaw agent from within Claude Code (`ask_agent`)
- Check which agents are online (`list_agents`)
- Check a specific agent's status (`agent_status`)
- Read recent Discord channel messages (`discord_recent`)
- Send a message to a Discord channel (`discord_send`)
- Notify Bailey of something important (`notify`)
- Check for pending directions from Daemon (`check_steering`)
- Read or write shared project decisions/context (`project_memory_read`, `project_memory_write`)
- Announce progress or completion status to Discord (`announce`)
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

### `discord_recent`
Read recent messages from a Discord channel via Daemon.
```
channel: "ai"        # optional, defaults to "ai"
limit: 10            # optional, defaults to 10
```
Returns formatted messages as `[timestamp] sender: message`.

### `discord_send`
Send a message to a Discord channel via Daemon.
```
channel: "ai"        # optional, defaults to "ai"
message: "Hello from Claude Code!"
```

### `notify`
Send a notification to Bailey's Discord DMs.
```
message: "Build complete for feature X"
urgent: false        # optional — if true, uses 🚨 prefix
```
Posts as: `🔔 [CC] {message}` or `🚨 [CC] {message}` if urgent.

### `check_steering`
Check for pending steering messages from Daemon. Reads from `~/.openclaw-bridge/steering.json` and clears after reading.
```
# no params
```
Returns pending messages or "No pending steering messages."

**Steering file format** (written by Daemon or scripts):
```json
{
  "messages": [
    { "from": "daemon", "text": "Focus on the auth module next", "timestamp": "2026-03-24T10:00:00Z" }
  ]
}
```

### `project_memory_read`
Read shared project memory from `.openclaw-bridge/memory.json` in the current directory.
```
key: "architecture_decision"   # optional — reads all if omitted
```
Useful for reading decisions, context, and notes shared across Claude Code sessions.

### `project_memory_write`
Write a key/value entry to `.openclaw-bridge/memory.json` in the current directory. Appends with timestamp.
```
key: "current_task"
value: "Implementing auth flow — JWT refresh tokens"
```

### `announce`
Post a status announcement to a Discord channel.
```
status: "Feature auth complete, tests passing ✅"
channel: "ai"    # optional, defaults to "ai"
```
Posts as: `⚡ [Claude Code] {status}`

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

## Recommended Patterns

**Check steering at session start:**
```
check_steering   → apply any pending directions from Daemon
```

**Save decisions to project memory:**
```
project_memory_write(key="decision:auth", value="Using JWT refresh tokens, 7-day expiry")
```

**Announce completion:**
```
announce(status="Auth module complete — all tests pass ✅")
```

**Notify on critical errors:**
```
notify(message="Build failed: TypeScript errors in src/core/auth.ts", urgent=true)
```
