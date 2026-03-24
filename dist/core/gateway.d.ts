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
    askAgentForDiscord(agent: string, channel: string, limit: number): Promise<string>;
    askAgentToSendDiscord(agent: string, channel: string, message: string): Promise<string>;
    askAgentToNotify(agent: string, targetChannel: string, message: string): Promise<string>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=gateway.d.ts.map