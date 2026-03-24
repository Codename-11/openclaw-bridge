import { createServer, IncomingMessage, ServerResponse } from 'http'
import { createLogger } from '../../core/logger.js'
import type { CCSession } from './session.js'

const logger = createLogger('bridge:listener')

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

export class BridgeListener {
  private port: number
  private session: CCSession
  private server: ReturnType<typeof createServer> | null = null

  constructor(port: number, session: CCSession) {
    this.port = port
    this.session = session
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer(async (req, res) => {
        const method = req.method ?? 'GET'
        const url = req.url ?? '/'

        try {
          if (method === 'GET' && url === '/health') {
            json(res, 200, { ok: true, service: 'openclaw-bridge' })
            return
          }

          if (method === 'GET' && url === '/status') {
            json(res, 200, {
              ok: true,
              session: {
                active: this.session.isActive(),
                id: this.session.getSessionId() || null,
                continueMode: this.session.isContinueMode(),
              },
            })
            return
          }

          if (method === 'POST' && url === '/session') {
            const body = await readBody(req)
            const data = JSON.parse(body) as { project?: string; resume?: string; continue?: boolean }

            if (data.resume) {
              // Resume a specific session by ID
              await this.session.resume(data.resume)
              json(res, 200, { ok: true, mode: 'resume', sessionId: this.session.getSessionId() })
            } else if (data.continue) {
              // Continue the latest session in the project dir
              await this.session.continueLatest(data.project)
              json(res, 200, { ok: true, mode: 'continue', project: data.project })
            } else if (data.project) {
              // Fresh session (no shared context)
              await this.session.create(data.project)
              json(res, 200, { ok: true, mode: 'fresh', sessionId: this.session.getSessionId() })
            } else {
              json(res, 400, { error: "Provide 'project', 'resume', or 'continue'" })
            }
            return
          }

          if (method === 'POST' && url === '/message') {
            const body = await readBody(req)
            const data = JSON.parse(body) as { message?: string; from?: string }

            if (!data.message) {
              json(res, 400, { error: "'message' is required" })
              return
            }

            if (!this.session.isActive()) {
              json(res, 400, {
                error: 'No active CC session. POST /session first.',
              })
              return
            }

            logger.info(`Incoming message from ${data.from ?? 'unknown'}: ${data.message.slice(0, 100)}${data.message.length > 100 ? '...' : ''}`)
            const response = await this.session.sendMessage(data.message)
            logger.info(`Response: ${response.slice(0, 200)}${response.length > 200 ? '...' : ''}`)
            json(res, 200, { response })
            return
          }

          json(res, 404, { error: 'Not found' })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          logger.error(`Request error: ${msg}`)
          json(res, 500, { error: msg })
        }
      })

      this.server.on('error', reject)
      this.server.listen(this.port, () => {
        logger.info(`Bridge HTTP listener on port ${this.port}`)
        resolve()
      })
    })
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve()
        return
      }
      this.server.close(() => resolve())
    })
  }
}
