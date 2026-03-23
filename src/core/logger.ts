export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info'

function log(level: LogLevel, module: string, message: string, data?: unknown): void {
  if (LEVELS[level] < LEVELS[currentLevel]) return

  const ts = new Date().toISOString()
  const prefix = `[${ts}] [${level.toUpperCase()}] [${module}]`
  const line = data !== undefined
    ? `${prefix} ${message} ${JSON.stringify(data)}`
    : `${prefix} ${message}`

  process.stderr.write(line + '\n')
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, data?: unknown) => log('debug', module, msg, data),
    info: (msg: string, data?: unknown) => log('info', module, msg, data),
    warn: (msg: string, data?: unknown) => log('warn', module, msg, data),
    error: (msg: string, data?: unknown) => log('error', module, msg, data),
  }
}
