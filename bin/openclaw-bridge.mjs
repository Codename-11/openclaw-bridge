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
  openclaw-bridge update             Pull latest from GitHub
  openclaw-bridge doctor             Diagnose common issues
  openclaw-bridge --help             Show this help
  openclaw-bridge --version          Show version

Examples:
  openclaw-bridge setup
  openclaw-bridge start mcp
  openclaw-bridge start bridge
  openclaw-bridge update
  openclaw-bridge doctor
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

    case 'update': {
      const { execSync } = await import('child_process')
      const appDir = join(dirname(__dirname))
      console.log('Updating openclaw-bridge...')
      try {
        execSync('git pull --quiet', { cwd: appDir, stdio: 'inherit' })
        console.log('✅ Updated to latest')
      } catch {
        console.error('❌ Update failed. Run manually: cd ~/.openclaw-bridge/app && git pull')
      }
      break
    }

    case 'doctor': {
      console.log(`\n🩺 openclaw-bridge doctor v${pkg.version}\n`)

      // Check Node version
      const nodeVer = process.version
      const major = parseInt(nodeVer.slice(1))
      console.log(`  Node.js:    ${nodeVer} ${major >= 18 ? '✅' : '❌ requires 18+'}`)

      // Check config
      const { loadConfig, getConfigPath } = await import('../dist/core/config.js')
      const config = loadConfig()
      const configPath = getConfigPath()
      const { existsSync } = await import('fs')
      console.log(`  Config:     ${existsSync(configPath) ? '✅ ' + configPath : '❌ not found — run: openclaw-bridge setup'}`)

      // Check gateway
      console.log(`  Gateway:    ${config.gateway.url}`)
      console.log(`  Token:      ${config.gateway.token ? '✅ set' : '❌ not set'}`)

      // Test gateway connectivity
      try {
        const resp = await fetch(`${config.gateway.url}/v1/models`, {
          headers: { 'Authorization': `Bearer ${config.gateway.token}` },
          signal: AbortSignal.timeout(5000),
        })
        console.log(`  Connection: ${resp.ok ? '✅ gateway reachable' : `❌ HTTP ${resp.status}`}`)
      } catch (err) {
        console.log(`  Connection: ❌ cannot reach gateway (${err.message})`)
      }

      // Check MCP registration
      try {
        const { execSync: exec2 } = await import('child_process')
        const mcpList = exec2('claude mcp list', { encoding: 'utf-8', timeout: 5000 }).toString()
        const hasOpenclaw = mcpList.includes('openclaw')
        console.log(`  MCP:        ${hasOpenclaw ? '✅ registered with Claude Code' : '❌ not registered — run: claude mcp add --scope user openclaw -- openclaw-bridge-mcp'}`)
      } catch {
        console.log(`  MCP:        ⚠️  could not check (claude CLI not found?)`)
      }

      // Check bridge
      try {
        const resp = await fetch(`http://localhost:${config.modules.bridge.port}/health`, {
          signal: AbortSignal.timeout(2000),
        })
        console.log(`  Bridge:     ${resp.ok ? `✅ running on port ${config.modules.bridge.port}` : '❌ not responding'}`)
      } catch {
        console.log(`  Bridge:     ⚠️  not running (optional — start with: openclaw-bridge start bridge)`)
      }

      // Check modules
      console.log(`\n  Modules:`)
      console.log(`    MCP:      ${config.modules.mcp.enabled ? '✅ enabled' : '❌ disabled'}`)
      console.log(`    Bridge:   ${config.modules.bridge.enabled ? `✅ enabled (port ${config.modules.bridge.port})` : '❌ disabled'}`)
      console.log(`    Relay:    ${config.modules.relay.enabled ? '✅ enabled' : '⬜ disabled (placeholder)'}`)
      console.log('')
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
