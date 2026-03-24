"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCSession = void 0;
const logger_js_1 = require("../../core/logger.js");
const child_process_1 = require("child_process");
const logger = (0, logger_js_1.createLogger)('bridge:session');
class CCSession {
    projectDir = '';
    sessionId = '';
    active = false;
    async create(projectDir) {
        this.projectDir = projectDir;
        this.active = true;
        logger.info(`CC session created for project: ${projectDir}`);
        logger.info('Using claude CLI --print mode for message passing');
    }
    async sendMessage(message) {
        if (!this.active) {
            throw new Error('No active CC session — call create() first');
        }
        logger.debug(`Sending message to CC via CLI`, { chars: message.length });
        return new Promise((resolve, reject) => {
            const args = [
                '--print',
                '--output-format', 'text',
            ];
            const opts = {
                timeout: 120000,
                maxBuffer: 10 * 1024 * 1024,
            };
            if (this.projectDir) {
                opts.cwd = this.projectDir;
            }
            const child = (0, child_process_1.execFile)('claude', args, opts, (err, stdout, stderr) => {
                if (err) {
                    logger.warn(`CLI error: ${err.message}`);
                    if (stderr)
                        logger.debug(`stderr: ${stderr}`);
                    reject(new Error(`Claude CLI error: ${err.message}`));
                    return;
                }
                const text = stdout.trim();
                logger.debug(`Received response from CC`, { chars: text.length });
                resolve(text);
            });
            // Send message via stdin
            child.stdin?.write(message);
            child.stdin?.end();
        });
    }
    async resume(sessionId) {
        this.sessionId = sessionId;
        this.active = true;
        logger.info(`CC session resumed: ${sessionId}`);
    }
    getSessionId() {
        return this.sessionId;
    }
    isActive() {
        return this.active;
    }
}
exports.CCSession = CCSession;
//# sourceMappingURL=session.js.map