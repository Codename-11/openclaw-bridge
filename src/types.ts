import type { Config } from './core/config.js'

/**
 * Standard interface every module must implement.
 */
export interface BridgeModule {
  name: string
  description: string
  init(config: Config): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  health(): { ok: boolean; details: string }
}
