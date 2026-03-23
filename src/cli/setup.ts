import { createInterface } from 'readline'
import { execSync } from 'child_process'
import { loadConfig, saveConfig, getConfigPath } from '../core/config.js'
import type { Config } from '../core/config.js'

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

function maskInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question)
    // Simple masking via muted echo
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })
    // Mute output for password entry
    const onData = (char: Buffer) => {
      const c = char.toString()
      if (c === '\n' || c === '\r' || c === '\u0004') {
        process.stdout.write('\n')
        process.stdin.off('data', onData)
        process.stdin.setRawMode?.(false)
        process.stdin.pause()
        rl.close()
      } else {
        process.stdout.write('*')
      }
    }

    let value = ''
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (raw: Buffer | string) => {
      const c = typeof raw === 'string' ? raw : raw.toString()
      if (c === '\n' || c === '\r' || c === '\u0004') {
        process.stdout.write('\n')
        process.stdin.removeAllListeners('data')
        process.stdin.setRawMode?.(false)
        process.stdin.pause()
        rl.close()
        resolve(value)
      } else if (c === '\u007f') {
        // backspace
        value = value.slice(0, -1)
      } else {
        value += c
        process.stdout.write('*')
      }
    })
  })
}

export async function runSetup(): Promise<void> {
  console.log('\n🔩 openclaw-bridge setup wizard\n')

  const existing = loadConfig()

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  const gatewayUrl = await ask(
    rl,
    `Gateway URL [${existing.gateway.url}]: `
  )

  rl.close()

  const url = gatewayUrl.trim() || existing.gateway.url

  // Token input (masked)
  const tokenPrompt = existing.gateway.token
    ? 'Gateway token [current: set, press enter to keep]: '
    : 'Gateway token (required): '
  const tokenInput = await maskInput(tokenPrompt)
  const token = tokenInput.trim() || existing.gateway.token

  const rl2 = createInterface({ input: process.stdin, output: process.stdout })

  const mcpInput = await ask(rl2, 'Enable MCP module? [Y/n]: ')
  const mcpEnabled = mcpInput.trim().toLowerCase() !== 'n'

  const bridgeInput = await ask(rl2, 'Enable Bridge module? [y/N]: ')
  const bridgeEnabled = bridgeInput.trim().toLowerCase() === 'y'

  let bridgePort = existing.modules.bridge.port
  let defaultProject = existing.modules.bridge.defaultProject

  if (bridgeEnabled) {
    const portInput = await ask(rl2, `Bridge port [${bridgePort}]: `)
    if (portInput.trim()) bridgePort = parseInt(portInput.trim(), 10)

    const projectInput = await ask(rl2, `Default project directory [${defaultProject || 'none'}]: `)
    if (projectInput.trim()) defaultProject = projectInput.trim()
  }

  rl2.close()

  const config: Config = {
    gateway: { url, token },
    modules: {
      mcp: { enabled: mcpEnabled },
      bridge: { enabled: bridgeEnabled, port: bridgePort, defaultProject },
      relay: { enabled: false },
    },
  }

  saveConfig(config)
  console.log(`\n✅ Config saved to ${getConfigPath()}`)

  // Offer Claude Code MCP registration
  const rl3 = createInterface({ input: process.stdin, output: process.stdout })
  const addMcp = await ask(rl3, '\nAdd MCP server to Claude Code? [Y/n]: ')
  rl3.close()

  if (addMcp.trim().toLowerCase() !== 'n') {
    try {
      execSync('claude mcp add openclaw -- npx openclaw-bridge mcp', {
        stdio: 'inherit',
      })
      console.log('✅ MCP server added to Claude Code')
    } catch {
      console.log('⚠️  Could not run `claude mcp add` — run manually:')
      console.log('   claude mcp add openclaw -- npx openclaw-bridge mcp')
    }
  }

  console.log('\n📋 Summary:')
  console.log(`  Gateway URL:    ${url}`)
  console.log(`  Gateway token:  ${token ? '***set***' : 'NOT SET (requests will fail)'}`)
  console.log(`  MCP module:     ${mcpEnabled ? 'enabled' : 'disabled'}`)
  console.log(`  Bridge module:  ${bridgeEnabled ? `enabled (port ${bridgePort})` : 'disabled'}`)
  console.log('\nRun: openclaw-bridge start mcp')
  console.log('     openclaw-bridge status\n')
}
