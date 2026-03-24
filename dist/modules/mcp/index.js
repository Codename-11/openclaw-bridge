"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpModule = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const gateway_js_1 = require("../../core/gateway.js");
const logger_js_1 = require("../../core/logger.js");
const tools_js_1 = require("./tools.js");
const logger = (0, logger_js_1.createLogger)('mcp');
class McpModule {
    name = 'mcp';
    description = 'MCP stdio server exposing OpenClaw agents as Claude Code tools';
    config;
    gateway;
    server;
    async init(config) {
        this.config = config;
        this.gateway = new gateway_js_1.GatewayClient(config.gateway);
        if (!config.gateway.token) {
            logger.warn('OPENCLAW_GATEWAY_TOKEN is not set — requests will likely fail');
        }
        this.server = new index_js_1.Server({ name: 'openclaw-bridge', version: '0.1.0' }, { capabilities: { tools: {} } });
        const handlers = (0, tools_js_1.buildToolHandlers)(this.gateway);
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
            tools: tools_js_1.TOOL_DEFINITIONS,
        }));
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const handlerMap = handlers;
            const handler = handlerMap[name];
            if (!handler) {
                return {
                    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    isError: true,
                };
            }
            try {
                return await handler(args ?? {});
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    content: [{ type: 'text', text: `Unexpected error: ${msg}` }],
                    isError: true,
                };
            }
        });
    }
    async start() {
        logger.info(`Starting MCP stdio server (gateway: ${this.config.gateway.url})`);
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        logger.info('MCP server connected and ready');
    }
    async stop() {
        logger.info('MCP module stopped');
    }
    health() {
        return { ok: true, details: 'MCP stdio server running' };
    }
}
exports.McpModule = McpModule;
// Allow direct execution: node dist/modules/mcp/index.js
// This is the entrypoint used when running standalone MCP mode
if (process.argv[1] && process.argv[1].endsWith('mcp/index.js')) {
    ;
    (async () => {
        const { loadConfig } = await import('../../core/config.js');
        const config = loadConfig();
        const mod = new McpModule();
        await mod.init(config);
        await mod.start();
    })().catch((err) => {
        process.stderr.write(`Fatal: ${err}\n`);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map