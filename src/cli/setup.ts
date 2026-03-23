import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { loadConfig, saveConfig, getConfigPath } from '../core/config.js'
import type { Config } from '../core/config.js'

function ask(rl: ReturnType<typeof createInterface>, question: string, defaultVal?: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim() || defaultVal || '')
    })
  })
}

export async function runSetup(): Promise<void> {
  console.log('\n🔩 openclaw-bridge setup wizard\n')

  const existing = loadConfig()

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const gatewayUrl = await ask(
    rl,
    `Gateway URL [${existing.gateway.url}]: `,
    existing.gateway.url
  )

  // Token — no masking, just normal input (masking breaks Windows stdin)
  const tokenPrompt = existing.gateway.token
    ? 'Gateway token [press enter to keep current]: '
    : 'Gateway token (required): '
  const token = await ask(rl, tokenPrompt, existing.gateway.token)

  const mcpInput = await ask(rl, 'Enable MCP module? [Y/n]: ', 'y')
  const mcpEnabled = mcpInput.toLowerCase() !== 'n'

  const bridgeInput = await ask(rl, 'Enable Bridge module? [y/N]: ', 'n')
  const bridgeEnabled = bridgeInput.toLowerCase() === 'y'

  let bridgePort = existing.modules.bridge.port
  let defaultProject = existing.modules.bridge.defaultProject

  if (bridgeEnabled) {
    const portInput = await ask(rl, `Bridge port [${bridgePort}]: `, String(bridgePort))
    bridgePort = parseInt(portInput, 10) || bridgePort

    const projectInput = await ask(rl, `Default project directory [${defaultProject || 'none'}]: `, defaultProject)
    defaultProject = projectInput
  }

  rl.close()

  const config: Config = {
    gateway: { url: gatewayUrl, token },
    modules: {
      mcp: { enabled: mcpEnabled },
      bridge: { enabled: bridgeEnabled, port: bridgePort, defaultProject },
      relay: { enabled: false },
    },
  }

  saveConfig(config)
  console.log(`\n✅ Config saved to ${getConfigPath()}`)

  // Offer Claude Code MCP registration
  const rl2 = createInterface({ input: process.stdin, output: process.stdout })
  const addMcp = await ask(rl2, '\nAdd MCP server to Claude Code? [Y/n]: ', 'y')
  rl2.close()

  if (addMcp.toLowerCase() !== 'n') {
    try {
      const envArgs = `--env OPENCLAW_GATEWAY_URL=${gatewayUrl} --env OPENCLAW_GATEWAY_TOKEN=${token}`
      execSync(`claude mcp add openclaw ${envArgs} -- npx openclaw-bridge mcp`, {
        stdio: 'inherit',
      })
      console.log('✅ MCP server added to Claude Code')
    } catch {
      console.log('⚠️  Could not auto-add. Run manually:')
      console.log(`   claude mcp add openclaw --env OPENCLAW_GATEWAY_URL=${gatewayUrl} --env OPENCLAW_GATEWAY_TOKEN=${token} -- npx openclaw-bridge mcp`)
    }
  }

  console.log('\n📋 Summary:')
  console.log(`  Gateway:  ${gatewayUrl}`)
  console.log(`  Token:    ${token ? '***set***' : 'NOT SET'}`)
  console.log(`  MCP:      ${mcpEnabled ? '✅ enabled' : '❌ disabled'}`)
  console.log(`  Bridge:   ${bridgeEnabled ? `✅ port ${bridgePort}` : '❌ disabled'}`)
  console.log('\nRun: openclaw-bridge start mcp')
  console.log('     openclaw-bridge status\n')
}
