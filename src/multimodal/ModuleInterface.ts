// [PURIFIED_BY_AETERNA: 86bcab5a-bb55-4112-8b52-4deef0a33580]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: cb15dd05-4a55-4fa5-bd08-85bdc6810292]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 9a3cf055-f395-4dc1-be36-7d86484709ad]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 9a3cf055-f395-4dc1-be36-7d86484709ad]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 9eeb4961-9810-4b72-b390-0ad582ea15f1]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: c855e00f-4735-4c60-81ee-51975e5496bb]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: c855e00f-4735-4c60-81ee-51975e5496bb]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: a0ca4b63-4aad-4258-aaea-56e5456a8400]
// Suggestion: Review and entrench stable logic.
/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   QANTUM PRIME: UNIVERSAL MODULE INTERFACE                                    ║
 * ║   The "USB Port" of the Galaxy.                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

export type ModuleStatus = 'BOOTING' | 'READY' | 'BUSY' | 'ERROR' | 'OFFLINE';

export interface ModuleContext {
    requestId: string;
    timestamp: number;
    payload: any;
    user?: {
        id: string;
        permissions: string[];
    };
}

export interface ModuleResult {
    success: boolean;
    data?: any;
    error?: string;
    metrics?: {
        durationMs: number;
        memoryUsage: number;
    };
}

export interface IModule {
    /**
     * Unique Identifier (e.g., 'RefactorEngine', 'GhostShield')
     */
    readonly id: string;

    /**
     * Semantic Version
     */
    readonly version: string;

    /**
     * The Standard Execution Point.
     * Every module must be callable via this method.
     */
    execute(context: ModuleContext): Promise<ModuleResult>;

    /**
     * Health Check for the Dashboard.
     * Returns the current pulse of the module.
     */
    health(): Promise<ModuleStatus>;

    /**
     * Optional: Graceful Shutdown
     */
    shutdown?(): Promise<void>;
}
