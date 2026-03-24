"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatus = runStatus;
const config_js_1 = require("../core/config.js");
const gateway_js_1 = require("../core/gateway.js");
async function runStatus() {
    const config = (0, config_js_1.loadConfig)();
    console.log('\n📊 openclaw-bridge status\n');
    // Gateway health
    const gateway = new gateway_js_1.GatewayClient(config.gateway);
    process.stdout.write(`  Gateway (${config.gateway.url})... `);
    const healthy = await gateway.healthCheck();
    console.log(healthy ? '✅ reachable' : '❌ unreachable');
    // Module status (config-level)
    console.log('\n  Modules (from config):');
    const mods = config.modules;
    console.log(`    mcp:    ${mods.mcp.enabled ? '✅ enabled' : '⚪ disabled'}`);
    console.log(`    bridge: ${mods.bridge.enabled ? `✅ enabled (port ${mods.bridge.port})` : '⚪ disabled'}`);
    console.log(`    relay:  ${mods.relay.enabled ? '✅ enabled' : '⚪ disabled'}`);
    if (healthy) {
        try {
            const agents = await gateway.listAgents();
            console.log(`\n  Agents available: ${agents.length}`);
            for (const a of agents) {
                console.log(`    - ${a.name}`);
            }
        }
        catch {
            console.log('\n  Could not list agents');
        }
    }
    console.log();
}
//# sourceMappingURL=status.js.map