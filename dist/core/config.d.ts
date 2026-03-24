export interface GatewayConfig {
    url: string;
    token: string;
}
export interface McpModuleConfig {
    enabled: boolean;
}
export interface BridgeModuleConfig {
    enabled: boolean;
    port: number;
    defaultProject: string;
}
export interface RelayModuleConfig {
    enabled: boolean;
}
export interface ModulesConfig {
    mcp: McpModuleConfig;
    bridge: BridgeModuleConfig;
    relay: RelayModuleConfig;
}
export interface Config {
    gateway: GatewayConfig;
    modules: ModulesConfig;
}
declare const DEFAULT_CONFIG: Config;
export declare function loadConfig(): Config;
export declare function saveConfig(config: Config): void;
export declare function getConfigPath(): string;
export { DEFAULT_CONFIG };
//# sourceMappingURL=config.d.ts.map