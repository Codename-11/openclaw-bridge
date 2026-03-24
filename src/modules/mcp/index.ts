import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import type { Config } from '../../core/config.js'
import { GatewayClient } from '../../core/gateway.js'
import { createLogger } from '../../core/logger.js'
import { TOOL_DEFINITIONS, buildToolHandlers } from './tools.js'
import type { BridgeModule } from '../../types.js'

const logger = createLogger('mcp')

export class McpModule implements BridgeModule {
  name = 'mcp'
  description = 'MCP stdio server exposing OpenClaw agents as Claude Code tools'

  private config!: Config
  private gateway!: GatewayClient
  private server!: Server

  async init(config: Config): Promise<void> {
    this.config = config
    this.gateway = new GatewayClient(config.gateway)

    if (!config.gateway.token) {
      logger.warn('OPENCLAW_GATEWAY_TOKEN is not set — requests will likely fail')
    }

    this.server = new Server(
      { name: 'openclaw-bridge', version: '0.1.0' },
      { capabilities: { tools: {} } }
    )

    const handlers = buildToolHandlers(this.gateway)

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOL_DEFINITIONS,
    }))

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params
      const handlerMap = handlers as Record<
        string,
        (a: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }>
      >
      const handler = handlerMap[name]
      if (!handler) {
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        }
      }
      try {
        return await handler(args ?? {})
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return {
          content: [{ type: 'text', text: `Unexpected error: ${msg}` }],
          isError: true,
        }
      }
    })
  }

  async start(): Promise<void> {
    logger.info(`Starting MCP stdio server (gateway: ${this.config.gateway.url})`)
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    logger.info('MCP server connected and ready')
  }

  async stop(): Promise<void> {
    logger.info('MCP module stopped')
  }

  health(): { ok: boolean; details: string } {
    return { ok: true, details: 'MCP stdio server running' }
  }
}

// Allow direct execution: node dist/modules/mcp/index.js
// This is the entrypoint used when running standalone MCP mode
if (process.argv[1] && (process.argv[1].endsWith('mcp/index.js') || process.argv[1].endsWith('mcp\\index.js'))) {
  ;(async () => {
    const { loadConfig } = await import('../../core/config.js')
    const config = loadConfig()
    const mod = new McpModule()
    await mod.init(config)
    await mod.start()
  })().catch((err) => {
    process.stderr.write(`Fatal: ${err}\n`)
    process.exit(1)
  })
}
