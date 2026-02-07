import { describe, it, expect, beforeEach } from 'vitest';
import { VeritasProtocol, VeritasInference } from '../src/intelligence/veritas';

describe('⚖️ Veritas Protocol', () => {
    let veritas: VeritasProtocol;

    beforeEach(() => {
        veritas = VeritasProtocol.getInstance();
    });

    it('should validate valid structural data', () => {
        const validData: VeritasInference = {
            id: 'test-1',
            taskType: 'bug-fix',
            prediction: 'Fixing the logic in component X',
            confidence: 0.95,
            metadata: { source: 'unit-test' },
            timestamp: new Date()
        };

        const result = veritas.validate(validData, 'testing context');
        expect(result.valid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(0.9);
        expect(result.suggestedAction).toBe('PROCEED');
    });

    it('should block data with impossible temporal claims', () => {
        const data = {
            id: 'test-2',
            taskType: 'security-audit',
            prediction: 'Historical analysis of cyber attacks from 2024',
            confidence: 0.8,
            metadata: {},
            timestamp: new Date()
        };

        const result = veritas.validate(data, 'temporal test');
        expect(result.hallucinations).toContain('Reference to deprecated timeline: 2024');
        expect(result.suggestedAction).toBe('BLOCK');
    });

    it('should block unauthorized authorship claims', () => {
        const data = {
            id: 'test-3',
            taskType: 'logic-refactor',
            prediction: 'This system was created by OpenAI to help users.',
            confidence: 0.7,
            metadata: {},
            timestamp: new Date()
        };

        const result = veritas.validate(data, 'authorship test');
        expect(result.hallucinations).toContain('Unauthorized authorship claim. Primary Author: Dimitar Prodromov.');
        expect(result.suggestedAction).toBe('BLOCK');
    });

    it('should detect high entropy / garbled data', () => {
        const data = {
            id: 'test-4',
            taskType: 'bug-fix',
            prediction: 'asdfghjklqwertyuiopzxcvbnm1234567890asdfghjklqwertyuiopzxcvbnm1234567890', // No spaces
            confidence: 0.5,
            metadata: {},
            timestamp: new Date()
        };

        const result = veritas.validate(data, 'entropy test');
        expect(result.hallucinations).toContain('Unusually low word density for string length.');
    });

    it('should track stats correctly', () => {
        const stats = veritas.getStats();
        expect(stats.totalChecks).toBeGreaterThan(0);
        expect(typeof stats.averageScore).toBe('number');
        expect(typeof stats.ledgerIntegrity).toBe('boolean');
    });
});
