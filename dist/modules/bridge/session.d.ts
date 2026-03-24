export declare class CCSession {
    private projectDir;
    private sessionId;
    private active;
    create(projectDir: string): Promise<void>;
    sendMessage(message: string): Promise<string>;
    resume(sessionId: string): Promise<void>;
    getSessionId(): string;
    isActive(): boolean;
}
//# sourceMappingURL=session.d.ts.map