import { describe, it, expect, beforeEach } from 'vitest';
import { SovereignLedger } from '../src/omega/SovereignLedger';
import * as fs from 'fs';
import * as path from 'path';

describe('📜 Sovereign Ledger', () => {
    let ledger: SovereignLedger;

    beforeEach(() => {
        ledger = SovereignLedger.getInstance();
    });

    it('should append blocks and maintain integrity', async () => {
        const action = 'TEST_ACTION';
        const payload = { data: 'test-payload' };

        const block = await ledger.append(action, payload);

        expect(block.action).toBe(action);
        expect(block.index).toBeGreaterThanOrEqual(0);
        expect(block.hash.length).toBe(128); // SHA-512

        const verification = ledger.verifyIntegrity();
        expect(verification.valid).toBe(true);
    });

    it('should detect data corruption', async () => {
        const ledgerPath = path.join(process.cwd(), 'data', 'sovereign.ledger');
        if (fs.existsSync(ledgerPath)) {
            const content = fs.readFileSync(ledgerPath, 'utf8');
            const lines = content.trim().split('\n');
            if (lines.length > 0) {
                // Corrupt the last block
                const lastBlock = JSON.parse(lines[lines.length - 1]);
                lastBlock.action = 'CORRUPTED_ACTION';
                lines[lines.length - 1] = JSON.stringify(lastBlock);

                fs.writeFileSync(ledgerPath, lines.join('\n') + '\n');

                const verification = ledger.verifyIntegrity();
                expect(verification.valid).toBe(false);
                expect(verification.error).toContain('Data corruption');
            }
        }
    });

    it('should retrieve history', () => {
        const history = ledger.getHistory(5);
        expect(Array.isArray(history)).toBe(true);
        if (history.length > 0) {
            expect(history[history.length - 1]).toHaveProperty('hash');
        }
    });
});
