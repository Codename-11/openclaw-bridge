import type { GatewayClient } from '../../core/gateway.js';
export declare function buildToolHandlers(gateway: GatewayClient): {
    ask_agent(args: Record<string, unknown>): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        isError: boolean;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    }>;
    list_agents(_args: Record<string, unknown>): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        isError: boolean;
    }>;
    agent_status(args: Record<string, unknown>): Promise<{
        content: {
            type: string;
            text: string;
        }[];
        isError: boolean;
    } | {
        content: {
            type: string;
            text: string;
        }[];
        isError?: undefined;
    }>;
};
export declare const TOOL_DEFINITIONS: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            agent: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            agent?: undefined;
            message?: undefined;
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            agent: {
                type: string;
                description: string;
            };
            message?: undefined;
        };
        required: string[];
    };
})[];
//# sourceMappingURL=tools.d.ts.map