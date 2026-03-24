# openclaw-bridge

## Install

```bash
# Install from GitHub
npm install -g github:Codename-11/openclaw-bridge

# Run setup wizard
openclaw-bridge setup

# Update to latest
npm install -g github:Codename-11/openclaw-bridge
```

When published to npm (coming soon):
```bash
npm install -g openclaw-bridge
```

**openclaw-bridge** is a modular CLI package that bridges Claude Code and OpenClaw AI agents. It absorbs the functionality of `openclaw-mcp` and extends it with a full module architecture — MCP tools for querying agents from Claude Code, Discord integration, notifications, project memory, steering, and an HTTP bridge for pushing messages into Claude Code sessions from agent code.

## Dev Setup (contributors)

```bash
git clone https://github.com/Codename-11/openclaw-bridge
cd openclaw-bridge
npm install
npm run build
```

## Modules

| Module | Description |
|--------|-------------|
| **mcp** | MCP stdio server — exposes all tools to Claude Code |
| **bridge** | HTTP server (port 9999) — wraps Claude Code SDK session, lets agents send messages into CC |
| **relay** | Placeholder for future Voxel device relay (not implemented) |

## Feature Matrix

| Feature | MCP only | MCP + Bridge |
|---------|----------|-------------|
| CC asks agents questions | ✅ | ✅ |
| CC reads Discord messages | ✅ | ✅ |
| CC posts to Discord | ✅ | ✅ |
| CC sends notifications | ✅ | ✅ |
| CC reads/writes project memory | ✅ | ✅ |
| CC checks steering directions | ✅ | ✅ |
| CC announces status | ✅ | ✅ |
| Daemon pushes messages to CC | ❌ | ✅ |
| Daemon steers CC in real-time | ❌ | ✅ |

**MCP tools work without the bridge.** Start the bridge only when you want agents to push messages to CC.

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

## MCP Tools Reference

### Core Agent Tools

#### `ask_agent`
Send a message to an OpenClaw agent and get their response.
```
Parameters:
  agent   (required) — "daemon" | "soren" | "ash" | "mira" | "jace" | "pip"
  message (required) — The message or question to send

Example:
  ask_agent(agent="daemon", message="What's the current priority?")
```

#### `list_agents`
List all available agents registered with the gateway. No parameters.

#### `agent_status`
Check a specific agent's status.
```
Parameters:
  agent (required) — Agent name to check

Example:
  agent_status(agent="ash")
```

---

### Discord Tools

#### `discord_recent`
Read recent messages from a Discord channel via Daemon.
```
Parameters:
  channel (optional) — Channel name, default: "ai"
  limit   (optional) — Number of messages, default: 10

Example:
  discord_recent(channel="dev", limit=20)
  → [2026-03-24T10:00:00Z] daemon: Check in on the auth feature
  → [2026-03-24T10:01:00Z] ash: On it, working through the JWT refresh logic
```

#### `discord_send`
Send a message to a Discord channel via Daemon.
```
Parameters:
  channel (optional) — Channel name, default: "ai"
  message (required) — Message text to send

Example:
  discord_send(channel="ai", message="Just pushed the auth refactor to main")
```

---

### Notification Tool

#### `notify`
Send a notification to Bailey's Discord DMs.
```
Parameters:
  message (required) — The notification text
  urgent  (optional) — Boolean, default: false

Formats:
  🔔 [CC] {message}        — standard
  🚨 [CC] {message}        — when urgent=true

Examples:
  notify(message="Build complete — all 47 tests pass ✅")
  notify(message="TypeScript errors blocking build in src/auth.ts", urgent=true)
```

---

### Steering Tool

#### `check_steering`
Check for pending directions from Daemon. Reads `~/.openclaw-bridge/steering.json` and clears messages after reading.
```
Parameters: none

Example:
  check_steering()
  → Pending steering messages:
  → [2026-03-24T09:55:00Z] daemon: Switch focus to the payment module after auth
```

**Steering file format** (`~/.openclaw-bridge/steering.json`):
```json
{
  "messages": [
    {
      "from": "daemon",
      "text": "Focus on payment module after auth is done",
      "timestamp": "2026-03-24T09:55:00.000Z"
    }
  ]
}
```

Daemon or any script can write to this file to guide Claude Code's work without interrupting the session.

---

### Project Memory Tools

#### `project_memory_read`
Read shared project decisions and context from `.openclaw-bridge/memory.json` in the current directory.
```
Parameters:
  key (optional) — Specific key to read; omit to read all

Examples:
  project_memory_read()
  → [2026-03-24T10:00:00Z] decision:auth: Using JWT refresh tokens, 7-day expiry
  → [2026-03-24T10:05:00Z] current_task: Implementing payment flow

  project_memory_read(key="decision:auth")
  → [2026-03-24T10:00:00Z] decision:auth: Using JWT refresh tokens, 7-day expiry
```

#### `project_memory_write`
Write a key/value entry to `.openclaw-bridge/memory.json`. Appends with timestamp.
```
Parameters:
  key   (required) — Memory key
  value (required) — Memory value

Examples:
  project_memory_write(key="decision:db", value="Postgres 16 with Drizzle ORM")
  project_memory_write(key="current_task", value="Auth module — JWT refresh tokens")
```

**Memory file format** (`.openclaw-bridge/memory.json` in project root):
```json
[
  { "key": "decision:auth", "value": "JWT refresh tokens, 7-day expiry", "timestamp": "2026-03-24T10:00:00.000Z" },
  { "key": "current_task", "value": "Payment flow", "timestamp": "2026-03-24T10:05:00.000Z" }
]
```

---

### Announce Tool

#### `announce`
Post a formatted status update to Discord.
```
Parameters:
  status  (required) — Status message
  channel (optional) — Target channel, default: "ai"

Posts as: ⚡ [Claude Code] {status}

Examples:
  announce(status="Starting auth module refactor")
  announce(status="Auth complete — all tests pass ✅", channel="dev")
  announce(status="Build failed: missing env vars in CI", channel="alerts")
```

---

## PostToolUse Hook (Formatted Output)

The `hooks/post-tool-use.js` script formats output from openclaw-bridge tools into readable boxes in the Claude Code UI.

### Setup

Add to your project's `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "mcp__openclaw__*",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/openclaw-bridge/hooks/post-tool-use.js"
          }
        ]
      }
    ]
  }
}
```

Or if installed locally in the project:
```json
"command": "node node_modules/openclaw-bridge/hooks/post-tool-use.js"
```

### Output format
```
┌─ 🔗 💬 Discord Messages ──────────────────────────┐
│ [10:01] daemon: What's the status on auth?         │
│ [10:02] ash: JWT refresh is done, testing now      │
│ [10:05] soren: Looks good, merge when ready        │
└────────────────────────────────────────────────────┘
```

---

## Example Workflows

### Starting a new Claude Code session on a project

```
1. check_steering()          → apply any pending Daemon directions
2. project_memory_read()     → load decisions and context
3. discord_recent()          → catch up on team channel
4. announce(status="Starting work on [feature]")
```

### Completing a task

```
1. project_memory_write(key="completed", value="Auth module — JWT refresh tokens")
2. announce(status="Auth module complete ✅ — pushed to main")
3. notify(message="Auth done. Ready for review.")
```

### Escalating a blocker

```
notify(message="Blocked: cannot reproduce the payment webhook in local dev. Need help.", urgent=true)
```

### Leaving context for next session

```
project_memory_write(key="next_session", value="Pick up at payment webhook — see PR #42 for context")
project_memory_write(key="decision:payment", value="Using Stripe webhooks with idempotency keys")
announce(status="Ending session — context saved in project memory")
```

---

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
├── hooks/
│   └── post-tool-use.js        ← PostToolUse hook for formatted output
├── src/
│   ├── core/
│   │   ├── config.ts           ← Config loader + env overrides
│   │   ├── gateway.ts          ← OpenClaw gateway client
│   │   └── logger.ts           ← Structured stderr logging
│   ├── modules/
│   │   ├── mcp/                ← MCP stdio server + all tools
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

## Steering Mechanism

The steering system allows Daemon (or any external process) to leave directions for the next Claude Code session without interrupting ongoing work.

**Writing steering messages:**
```bash
# From a shell script or Daemon
cat > ~/.openclaw-bridge/steering.json << 'EOF'
{
  "messages": [
    {
      "from": "daemon",
      "text": "Prioritize the payment module next — client deadline moved up",
      "timestamp": "2026-03-24T10:00:00.000Z"
    }
  ]
}
EOF
```

**Reading in Claude Code:**
```
check_steering()
→ Pending steering messages:
→ [2026-03-24T10:00:00Z] daemon: Prioritize the payment module next — client deadline moved up
```

Messages are cleared after reading. Each `check_steering` call is a one-time delivery.

## Uninstall

```bash
# Remove MCP from Claude Code
claude mcp remove openclaw

# Remove package
npm uninstall -g openclaw-bridge

# Remove config + data
rm -rf ~/.openclaw-bridge          # macOS/Linux
rmdir /s /q %USERPROFILE%\.openclaw-bridge   # Windows

# Remove project memory (optional, per-project)
rm .openclaw-bridge/memory.json
```

## License

MIT
