import type { CCSession } from './session.js';
export declare class BridgeListener {
    private port;
    private session;
    private server;
    constructor(port: number, session: CCSession);
    start(): Promise<void>;
    stop(): Promise<void>;
}
//# sourceMappingURL=listener.d.ts.map