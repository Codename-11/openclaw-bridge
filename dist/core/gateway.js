"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayClient = void 0;
const logger_js_1 = require("./logger.js");
const logger = (0, logger_js_1.createLogger)('gateway');
class GatewayClient {
    url;
    token;
    constructor(config) {
        this.url = config.url.replace(/\/$/, '');
        this.token = config.token;
    }
    headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
        };
    }
    async askAgent(agent, message) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120_000);
        try {
            logger.debug(`Asking agent ${agent}`, { message: message.slice(0, 100) });
            const response = await fetch(`${this.url}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    ...this.headers(),
                    'x-openclaw-session-key': `agent:${agent}:bridge`,
                },
                body: JSON.stringify({
                    model: `openclaw:${agent}`,
                    stream: false,
                    messages: [{ role: 'user', content: message }],
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`Gateway error (${response.status}): ${errText}`);
            }
            const data = (await response.json());
            const text = data?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2);
            logger.debug(`Got response from ${agent}`, { chars: text.length });
            return text;
        }
        catch (err) {
            clearTimeout(timeout);
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`askAgent failed for ${agent}: ${msg}`);
            throw new Error(`Request to agent '${agent}' failed: ${msg}`);
        }
    }
    async listAgents() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        try {
            const response = await fetch(`${this.url}/v1/models`, {
                headers: this.headers(),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`Gateway error (${response.status}): ${errText}`);
            }
            const data = (await response.json());
            return (data?.data ?? []).map((m) => ({
                id: m.id,
                name: m.id.replace(/^openclaw:/, ''),
                ownedBy: m.owned_by,
                created: m.created,
            }));
        }
        catch (err) {
            clearTimeout(timeout);
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`listAgents failed: ${msg}`);
            throw new Error(`Failed to list agents: ${msg}`);
        }
    }
    async healthCheck() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);
        try {
            const response = await fetch(`${this.url}/v1/models`, {
                headers: this.headers(),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            return response.ok;
        }
        catch {
            clearTimeout(timeout);
            return false;
        }
    }
}
exports.GatewayClient = GatewayClient;
//# sourceMappingURL=gateway.js.map