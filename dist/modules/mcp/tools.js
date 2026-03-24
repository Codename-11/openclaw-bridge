"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DEFINITIONS = void 0;
exports.buildToolHandlers = buildToolHandlers;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const os_1 = require("os");
const path_1 = require("path");
// Bailey's DM channel for notifications
const NOTIFY_CHANNEL = '1485447564965969972';
function readJsonFile(filePath) {
    try {
        if (!(0, fs_1.existsSync)(filePath))
            return null;
        return JSON.parse((0, fs_1.readFileSync)(filePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
function writeJsonFile(filePath, data) {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dir && !(0, fs_1.existsSync)(dir)) {
        (0, fs_1.mkdirSync)(dir, { recursive: true });
    }
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
function buildToolHandlers(gateway) {
    return {
        async ask_agent(args) {
            const agent = args?.agent;
            const message = args?.message;
            if (!agent || !message) {
                return {
                    content: [{ type: 'text', text: "Error: 'agent' and 'message' are required." }],
                    isError: true,
                };
            }
            try {
                const text = await gateway.askAgent(agent, message);
                return { content: [{ type: 'text', text }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async list_agents(_args) {
            try {
                const agents = await gateway.listAgents();
                if (agents.length === 0) {
                    return { content: [{ type: 'text', text: 'No agents found.' }] };
                }
                const lines = agents.map((a) => `- ${a.name} (id: ${a.id})`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Available OpenClaw agents:\n${lines.join('\n')}`,
                        },
                    ],
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async agent_status(args) {
            const agent = args?.agent;
            if (!agent) {
                return {
                    content: [{ type: 'text', text: "Error: 'agent' is required." }],
                    isError: true,
                };
            }
            try {
                const agents = await gateway.listAgents();
                const match = agents.find((a) => a.id === agent ||
                    a.id === `openclaw:${agent}` ||
                    a.name.toLowerCase() === agent.toLowerCase());
                if (!match) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Agent '${agent}' not found. Run list_agents to see available agents.`,
                            },
                        ],
                    };
                }
                const lastActivity = match.created
                    ? new Date(match.created * 1000).toISOString()
                    : 'unknown';
                return {
                    content: [
                        {
                            type: 'text',
                            text: [
                                `Agent: ${match.name}`,
                                `Model ID: ${match.id}`,
                                `Owned by: ${match.ownedBy ?? 'unknown'}`,
                                `Last activity: ${lastActivity}`,
                                `Status: active`,
                            ].join('\n'),
                        },
                    ],
                };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async discord_recent(args) {
            const channel = args?.channel || 'ai';
            const limit = typeof args?.limit === 'number' ? args.limit : 10;
            try {
                const text = await gateway.askAgentForDiscord('daemon', channel, limit);
                return { content: [{ type: 'text', text }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async discord_send(args) {
            const channel = args?.channel || 'ai';
            const messageText = args?.message;
            if (!messageText) {
                return {
                    content: [{ type: 'text', text: "Error: 'message' is required." }],
                    isError: true,
                };
            }
            try {
                const result = await gateway.askAgentToSendDiscord('daemon', channel, messageText);
                return { content: [{ type: 'text', text: result }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async notify(args) {
            const messageText = args?.message;
            const urgent = Boolean(args?.urgent);
            if (!messageText) {
                return {
                    content: [{ type: 'text', text: "Error: 'message' is required." }],
                    isError: true,
                };
            }
            const prefix = urgent ? '🚨 [CC]' : '🔔 [CC]';
            const formatted = `${prefix} ${messageText}`;
            try {
                const result = await gateway.askAgentToNotify('daemon', NOTIFY_CHANNEL, formatted);
                return { content: [{ type: 'text', text: `Notification sent: ${result}` }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async check_steering(_args) {
            const steeringPath = (0, path_1.join)((0, os_1.homedir)(), '.openclaw-bridge', 'steering.json');
            try {
                const data = readJsonFile(steeringPath);
                if (!data || !data.messages || data.messages.length === 0) {
                    return { content: [{ type: 'text', text: 'No pending steering messages.' }] };
                }
                const lines = data.messages.map((m) => `[${m.timestamp}] ${m.from}: ${m.text}`);
                const output = `Pending steering messages:\n\n${lines.join('\n')}`;
                // Clear after reading
                writeJsonFile(steeringPath, { messages: [] });
                return { content: [{ type: 'text', text: output }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async project_memory_read(args) {
            const key = args?.key;
            const memoryPath = (0, path_1.resolve)(process.cwd(), '.openclaw-bridge', 'memory.json');
            try {
                const data = readJsonFile(memoryPath);
                if (!data || data.length === 0) {
                    return { content: [{ type: 'text', text: 'No project memory found.' }] };
                }
                const entries = key
                    ? data.filter((e) => e.key === key)
                    : data;
                if (entries.length === 0) {
                    return { content: [{ type: 'text', text: `No memory entries found for key: ${key}` }] };
                }
                const lines = entries.map((e) => `[${e.timestamp}] ${e.key}: ${e.value}`);
                return { content: [{ type: 'text', text: lines.join('\n') }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async project_memory_write(args) {
            const key = args?.key;
            const value = args?.value;
            if (!key || !value) {
                return {
                    content: [{ type: 'text', text: "Error: 'key' and 'value' are required." }],
                    isError: true,
                };
            }
            const memoryPath = (0, path_1.resolve)(process.cwd(), '.openclaw-bridge', 'memory.json');
            try {
                const existing = readJsonFile(memoryPath) ?? [];
                const entry = { key, value, timestamp: new Date().toISOString() };
                existing.push(entry);
                writeJsonFile(memoryPath, existing);
                return { content: [{ type: 'text', text: `Memory written: ${key} = ${value}` }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async announce(args) {
            const status = args?.status;
            const channel = args?.channel || 'ai';
            if (!status) {
                return {
                    content: [{ type: 'text', text: "Error: 'status' is required." }],
                    isError: true,
                };
            }
            const formatted = `⚡ [Claude Code] ${status}`;
            try {
                const result = await gateway.askAgentToSendDiscord('daemon', channel, formatted);
                return { content: [{ type: 'text', text: `Announced to #${channel}: ${result}` }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: msg }], isError: true };
            }
        },
        async start_bridge(args) {
            const port = args?.port || 9999;
            const project = args?.project || '';
            // Check if bridge is already running
            try {
                const resp = await fetch(`http://localhost:${port}/health`);
                if (resp.ok) {
                    return { content: [{ type: 'text', text: `Bridge already running on port ${port}.` }] };
                }
            }
            catch {
                // Not running, good
            }
            // Find the bridge start script
            const appDir = (0, path_1.join)((0, os_1.homedir)(), '.openclaw-bridge', 'app');
            const startScript = (0, path_1.join)(appDir, 'dist', 'cli', 'start.js');
            if (!(0, fs_1.existsSync)(startScript)) {
                return {
                    content: [{ type: 'text', text: 'Bridge not installed. Run the installer first: irm https://raw.githubusercontent.com/Codename-11/openclaw-bridge/main/install.ps1 | iex' }],
                    isError: true,
                };
            }
            try {
                // Spawn detached bridge process
                const child = (0, child_process_1.spawn)('node', ['-e', `require('${startScript.replace(/\\/g, '/')}').runStart(['bridge'])`], {
                    detached: true,
                    stdio: 'ignore',
                    env: { ...process.env },
                });
                child.unref();
                // Wait a moment and verify it started
                await new Promise((r) => setTimeout(r, 2000));
                try {
                    const resp = await fetch(`http://localhost:${port}/health`);
                    if (resp.ok) {
                        let msg = `Bridge started on port ${port} (background process).`;
                        if (project) {
                            // Auto-create session
                            await fetch(`http://localhost:${port}/session`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ project }),
                            });
                            msg += ` Session created for: ${project}`;
                        }
                        return { content: [{ type: 'text', text: msg }] };
                    }
                }
                catch { }
                return { content: [{ type: 'text', text: `Bridge process spawned on port ${port}. It may take a moment to start.` }] };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { content: [{ type: 'text', text: `Failed to start bridge: ${msg}` }], isError: true };
            }
        },
        async stop_bridge(args) {
            const port = args?.port || 9999;
            try {
                const resp = await fetch(`http://localhost:${port}/health`);
                if (!resp.ok) {
                    return { content: [{ type: 'text', text: 'Bridge is not running.' }] };
                }
            }
            catch {
                return { content: [{ type: 'text', text: 'Bridge is not running.' }] };
            }
            // There's no graceful shutdown endpoint yet — just report status
            return { content: [{ type: 'text', text: `Bridge is running on port ${port}. To stop it, close the terminal or kill the process.` }] };
        },
    };
}
exports.TOOL_DEFINITIONS = [
    {
        name: 'ask_agent',
        description: "Send a message to an OpenClaw agent and get their response. Use agent names like 'daemon', 'soren', 'ash', 'mira', 'jace', 'pip'.",
        inputSchema: {
            type: 'object',
            properties: {
                agent: {
                    type: 'string',
                    description: "The agent to message (e.g. 'daemon', 'soren', 'ash')",
                },
                message: {
                    type: 'string',
                    description: 'The message to send to the agent',
                },
            },
            required: ['agent', 'message'],
        },
    },
    {
        name: 'list_agents',
        description: 'List all available OpenClaw agents from the gateway.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'agent_status',
        description: 'Check the status of a specific OpenClaw agent session.',
        inputSchema: {
            type: 'object',
            properties: {
                agent: {
                    type: 'string',
                    description: 'The agent name to check status for',
                },
            },
            required: ['agent'],
        },
    },
    {
        name: 'discord_recent',
        description: 'Read recent messages from a Discord channel via the OpenClaw gateway. Returns formatted message list.',
        inputSchema: {
            type: 'object',
            properties: {
                channel: {
                    type: 'string',
                    description: 'Discord channel name to read from (default: "ai")',
                },
                limit: {
                    type: 'number',
                    description: 'Number of recent messages to fetch (default: 10)',
                },
            },
            required: [],
        },
    },
    {
        name: 'discord_send',
        description: 'Send a message to a Discord channel via the OpenClaw gateway.',
        inputSchema: {
            type: 'object',
            properties: {
                channel: {
                    type: 'string',
                    description: 'Discord channel name to send to (default: "ai")',
                },
                message: {
                    type: 'string',
                    description: 'The message text to send',
                },
            },
            required: ['message'],
        },
    },
    {
        name: 'notify',
        description: "Send a notification to Bailey's Discord DMs. Prefixes with 🔔 [CC] or 🚨 [CC] if urgent.",
        inputSchema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    description: 'The notification message to send',
                },
                urgent: {
                    type: 'boolean',
                    description: 'If true, uses 🚨 prefix instead of 🔔',
                },
            },
            required: ['message'],
        },
    },
    {
        name: 'check_steering',
        description: 'Check for pending steering messages from Daemon (written to ~/.openclaw-bridge/steering.json). Clears messages after reading.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'project_memory_read',
        description: 'Read shared project memory from .openclaw-bridge/memory.json in the current directory. Useful for decisions, context, and notes shared across Claude Code sessions.',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Specific key to read (omit to read all entries)',
                },
            },
            required: [],
        },
    },
    {
        name: 'project_memory_write',
        description: 'Write a key/value entry to .openclaw-bridge/memory.json in the current directory. Appends with timestamp.',
        inputSchema: {
            type: 'object',
            properties: {
                key: {
                    type: 'string',
                    description: 'Memory key (e.g. "architecture_decision", "current_task")',
                },
                value: {
                    type: 'string',
                    description: 'Memory value to store',
                },
            },
            required: ['key', 'value'],
        },
    },
    {
        name: 'announce',
        description: 'Post a status announcement to a Discord channel formatted as "⚡ [Claude Code] {status}". Use for progress updates, completions, and errors.',
        inputSchema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    description: 'Status message to announce',
                },
                channel: {
                    type: 'string',
                    description: 'Discord channel to post to (default: "ai")',
                },
            },
            required: ['status'],
        },
    },
    {
        name: 'start_bridge',
        description: 'Start the openclaw-bridge HTTP listener as a background process. This allows OpenClaw agents (like Daemon) to push messages to Claude Code. The bridge survives after Claude Code exits.',
        inputSchema: {
            type: 'object',
            properties: {
                port: {
                    type: 'number',
                    description: 'Port to run the bridge on (default: 9999)',
                },
                project: {
                    type: 'string',
                    description: 'Project directory to auto-create a session for',
                },
            },
            required: [],
        },
    },
    {
        name: 'stop_bridge',
        description: 'Check if the bridge is running and get info on how to stop it.',
        inputSchema: {
            type: 'object',
            properties: {
                port: {
                    type: 'number',
                    description: 'Port to check (default: 9999)',
                },
            },
            required: [],
        },
    },
];
//# sourceMappingURL=tools.js.map