# openclaw-bridge — Developer Guide

## Project Structure

```
src/
├── core/
│   ├── config.ts     Config loader — reads ~/.openclaw-bridge/config.json + env overrides
│   ├── gateway.ts    OpenClaw gateway HTTP client (askAgent, listAgents, healthCheck)
│   └── logger.ts     Structured stderr logger with module namespacing
├── modules/
│   ├── mcp/
│   │   ├── index.ts  McpModule — implements BridgeModule, runs MCP stdio server
│   │   └── tools.ts  Tool definitions + handler factories for ask_agent, list_agents, agent_status
│   ├── bridge/
│   │   ├── index.ts  BridgeModuleImpl — implements BridgeModule
│   │   ├── session.ts CCSession — lazy-loads @anthropic-ai/claude-code SDK
│   │   └── listener.ts BridgeListener — HTTP server for incoming messages
│   └── relay/
│       └── index.ts  RelayModule — placeholder, no-op
├── cli/
│   ├── setup.ts      Interactive setup wizard (readline, no deps)
│   ├── start.ts      Module loader + lifecycle orchestration
│   └── status.ts     Gateway + config health check
├── types.ts          BridgeModule interface (shared type to avoid circular imports)
└── index.ts          Programmatic exports
bin/
└── openclaw-bridge.mjs  CLI router (ESM, routes subcommands to dist/)
```

## BridgeModule Interface

Every module in `src/modules/` must implement:

```typescript
export interface BridgeModule {
  name: string
  description: string
  init(config: Config): Promise<void>   // Called once with loaded config
  start(): Promise<void>                 // Begin operation (may block for MCP)
  stop(): Promise<void>                  // Graceful shutdown
  health(): { ok: boolean; details: string }
}
```

## Adding a New Module

1. Create `src/modules/<name>/index.ts`
2. Export a class implementing `BridgeModule` (import from `../../types.js`)
3. Add to `loadModule()` in `src/cli/start.ts`
4. Add config shape to `src/core/config.ts` if needed
5. Export from `src/index.ts`

## Build & Test

```bash
npm install
npm run build        # tsc → dist/
npm run dev          # tsx src/index.ts (no build step)
```

Test MCP mode directly:
```bash
OPENCLAW_GATEWAY_URL=http://localhost:18789 \
OPENCLAW_GATEWAY_TOKEN=your-token \
node dist/modules/mcp/index.js
```

Test via CLI:
```bash
node bin/openclaw-bridge.mjs status
node bin/openclaw-bridge.mjs mcp
```

## Key Design Notes

- **Circular import avoidance**: `BridgeModule` interface lives in `src/types.ts`, not `src/index.ts`. Modules import from `../../types.js`.
- **MCP blocks**: `McpModule.start()` connects to stdio transport and never resolves — always run it last (or alone).
- **Bridge SDK is optional**: `@anthropic-ai/claude-code` is an `optionalDependency`. `session.ts` lazy-imports it and degrades gracefully if absent.
- **All imports use `.js` extension**: Required for NodeNext module resolution even for `.ts` source files.
- **Env vars override config**: `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` always take precedence over the config file.

## Gateway Session Key

Requests to the gateway use `x-openclaw-session-key: agent:{agent}:bridge`. MCP used `:mcp` suffix in the original; bridge uses `:bridge`. This differentiates traffic sources in the gateway logs.
