/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SOVEREIGN LEDGER - The Immutable Truth
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "Всяко решение е запечатано с хеш. Бъдещето се гради върху неизтриваемо минало."
 * 
 * This module implements:
 * - Content Hashing (SHA-512) for every system decision.
 * - Chained Integrity: Each block contains the hash of the previous one.
 * - Local Persistence: Sealed ledger file `./data/sovereign.ledger`.
 * - Veritas Integration: Critical validation results are automatically logged.
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. All Rights Reserved.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface LedgerBlock {
    index: number;
    timestamp: string;
    action: string;
    payload: Record<string, unknown>;
    previousHash: string;
    hash: string;
    signature: string;
}

export class SovereignLedger {
    private static instance: SovereignLedger;
    private readonly LEDGER_PATH = path.join(process.cwd(), 'data', 'sovereign.ledger');
    private lastHash: string = '0'.repeat(128);
    private currentIndex: number = 0;

    private constructor() {
        this.ensureDataDirectory();
        this.loadLastState();
        console.log(`📜 [LEDGER] Sovereign Ledger active. Integrity chain at block #${this.currentIndex}`);
    }

    public static getInstance(): SovereignLedger {
        if (!SovereignLedger.instance) {
            SovereignLedger.instance = new SovereignLedger();
        }
        return SovereignLedger.instance;
    }

    private ensureDataDirectory() {
        const dir = path.dirname(this.LEDGER_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private loadLastState() {
        if (fs.existsSync(this.LEDGER_PATH)) {
            try {
                const lines = fs.readFileSync(this.LEDGER_PATH, 'utf8').trim().split('\n');
                if (lines.length > 0) {
                    const lastBlock = JSON.parse(lines[lines.length - 1]) as LedgerBlock;
                    this.lastHash = lastBlock.hash;
                    this.currentIndex = lastBlock.index + 1;
                }
            } catch (e) {
                console.error('⚠️ [LEDGER] Corruption detected in ledger file. Initializing emergency recovery...');
                this.backupCorruptedLedger();
            }
        }
    }

    private backupCorruptedLedger() {
        const backupPath = `${this.LEDGER_PATH}.corrupted.${Date.now()}`;
        if (fs.existsSync(this.LEDGER_PATH)) {
            fs.renameSync(this.LEDGER_PATH, backupPath);
        }
        this.lastHash = '0'.repeat(128);
        this.currentIndex = 0;
    }

    /**
     * Append a new decision to the ledger
     */
    public async append(action: string, payload: Record<string, unknown>): Promise<LedgerBlock> {
        const timestamp = new Date().toISOString();
        const previousHash = this.lastHash;
        const index = this.currentIndex;

        // Create block content string with guaranteed field order
        const blockContent = JSON.stringify({
            index,
            timestamp,
            action,
            payload,
            previousHash
        });

        // Hash with SHA-512
        const hash = crypto.createHash('sha512').update(blockContent).digest('hex');

        // Simulate Dimitar's signature (In production, this would be a real RSA/ECDSA signature)
        const signature = crypto.createHmac('sha256', 'DIMITAR_SIGNATURE_KEY').update(hash).digest('hex');

        const block: LedgerBlock = {
            index,
            timestamp,
            action,
            payload,
            previousHash,
            hash,
            signature
        };

        // Atomic append to file
        fs.appendFileSync(this.LEDGER_PATH, JSON.stringify(block) + '\n');

        this.lastHash = hash;
        this.currentIndex++;

        return block;
    }

    /**
     * Comprehensive integrity check of the entire chain
     */
    public verifyIntegrity(): { valid: boolean; error?: string; processedBlocks: number } {
        if (!fs.existsSync(this.LEDGER_PATH)) return { valid: true, processedBlocks: 0 };

        const lines = fs.readFileSync(this.LEDGER_PATH, 'utf8').trim().split('\n');
        let expectedPreviousHash = '0'.repeat(128);

        for (let i = 0; i < lines.length; i++) {
            const block = JSON.parse(lines[i]) as LedgerBlock;

            // 1. Verify index
            if (block.index !== i) return { valid: false, error: `Index mismatch at line ${i}`, processedBlocks: i };

            // 2. Verify previous hash link
            if (block.previousHash !== expectedPreviousHash) {
                return { valid: false, error: `Hash chain broken at block #${i}`, processedBlocks: i };
            }

            // 3. Recalculate and verify current hash with same field order
            const blockContent = JSON.stringify({
                index: block.index,
                timestamp: block.timestamp,
                action: block.action,
                payload: block.payload,
                previousHash: block.previousHash
            });
            const recalculatedHash = crypto.createHash('sha512').update(blockContent).digest('hex');

            if (recalculatedHash !== block.hash) {
                return { valid: false, error: `Data corruption at block #${i}`, processedBlocks: i };
            }

            expectedPreviousHash = block.hash;
        }

        return { valid: true, processedBlocks: lines.length };
    }

    public getHistory(limit: number = 50): LedgerBlock[] {
        if (!fs.existsSync(this.LEDGER_PATH)) return [];

        const lines = fs.readFileSync(this.LEDGER_PATH, 'utf8').trim().split('\n');
        return lines.slice(-limit).map(l => JSON.parse(l));
    }
}
