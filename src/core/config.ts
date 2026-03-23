import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

export interface GatewayConfig {
  url: string
  token: string
}

export interface McpModuleConfig {
  enabled: boolean
}

export interface BridgeModuleConfig {
  enabled: boolean
  port: number
  defaultProject: string
}

export interface RelayModuleConfig {
  enabled: boolean
}

export interface ModulesConfig {
  mcp: McpModuleConfig
  bridge: BridgeModuleConfig
  relay: RelayModuleConfig
}

export interface Config {
  gateway: GatewayConfig
  modules: ModulesConfig
}

const CONFIG_DIR = join(homedir(), '.openclaw-bridge')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const DEFAULT_CONFIG: Config = {
  gateway: {
    url: 'http://localhost:18789',
    token: '',
  },
  modules: {
    mcp: { enabled: true },
    bridge: {
      enabled: false,
      port: 9999,
      defaultProject: '',
    },
    relay: { enabled: false },
  },
}

export function loadConfig(): Config {
  let fileConfig: Partial<Config> = {}

  if (existsSync(CONFIG_PATH)) {
    try {
      const raw = readFileSync(CONFIG_PATH, 'utf-8')
      fileConfig = JSON.parse(raw) as Partial<Config>
    } catch {
      // ignore parse errors, use defaults
    }
  }

  const config: Config = {
    gateway: {
      url: fileConfig.gateway?.url ?? DEFAULT_CONFIG.gateway.url,
      token: fileConfig.gateway?.token ?? DEFAULT_CONFIG.gateway.token,
    },
    modules: {
      mcp: {
        enabled: fileConfig.modules?.mcp?.enabled ?? DEFAULT_CONFIG.modules.mcp.enabled,
      },
      bridge: {
        enabled: fileConfig.modules?.bridge?.enabled ?? DEFAULT_CONFIG.modules.bridge.enabled,
        port: fileConfig.modules?.bridge?.port ?? DEFAULT_CONFIG.modules.bridge.port,
        defaultProject: fileConfig.modules?.bridge?.defaultProject ?? DEFAULT_CONFIG.modules.bridge.defaultProject,
      },
      relay: {
        enabled: fileConfig.modules?.relay?.enabled ?? DEFAULT_CONFIG.modules.relay.enabled,
      },
    },
  }

  // Env var overrides
  if (process.env.OPENCLAW_GATEWAY_URL) {
    config.gateway.url = process.env.OPENCLAW_GATEWAY_URL
  }
  if (process.env.OPENCLAW_GATEWAY_TOKEN) {
    config.gateway.token = process.env.OPENCLAW_GATEWAY_TOKEN
  }

  return config
}

export function saveConfig(config: Config): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8')
}

export function getConfigPath(): string {
  return CONFIG_PATH
}

export { DEFAULT_CONFIG }
