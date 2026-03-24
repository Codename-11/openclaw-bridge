"use strict";
// Programmatic API export for openclaw-bridge
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayModule = exports.BridgeModuleImpl = exports.McpModule = exports.createLogger = exports.GatewayClient = exports.getConfigPath = exports.saveConfig = exports.loadConfig = void 0;
var config_js_1 = require("./core/config.js");
Object.defineProperty(exports, "loadConfig", { enumerable: true, get: function () { return config_js_1.loadConfig; } });
Object.defineProperty(exports, "saveConfig", { enumerable: true, get: function () { return config_js_1.saveConfig; } });
Object.defineProperty(exports, "getConfigPath", { enumerable: true, get: function () { return config_js_1.getConfigPath; } });
var gateway_js_1 = require("./core/gateway.js");
Object.defineProperty(exports, "GatewayClient", { enumerable: true, get: function () { return gateway_js_1.GatewayClient; } });
var logger_js_1 = require("./core/logger.js");
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_js_1.createLogger; } });
var index_js_1 = require("./modules/mcp/index.js");
Object.defineProperty(exports, "McpModule", { enumerable: true, get: function () { return index_js_1.McpModule; } });
var index_js_2 = require("./modules/bridge/index.js");
Object.defineProperty(exports, "BridgeModuleImpl", { enumerable: true, get: function () { return index_js_2.BridgeModuleImpl; } });
var index_js_3 = require("./modules/relay/index.js");
Object.defineProperty(exports, "RelayModule", { enumerable: true, get: function () { return index_js_3.RelayModule; } });
//# sourceMappingURL=index.js.map