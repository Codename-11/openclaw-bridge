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
    discord_recent(args: Record<string, unknown>): Promise<{
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
    discord_send(args: Record<string, unknown>): Promise<{
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
    notify(args: Record<string, unknown>): Promise<{
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
    check_steering(_args: Record<string, unknown>): Promise<{
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
    project_memory_read(args: Record<string, unknown>): Promise<{
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
    project_memory_write(args: Record<string, unknown>): Promise<{
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
    announce(args: Record<string, unknown>): Promise<{
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
    start_bridge(args: Record<string, unknown>): Promise<{
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
    stop_bridge(args: Record<string, unknown>): Promise<{
        content: {
            type: string;
            text: string;
        }[];
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
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
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
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
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
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            channel: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            channel: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
            agent?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            message: {
                type: string;
                description: string;
            };
            urgent: {
                type: string;
                description: string;
            };
            agent?: undefined;
            channel?: undefined;
            limit?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            key: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            value?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            key: {
                type: string;
                description: string;
            };
            value: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            status?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            status: {
                type: string;
                description: string;
            };
            channel: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            port?: undefined;
            project?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            port: {
                type: string;
                description: string;
            };
            project: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
        };
        required: never[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            port: {
                type: string;
                description: string;
            };
            agent?: undefined;
            message?: undefined;
            channel?: undefined;
            limit?: undefined;
            urgent?: undefined;
            key?: undefined;
            value?: undefined;
            status?: undefined;
            project?: undefined;
        };
        required: never[];
    };
})[];
//# sourceMappingURL=tools.d.ts.map