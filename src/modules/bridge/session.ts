import { createLogger } from '../../core/logger.js'
import { execFile } from 'child_process'

const logger = createLogger('bridge:session')

export class CCSession {
  private projectDir: string = ''
  private sessionId: string = ''
  private active: boolean = false
  private continueMode: boolean = false

  async create(projectDir: string): Promise<void> {
    this.projectDir = projectDir
    this.active = true
    this.continueMode = false
    this.sessionId = ''
    logger.info(`CC session created for project: ${projectDir}`)
    logger.info('Using claude CLI --print mode for message passing')
  }

  async resume(sessionId: string): Promise<void> {
    this.sessionId = sessionId
    this.active = true
    this.continueMode = true
    logger.info(`CC session will resume: ${sessionId}`)
  }

  async continueLatest(projectDir?: string): Promise<void> {
    if (projectDir) this.projectDir = projectDir
    this.active = true
    this.continueMode = true
    this.sessionId = ''
    logger.info(`CC session will continue latest in: ${this.projectDir || 'cwd'}`)
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.active) {
      throw new Error('No active CC session — call create(), resume(), or continueLatest() first')
    }

    logger.debug(`Sending message to CC via CLI`, { chars: message.length })

    return new Promise((resolve, reject) => {
      const args = [
        '--print',
        '--output-format', 'text',
      ]

      // Resume a specific session or continue the latest
      if (this.sessionId) {
        args.push('--resume', this.sessionId)
      } else if (this.continueMode) {
        args.push('--continue')
      }

      const opts: { timeout: number; cwd?: string; maxBuffer: number } = {
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024,
      }
      if (this.projectDir) {
        opts.cwd = this.projectDir
      }

      const child = execFile('claude', args, opts, (err, stdout, stderr) => {
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

      // Send message via stdin
      child.stdin?.write(message)
      child.stdin?.end()
    })
  }

  getSessionId(): string {
    return this.sessionId
  }

  isActive(): boolean {
    return this.active
  }

  isContinueMode(): boolean {
    return this.continueMode
  }
}
