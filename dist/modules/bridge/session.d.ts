export declare class CCSession {
    private projectDir;
    private sessionId;
    private active;
    private continueMode;
    create(projectDir: string): Promise<void>;
    resume(sessionId: string): Promise<void>;
    continueLatest(projectDir?: string): Promise<void>;
    sendMessage(message: string): Promise<string>;
    getSessionId(): string;
    isActive(): boolean;
    isContinueMode(): boolean;
}
//# sourceMappingURL=session.d.ts.map