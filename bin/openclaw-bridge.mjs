#!/usr/bin/env node

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'))

const args = process.argv.slice(2)
const command = args[0]
const rest = args.slice(1)

const USAGE = `
openclaw-bridge v${pkg.version}

Usage:
  openclaw-bridge setup              Interactive setup wizard
  openclaw-bridge start [modules..]  Start modules (mcp, bridge, relay)
  openclaw-bridge start --all        Start all enabled modules
  openclaw-bridge mcp                Direct MCP stdio mode (for Claude Code)
  openclaw-bridge status             Health check
  openclaw-bridge --help             Show this help
  openclaw-bridge --version          Show version

Examples:
  openclaw-bridge setup
  openclaw-bridge start mcp
  openclaw-bridge start mcp bridge
  openclaw-bridge start --all
  openclaw-bridge mcp
  openclaw-bridge status
`

async function main() {
  switch (command) {
    case 'setup': {
      const { runSetup } = await import('../dist/cli/setup.js')
      await runSetup()
      break
    }

    case 'start': {
      const { runStart } = await import('../dist/cli/start.js')
      await runStart(rest)
      break
    }

    case 'mcp': {
      // Direct MCP stdio mode — only loads MCP module, no HTTP, no bridge
      const { loadConfig } = await import('../dist/core/config.js')
      const { McpModule } = await import('../dist/modules/mcp/index.js')
      const config = loadConfig()
      const mod = new McpModule()
      await mod.init(config)
      await mod.start()
      break
    }

    case 'status': {
      const { runStatus } = await import('../dist/cli/status.js')
      await runStatus()
      break
    }

    case '--version':
    case '-v':
      console.log(pkg.version)
      break

    case '--help':
    case '-h':
    case undefined:
      console.log(USAGE)
      break

    default:
      console.error(`Unknown command: ${command}`)
      console.log(USAGE)
      process.exit(1)
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`)
  process.exit(1)
})
