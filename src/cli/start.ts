import { loadConfig } from '../core/config.js'
import { createLogger } from '../core/logger.js'
import type { BridgeModule } from '../types.js'

const logger = createLogger('start')

type ModuleName = 'mcp' | 'bridge' | 'relay'

async function loadModule(name: ModuleName): Promise<BridgeModule> {
  switch (name) {
    case 'mcp': {
      const { McpModule } = await import('../modules/mcp/index.js')
      return new McpModule()
    }
    case 'bridge': {
      const { BridgeModuleImpl } = await import('../modules/bridge/index.js')
      return new BridgeModuleImpl()
    }
    case 'relay': {
      const { RelayModule } = await import('../modules/relay/index.js')
      return new RelayModule()
    }
    default:
      throw new Error(`Unknown module: ${name}`)
  }
}

export async function runStart(args: string[]): Promise<void> {
  const config = loadConfig()

  let moduleNames: ModuleName[] = []

  if (args.includes('--all')) {
    // Start all enabled modules
    if (config.modules.mcp.enabled) moduleNames.push('mcp')
    if (config.modules.bridge.enabled) moduleNames.push('bridge')
    if (config.modules.relay.enabled) moduleNames.push('relay')
  } else if (args.length > 0) {
    // Specific modules requested
    for (const arg of args) {
      if (!['mcp', 'bridge', 'relay'].includes(arg)) {
        console.error(`Unknown module: ${arg}`)
        process.exit(1)
      }
      moduleNames.push(arg as ModuleName)
    }
  } else {
    // Default: start all enabled
    if (config.modules.mcp.enabled) moduleNames.push('mcp')
    if (config.modules.bridge.enabled) moduleNames.push('bridge')
    if (config.modules.relay.enabled) moduleNames.push('relay')
  }

  if (moduleNames.length === 0) {
    console.error('No modules enabled. Run: openclaw-bridge setup')
    process.exit(1)
  }

  const modules: BridgeModule[] = []

  for (const name of moduleNames) {
    const mod = await loadModule(name)
    await mod.init(config)
    modules.push(mod)
  }

  // Handle shutdown
  const shutdown = async () => {
    logger.info('Shutting down...')
    for (const mod of modules) {
      try {
        await mod.stop()
      } catch (err) {
        logger.error(`Error stopping ${mod.name}: ${err}`)
      }
    }
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  // Start modules (note: MCP start() blocks on stdio, so run them in sequence)
  // For non-blocking modules, start concurrently; for MCP, it must be last if alone
  const nonMcp = modules.filter((m) => m.name !== 'mcp')
  const mcpMod = modules.find((m) => m.name === 'mcp')

  for (const mod of nonMcp) {
    await mod.start()
  }

  if (mcpMod) {
    await mcpMod.start() // blocks
  } else {
    // Keep alive
    await new Promise<void>(() => { /* intentionally never resolves */ })
  }
}
