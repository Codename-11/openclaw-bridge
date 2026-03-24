import type { Config } from '../../core/config.js';
import type { BridgeModule } from '../../types.js';
export declare class RelayModule implements BridgeModule {
    name: string;
    description: string;
    init(_config: Config): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    health(): {
        ok: boolean;
        details: string;
    };
}
//# sourceMappingURL=index.d.ts.map