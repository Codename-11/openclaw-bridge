"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetup = runSetup;
const readline_1 = require("readline");
const child_process_1 = require("child_process");
const config_js_1 = require("../core/config.js");
const DEFAULT_PORT = 18789;
function ask(rl, question, defaultVal) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim() || defaultVal || '');
        });
    });
}
/**
 * Normalize a gateway URL input:
 * - If just an IP/hostname, prepend http:// and append default port
 * - If IP:port, prepend http://
 * - Ensure http(s):// prefix
 */
function normalizeGatewayUrl(input) {
    let url = input.trim();
    // Already has protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Check if port is missing
        try {
            const parsed = new URL(url);
            if (!parsed.port && !url.includes(':' + DEFAULT_PORT)) {
                return `${parsed.protocol}//${parsed.hostname}:${DEFAULT_PORT}`;
            }
        }
        catch { }
        return url;
    }
    // Has port (e.g. 172.16.24.250:18789)
    if (/:\d+$/.test(url)) {
        return `http://${url}`;
    }
    // Just hostname/IP (e.g. 172.16.24.250)
    return `http://${url}:${DEFAULT_PORT}`;
}
async function runSetup() {
    console.log('\n🔩 openclaw-bridge setup wizard\n');
    const existing = (0, config_js_1.loadConfig)();
    const rl = (0, readline_1.createInterface)({ input: process.stdin, output: process.stdout });
    console.log('  Enter your OpenClaw gateway address.');
    console.log('  Examples: 192.168.1.100, myserver:18789, http://localhost:18789');
    console.log('  Default port 18789 is added automatically if omitted.');
    console.log('');
    const rawUrl = await ask(rl, `Gateway URL [${existing.gateway.url}]: `, existing.gateway.url);
    const gatewayUrl = normalizeGatewayUrl(rawUrl);
    console.log(`  → Using: ${gatewayUrl}`);
    console.log('');
    const tokenPrompt = existing.gateway.token
        ? 'Gateway token [press enter to keep current]: '
        : 'Gateway token (required): ';
    const token = await ask(rl, tokenPrompt, existing.gateway.token);
    const mcpInput = await ask(rl, '\nEnable MCP module? (CC asks agents) [Y/n]: ', 'y');
    const mcpEnabled = mcpInput.toLowerCase() !== 'n';
    const bridgeInput = await ask(rl, 'Enable Bridge module? (agents push to CC) [y/N]: ', 'n');
    const bridgeEnabled = bridgeInput.toLowerCase() === 'y';
    let bridgePort = existing.modules.bridge.port;
    let defaultProject = existing.modules.bridge.defaultProject;
    if (bridgeEnabled) {
        const portInput = await ask(rl, `Bridge port [${bridgePort}]: `, String(bridgePort));
        bridgePort = parseInt(portInput, 10) || bridgePort;
        const projectInput = await ask(rl, `Default project directory [${defaultProject || 'none'}]: `, defaultProject);
        defaultProject = projectInput;
    }
    rl.close();
    const config = {
        gateway: { url: gatewayUrl, token },
        modules: {
            mcp: { enabled: mcpEnabled },
            bridge: { enabled: bridgeEnabled, port: bridgePort, defaultProject },
            relay: { enabled: false },
        },
    };
    (0, config_js_1.saveConfig)(config);
    console.log(`\n✅ Config saved to ${(0, config_js_1.getConfigPath)()}`);
    // Offer Claude Code MCP registration
    const rl2 = (0, readline_1.createInterface)({ input: process.stdin, output: process.stdout });
    const addMcp = await ask(rl2, '\nAdd MCP server to Claude Code? [Y/n]: ', 'y');
    rl2.close();
    if (addMcp.toLowerCase() !== 'n') {
        try {
            const envArgs = `--env OPENCLAW_GATEWAY_URL=${gatewayUrl} --env OPENCLAW_GATEWAY_TOKEN=${token}`;
            (0, child_process_1.execSync)(`claude mcp add --scope user openclaw ${envArgs} -- npx openclaw-bridge mcp`, {
                stdio: 'inherit',
            });
            console.log('✅ MCP server added to Claude Code (all projects)');
        }
        catch {
            console.log('⚠️  Could not auto-add. Run manually:');
            console.log(`   claude mcp add --scope user openclaw -- openclaw-bridge-mcp`);
        }
    }
    console.log('\n┌─────────────────────────────────────────────┐');
    console.log('│           📋 Setup Complete                  │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│  Gateway:  ${gatewayUrl.padEnd(33)}│`);
    console.log(`│  Token:    ${(token ? '●●●●●●●● (set)' : '⚠ NOT SET').padEnd(33)}│`);
    console.log(`│  MCP:      ${(mcpEnabled ? '✅ enabled — CC can ask agents' : '❌ disabled').padEnd(33)}│`);
    console.log(`│  Bridge:   ${(bridgeEnabled ? `✅ port ${bridgePort} — agents push to CC` : '❌ disabled').padEnd(33)}│`);
    console.log('├─────────────────────────────────────────────┤');
    console.log('│  Restart Claude Code to activate MCP tools  │');
    console.log('│                                             │');
    if (bridgeEnabled) {
        console.log('│  Start bridge:  openclaw-bridge start bridge│');
    }
    console.log('│  Try in CC:     "ask Daemon what time it is"│');
    console.log('└─────────────────────────────────────────────┘');
    console.log('');
}
//# sourceMappingURL=setup.js.map