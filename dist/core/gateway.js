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
        // The gateway doesn't have a /v1/models endpoint — ask Daemon to list agents
        try {
            const response = await this.askAgent('daemon', 'List all available agents on this OpenClaw instance. Return ONLY a JSON array of objects like: [{"id":"daemon","name":"Daemon","role":"Lead agent"}]. No other text.', 'agent:daemon:bridge-list');
            // Try to parse JSON from the response
            const match = response.match(/\[[\s\S]*\]/);
            if (match) {
                const agents = JSON.parse(match[0]);
                return agents.map((a) => ({
                    id: a.id,
                    name: a.name,
                    ownedBy: a.role,
                }));
            }
            // Fallback: return daemon as the known agent
            return [{ id: 'daemon', name: 'Daemon', ownedBy: 'lead' }];
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`listAgents failed: ${msg}`);
            throw new Error(`Failed to list agents: ${msg}`);
        }
    }
    async askAgentForDiscord(agent, channel, limit) {
        const prompt = `Read the last ${limit} messages from Discord channel #${channel} using the message tool with action=read, channel="${channel}", limit=${limit}. Return them formatted as: [timestamp] sender: message\n\nIf you cannot read the channel or there are no messages, say so clearly.`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        try {
            logger.debug(`Asking ${agent} to read Discord #${channel} (limit ${limit})`);
            const response = await fetch(`${this.url}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    ...this.headers(),
                    'x-openclaw-session-key': `agent:${agent}:bridge-discord`,
                },
                body: JSON.stringify({
                    model: `openclaw:${agent}`,
                    stream: false,
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`Gateway error (${response.status}): ${errText}`);
            }
            const data = (await response.json());
            return data?.choices?.[0]?.message?.content ?? JSON.stringify(data, null, 2);
        }
        catch (err) {
            clearTimeout(timeout);
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`askAgentForDiscord failed: ${msg}`);
            throw new Error(`Discord read via agent '${agent}' failed: ${msg}`);
        }
    }
    async askAgentToSendDiscord(agent, channel, message) {
        const prompt = `Send the following message to Discord channel #${channel} using the message tool with action=send, target="${channel}": ${message}\n\nConfirm when sent.`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        try {
            logger.debug(`Asking ${agent} to send to Discord #${channel}`);
            const response = await fetch(`${this.url}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    ...this.headers(),
                    'x-openclaw-session-key': `agent:${agent}:bridge-discord`,
                },
                body: JSON.stringify({
                    model: `openclaw:${agent}`,
                    stream: false,
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`Gateway error (${response.status}): ${errText}`);
            }
            const data = (await response.json());
            return data?.choices?.[0]?.message?.content ?? 'Message sent.';
        }
        catch (err) {
            clearTimeout(timeout);
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`askAgentToSendDiscord failed: ${msg}`);
            throw new Error(`Discord send via agent '${agent}' failed: ${msg}`);
        }
    }
    async askAgentToNotify(agent, targetChannel, message) {
        const prompt = `Send the following message to Discord channel ${targetChannel} using the message tool with action=send, channel="${targetChannel}": ${message}\n\nConfirm when sent.`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60_000);
        try {
            logger.debug(`Asking ${agent} to notify channel ${targetChannel}`);
            const response = await fetch(`${this.url}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    ...this.headers(),
                    'x-openclaw-session-key': `agent:${agent}:bridge-notify`,
                },
                body: JSON.stringify({
                    model: `openclaw:${agent}`,
                    stream: false,
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                const errText = await response.text().catch(() => response.statusText);
                throw new Error(`Gateway error (${response.status}): ${errText}`);
            }
            const data = (await response.json());
            return data?.choices?.[0]?.message?.content ?? 'Notification sent.';
        }
        catch (err) {
            clearTimeout(timeout);
            const msg = err instanceof Error ? err.message : String(err);
            logger.error(`askAgentToNotify failed: ${msg}`);
            throw new Error(`Notify via agent '${agent}' failed: ${msg}`);
        }
    }
    async healthCheck() {
        // Test with a lightweight chat completion instead of /v1/models (which returns HTML)
        try {
            const response = await this.askAgent('daemon', 'ping', 'agent:daemon:bridge-health');
            return response.length > 0;
        }
        catch {
            return false;
        }
    }
}
exports.GatewayClient = GatewayClient;
//# sourceMappingURL=gateway.js.map