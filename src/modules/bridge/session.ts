import { createLogger } from '../../core/logger.js'
import { execFile } from 'child_process'

const logger = createLogger('bridge:session')

export class CCSession {
  private projectDir: string = ''
  private sessionId: string = ''
  private active: boolean = false

  async create(projectDir: string): Promise<void> {
    this.projectDir = projectDir
    this.active = true
    logger.info(`CC session created for project: ${projectDir}`)
    logger.info('Using claude CLI --print mode for message passing')
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.active) {
      throw new Error('No active CC session — call create() first')
    }

    logger.debug(`Sending message to CC via CLI`, { chars: message.length })

    return new Promise((resolve, reject) => {
      const args = [
        '--print',
        '--output-format', 'text',
        '--message', message,
      ]

      // If we have a project dir, set cwd
      const opts: { timeout: number; cwd?: string; maxBuffer: number } = {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      }
      if (this.projectDir) {
        opts.cwd = this.projectDir
      }

      execFile('claude', args, opts, (err, stdout, stderr) => {
        if (err) {
          logger.warn(`CLI error: ${err.message}`)
          if (stderr) logger.debug(`stderr: ${stderr}`)
          reject(new Error(`Claude CLI error: ${err.message}`))
          return
        }

        const text = stdout.trim()
        logger.debug(`Received response from CC`, { chars: text.length })
        resolve(text)
      })
    })
  }

  async resume(sessionId: string): Promise<void> {
    this.sessionId = sessionId
    this.active = true
    logger.info(`CC session resumed: ${sessionId}`)
  }

  getSessionId(): string {
    return this.sessionId
  }

  isActive(): boolean {
    return this.active
  }
}
