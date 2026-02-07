/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM VISUAL SNAPSHOT TESTING                                              ║
 * ║   "DOM and JSON snapshot comparisons"                                         ║
 * ║                                                                               ║
 * ║   TODO B #34 - Visual Testing: Snapshot support                               ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SnapshotConfig {
    snapshotDir: string;
    updateSnapshots: boolean;
    serializers: SnapshotSerializer[];
    resolveSnapshotPath?: (testPath: string, snapshotName: string) => string;
}

export interface SnapshotSerializer {
    name: string;
    test: (value: any) => boolean;
    serialize: (value: any) => string;
}

export interface SnapshotResult {
    match: boolean;
    isNew: boolean;
    updated: boolean;
    snapshotPath: string;
    expected?: string;
    actual: string;
    diff?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOT MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class SnapshotManager {
    private static instance: SnapshotManager;
    private config: SnapshotConfig;
    private snapshotCounts = new Map<string, number>();

    private constructor(config: Partial<SnapshotConfig> = {}) {
        this.config = {
            snapshotDir: config.snapshotDir || './__snapshots__',
            updateSnapshots: config.updateSnapshots ?? false,
            serializers: config.serializers || [],
            resolveSnapshotPath: config.resolveSnapshotPath
        };

        // Add default serializers
        this.addDefaultSerializers();
    }

    static getInstance(config?: Partial<SnapshotConfig>): SnapshotManager {
        if (!SnapshotManager.instance) {
            SnapshotManager.instance = new SnapshotManager(config);
        }
        return SnapshotManager.instance;
    }

    static configure(config: Partial<SnapshotConfig>): SnapshotManager {
        SnapshotManager.instance = new SnapshotManager(config);
        return SnapshotManager.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SERIALIZERS
    // ─────────────────────────────────────────────────────────────────────────

    private addDefaultSerializers(): void {
        // HTML serializer
        this.config.serializers.push({
            name: 'html',
            test: (value) => typeof value === 'string' && value.trim().startsWith('<'),
            serialize: (value) => this.formatHTML(value)
        });

        // Date serializer
        this.config.serializers.push({
            name: 'date',
            test: (value) => value instanceof Date,
            serialize: (value) => `Date { ${value.toISOString()} }`
        });

        // Buffer serializer
        this.config.serializers.push({
            name: 'buffer',
            test: (value) => Buffer.isBuffer(value),
            serialize: (value) => `Buffer { length: ${value.length}, hash: ${
                crypto.createHash('md5').update(value).digest('hex').slice(0, 8)
            } }`
        });

        // Function serializer
        this.config.serializers.push({
            name: 'function',
            test: (value) => typeof value === 'function',
            serialize: (value) => `[Function: ${value.name || 'anonymous'}]`
        });

        // Map serializer
        this.config.serializers.push({
            name: 'map',
            test: (value) => value instanceof Map,
            serialize: (value) => {
                const obj = Object.fromEntries(value);
                return `Map ${this.serialize(obj)}`;
            }
        });

        // Set serializer
        this.config.serializers.push({
            name: 'set',
            test: (value) => value instanceof Set,
            serialize: (value) => {
                const arr = [...value];
                return `Set ${this.serialize(arr)}`;
            }
        });
    }

    /**
     * Add custom serializer
     */
    addSerializer(serializer: SnapshotSerializer): void {
        this.config.serializers.unshift(serializer);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SNAPSHOT OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Match snapshot
     */
    async matchSnapshot(testName: string, value: any, snapshotName?: string): Promise<SnapshotResult> {
        const count = (this.snapshotCounts.get(testName) || 0) + 1;
        this.snapshotCounts.set(testName, count);

        const name = snapshotName || `${testName} ${count}`;
        const serialized = this.serialize(value);
        const snapshotPath = this.getSnapshotPath(testName, name);

        // Check if snapshot exists
        let existing: string | null = null;
        try {
            existing = await fs.promises.readFile(snapshotPath, 'utf-8');
        } catch {
            // Snapshot doesn't exist
        }

        // New snapshot
        if (existing === null) {
            await this.saveSnapshot(snapshotPath, name, serialized);
            return {
                match: true,
                isNew: true,
                updated: false,
                snapshotPath,
                actual: serialized
            };
        }

        // Extract snapshot content
        const expected = this.extractSnapshot(existing, name);

        // Compare
        if (expected === serialized) {
            return {
                match: true,
                isNew: false,
                updated: false,
                snapshotPath,
                expected,
                actual: serialized
            };
        }

        // Mismatch
        if (this.config.updateSnapshots) {
            await this.updateSnapshot(snapshotPath, name, serialized);
            return {
                match: true,
                isNew: false,
                updated: true,
                snapshotPath,
                expected,
                actual: serialized
            };
        }

        return {
            match: false,
            isNew: false,
            updated: false,
            snapshotPath,
            expected,
            actual: serialized,
            diff: this.generateDiff(expected, serialized)
        };
    }

    /**
     * Assert snapshot matches
     */
    async assertSnapshot(testName: string, value: any, snapshotName?: string): Promise<void> {
        const result = await this.matchSnapshot(testName, value, snapshotName);

        if (!result.match) {
            throw new Error(
                `Snapshot mismatch for "${snapshotName || testName}":\n\n` +
                `Expected:\n${result.expected}\n\n` +
                `Actual:\n${result.actual}\n\n` +
                `Diff:\n${result.diff}`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INLINE SNAPSHOTS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Match inline snapshot
     */
    matchInlineSnapshot(value: any, inlineSnapshot?: string): { match: boolean; actual: string } {
        const serialized = this.serialize(value);

        if (inlineSnapshot === undefined) {
            return { match: true, actual: serialized };
        }

        const expected = inlineSnapshot.trim();
        const actual = serialized.trim();

        return {
            match: expected === actual,
            actual: serialized
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROPERTY MATCHERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Match snapshot with property matchers
     */
    async matchSnapshotWithMatchers(
        testName: string,
        value: any,
        matchers: Record<string, (v: any) => boolean>
    ): Promise<SnapshotResult> {
        // Replace matched properties with placeholders
        const processed = this.applyMatchers(value, matchers);
        return this.matchSnapshot(testName, processed);
    }

    private applyMatchers(value: any, matchers: Record<string, (v: any) => boolean>): any {
        if (typeof value !== 'object' || value === null) {
            return value;
        }

        const result: any = Array.isArray(value) ? [] : {};

        for (const key of Object.keys(value)) {
            if (matchers[key]) {
                result[key] = matchers[key](value[key]) ? `[${key}]` : value[key];
            } else if (typeof value[key] === 'object' && value[key] !== null) {
                result[key] = this.applyMatchers(value[key], matchers);
            } else {
                result[key] = value[key];
            }
        }

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SERIALIZATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Serialize value
     */
    serialize(value: any): string {
        // Check custom serializers first
        for (const serializer of this.config.serializers) {
            if (serializer.test(value)) {
                return serializer.serialize(value);
            }
        }

        // Default serialization
        if (value === undefined) {
            return 'undefined';
        }

        if (value === null) {
            return 'null';
        }

        if (typeof value === 'string') {
            return `"${value}"`;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            const items = value.map(v => this.serialize(v));
            return `[\n${items.map(i => '  ' + i).join(',\n')}\n]`;
        }

        if (typeof value === 'object') {
            const keys = Object.keys(value);
            if (keys.length === 0) return '{}';

            const entries = keys.map(k => {
                const serialized = this.serialize(value[k]);
                return `  "${k}": ${serialized}`;
            });

            return `{\n${entries.join(',\n')}\n}`;
        }

        return String(value);
    }

    /**
     * Format HTML
     */
    private formatHTML(html: string): string {
        let formatted = '';
        let indent = 0;
        const lines = html.split(/(?=<)|(?<=>)/);

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('</')) {
                indent--;
                formatted += '  '.repeat(indent) + trimmed + '\n';
            } else if (trimmed.startsWith('<') && !trimmed.endsWith('/>') && !trimmed.includes('</')) {
                formatted += '  '.repeat(indent) + trimmed + '\n';
                if (!trimmed.includes('<!') && !trimmed.includes('<?')) {
                    indent++;
                }
            } else {
                formatted += '  '.repeat(indent) + trimmed + '\n';
            }
        }

        return formatted.trim();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FILE OPERATIONS
    // ─────────────────────────────────────────────────────────────────────────

    private getSnapshotPath(testName: string, snapshotName: string): string {
        if (this.config.resolveSnapshotPath) {
            return this.config.resolveSnapshotPath(testName, snapshotName);
        }

        const filename = this.sanitizeName(testName) + '.snap';
        return path.join(this.config.snapshotDir, filename);
    }

    private async saveSnapshot(filepath: string, name: string, content: string): Promise<void> {
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true });

        const entry = this.formatSnapshotEntry(name, content);
        
        try {
            const existing = await fs.promises.readFile(filepath, 'utf-8');
            await fs.promises.writeFile(filepath, existing + '\n' + entry);
        } catch {
            await fs.promises.writeFile(filepath, entry);
        }
    }

    private async updateSnapshot(filepath: string, name: string, content: string): Promise<void> {
        let fileContent: string;
        try {
            fileContent = await fs.promises.readFile(filepath, 'utf-8');
        } catch {
            fileContent = '';
        }

        const pattern = new RegExp(
            `exports\\[\`${this.escapeRegex(name)}\`\\] = \`[\\s\\S]*?\`;`,
            'g'
        );

        const entry = this.formatSnapshotEntry(name, content);

        if (pattern.test(fileContent)) {
            fileContent = fileContent.replace(pattern, entry);
        } else {
            fileContent = fileContent + '\n' + entry;
        }

        await fs.promises.writeFile(filepath, fileContent.trim());
    }

    private extractSnapshot(fileContent: string, name: string): string {
        const pattern = new RegExp(
            `exports\\[\`${this.escapeRegex(name)}\`\\] = \`([\\s\\S]*?)\`;`
        );

        const match = fileContent.match(pattern);
        return match ? match[1] : '';
    }

    private formatSnapshotEntry(name: string, content: string): string {
        return `exports[\`${name}\`] = \`\n${content}\n\`;`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DIFF
    // ─────────────────────────────────────────────────────────────────────────

    private generateDiff(expected: string, actual: string): string {
        const expectedLines = expected.split('\n');
        const actualLines = actual.split('\n');
        const diff: string[] = [];

        const maxLines = Math.max(expectedLines.length, actualLines.length);

        for (let i = 0; i < maxLines; i++) {
            const exp = expectedLines[i] || '';
            const act = actualLines[i] || '';

            if (exp === act) {
                diff.push(`  ${exp}`);
            } else {
                if (expectedLines[i] !== undefined) {
                    diff.push(`- ${exp}`);
                }
                if (actualLines[i] !== undefined) {
                    diff.push(`+ ${act}`);
                }
            }
        }

        return diff.join('\n');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Reset snapshot counts
     */
    resetCounts(): void {
        this.snapshotCounts.clear();
    }

    /**
     * Set update mode
     */
    setUpdateMode(update: boolean): void {
        this.config.updateSnapshots = update;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSnapshotManager = (): SnapshotManager => SnapshotManager.getInstance();
export const configureSnapshots = (config: Partial<SnapshotConfig>): SnapshotManager => 
    SnapshotManager.configure(config);

// Quick snapshot operations
export const snapshot = {
    match: (testName: string, value: any, name?: string) => 
        SnapshotManager.getInstance().matchSnapshot(testName, value, name),
    assert: (testName: string, value: any, name?: string) => 
        SnapshotManager.getInstance().assertSnapshot(testName, value, name),
    inline: (value: any, expected?: string) => 
        SnapshotManager.getInstance().matchInlineSnapshot(value, expected),
    serialize: (value: any) => 
        SnapshotManager.getInstance().serialize(value)
};

export default SnapshotManager;
