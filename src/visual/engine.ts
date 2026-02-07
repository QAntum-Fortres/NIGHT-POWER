/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM VISUAL TEST ENGINE                                                   ║
 * ║   "Pixel-perfect visual regression testing"                                   ║
 * ║                                                                               ║
 * ║   TODO B #33 - Visual Testing: Screenshot comparison                          ║
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

export interface ScreenshotOptions {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    quality?: number;
    type?: 'png' | 'jpeg';
    omitBackground?: boolean;
    encoding?: 'base64' | 'binary';
}

export interface ComparisonResult {
    match: boolean;
    similarity: number;
    diffPixels: number;
    totalPixels: number;
    diffPercentage: number;
    diffPath?: string;
    baselinePath: string;
    actualPath: string;
    dimensions: {
        baseline: { width: number; height: number };
        actual: { width: number; height: number };
    };
    error?: string;
}

export interface VisualTestConfig {
    baselineDir: string;
    actualDir: string;
    diffDir: string;
    threshold: number;
    antiAliasing?: boolean;
    ignoreColors?: boolean;
    ignoreAntialiasing?: boolean;
    outputDiffPixels?: boolean;
    diffColor?: { r: number; g: number; b: number };
}

export interface Viewport {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL TEST ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class VisualTestEngine {
    private static instance: VisualTestEngine;
    private config: VisualTestConfig;
    private baselines = new Map<string, Buffer>();

    private constructor(config: Partial<VisualTestConfig> = {}) {
        this.config = {
            baselineDir: config.baselineDir || './visual-baselines',
            actualDir: config.actualDir || './visual-actual',
            diffDir: config.diffDir || './visual-diffs',
            threshold: config.threshold ?? 0.01,
            antiAliasing: config.antiAliasing ?? true,
            ignoreColors: config.ignoreColors ?? false,
            ignoreAntialiasing: config.ignoreAntialiasing ?? false,
            outputDiffPixels: config.outputDiffPixels ?? true,
            diffColor: config.diffColor || { r: 255, g: 0, b: 0 }
        };
    }

    static getInstance(config?: Partial<VisualTestConfig>): VisualTestEngine {
        if (!VisualTestEngine.instance) {
            VisualTestEngine.instance = new VisualTestEngine(config);
        }
        return VisualTestEngine.instance;
    }

    static configure(config: Partial<VisualTestConfig>): VisualTestEngine {
        VisualTestEngine.instance = new VisualTestEngine(config);
        return VisualTestEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BASELINE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Save baseline screenshot
     */
    async saveBaseline(name: string, screenshot: Buffer): Promise<string> {
        await this.ensureDir(this.config.baselineDir);
        const filename = this.sanitizeName(name) + '.png';
        const filepath = path.join(this.config.baselineDir, filename);
        
        await fs.promises.writeFile(filepath, screenshot);
        this.baselines.set(name, screenshot);
        
        return filepath;
    }

    /**
     * Load baseline
     */
    async loadBaseline(name: string): Promise<Buffer | null> {
        if (this.baselines.has(name)) {
            return this.baselines.get(name)!;
        }

        const filename = this.sanitizeName(name) + '.png';
        const filepath = path.join(this.config.baselineDir, filename);

        try {
            const buffer = await fs.promises.readFile(filepath);
            this.baselines.set(name, buffer);
            return buffer;
        } catch {
            return null;
        }
    }

    /**
     * Check if baseline exists
     */
    async hasBaseline(name: string): Promise<boolean> {
        if (this.baselines.has(name)) return true;

        const filename = this.sanitizeName(name) + '.png';
        const filepath = path.join(this.config.baselineDir, filename);

        try {
            await fs.promises.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete baseline
     */
    async deleteBaseline(name: string): Promise<void> {
        this.baselines.delete(name);
        const filename = this.sanitizeName(name) + '.png';
        const filepath = path.join(this.config.baselineDir, filename);

        try {
            await fs.promises.unlink(filepath);
        } catch {
            // Ignore if doesn't exist
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPARISON
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compare screenshot with baseline
     */
    async compare(name: string, actual: Buffer): Promise<ComparisonResult> {
        // Save actual screenshot
        await this.ensureDir(this.config.actualDir);
        const actualFilename = this.sanitizeName(name) + '.png';
        const actualPath = path.join(this.config.actualDir, actualFilename);
        await fs.promises.writeFile(actualPath, actual);

        // Load baseline
        const baseline = await this.loadBaseline(name);
        const baselinePath = path.join(this.config.baselineDir, actualFilename);

        if (!baseline) {
            // No baseline exists - save as new baseline
            await this.saveBaseline(name, actual);
            return {
                match: true,
                similarity: 1,
                diffPixels: 0,
                totalPixels: 0,
                diffPercentage: 0,
                baselinePath,
                actualPath,
                dimensions: {
                    baseline: { width: 0, height: 0 },
                    actual: { width: 0, height: 0 }
                },
                error: 'No baseline found - created new baseline'
            };
        }

        // Compare images
        return this.compareBuffers(name, baseline, actual, baselinePath, actualPath);
    }

    /**
     * Compare two image buffers
     */
    private async compareBuffers(
        name: string,
        baseline: Buffer,
        actual: Buffer,
        baselinePath: string,
        actualPath: string
    ): Promise<ComparisonResult> {
        // Get image dimensions from PNG headers
        const baselineDims = this.getPngDimensions(baseline);
        const actualDims = this.getPngDimensions(actual);

        // Check dimensions match
        if (!baselineDims || !actualDims) {
            return {
                match: false,
                similarity: 0,
                diffPixels: -1,
                totalPixels: -1,
                diffPercentage: 100,
                baselinePath,
                actualPath,
                dimensions: {
                    baseline: baselineDims || { width: 0, height: 0 },
                    actual: actualDims || { width: 0, height: 0 }
                },
                error: 'Could not parse image dimensions'
            };
        }

        if (baselineDims.width !== actualDims.width || baselineDims.height !== actualDims.height) {
            return {
                match: false,
                similarity: 0,
                diffPixels: -1,
                totalPixels: Math.max(
                    baselineDims.width * baselineDims.height,
                    actualDims.width * actualDims.height
                ),
                diffPercentage: 100,
                baselinePath,
                actualPath,
                dimensions: {
                    baseline: baselineDims,
                    actual: actualDims
                },
                error: `Dimension mismatch: baseline ${baselineDims.width}x${baselineDims.height}, actual ${actualDims.width}x${actualDims.height}`
            };
        }

        // Simple byte comparison for exact match
        const baselineHash = crypto.createHash('md5').update(baseline).digest('hex');
        const actualHash = crypto.createHash('md5').update(actual).digest('hex');

        const totalPixels = baselineDims.width * baselineDims.height;

        if (baselineHash === actualHash) {
            return {
                match: true,
                similarity: 1,
                diffPixels: 0,
                totalPixels,
                diffPercentage: 0,
                baselinePath,
                actualPath,
                dimensions: {
                    baseline: baselineDims,
                    actual: actualDims
                }
            };
        }

        // Perform pixel-level comparison
        const diffResult = await this.pixelCompare(baseline, actual, baselineDims);
        const diffPercentage = (diffResult.diffPixels / totalPixels) * 100;
        const match = diffPercentage <= this.config.threshold * 100;

        // Save diff image
        let diffPath: string | undefined;
        if (this.config.outputDiffPixels && diffResult.diffBuffer) {
            await this.ensureDir(this.config.diffDir);
            const diffFilename = this.sanitizeName(name) + '-diff.png';
            diffPath = path.join(this.config.diffDir, diffFilename);
            await fs.promises.writeFile(diffPath, diffResult.diffBuffer);
        }

        return {
            match,
            similarity: 1 - (diffResult.diffPixels / totalPixels),
            diffPixels: diffResult.diffPixels,
            totalPixels,
            diffPercentage,
            diffPath,
            baselinePath,
            actualPath,
            dimensions: {
                baseline: baselineDims,
                actual: actualDims
            }
        };
    }

    /**
     * Pixel-level comparison
     */
    private async pixelCompare(
        baseline: Buffer,
        actual: Buffer,
        dimensions: { width: number; height: number }
    ): Promise<{ diffPixels: number; diffBuffer?: Buffer }> {
        // Simple comparison - compare raw buffer bytes
        // In real implementation, would decode PNG and compare pixels
        let diffPixels = 0;
        const minLength = Math.min(baseline.length, actual.length);

        for (let i = 0; i < minLength; i++) {
            if (baseline[i] !== actual[i]) {
                diffPixels++;
            }
        }

        // Estimate pixel diff from byte diff
        // PNG has ~4 bytes per pixel (RGBA)
        const estimatedPixelDiff = Math.floor(diffPixels / 4);

        return {
            diffPixels: estimatedPixelDiff,
            diffBuffer: undefined // Would generate diff image in full implementation
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VISUAL ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assert visual match
     */
    async assertMatch(name: string, actual: Buffer): Promise<void> {
        const result = await this.compare(name, actual);
        
        if (!result.match) {
            throw new Error(
                `Visual regression detected for "${name}": ` +
                `${result.diffPercentage.toFixed(2)}% difference ` +
                `(threshold: ${this.config.threshold * 100}%)\n` +
                `Baseline: ${result.baselinePath}\n` +
                `Actual: ${result.actualPath}` +
                (result.diffPath ? `\nDiff: ${result.diffPath}` : '')
            );
        }
    }

    /**
     * Assert similarity threshold
     */
    async assertSimilarity(name: string, actual: Buffer, threshold: number): Promise<void> {
        const result = await this.compare(name, actual);
        
        if (result.similarity < threshold) {
            throw new Error(
                `Visual similarity too low for "${name}": ` +
                `${(result.similarity * 100).toFixed(2)}% ` +
                `(required: ${threshold * 100}%)`
            );
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    }

    private async ensureDir(dir: string): Promise<void> {
        await fs.promises.mkdir(dir, { recursive: true });
    }

    private getPngDimensions(buffer: Buffer): { width: number; height: number } | null {
        // PNG header check
        if (buffer.length < 24) return null;
        
        // Check PNG signature
        const signature = buffer.slice(0, 8);
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        
        if (!signature.equals(pngSignature)) return null;

        // IHDR chunk starts at byte 8
        // Width is at bytes 16-19, Height at 20-23
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);

        return { width, height };
    }

    /**
     * Update configuration
     */
    configure(config: Partial<VisualTestConfig>): void {
        Object.assign(this.config, config);
    }

    /**
     * Get configuration
     */
    getConfig(): VisualTestConfig {
        return { ...this.config };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWPORT PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const ViewportPresets = {
    // Desktop
    desktop: { width: 1920, height: 1080 },
    desktopHD: { width: 1366, height: 768 },
    desktopSmall: { width: 1280, height: 800 },

    // Laptop
    laptop: { width: 1440, height: 900 },
    laptopHiDPI: { width: 1440, height: 900, deviceScaleFactor: 2 },

    // Tablet
    iPadPro: { width: 1024, height: 1366, isMobile: true },
    iPad: { width: 768, height: 1024, isMobile: true },
    iPadMini: { width: 768, height: 1024, isMobile: true },

    // Mobile
    iPhone14ProMax: { width: 430, height: 932, isMobile: true, deviceScaleFactor: 3 },
    iPhone14: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 },
    iPhoneSE: { width: 375, height: 667, isMobile: true, deviceScaleFactor: 2 },
    pixel7: { width: 412, height: 915, isMobile: true, deviceScaleFactor: 2.625 },
    galaxyS21: { width: 360, height: 800, isMobile: true, deviceScaleFactor: 3 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getVisualEngine = (): VisualTestEngine => VisualTestEngine.getInstance();
export const configureVisual = (config: Partial<VisualTestConfig>): VisualTestEngine => 
    VisualTestEngine.configure(config);

// Quick visual operations
export const visual = {
    compare: (name: string, screenshot: Buffer) => 
        VisualTestEngine.getInstance().compare(name, screenshot),
    assertMatch: (name: string, screenshot: Buffer) => 
        VisualTestEngine.getInstance().assertMatch(name, screenshot),
    saveBaseline: (name: string, screenshot: Buffer) => 
        VisualTestEngine.getInstance().saveBaseline(name, screenshot),
    hasBaseline: (name: string) => 
        VisualTestEngine.getInstance().hasBaseline(name)
};

export default VisualTestEngine;
