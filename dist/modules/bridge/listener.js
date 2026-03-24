"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeListener = void 0;
const http_1 = require("http");
const logger_js_1 = require("../../core/logger.js");
const logger = (0, logger_js_1.createLogger)('bridge:listener');
function readBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}
function json(res, status, data) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
}
class BridgeListener {
    port;
    session;
    server = null;
    constructor(port, session) {
        this.port = port;
        this.session = session;
    }
    start() {
        return new Promise((resolve, reject) => {
            this.server = (0, http_1.createServer)(async (req, res) => {
                const method = req.method ?? 'GET';
                const url = req.url ?? '/';
                try {
                    if (method === 'GET' && url === '/health') {
                        json(res, 200, { ok: true, service: 'openclaw-bridge' });
                        return;
                    }
                    if (method === 'GET' && url === '/status') {
                        json(res, 200, {
                            ok: true,
                            session: {
                                active: this.session.isActive(),
                                id: this.session.getSessionId() || null,
                            },
                        });
                        return;
                    }
                    if (method === 'POST' && url === '/session') {
                        const body = await readBody(req);
                        const data = JSON.parse(body);
                        if (data.resume) {
                            await this.session.resume(data.resume);
                            json(res, 200, { ok: true, sessionId: this.session.getSessionId() });
                        }
                        else if (data.project) {
                            await this.session.create(data.project);
                            json(res, 200, { ok: true, sessionId: this.session.getSessionId() });
                        }
                        else {
                            json(res, 400, { error: "Provide 'project' or 'resume'" });
                        }
                        return;
                    }
                    if (method === 'POST' && url === '/message') {
                        const body = await readBody(req);
                        const data = JSON.parse(body);
                        if (!data.message) {
                            json(res, 400, { error: "'message' is required" });
                            return;
                        }
                        if (!this.session.isActive()) {
                            json(res, 400, {
                                error: 'No active CC session. POST /session first.',
                            });
                            return;
                        }
                        logger.info(`Incoming message from ${data.from ?? 'unknown'}`);
                        const response = await this.session.sendMessage(data.message);
                        json(res, 200, { response });
                        return;
                    }
                    json(res, 404, { error: 'Not found' });
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    logger.error(`Request error: ${msg}`);
                    json(res, 500, { error: msg });
                }
            });
            this.server.on('error', reject);
            this.server.listen(this.port, () => {
                logger.info(`Bridge HTTP listener on port ${this.port}`);
                resolve();
            });
        });
    }
    stop() {
        return new Promise((resolve) => {
            if (!this.server) {
                resolve();
                return;
            }
            this.server.close(() => resolve());
        });
    }
}
exports.BridgeListener = BridgeListener;
//# sourceMappingURL=listener.js.map