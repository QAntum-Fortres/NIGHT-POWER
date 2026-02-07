/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                    🛡️ THE PERSONAL SOVEREIGNTY MODULE 🛡️                      ║
 * ║                                                                               ║
 * ║  "В QAntum не лъжем."                                                         ║
 * ║                                                                               ║
 * ║  This module generates and validates the Unique Sovereignty Key (USK)         ║
 * ║  based on hardware fingerprint + biometric rhythm.                            ║
 * ║                                                                               ║
 * ║  Created: January 1, 2026 17:05                                               ║
 * ║  Author: Mister Mind for Dimitar Prodromov                                    ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */
interface SovereigntyReport {
    isAuthorized: boolean;
    identityMatch: boolean;
    hardwareMatch: boolean;
    biometricSync: boolean;
    timestamp: number;
    machineFingerprint: string;
    threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
interface HardwareDNA {
    motherboard: string;
    uuid: string;
    cpuId: string;
    diskSerial: string;
    macAddresses: string[];
    hostname: string;
    username: string;
}
export declare class Sovereignty {
    private static failedAttempts;
    private static readonly MAX_ATTEMPTS;
    private static readonly SOVEREIGNTY_PATH;
    /**
     * 🧬 Extract the complete Hardware DNA
     * Motherboard + UUID + CPU + Disk + MAC + Identity
     */
    static extractHardwareDNA(): HardwareDNA;
    /**
     * 🔐 Generate SHA-512 Sovereignty Hash from Hardware DNA
     */
    static generateSovereigntyHash(dna?: HardwareDNA): string;
    /**
     * 🧠 Get Biometric Rhythm (simulated via system metrics)
     * In production, this would connect to HardwareBridge for real biometrics
     */
    static getBiometricRhythm(): string;
    /**
     * 🛡️ MAIN VERIFICATION: Check if current machine is the Sovereign Owner
     */
    static verifyOwner(): SovereigntyReport;
    /**
     * Verify against stored sovereignty seal (for development)
     */
    private static verifyAgainstSeal;
    /**
     * Create initial sovereignty seal
     */
    private static createSeal;
    /**
     * Record failed verification attempt
     */
    private static recordFailedAttempt;
    /**
     * 💀 TOMBSTONE PROTOCOL - Level 3 Self-Destruction
     */
    static initiateSelfDestruct(): void;
    /**
     * Check if system is tombstoned
     */
    static isTombstoned(): boolean;
    /**
     * 🔥 THE POISON PILL: Polymorphic Obfuscation
     * If compiled on wrong machine, scramble all source files
     */
    static activatePoisonPill(targetDir: string): void;
    /**
     * Get current sovereignty status for display
     */
    static getStatus(): {
        icon: string;
        text: string;
        color: string;
    };
}
export default Sovereignty;
