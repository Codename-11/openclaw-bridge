"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DEFINITIONS = void 0;
exports.buildToolHandlers = buildToolHandlers;
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
];
//# sourceMappingURL=tools.js.map