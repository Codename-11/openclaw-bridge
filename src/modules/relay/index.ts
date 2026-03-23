import type { Config } from '../../core/config.js'
import type { BridgeModule } from '../../types.js'

export class RelayModule implements BridgeModule {
  name = 'relay'
  description = 'Voxel Relay device communication (coming soon)'

  async init(_config: Config): Promise<void> {
    // no-op
  }

  async start(): Promise<void> {
    // no-op
  }

  async stop(): Promise<void> {
    // no-op
  }

  health(): { ok: boolean; details: string } {
    return { ok: false, details: 'Not implemented' }
  }
}
