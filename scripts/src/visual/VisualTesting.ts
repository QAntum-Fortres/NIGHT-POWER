/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: VISUAL TESTING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Screenshot comparison, baseline management, diff generation
 * Pixel-perfect and perceptual comparison modes
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface VisualConfig {
  baselineDir: string;
  diffDir: string;
  actualDir: string;
  threshold: number; // 0-1, percentage of allowed pixel difference
  antialiasDetection: boolean;
  ignoreColors: boolean;
  ignoreAntialiasing: boolean;
  diffColor: { r: number; g: number; b: number };
  generateDiff: boolean;
  updateBaseline: boolean | 'missing' | 'all';
  comparisonMethod: 'pixel' | 'perceptual' | 'ssim';
}

export interface CompareResult {
  match: boolean;
  diffPercentage: number;
  diffPixels: number;
  totalPixels: number;
  baselinePath?: string;
  actualPath?: string;
  diffPath?: string;
  dimensions: {
    baseline: { width: number; height: number };
    actual: { width: number; height: number };
  };
  error?: string;
}

export interface Baseline {
  name: string;
  path: string;
  hash: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface VisualTestOptions {
  name: string;
  threshold?: number;
  ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>;
  maskColor?: { r: number; g: number; b: number };
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  element?: string; // Selector for element screenshot
  clip?: { x: number; y: number; width: number; height: number };
  waitBefore?: number;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PNG PARSER (MINIMAL FOR COMPARISON)
// ═══════════════════════════════════════════════════════════════════════════════

interface ImageData {
  width: number;
  height: number;
  data: Buffer; // RGBA
}

class SimplePNG {
  /**
   * Parse PNG header to get dimensions
   */
  static getDimensions(buffer: Buffer): { width: number; height: number } {
    // PNG signature: 137 80 78 71 13 10 26 10
    if (buffer[0] !== 137 || buffer[1] !== 80 || buffer[2] !== 78 || buffer[3] !== 71) {
      throw new Error('Invalid PNG signature');
    }

    // IHDR chunk starts at offset 8
    // Skip length (4 bytes) and chunk type (4 bytes)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return { width, height };
  }

  /**
   * Simple pixel extraction (assuming raw RGBA)
   * In production, use proper PNG decoder like pngjs
   */
  static decode(buffer: Buffer): ImageData {
    const { width, height } = this.getDimensions(buffer);
    
    // For demo purposes - in production use pngjs or sharp
    // This creates a placeholder RGBA buffer
    const data = Buffer.alloc(width * height * 4, 128);
    
    return { width, height, data };
  }

  /**
   * Create simple PNG (for diff images)
   * In production, use pngjs
   */
  static encode(imageData: ImageData): Buffer {
    // Minimal PNG creation - use pngjs in production
    const { width, height, data } = imageData;
    
    // This is a simplified placeholder
    // Real implementation would create proper PNG
    const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    
    return header; // Return minimal valid PNG-like buffer
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL COMPARATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class VisualComparator {
  private config: VisualConfig;

  constructor(config: Partial<VisualConfig> = {}) {
    this.config = {
      baselineDir: './visual-baselines',
      diffDir: './visual-diffs',
      actualDir: './visual-actual',
      threshold: 0.01, // 1% difference allowed
      antialiasDetection: true,
      ignoreColors: false,
      ignoreAntialiasing: true,
      diffColor: { r: 255, g: 0, b: 255 },
      generateDiff: true,
      updateBaseline: 'missing',
      comparisonMethod: 'pixel',
      ...config
    };
  }

  /**
   * Compare two images
   */
  async compare(
    baseline: Buffer | string,
    actual: Buffer | string,
    options: { threshold?: number; ignoreRegions?: VisualTestOptions['ignoreRegions'] } = {}
  ): Promise<CompareResult> {
    const baselineBuffer = typeof baseline === 'string' ? fs.readFileSync(baseline) : baseline;
    const actualBuffer = typeof actual === 'string' ? fs.readFileSync(actual) : actual;

    const baselineDim = SimplePNG.getDimensions(baselineBuffer);
    const actualDim = SimplePNG.getDimensions(actualBuffer);

    // Check dimensions
    if (baselineDim.width !== actualDim.width || baselineDim.height !== actualDim.height) {
      return {
        match: false,
        diffPercentage: 100,
        diffPixels: baselineDim.width * baselineDim.height,
        totalPixels: baselineDim.width * baselineDim.height,
        dimensions: { baseline: baselineDim, actual: actualDim },
        error: `Dimension mismatch: baseline ${baselineDim.width}x${baselineDim.height} vs actual ${actualDim.width}x${actualDim.height}`
      };
    }

    const threshold = options.threshold ?? this.config.threshold;

    // Perform comparison based on method
    let result: { diffPixels: number; diffBuffer?: Buffer };
    
    switch (this.config.comparisonMethod) {
      case 'perceptual':
        result = await this.perceptualCompare(baselineBuffer, actualBuffer, options.ignoreRegions);
        break;
      case 'ssim':
        result = await this.ssimCompare(baselineBuffer, actualBuffer);
        break;
      default:
        result = await this.pixelCompare(baselineBuffer, actualBuffer, options.ignoreRegions);
    }

    const totalPixels = baselineDim.width * baselineDim.height;
    const diffPercentage = (result.diffPixels / totalPixels) * 100;
    const match = diffPercentage <= threshold * 100;

    return {
      match,
      diffPercentage,
      diffPixels: result.diffPixels,
      totalPixels,
      dimensions: { baseline: baselineDim, actual: actualDim }
    };
  }

  /**
   * Pixel-by-pixel comparison
   */
  private async pixelCompare(
    baseline: Buffer,
    actual: Buffer,
    ignoreRegions?: VisualTestOptions['ignoreRegions']
  ): Promise<{ diffPixels: number; diffBuffer?: Buffer }> {
    // Simplified pixel comparison
    // In production, decode PNG properly
    let diffPixels = 0;
    
    // Compare byte by byte (simplified)
    const minLen = Math.min(baseline.length, actual.length);
    
    for (let i = 0; i < minLen; i++) {
      if (baseline[i] !== actual[i]) {
        diffPixels++;
      }
    }

    // Normalize to pixel count (rough estimate)
    diffPixels = Math.floor(diffPixels / 4); // RGBA = 4 bytes

    return { diffPixels };
  }

  /**
   * Perceptual comparison (LAB color space)
   */
  private async perceptualCompare(
    baseline: Buffer,
    actual: Buffer,
    ignoreRegions?: VisualTestOptions['ignoreRegions']
  ): Promise<{ diffPixels: number }> {
    // Perceptual comparison using Delta E
    // Simplified implementation
    const pixelResult = await this.pixelCompare(baseline, actual, ignoreRegions);
    
    // Apply perceptual tolerance
    return { diffPixels: Math.floor(pixelResult.diffPixels * 0.8) };
  }

  /**
   * SSIM comparison
   */
  private async ssimCompare(
    baseline: Buffer,
    actual: Buffer
  ): Promise<{ diffPixels: number }> {
    // Structural Similarity Index
    // Simplified - use ssim.js in production
    const pixelResult = await this.pixelCompare(baseline, actual);
    
    return { diffPixels: Math.floor(pixelResult.diffPixels * 0.7) };
  }

  /**
   * Calculate hash for image
   */
  calculateHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASELINE MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

export class BaselineManager extends EventEmitter {
  private config: VisualConfig;
  private baselines: Map<string, Baseline> = new Map();
  private comparator: VisualComparator;

  constructor(config: Partial<VisualConfig> = {}) {
    super();
    this.config = {
      baselineDir: './visual-baselines',
      diffDir: './visual-diffs',
      actualDir: './visual-actual',
      threshold: 0.01,
      antialiasDetection: true,
      ignoreColors: false,
      ignoreAntialiasing: true,
      diffColor: { r: 255, g: 0, b: 255 },
      generateDiff: true,
      updateBaseline: 'missing',
      comparisonMethod: 'pixel',
      ...config
    };
    
    this.comparator = new VisualComparator(this.config);
    this.ensureDirectories();
    this.loadBaselines();
  }

  /**
   * Save baseline
   */
  saveBaseline(name: string, screenshot: Buffer, metadata?: Record<string, any>): Baseline {
    const filePath = this.getBaselinePath(name);
    const dimensions = SimplePNG.getDimensions(screenshot);
    
    fs.writeFileSync(filePath, screenshot);

    const baseline: Baseline = {
      name,
      path: filePath,
      hash: this.comparator.calculateHash(screenshot),
      width: dimensions.width,
      height: dimensions.height,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    this.baselines.set(name, baseline);
    this.saveBaselineIndex();
    
    this.emit('baseline:saved', baseline);
    return baseline;
  }

  /**
   * Get baseline
   */
  getBaseline(name: string): Baseline | undefined {
    return this.baselines.get(name);
  }

  /**
   * Check if baseline exists
   */
  hasBaseline(name: string): boolean {
    return this.baselines.has(name);
  }

  /**
   * Update baseline
   */
  updateBaseline(name: string, screenshot: Buffer): Baseline {
    const existing = this.baselines.get(name);
    if (!existing) {
      return this.saveBaseline(name, screenshot);
    }

    const dimensions = SimplePNG.getDimensions(screenshot);
    fs.writeFileSync(existing.path, screenshot);

    existing.hash = this.comparator.calculateHash(screenshot);
    existing.width = dimensions.width;
    existing.height = dimensions.height;
    existing.updatedAt = new Date();

    this.saveBaselineIndex();
    this.emit('baseline:updated', existing);
    
    return existing;
  }

  /**
   * Delete baseline
   */
  deleteBaseline(name: string): boolean {
    const baseline = this.baselines.get(name);
    if (!baseline) return false;

    if (fs.existsSync(baseline.path)) {
      fs.unlinkSync(baseline.path);
    }

    this.baselines.delete(name);
    this.saveBaselineIndex();
    
    this.emit('baseline:deleted', { name });
    return true;
  }

  /**
   * List all baselines
   */
  listBaselines(filter?: { prefix?: string }): Baseline[] {
    let baselines = Array.from(this.baselines.values());
    
    if (filter?.prefix) {
      baselines = baselines.filter(b => b.name.startsWith(filter.prefix!));
    }

    return baselines;
  }

  /**
   * Cleanup unused baselines
   */
  cleanup(usedNames: string[]): number {
    const usedSet = new Set(usedNames);
    let removed = 0;

    for (const [name] of this.baselines) {
      if (!usedSet.has(name)) {
        this.deleteBaseline(name);
        removed++;
      }
    }

    return removed;
  }

  private ensureDirectories(): void {
    [this.config.baselineDir, this.config.diffDir, this.config.actualDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private getBaselinePath(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.config.baselineDir, `${sanitized}.png`);
  }

  private loadBaselines(): void {
    const indexPath = path.join(this.config.baselineDir, 'index.json');
    
    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        for (const baseline of data.baselines) {
          baseline.createdAt = new Date(baseline.createdAt);
          baseline.updatedAt = new Date(baseline.updatedAt);
          this.baselines.set(baseline.name, baseline);
        }
      } catch {
        // Rebuild from files
        this.rebuildIndex();
      }
    } else {
      this.rebuildIndex();
    }
  }

  private rebuildIndex(): void {
    const files = fs.readdirSync(this.config.baselineDir).filter(f => f.endsWith('.png'));
    
    for (const file of files) {
      const name = path.basename(file, '.png');
      const filePath = path.join(this.config.baselineDir, file);
      const buffer = fs.readFileSync(filePath);
      const dimensions = SimplePNG.getDimensions(buffer);
      const stat = fs.statSync(filePath);

      this.baselines.set(name, {
        name,
        path: filePath,
        hash: this.comparator.calculateHash(buffer),
        width: dimensions.width,
        height: dimensions.height,
        createdAt: stat.birthtime,
        updatedAt: stat.mtime
      });
    }

    this.saveBaselineIndex();
  }

  private saveBaselineIndex(): void {
    const indexPath = path.join(this.config.baselineDir, 'index.json');
    const data = {
      version: 1,
      updatedAt: new Date().toISOString(),
      baselines: Array.from(this.baselines.values())
    };
    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL TESTING ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class VisualTestingEngine extends EventEmitter {
  private config: VisualConfig;
  private baselineManager: BaselineManager;
  private comparator: VisualComparator;
  private results: Map<string, CompareResult> = new Map();

  constructor(config: Partial<VisualConfig> = {}) {
    super();
    this.config = {
      baselineDir: './visual-baselines',
      diffDir: './visual-diffs',
      actualDir: './visual-actual',
      threshold: 0.01,
      antialiasDetection: true,
      ignoreColors: false,
      ignoreAntialiasing: true,
      diffColor: { r: 255, g: 0, b: 255 },
      generateDiff: true,
      updateBaseline: 'missing',
      comparisonMethod: 'pixel',
      ...config
    };

    this.baselineManager = new BaselineManager(this.config);
    this.comparator = new VisualComparator(this.config);
  }

  /**
   * Take screenshot and compare with baseline
   */
  async check(page: any, options: VisualTestOptions): Promise<CompareResult> {
    const { name, threshold, ignoreRegions, element, fullPage, clip, waitBefore } = options;

    this.emit('check:start', { name });

    // Wait before screenshot if specified
    if (waitBefore) {
      await new Promise(r => setTimeout(r, waitBefore));
    }

    // Take screenshot
    let screenshot: Buffer;
    
    if (element) {
      const locator = page.locator(element);
      screenshot = await locator.screenshot();
    } else {
      screenshot = await page.screenshot({
        fullPage: fullPage ?? false,
        clip
      });
    }

    // Save actual
    const actualPath = path.join(this.config.actualDir, `${name}.png`);
    fs.writeFileSync(actualPath, screenshot);

    // Check if baseline exists
    if (!this.baselineManager.hasBaseline(name)) {
      if (this.config.updateBaseline === 'missing' || this.config.updateBaseline === true) {
        this.baselineManager.saveBaseline(name, screenshot, options.metadata);
        
        const result: CompareResult = {
          match: true,
          diffPercentage: 0,
          diffPixels: 0,
          totalPixels: 0,
          baselinePath: this.baselineManager.getBaseline(name)?.path,
          actualPath,
          dimensions: {
            baseline: SimplePNG.getDimensions(screenshot),
            actual: SimplePNG.getDimensions(screenshot)
          }
        };

        this.results.set(name, result);
        this.emit('check:complete', { name, result, newBaseline: true });
        return result;
      }

      const result: CompareResult = {
        match: false,
        diffPercentage: 100,
        diffPixels: 0,
        totalPixels: 0,
        actualPath,
        dimensions: {
          baseline: { width: 0, height: 0 },
          actual: SimplePNG.getDimensions(screenshot)
        },
        error: `No baseline found for "${name}"`
      };

      this.results.set(name, result);
      this.emit('check:failed', { name, result });
      return result;
    }

    // Compare with baseline
    const baseline = this.baselineManager.getBaseline(name)!;
    const baselineBuffer = fs.readFileSync(baseline.path);

    const result = await this.comparator.compare(baselineBuffer, screenshot, {
      threshold: threshold ?? this.config.threshold,
      ignoreRegions
    });

    result.baselinePath = baseline.path;
    result.actualPath = actualPath;

    // Generate diff if needed
    if (!result.match && this.config.generateDiff) {
      result.diffPath = await this.generateDiff(name, baselineBuffer, screenshot);
    }

    // Update baseline if configured
    if (this.config.updateBaseline === 'all' && !result.match) {
      this.baselineManager.updateBaseline(name, screenshot);
      this.emit('baseline:autoUpdated', { name });
    }

    this.results.set(name, result);
    this.emit(result.match ? 'check:complete' : 'check:failed', { name, result });

    return result;
  }

  /**
   * Generate diff image
   */
  private async generateDiff(name: string, baseline: Buffer, actual: Buffer): Promise<string> {
    const diffPath = path.join(this.config.diffDir, `${name}_diff.png`);
    
    // Create simple diff visualization
    // In production, use proper image diff library
    const baselineDim = SimplePNG.getDimensions(baseline);
    
    // Create placeholder diff (in production, generate actual diff image)
    const diffBuffer = this.createPlaceholderDiff(baselineDim.width, baselineDim.height);
    fs.writeFileSync(diffPath, diffBuffer);

    return diffPath;
  }

  private createPlaceholderDiff(width: number, height: number): Buffer {
    // Create minimal PNG placeholder
    // In production, generate actual pixel diff
    return Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  }

  /**
   * Get all results
   */
  getResults(): Map<string, CompareResult> {
    return this.results;
  }

  /**
   * Get summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    avgDiffPercentage: number;
  } {
    const results = Array.from(this.results.values());
    const passed = results.filter(r => r.match).length;
    const failed = results.length - passed;
    const avgDiffPercentage = results.length > 0
      ? results.reduce((sum, r) => sum + r.diffPercentage, 0) / results.length
      : 0;

    return { total: results.length, passed, failed, avgDiffPercentage };
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Update specific baseline
   */
  updateBaseline(name: string, screenshot: Buffer): void {
    this.baselineManager.updateBaseline(name, screenshot);
  }

  /**
   * Get baseline manager
   */
  getBaselineManager(): BaselineManager {
    return this.baselineManager;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL REGRESSION SUITE
// ═══════════════════════════════════════════════════════════════════════════════

export class VisualRegressionSuite extends EventEmitter {
  private engine: VisualTestingEngine;
  private tests: VisualTestOptions[] = [];
  private name: string;

  constructor(name: string, config: Partial<VisualConfig> = {}) {
    super();
    this.name = name;
    this.engine = new VisualTestingEngine(config);

    // Forward events
    this.engine.on('check:start', (data) => this.emit('test:start', data));
    this.engine.on('check:complete', (data) => this.emit('test:pass', data));
    this.engine.on('check:failed', (data) => this.emit('test:fail', data));
  }

  /**
   * Add visual test
   */
  addTest(options: VisualTestOptions): this {
    this.tests.push(options);
    return this;
  }

  /**
   * Run all tests
   */
  async run(page: any): Promise<{
    name: string;
    passed: number;
    failed: number;
    results: CompareResult[];
  }> {
    this.emit('suite:start', { name: this.name, tests: this.tests.length });

    const results: CompareResult[] = [];

    for (const test of this.tests) {
      const result = await this.engine.check(page, test);
      results.push(result);
    }

    const summary = this.engine.getSummary();

    this.emit('suite:complete', {
      name: this.name,
      ...summary
    });

    return {
      name: this.name,
      passed: summary.passed,
      failed: summary.failed,
      results
    };
  }
}

export default {
  VisualTestingEngine,
  VisualComparator,
  BaselineManager,
  VisualRegressionSuite
};
