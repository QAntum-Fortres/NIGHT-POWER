import { ICognitiveModule, CognitiveAction, CognitiveObservation, CognitiveActionType } from './types.js';

export class DecryptionEngine implements ICognitiveModule {
    public readonly id = 'decryption-engine';

    public getName(): string {
        return 'Decryption Engine';
    }

    public async execute(action: CognitiveAction): Promise<CognitiveObservation> {
        const payload = action.payload as { content: string };
        const content = payload.content;

        try {
            const decoded = this.attemptDecode(content);

            if (this.isJson(decoded)) {
                const parsed = JSON.parse(decoded);
                return this.buildSuccessResponse('DECODED_JSON', {
                    type: typeof parsed,
                    preview: JSON.stringify(parsed).substring(0, 100),
                    data: parsed
                });
            } else if (decoded !== content) {
                return this.buildSuccessResponse('DECODED_RAW', {
                    preview: decoded.substring(0, 100),
                    data: decoded
                });
            } else {
                return this.buildErrorResponse(content);
            }

        } catch (e: unknown) {
            const error = e instanceof Error ? e.message : String(e);
            return this.buildErrorResponse(content, error);
        }
    }

    private attemptDecode(input: string): string {
        const cleanInput = input.trim().replace(/\s/g, '');

        // Strategy A: Base64
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        if (base64Regex.test(cleanInput)) {
            try {
                return Buffer.from(cleanInput, 'base64').toString('utf8');
            } catch { /* Fallthrough */ }
        }

        // Strategy B: Hex
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (hexRegex.test(cleanInput)) {
            try {
                return Buffer.from(cleanInput, 'hex').toString('utf8');
            } catch { /* Fallthrough */ }
        }

        return input;
    }

    private isJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    private buildSuccessResponse(status: string, data: unknown): CognitiveObservation {
        return {
            action: CognitiveActionType.DECRYPT_VAULT,
            result: { status, data },
            timestamp: Date.now(),
            success: true
        };
    }

    private buildErrorResponse(content: string, error?: string): CognitiveObservation {
        return {
            action: CognitiveActionType.DECRYPT_VAULT,
            result: {
                status: 'NOT_DECODED',
                preview: content.substring(0, 20)
            },
            timestamp: Date.now(),
            success: false,
            error
        };
    }
}
