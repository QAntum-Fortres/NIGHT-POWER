/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║   🛰️ VAULT DECRYPTOR v1.0.0                                                    ║
 * ║   Advanced Phishing & Obfuscated Payload Protection                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { DecryptionEngine } from './decryption-engine.js';
import { ICognitiveModule, CognitiveAction, CognitiveObservation, CognitiveActionType } from './types.js';

export class VaultDecryptor implements ICognitiveModule {
    public readonly id = 'vault-decryptor';
    private engine: DecryptionEngine;

    constructor() {
        this.engine = new DecryptionEngine();
    }

    public getName(): string {
        return 'Vault Phishing Decryptor';
    }

    public async execute(action: CognitiveAction): Promise<CognitiveObservation> {
        const payload = action.payload as { source: string, content: string };
        const source = payload?.source || 'unknown';
        const content = payload?.content || '';

        console.log(`[VAULT] Analyzing content from ${source}...`);

        const blobs = this.extractEncodedBlobs(content);
        const detections = [];

        for (const blob of blobs) {
            const decodedObs = await this.engine.execute({
                type: CognitiveActionType.DECRYPT_VAULT,
                payload: { content: blob }
            });

            if (decodedObs.success) {
                const data = decodedObs.result as { status: string, data: unknown };
                detections.push({
                    original: blob,
                    decoded: data.data,
                    threatLevel: this.assessThreat(data.data)
                });
            }
        }

        const result = {
            source,
            blobsFound: blobs.length,
            detections,
            isSafe: detections.every(r => r.threatLevel === 'LOW'),
            timestamp: Date.now()
        };

        return {
            action: CognitiveActionType.DECRYPT_VAULT,
            result,
            timestamp: Date.now(),
            success: true
        };
    }

    private extractEncodedBlobs(content: string): string[] {
        const base64Regex = /[A-Za-z0-9+/]{20,}={0,2}/g;
        return content.match(base64Regex) || [];
    }

    private assessThreat(decoded: unknown): 'LOW' | 'MEDIUM' | 'HIGH' {
        const contentStr = JSON.stringify(decoded).toLowerCase();
        const markers = ['drainer', 'approve', 'private_key', 'seed', 'transfer', 'login'];

        if (markers.some(m => contentStr.includes(m))) return 'HIGH';
        if (contentStr.includes('http')) return 'MEDIUM';

        return 'LOW';
    }
}
