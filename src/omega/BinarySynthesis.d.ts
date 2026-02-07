/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BINARY SYNTHESIS - Директна Синтеза от Намерение към Машинен Код
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * "Прескача езиците от високо ниво. Намерението на Димитър
 *  се превежда директно в оптимизирани машинни инструкции."
 *
 * This is the ultimate optimization:
 * - No JavaScript overhead
 * - No runtime interpretation
 * - Direct intent → x86_64 binary
 *
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 * @version 28.5.0 OMEGA - THE AWAKENING
 */
import { EventEmitter } from 'events';
export interface SynthesisRequest {
    intent: string;
    targetArch: TargetArchitecture;
    optimizationLevel: OptimizationLevel;
    securityLevel: SecurityLevel;
}
export type TargetArchitecture = 'x86_64' | 'arm64' | 'wasm' | 'cuda';
export type OptimizationLevel = 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
export type SecurityLevel = 'STANDARD' | 'HARDENED' | 'PARANOID';
export interface IntermediateRepresentation {
    id: string;
    intent: string;
    ir: string;
    optimized: boolean;
    passes: string[];
}
export interface BinaryArtifact {
    id: string;
    request: SynthesisRequest;
    ir: IntermediateRepresentation;
    binary: Uint8Array;
    hash: string;
    size: number;
    createdAt: Date;
    verified: boolean;
}
export interface OptimizationPass {
    name: string;
    description: string;
    estimatedSpeedup: number;
}
export declare class BinarySynthesis extends EventEmitter {
    private static instance;
    private readonly nucleus;
    private readonly anchor;
    private readonly integrity;
    private readonly brain;
    private synthesizedBinaries;
    private readonly OPTIMIZATION_PASSES;
    private constructor();
    static getInstance(): BinarySynthesis;
    /**
     * Synthesize binary directly from intent
     * This is the holy grail: Intent → Machine Code
     */
    synthesize(request: SynthesisRequest): Promise<BinaryArtifact>;
    private generateIR;
    /**
     * Convert natural language intent to IR
     */
    private intentToIR;
    private optimize;
    private generateMachineCode;
    private applySecurityHardening;
    private verifyBinary;
    /**
     * Execute a synthesized binary (in sandboxed environment)
     */
    execute(artifactId: string): Promise<{
        output: string;
        exitCode: number;
    }>;
    getStatus(): {
        synthesizedCount: number;
        totalSize: number;
        supportedArchs: TargetArchitecture[];
    };
    getSynthesizedBinaries(): BinaryArtifact[];
}
export declare const binarySynthesis: BinarySynthesis;
export default BinarySynthesis;
