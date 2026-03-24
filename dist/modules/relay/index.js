"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayModule = void 0;
class RelayModule {
    name = 'relay';
    description = 'Voxel Relay device communication (coming soon)';
    async init(_config) {
        // no-op
    }
    async start() {
        // no-op
    }
    async stop() {
        // no-op
    }
    health() {
        return { ok: false, details: 'Not implemented' };
    }
}
exports.RelayModule = RelayModule;
//# sourceMappingURL=index.js.map