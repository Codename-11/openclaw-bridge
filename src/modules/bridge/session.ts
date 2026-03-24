import { createLogger } from '../../core/logger.js'

const logger = createLogger('bridge:session')

// Lazy-load optional SDK
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ClaudeCodeSDK: new () => any
let sdkAvailable = false

async function loadSDK(): Promise<boolean> {
  if (sdkAvailable) return true
  try {
    // The SDK is ESM-only and has no 'main'/'exports' field.
    // Import directly from the cli.js entry which contains the SDK exports.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await (Function('return import("@anthropic-ai/claude-code/cli.js")')()) as any
    // Try named export first, then default
    ClaudeCodeSDK = mod.ClaudeCodeSDK ?? mod.default?.ClaudeCodeSDK ?? mod.default
    if (!ClaudeCodeSDK) {
      // Maybe it exports differently — log what we got
      logger.warn(`SDK loaded but ClaudeCodeSDK not found. Exports: ${Object.keys(mod).join(', ')}`)
      return false
    }
    sdkAvailable = true
    logger.info('Claude Code SDK loaded successfully')
    return true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(`@anthropic-ai/claude-code not available: ${msg}`)
    return false
  }
}

export class CCSession {
  private sdk: unknown = null
  private session: unknown = null
  private sessionId: string = ''

  async create(projectDir: string): Promise<void> {
    if (!(await loadSDK())) {
      throw new Error('@anthropic-ai/claude-code SDK not available')
    }

    this.sdk = new ClaudeCodeSDK()
    logger.info(`Creating CC session for project: ${projectDir}`)

    // Invoke SDK session creation
    const sdkAny = this.sdk as Record<string, (opts: unknown) => Promise<unknown>>
    this.session = await sdkAny.createSession({ projectDir })

    const sessionAny = this.session as Record<string, unknown>
    this.sessionId = (sessionAny.id ?? sessionAny.sessionId ?? '') as string
    logger.info(`CC session created: ${this.sessionId}`)
  }

  async resume(sessionId: string): Promise<void> {
    if (!(await loadSDK())) {
      throw new Error('@anthropic-ai/claude-code SDK not available')
    }

    this.sdk = new ClaudeCodeSDK()
    logger.info(`Resuming CC session: ${sessionId}`)

    const sdkAny = this.sdk as Record<string, (opts: unknown) => Promise<unknown>>
    this.session = await sdkAny.resumeSession({ sessionId })
    this.sessionId = sessionId
    logger.info(`CC session resumed: ${this.sessionId}`)
  }

  async sendMessage(message: string): Promise<string> {
    if (!this.session) {
      throw new Error('No active CC session — call create() or resume() first')
    }

    logger.debug(`Sending message to CC session`, { chars: message.length })

    const sessionAny = this.session as Record<string, (msg: string) => Promise<unknown>>
    const result = await sessionAny.sendMessage(message)

    // Result shape varies — try common patterns
    const resultAny = result as Record<string, unknown>
    const text =
      typeof result === 'string'
        ? result
        : (resultAny.content as string) ??
          (resultAny.text as string) ??
          (resultAny.message as string) ??
          JSON.stringify(result, null, 2)

    logger.debug(`Received response from CC`, { chars: text.length })
    return text
  }

  getSessionId(): string {
    return this.sessionId
  }

  isActive(): boolean {
    return this.session !== null
  }
}
