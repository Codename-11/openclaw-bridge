import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { loadConfig, saveConfig, getConfigPath } from '../core/config.js'
import type { Config } from '../core/config.js'

const DEFAULT_PORT = 18789

function ask(rl: ReturnType<typeof createInterface>, question: string, defaultVal?: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim() || defaultVal || '')
    })
  })
}

/**
 * Normalize a gateway URL input:
 * - If just an IP/hostname, prepend http:// and append default port
 * - If IP:port, prepend http://
 * - Ensure http(s):// prefix
 */
function normalizeGatewayUrl(input: string): string {
  let url = input.trim()

  // Already has protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Check if port is missing
    try {
      const parsed = new URL(url)
      if (!parsed.port && !url.includes(':' + DEFAULT_PORT)) {
        return `${parsed.protocol}//${parsed.hostname}:${DEFAULT_PORT}`
      }
    } catch {}
    return url
  }

  // Has port (e.g. 172.16.24.250:18789)
  if (/:\d+$/.test(url)) {
    return `http://${url}`
  }

  // Just hostname/IP (e.g. 172.16.24.250)
  return `http://${url}:${DEFAULT_PORT}`
}

export async function runSetup(): Promise<void> {
  console.log('\n🔩 openclaw-bridge setup wizard\n')

  const existing = loadConfig()

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  console.log('  Enter your OpenClaw gateway address.')
  console.log('  Examples: 192.168.1.100, myserver:18789, http://localhost:18789')
  console.log('  Default port 18789 is added automatically if omitted.')
  console.log('')
  const rawUrl = await ask(
    rl,
    `Gateway URL [${existing.gateway.url}]: `,
    existing.gateway.url
  )
  const gatewayUrl = normalizeGatewayUrl(rawUrl)
  console.log(`  → Using: ${gatewayUrl}`)

  console.log('')
  console.log('  Your gateway auth token. Found in ~/.openclaw/openclaw.json under gateway.auth.token')
  const tokenPrompt = existing.gateway.token
    ? 'Gateway token [press enter to keep current]: '
    : 'Gateway token (required): '
  const token = await ask(rl, tokenPrompt, existing.gateway.token)

  console.log('')
  console.log('  MCP module lets Claude Code ask your OpenClaw agents questions,')
  console.log('  read Discord messages, send notifications, and more.')
  console.log('  Recommended: Yes — this is the core feature.')
  const mcpInput = await ask(rl, 'Enable MCP module? [Y/n]: ', 'y')
  const mcpEnabled = mcpInput.toLowerCase() !== 'n'

  console.log('')
  console.log('  Bridge module lets your agents push messages INTO a running')
  console.log('  Claude Code session. Requires running a local HTTP listener.')
  console.log('  Optional — enable if you want agents to steer CC in real-time.')
  const bridgeInput = await ask(rl, 'Enable Bridge module? [y/N]: ', 'n')
  const bridgeEnabled = bridgeInput.toLowerCase() === 'y'

  let bridgePort = existing.modules.bridge.port
  let defaultProject = existing.modules.bridge.defaultProject

  if (bridgeEnabled) {
    console.log('')
    console.log('  Port the bridge HTTP listener will run on.')
    const portInput = await ask(rl, `Bridge port [${bridgePort}]: `, String(bridgePort))
    bridgePort = parseInt(portInput, 10) || bridgePort

    console.log('')
    console.log('  Default project directory for Claude Code sessions.')
    console.log('  Leave blank to use current directory when starting the bridge.')
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
      execSync(`claude mcp add --scope user openclaw ${envArgs} -- npx openclaw-bridge mcp`, {
        stdio: 'inherit',
      })
      console.log('✅ MCP server added to Claude Code (all projects)')
    } catch {
      console.log('⚠️  Could not auto-add. Run manually:')
      console.log(`   claude mcp add --scope user openclaw -- openclaw-bridge-mcp`)
    }
  }

  console.log('\n┌─────────────────────────────────────────────┐')
  console.log('│           📋 Setup Complete                  │')
  console.log('├─────────────────────────────────────────────┤')
  console.log(`│  Gateway:  ${gatewayUrl.padEnd(33)}│`)
  console.log(`│  Token:    ${(token ? '●●●●●●●● (set)' : '⚠ NOT SET').padEnd(33)}│`)
  console.log(`│  MCP:      ${(mcpEnabled ? '✅ enabled — CC can ask agents' : '❌ disabled').padEnd(33)}│`)
  console.log(`│  Bridge:   ${(bridgeEnabled ? `✅ port ${bridgePort} — agents push to CC` : '❌ disabled').padEnd(33)}│`)
  console.log('├─────────────────────────────────────────────┤')
  console.log('│  Restart Claude Code to activate MCP tools  │')
  console.log('│                                             │')
  if (bridgeEnabled) {
    console.log('│  Start bridge:  openclaw-bridge start bridge│')
  }
  console.log('│  Try in CC:     "ask Daemon what time it is"│')
  console.log('└─────────────────────────────────────────────┘')
  console.log('')
}
