// [PURIFIED_BY_AETERNA: fb9ba3f0-246b-42f8-aa98-d5b1bc1def94]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: abe3ab0b-78a9-4c92-a15c-7c3fc25dfb20]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: a313003b-bd35-4020-9001-e432f828e27e]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: a313003b-bd35-4020-9001-e432f828e27e]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: c454a4ae-ca2d-462f-bf0c-ecea79512e6f]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 8d97333b-7c6a-432f-9d4c-8d78626ff424]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 8d97333b-7c6a-432f-9d4c-8d78626ff424]
// Suggestion: Review and entrench stable logic.
// [PURIFIED_BY_AETERNA: 980a5700-9ba1-4478-9d4b-dc65adcfe710]
// Suggestion: Review and entrench stable logic.
// @ts-nocheck
import { IModule, ModuleContext, ModuleResult, ModuleStatus } from './ModuleInterface';
import type { ModuleEvent } from '../synthesis/cross-module-sync';
import { getSync } from '../synthesis/cross-module-sync';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   MODULE ADAPTER - The Universal Translator                                   ║
 * ║   Wraps *any* module to make it IModule-compatible.                           ║
 * ║   AUTO-CONNECTS TO CROSSMODULESYNCORCHESTRATOR                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

export interface LegacyModule {
    [key: string]: any;
}

export class ModuleAdapter implements IModule {
    readonly id: string;
    readonly version: string;
    private legacyModule: LegacyModule;
    private primaryMethod: string;

    constructor(
        id: string,
        legacyModule: LegacyModule,
        options?: {
            version?: string;
            primaryMethod?: string;
        }
    ) {
        this.id = id;
        this.legacyModule = legacyModule;
        this.version = options?.version || '1.0.0';
        this.primaryMethod = options?.primaryMethod || this.detectPrimaryMethod();

        // 🔗 AUTO-REGISTER WITH ORCHESTRATOR
        try {
            getSync().registerModule(this.id, this);
            console.log(`🔌 [ModuleAdapter] ${this.id} connected to Orchestrator`);
        } catch (error) {
            console.warn(`⚠️ [ModuleAdapter] ${this.id} could not connect to Orchestrator:`, error);
        }
    }

    /**
     * Auto-detect the main execution method
     * Common patterns: execute, run, process, analyze, scan, fix
     */
    private detectPrimaryMethod(): string {
        const candidates = ['execute', 'run', 'process', 'analyze', 'scan', 'fix', 'start'];
        for (const method of candidates) {
            if (typeof this.legacyModule[method] === 'function') {
                return method;
            }
        }
        // Fallback: find first function
        const firstFunc = Object.keys(this.legacyModule).find(
            key => typeof this.legacyModule[key] === 'function'
        );
        return firstFunc || 'execute';
    }

    async execute(context: ModuleContext): Promise<ModuleResult> {
        const startTime = Date.now();
        const startMem = process.memoryUsage().heapUsed;

        try {
            const method = this.legacyModule[this.primaryMethod];

            if (!method) {
                return {
                    success: false,
                    error: `Method '${this.primaryMethod}' not found in module '${this.id}'`
                };
            }

            // Invoke the legacy method
            const result = await Promise.resolve(method.call(this.legacyModule, context.payload));

            return {
                success: true,
                data: result,
                metrics: {
                    durationMs: Date.now() - startTime,
                    memoryUsage: process.memoryUsage().heapUsed - startMem
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Unknown error',
                metrics: {
                    durationMs: Date.now() - startTime,
                    memoryUsage: process.memoryUsage().heapUsed - startMem
                }
            };
        }
    }

    async health(): Promise<ModuleStatus> {
        // Simple heuristic: if the module exists and has methods, it's READY
        if (this.legacyModule && typeof this.legacyModule === 'object') {
            return 'READY';
        }
        return 'OFFLINE';
    }

    async shutdown(): Promise<void> {
        // Check if module has cleanup method
        if (typeof this.legacyModule.shutdown === 'function') {
            await this.legacyModule.shutdown();
        }
        if (typeof this.legacyModule.cleanup === 'function') {
            await this.legacyModule.cleanup();
        }
    }

    /**
     * Handle sync events from CrossModuleSyncOrchestrator
     */
    handleSyncEvent(event: ModuleEvent): void {
        console.log(`📡 [${this.id}] Received event: ${event.type} from ${event.source}`);

        // If legacy module has event handler, delegate
        if (typeof this.legacyModule.handleSyncEvent === 'function') {
            this.legacyModule.handleSyncEvent(event);
        }

        // Otherwise, log for awareness
        if (event.type === 'SYSTEM_AWAKENING') {
            console.log(`🌟 [${this.id}] Acknowledged system awakening`);
        }
    }

    /**
     * Health check for orchestrator
     */
    healthCheck(): boolean {
        return true;
    }
}

/**
 * Factory function to create adapters from mega-map.json entries
 */
export function createAdapterFromMap(mapEntry: any, moduleInstance: any): IModule {
    return new ModuleAdapter(mapEntry.id, moduleInstance, {
        version: '1.0.0',
        primaryMethod: mapEntry.exports?.[0] || undefined
    });
}
