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
    continueMode = false;
    async create(projectDir) {
        this.projectDir = projectDir;
        this.active = true;
        this.continueMode = false;
        this.sessionId = '';
        logger.info(`CC session created for project: ${projectDir}`);
        logger.info('Using claude CLI --print mode for message passing');
    }
    async resume(sessionId) {
        this.sessionId = sessionId;
        this.active = true;
        this.continueMode = true;
        logger.info(`CC session will resume: ${sessionId}`);
    }
    async continueLatest(projectDir) {
        if (projectDir)
            this.projectDir = projectDir;
        this.active = true;
        this.continueMode = true;
        this.sessionId = '';
        logger.info(`CC session will continue latest in: ${this.projectDir || 'cwd'}`);
    }
    async sendMessage(message) {
        if (!this.active) {
            throw new Error('No active CC session — call create(), resume(), or continueLatest() first');
        }
        logger.debug(`Sending message to CC via CLI`, { chars: message.length });
        return new Promise((resolve, reject) => {
            const args = [
                '--print',
                '--output-format', 'text',
            ];
            // Resume a specific session or continue the latest
            if (this.sessionId) {
                args.push('--resume', this.sessionId);
            }
            else if (this.continueMode) {
                args.push('--continue');
            }
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
    getSessionId() {
        return this.sessionId;
    }
    isActive() {
        return this.active;
    }
    isContinueMode() {
        return this.continueMode;
    }
}
exports.CCSession = CCSession;
//# sourceMappingURL=session.js.map