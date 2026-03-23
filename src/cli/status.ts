import { loadConfig } from '../core/config.js'
import { GatewayClient } from '../core/gateway.js'

export async function runStatus(): Promise<void> {
  const config = loadConfig()

  console.log('\n📊 openclaw-bridge status\n')

  // Gateway health
  const gateway = new GatewayClient(config.gateway)
  process.stdout.write(`  Gateway (${config.gateway.url})... `)
  const healthy = await gateway.healthCheck()
  console.log(healthy ? '✅ reachable' : '❌ unreachable')

  // Module status (config-level)
  console.log('\n  Modules (from config):')
  const mods = config.modules
  console.log(`    mcp:    ${mods.mcp.enabled ? '✅ enabled' : '⚪ disabled'}`)
  console.log(
    `    bridge: ${mods.bridge.enabled ? `✅ enabled (port ${mods.bridge.port})` : '⚪ disabled'}`
  )
  console.log(`    relay:  ${mods.relay.enabled ? '✅ enabled' : '⚪ disabled'}`)

  if (healthy) {
    try {
      const agents = await gateway.listAgents()
      console.log(`\n  Agents available: ${agents.length}`)
      for (const a of agents) {
        console.log(`    - ${a.name}`)
      }
    } catch {
      console.log('\n  Could not list agents')
    }
  }

  console.log()
}
