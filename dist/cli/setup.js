"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSetup = runSetup;
const readline_1 = require("readline");
const child_process_1 = require("child_process");
const config_js_1 = require("../core/config.js");
function ask(rl, question, defaultVal) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim() || defaultVal || '');
        });
    });
}
async function runSetup() {
    console.log('\n🔩 openclaw-bridge setup wizard\n');
    const existing = (0, config_js_1.loadConfig)();
    const rl = (0, readline_1.createInterface)({ input: process.stdin, output: process.stdout });
    const gatewayUrl = await ask(rl, `Gateway URL [${existing.gateway.url}]: `, existing.gateway.url);
    // Token — no masking, just normal input (masking breaks Windows stdin)
    const tokenPrompt = existing.gateway.token
        ? 'Gateway token [press enter to keep current]: '
        : 'Gateway token (required): ';
    const token = await ask(rl, tokenPrompt, existing.gateway.token);
    const mcpInput = await ask(rl, 'Enable MCP module? [Y/n]: ', 'y');
    const mcpEnabled = mcpInput.toLowerCase() !== 'n';
    const bridgeInput = await ask(rl, 'Enable Bridge module? [y/N]: ', 'n');
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
            (0, child_process_1.execSync)(`claude mcp add openclaw ${envArgs} -- npx openclaw-bridge mcp`, {
                stdio: 'inherit',
            });
            console.log('✅ MCP server added to Claude Code');
        }
        catch {
            console.log('⚠️  Could not auto-add. Run manually:');
            console.log(`   claude mcp add openclaw --env OPENCLAW_GATEWAY_URL=${gatewayUrl} --env OPENCLAW_GATEWAY_TOKEN=${token} -- npx openclaw-bridge mcp`);
        }
    }
    console.log('\n📋 Summary:');
    console.log(`  Gateway:  ${gatewayUrl}`);
    console.log(`  Token:    ${token ? '***set***' : 'NOT SET'}`);
    console.log(`  MCP:      ${mcpEnabled ? '✅ enabled' : '❌ disabled'}`);
    console.log(`  Bridge:   ${bridgeEnabled ? `✅ port ${bridgePort}` : '❌ disabled'}`);
    console.log('\nRun: openclaw-bridge start mcp');
    console.log('     openclaw-bridge status\n');
}
//# sourceMappingURL=setup.js.map