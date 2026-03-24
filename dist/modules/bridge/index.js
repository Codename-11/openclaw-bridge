"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeModuleImpl = void 0;
const logger_js_1 = require("../../core/logger.js");
const session_js_1 = require("./session.js");
const listener_js_1 = require("./listener.js");
const logger = (0, logger_js_1.createLogger)('bridge');
class BridgeModuleImpl {
    name = 'bridge';
    description = 'Claude Code SDK bridge — lets agents push messages to CC sessions';
    moduleConfig;
    session;
    listener;
    running = false;
    async init(config) {
        this.moduleConfig = config.modules.bridge;
        this.session = new session_js_1.CCSession();
        this.listener = new listener_js_1.BridgeListener(this.moduleConfig.port, this.session);
        logger.info(`Bridge module initialized (port: ${this.moduleConfig.port})`);
    }
    async start() {
        logger.info('Starting bridge module');
        // Auto-create session if defaultProject is configured
        if (this.moduleConfig.defaultProject && !this.session.isActive()) {
            try {
                await this.session.create(this.moduleConfig.defaultProject);
                logger.info(`Auto-created CC session for ${this.moduleConfig.defaultProject}`);
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                logger.warn(`Could not create CC session automatically: ${msg}`);
                logger.warn('Bridge listener will start, but POST /session first to activate a session');
            }
        }
        await this.listener.start();
        this.running = true;
        logger.info('Bridge module ready');
    }
    async stop() {
        await this.listener.stop();
        this.running = false;
        logger.info('Bridge module stopped');
    }
    health() {
        if (!this.running)
            return { ok: false, details: 'Not running' };
        const sessionActive = this.session?.isActive();
        return {
            ok: true,
            details: `HTTP listener on port ${this.moduleConfig.port}, session: ${sessionActive ? 'active' : 'none'}`,
        };
    }
}
exports.BridgeModuleImpl = BridgeModuleImpl;
//# sourceMappingURL=index.js.map