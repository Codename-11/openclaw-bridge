"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.getConfigPath = getConfigPath;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const CONFIG_DIR = (0, path_1.join)((0, os_1.homedir)(), '.openclaw-bridge');
const CONFIG_PATH = (0, path_1.join)(CONFIG_DIR, 'config.json');
const DEFAULT_CONFIG = {
    gateway: {
        url: 'http://localhost:18789',
        token: '',
    },
    modules: {
        mcp: { enabled: true },
        bridge: {
            enabled: false,
            port: 9999,
            defaultProject: '',
        },
        relay: { enabled: false },
    },
};
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
function loadConfig() {
    let fileConfig = {};
    if ((0, fs_1.existsSync)(CONFIG_PATH)) {
        try {
            const raw = (0, fs_1.readFileSync)(CONFIG_PATH, 'utf-8');
            fileConfig = JSON.parse(raw);
        }
        catch {
            // ignore parse errors, use defaults
        }
    }
    const config = {
        gateway: {
            url: fileConfig.gateway?.url ?? DEFAULT_CONFIG.gateway.url,
            token: fileConfig.gateway?.token ?? DEFAULT_CONFIG.gateway.token,
        },
        modules: {
            mcp: {
                enabled: fileConfig.modules?.mcp?.enabled ?? DEFAULT_CONFIG.modules.mcp.enabled,
            },
            bridge: {
                enabled: fileConfig.modules?.bridge?.enabled ?? DEFAULT_CONFIG.modules.bridge.enabled,
                port: fileConfig.modules?.bridge?.port ?? DEFAULT_CONFIG.modules.bridge.port,
                defaultProject: fileConfig.modules?.bridge?.defaultProject ?? DEFAULT_CONFIG.modules.bridge.defaultProject,
            },
            relay: {
                enabled: fileConfig.modules?.relay?.enabled ?? DEFAULT_CONFIG.modules.relay.enabled,
            },
        },
    };
    // Env var overrides
    if (process.env.OPENCLAW_GATEWAY_URL) {
        config.gateway.url = process.env.OPENCLAW_GATEWAY_URL;
    }
    if (process.env.OPENCLAW_GATEWAY_TOKEN) {
        config.gateway.token = process.env.OPENCLAW_GATEWAY_TOKEN;
    }
    return config;
}
function saveConfig(config) {
    if (!(0, fs_1.existsSync)(CONFIG_DIR)) {
        (0, fs_1.mkdirSync)(CONFIG_DIR, { recursive: true });
    }
    (0, fs_1.writeFileSync)(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
function getConfigPath() {
    return CONFIG_PATH;
}
//# sourceMappingURL=config.js.map