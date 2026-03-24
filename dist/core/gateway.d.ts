import type { GatewayConfig } from './config.js';
export interface Agent {
    id: string;
    name: string;
    ownedBy?: string;
    created?: number;
}
export declare class GatewayClient {
    private url;
    private token;
    constructor(config: GatewayConfig);
    private headers;
    askAgent(agent: string, message: string): Promise<string>;
    listAgents(): Promise<Agent[]>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=gateway.d.ts.map