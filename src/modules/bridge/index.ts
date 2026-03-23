import type { Config, BridgeModuleConfig } from '../../core/config.js'
import { createLogger } from '../../core/logger.js'
import { CCSession } from './session.js'
import { BridgeListener } from './listener.js'
import type { BridgeModule } from '../../types.js'

const logger = createLogger('bridge')

export class BridgeModuleImpl implements BridgeModule {
  name = 'bridge'
  description = 'Claude Code SDK bridge — lets agents push messages to CC sessions'

  private moduleConfig!: BridgeModuleConfig
  private session!: CCSession
  private listener!: BridgeListener
  private running = false

  async init(config: Config): Promise<void> {
    this.moduleConfig = config.modules.bridge
    this.session = new CCSession()
    this.listener = new BridgeListener(this.moduleConfig.port, this.session)
    logger.info(`Bridge module initialized (port: ${this.moduleConfig.port})`)
  }

  async start(): Promise<void> {
    logger.info('Starting bridge module')

    // Auto-create session if defaultProject is configured
    if (this.moduleConfig.defaultProject && !this.session.isActive()) {
      try {
        await this.session.create(this.moduleConfig.defaultProject)
        logger.info(`Auto-created CC session for ${this.moduleConfig.defaultProject}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logger.warn(`Could not create CC session automatically: ${msg}`)
        logger.warn('Bridge listener will start, but POST /session first to activate a session')
      }
    }

    await this.listener.start()
    this.running = true
    logger.info('Bridge module ready')
  }

  async stop(): Promise<void> {
    await this.listener.stop()
    this.running = false
    logger.info('Bridge module stopped')
  }

  health(): { ok: boolean; details: string } {
    if (!this.running) return { ok: false, details: 'Not running' }
    const sessionActive = this.session?.isActive()
    return {
      ok: true,
      details: `HTTP listener on port ${this.moduleConfig.port}, session: ${sessionActive ? 'active' : 'none'}`,
    }
  }
}
