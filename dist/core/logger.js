"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
const currentLevel = process.env.LOG_LEVEL ?? 'info';
function log(level, module, message, data) {
    if (LEVELS[level] < LEVELS[currentLevel])
        return;
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [${level.toUpperCase()}] [${module}]`;
    const line = data !== undefined
        ? `${prefix} ${message} ${JSON.stringify(data)}`
        : `${prefix} ${message}`;
    process.stderr.write(line + '\n');
}
function createLogger(module) {
    return {
        debug: (msg, data) => log('debug', module, msg, data),
        info: (msg, data) => log('info', module, msg, data),
        warn: (msg, data) => log('warn', module, msg, data),
        error: (msg, data) => log('error', module, msg, data),
    };
}
//# sourceMappingURL=logger.js.map