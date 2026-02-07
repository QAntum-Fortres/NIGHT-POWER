/**
 * 🔧 SELF-HEALING V2 - Real-Time Test Refactoring
 * 
 * Advanced self-healing system that automatically repairs
 * broken tests when cognitive anchors change.
 * 
 * Features:
 * - Real-time DOM mutation detection
 * - Intelligent selector migration
 * - Automatic test code refactoring
 * - Learning from successful repairs
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @phase 89-90
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { NeuralMapEngine, CognitiveAnchor, SelectorSignal, VisualFingerprint } from './neural-map-engine';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES
// ============================================================
interface SelfHealingConfig {
    autoHeal: boolean;
    maxHealAttempts: number;
    healingStrategies: HealingStrategy[];
    learningEnabled: boolean;
    notifyOnHeal: boolean;
    refactorTestCode: boolean;
    backupBeforeRefactor: boolean;
    outputDir: string;
}

type HealingStrategy = 
    | 'fallback-selector'
    | 'visual-match'
    | 'semantic-match'
    | 'ml-prediction'
    | 'neighboring-elements'
    | 'structure-analysis';

interface AnchorChange {
    anchorId: string;
    previousSelector: string;
    previousSignals: SelectorSignal[];
    changeType: 'moved' | 'modified' | 'removed' | 'replaced';
    detectedAt: number;
    pageUrl: string;
}

// Use imported SelectorSignal from neural-map-engine

interface HealingResult {
    success: boolean;
    anchorId: string;
    strategy: HealingStrategy;
    previousSelector: string;
    newSelector: string;
    confidence: number;
    healingTime: number;
    refactoredFiles: string[];
}

interface RefactorSuggestion {
    testFile: string;
    line: number;
    originalCode: string;
    suggestedCode: string;
    reason: string;
    confidence: number;
    autoApply: boolean;
}

interface HealingHistory {
    anchorId: string;
    changes: AnchorChange[];
    healings: HealingResult[];
    successRate: number;
    lastUpdated: number;
}

interface MutationPattern {
    id: string;
    pattern: string;
    frequency: number;
    successfulStrategy: HealingStrategy;
    confidence: number;
}

// ============================================================
// SELF-HEALING V2 ENGINE
// ============================================================
export class SelfHealingV2 extends EventEmitter {
    private config: SelfHealingConfig;
    private neuralMap: NeuralMapEngine;
    private healingHistory: Map<string, HealingHistory> = new Map();
    private mutationPatterns: MutationPattern[] = [];
    private activeWatchers: Map<string, NodeJS.Timer> = new Map();

    constructor(config: Partial<SelfHealingConfig> = {}) {
        super();

        this.config = {
            autoHeal: true,
            maxHealAttempts: 5,
            healingStrategies: [
                'fallback-selector',
                'semantic-match',
                'visual-match',
                'neighboring-elements',
                'structure-analysis',
                'ml-prediction'
            ],
            learningEnabled: true,
            notifyOnHeal: true,
            refactorTestCode: true,
            backupBeforeRefactor: true,
            outputDir: './healing-data',
            ...config
        };

        this.neuralMap = new NeuralMapEngine();
        this.loadHealingData();
    }

    /**
     * 🔧 Attempt to heal a broken anchor
     */
    async heal(
        page: any,
        anchor: CognitiveAnchor,
        change: AnchorChange
    ): Promise<HealingResult> {
        logger.debug(`
╔═══════════════════════════════════════════════════════════════╗
║  🔧 SELF-HEALING V2 - Automatic Repair                        ║
║                                                               ║
║  "Tests that fix themselves"                                  ║
╚═══════════════════════════════════════════════════════════════╝
`);
        logger.debug(`🔧 [HEALER] Anchor: ${anchor.id}`);
        logger.debug(`🔧 [HEALER] Change: ${change.changeType}`);
        logger.debug(`🔧 [HEALER] Previous: ${change.previousSelector}`);
        logger.debug('');

        const startTime = Date.now();
        let result: HealingResult | null = null;

        // Try each strategy in order
        for (const strategy of this.config.healingStrategies) {
            if (result?.success) break;

            logger.debug(`🔧 [HEALER] Trying strategy: ${strategy}`);
            
            try {
                result = await this.tryStrategy(page, anchor, change, strategy);
                
                if (result.success) {
                    logger.debug(`✅ [HEALER] Success with ${strategy}!`);
                    logger.debug(`   New selector: ${result.newSelector}`);
                    logger.debug(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
                }
            } catch (error: any) {
                logger.debug(`❌ [HEALER] ${strategy} failed: ${error.message}`);
            }
        }

        if (!result || !result.success) {
            result = {
                success: false,
                anchorId: anchor.id,
                strategy: 'fallback-selector',
                previousSelector: change.previousSelector,
                newSelector: change.previousSelector,
                confidence: 0,
                healingTime: Date.now() - startTime,
                refactoredFiles: []
            };
        }

        result.healingTime = Date.now() - startTime;

        // Update history
        this.recordHealing(anchor.id, change, result);

        // Refactor test code if enabled
        if (result.success && this.config.refactorTestCode) {
            const refactored = await this.refactorTests(anchor, result);
            result.refactoredFiles = refactored;
        }

        // Learn from this healing
        if (this.config.learningEnabled && result.success) {
            this.learnFromHealing(change, result);
        }

        // Emit event
        this.emit('healing:complete', result);

        return result;
    }

    /**
     * Try a specific healing strategy
     */
    private async tryStrategy(
        page: any,
        anchor: CognitiveAnchor,
        change: AnchorChange,
        strategy: HealingStrategy
    ): Promise<HealingResult> {
        const baseResult = {
            anchorId: anchor.id,
            strategy,
            previousSelector: change.previousSelector,
            healingTime: 0,
            refactoredFiles: []
        };

        switch (strategy) {
            case 'fallback-selector':
                return await this.tryFallbackSelector(page, anchor, baseResult);
            
            case 'semantic-match':
                return await this.trySemanticMatch(page, anchor, baseResult);
            
            case 'visual-match':
                return await this.tryVisualMatch(page, anchor, baseResult);
            
            case 'neighboring-elements':
                return await this.tryNeighboringElements(page, anchor, change, baseResult);
            
            case 'structure-analysis':
                return await this.tryStructureAnalysis(page, anchor, change, baseResult);
            
            case 'ml-prediction':
                return await this.tryMLPrediction(page, anchor, change, baseResult);
            
            default:
                return { ...baseResult, success: false, newSelector: '', confidence: 0 };
        }
    }

    /**
     * Strategy: Try fallback selectors from the anchor
     */
    private async tryFallbackSelector(
        page: any,
        anchor: CognitiveAnchor,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        // Try each selector in the anchor's list
        for (const selector of anchor.selectors) {
            try {
                const selectorValue = (selector as any).value || selector.selector;
                const element = await page.$(selectorValue);
                if (element) {
                    const isVisible = await element.isVisible();
                    if (isVisible) {
                        return {
                            ...baseResult,
                            success: true,
                            newSelector: selectorValue,
                            confidence: selector.confidence
                        } as HealingResult;
                    }
                }
            } catch {}
        }

        return {
            ...baseResult,
            success: false,
            newSelector: '',
            confidence: 0
        } as HealingResult;
    }

    /**
     * Strategy: Semantic matching based on text/aria
     */
    private async trySemanticMatch(
        page: any,
        anchor: CognitiveAnchor,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        // Find semantic context
        const semanticHints = anchor.selectors.filter(s => 
            s.type === 'text' || s.type === 'aria' || s.type === 'role'
        );

        for (const hint of semanticHints) {
            try {
                let selector: string;
                const hintValue = (hint as any).value || hint.selector;
                
                switch (hint.type) {
                    case 'text':
                        selector = `text=${hintValue}`;
                        break;
                    case 'aria':
                        selector = `[aria-label="${hintValue}"]`;
                        break;
                    case 'role':
                        selector = `[role="${hintValue}"]`;
                        break;
                    default:
                        continue;
                }

                const element = await page.$(selector);
                if (element && await element.isVisible()) {
                    return {
                        ...baseResult,
                        success: true,
                        newSelector: selector,
                        confidence: hint.confidence * 0.9
                    } as HealingResult;
                }
            } catch {}
        }

        return {
            ...baseResult,
            success: false,
            newSelector: '',
            confidence: 0
        } as HealingResult;
    }

    /**
     * Strategy: Visual matching using image comparison
     */
    private async tryVisualMatch(
        page: any,
        anchor: CognitiveAnchor,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        if (!anchor.visual?.fingerprint) {
            return { ...baseResult, success: false, newSelector: '', confidence: 0 } as HealingResult;
        }

        // Get all similar elements on page
        const candidates = await page.evaluate((visual: any) => {
            const results: any[] = [];
            const elements = document.querySelectorAll('*');

            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);

                // Match by approximate size and color
                const sizeSimilarity = 1 - Math.abs(rect.width - visual.bounds.width) / 100;
                const heightSimilarity = 1 - Math.abs(rect.height - visual.bounds.height) / 100;

                if (sizeSimilarity > 0.7 && heightSimilarity > 0.7) {
                    // Generate XPath for this element
                    const getXPath = (element: Element): string => {
                        if (element.id) return `//*[@id="${element.id}"]`;
                        if (element === document.body) return '/html/body';
                        
                        const siblings = element.parentNode?.children || [];
                        let index = 1;
                        for (const sibling of siblings) {
                            if (sibling === element) {
                                return getXPath(element.parentElement!) + 
                                       `/${element.tagName.toLowerCase()}[${index}]`;
                            }
                            if (sibling.tagName === element.tagName) index++;
                        }
                        return '';
                    };

                    results.push({
                        xpath: getXPath(el),
                        similarity: (sizeSimilarity + heightSimilarity) / 2,
                        tag: el.tagName.toLowerCase()
                    });
                }
            }

            return results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
        }, anchor.visual);

        // Try candidates
        for (const candidate of candidates) {
            try {
                const element = await page.$(`xpath=${candidate.xpath}`);
                if (element && await element.isVisible()) {
                    return {
                        ...baseResult,
                        success: true,
                        newSelector: `xpath=${candidate.xpath}`,
                        confidence: candidate.similarity * 0.8
                    } as HealingResult;
                }
            } catch {}
        }

        return {
            ...baseResult,
            success: false,
            newSelector: '',
            confidence: 0
        } as HealingResult;
    }

    /**
     * Strategy: Find element based on neighboring elements
     */
    private async tryNeighboringElements(
        page: any,
        anchor: CognitiveAnchor,
        change: AnchorChange,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        // Use semantic context from anchor
        const context = anchor.semantic;
        if (!context) {
            return { ...baseResult, success: false, newSelector: '', confidence: 0 } as HealingResult;
        }

        // Try to find element near known landmarks
        const landmarks = await page.evaluate((semantic: any) => {
            const results: any[] = [];
            
            // Find heading
            if (semantic.nearestHeading) {
                const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                for (const h of headings) {
                    if (h.textContent?.includes(semantic.nearestHeading)) {
                        // Find interactive elements near this heading
                        const siblings = h.parentElement?.querySelectorAll('button, a, input') || [];
                        for (const sib of siblings) {
                            results.push({
                                xpath: (sib as any).id ? `//*[@id="${(sib as any).id}"]` : null,
                                text: sib.textContent?.trim(),
                                tag: sib.tagName.toLowerCase()
                            });
                        }
                    }
                }
            }

            return results;
        }, context);

        for (const landmark of landmarks) {
            if (landmark.xpath) {
                try {
                    const element = await page.$(`xpath=${landmark.xpath}`);
                    if (element && await element.isVisible()) {
                        return {
                            ...baseResult,
                            success: true,
                            newSelector: `xpath=${landmark.xpath}`,
                            confidence: 0.7
                        } as HealingResult;
                    }
                } catch {}
            }
        }

        return {
            ...baseResult,
            success: false,
            newSelector: '',
            confidence: 0
        } as HealingResult;
    }

    /**
     * Strategy: Analyze DOM structure changes
     */
    private async tryStructureAnalysis(
        page: any,
        anchor: CognitiveAnchor,
        change: AnchorChange,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        // Get DOM tree and compare structure
        const analysis = await page.evaluate((prevSelector: string) => {
            // Parse the previous selector to understand what we're looking for
            const patterns = {
                hasClass: prevSelector.match(/\.([a-zA-Z0-9_-]+)/g),
                hasTag: prevSelector.match(/^([a-z]+)/)?.[1],
                hasAttr: prevSelector.match(/\[([^\]]+)\]/g)
            };

            // Find elements matching partial patterns
            const candidates: any[] = [];

            // Try to find by class pattern
            if (patterns.hasClass) {
                for (const cls of patterns.hasClass) {
                    const className = cls.slice(1);
                    const elements = document.querySelectorAll(`[class*="${className}"]`);
                    for (const el of elements) {
                        candidates.push({
                            selector: el.id ? `#${el.id}` : `[class="${el.className}"]`,
                            score: 0.6
                        });
                    }
                }
            }

            return candidates.slice(0, 5);
        }, change.previousSelector);

        for (const candidate of analysis) {
            try {
                const element = await page.$(candidate.selector);
                if (element && await element.isVisible()) {
                    return {
                        ...baseResult,
                        success: true,
                        newSelector: candidate.selector,
                        confidence: candidate.score
                    } as HealingResult;
                }
            } catch {}
        }

        return {
            ...baseResult,
            success: false,
            newSelector: '',
            confidence: 0
        } as HealingResult;
    }

    /**
     * Strategy: ML-based prediction from learned patterns
     */
    private async tryMLPrediction(
        page: any,
        anchor: CognitiveAnchor,
        change: AnchorChange,
        baseResult: Partial<HealingResult>
    ): Promise<HealingResult> {
        // Find similar mutation patterns from history
        const patterns = this.findSimilarPatterns(change);

        if (patterns.length === 0) {
            return { ...baseResult, success: false, newSelector: '', confidence: 0 } as HealingResult;
        }

        // Use most successful pattern
        const bestPattern = patterns[0];
        
        // Apply the pattern's successful strategy
        logger.debug(`🔧 [ML] Using learned pattern: ${bestPattern.pattern}`);
        logger.debug(`🔧 [ML] Recommended strategy: ${bestPattern.successfulStrategy}`);

        // Re-try with the learned strategy
        return await this.tryStrategy(
            page, 
            anchor, 
            change, 
            bestPattern.successfulStrategy
        );
    }

    /**
     * Find similar mutation patterns from history
     */
    private findSimilarPatterns(change: AnchorChange): MutationPattern[] {
        return this.mutationPatterns
            .filter(p => {
                // Match by change type and selector pattern
                const changePattern = `${change.changeType}:${this.extractSelectorPattern(change.previousSelector)}`;
                return p.pattern.includes(changePattern.split(':')[0]) ||
                       this.calculateSimilarity(p.pattern, changePattern) > 0.5;
            })
            .sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Extract pattern from selector
     */
    private extractSelectorPattern(selector: string): string {
        return selector
            .replace(/[0-9]+/g, 'N')
            .replace(/"[^"]+"/g, '"..."')
            .replace(/'[^']+'/g, "'...'");
    }

    /**
     * Calculate string similarity
     */
    private calculateSimilarity(a: string, b: string): number {
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        
        if (longer.length === 0) return 1.0;
        
        const costs: number[] = [];
        for (let i = 0; i <= longer.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= shorter.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer[i - 1] !== shorter[j - 1]) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[shorter.length] = lastValue;
        }
        
        return (longer.length - costs[shorter.length]) / longer.length;
    }

    // ============================================================
    // TEST REFACTORING
    // ============================================================

    /**
     * Refactor test files with new selector
     */
    private async refactorTests(
        anchor: CognitiveAnchor,
        healing: HealingResult
    ): Promise<string[]> {
        logger.debug('🔧 [HEALER] Refactoring test files...');

        const refactoredFiles: string[] = [];
        const testDirs = ['./test', './tests', './generated_tests', './e2e'];

        for (const dir of testDirs) {
            if (!fs.existsSync(dir)) continue;

            const files = this.findTestFiles(dir);
            
            for (const file of files) {
                const refactored = await this.refactorFile(
                    file,
                    healing.previousSelector,
                    healing.newSelector,
                    anchor.id
                );

                if (refactored) {
                    refactoredFiles.push(file);
                }
            }
        }

        logger.debug(`🔧 [HEALER] Refactored ${refactoredFiles.length} files`);
        return refactoredFiles;
    }

    /**
     * Find all test files in directory
     */
    private findTestFiles(dir: string): string[] {
        const files: string[] = [];

        const walk = (currentDir: string) => {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    walk(fullPath);
                } else if (entry.isFile() && /\.(spec|test)\.(ts|js)$/.test(entry.name)) {
                    files.push(fullPath);
                }
            }
        };

        walk(dir);
        return files;
    }

    /**
     * Refactor a single file
     */
    private async refactorFile(
        filePath: string,
        oldSelector: string,
        newSelector: string,
        anchorId: string
    ): Promise<boolean> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Check if file contains the old selector
            if (!content.includes(oldSelector)) {
                return false;
            }

            // Backup if enabled
            if (this.config.backupBeforeRefactor) {
                const backupPath = filePath + '.backup.' + Date.now();
                fs.writeFileSync(backupPath, content);
            }

            // Replace selector
            const newContent = content.replace(
                new RegExp(this.escapeRegex(oldSelector), 'g'),
                newSelector
            );

            // Add healing comment
            const healingComment = `// 🔧 Self-healed: ${new Date().toISOString()} | Anchor: ${anchorId}\n`;
            const finalContent = healingComment + newContent;

            fs.writeFileSync(filePath, finalContent);

            logger.debug(`   ✅ Refactored: ${filePath}`);
            return true;

        } catch (error) {
            logger.error(`   ❌ Failed to refactor: ${filePath}`);
            return false;
        }
    }

    /**
     * Generate refactoring suggestions without auto-applying
     */
    async suggestRefactoring(
        anchor: CognitiveAnchor,
        healing: HealingResult
    ): Promise<RefactorSuggestion[]> {
        const suggestions: RefactorSuggestion[] = [];
        const testDirs = ['./test', './tests', './generated_tests', './e2e'];

        for (const dir of testDirs) {
            if (!fs.existsSync(dir)) continue;

            const files = this.findTestFiles(dir);

            for (const file of files) {
                const content = fs.readFileSync(file, 'utf-8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                    if (line.includes(healing.previousSelector)) {
                        suggestions.push({
                            testFile: file,
                            line: index + 1,
                            originalCode: line.trim(),
                            suggestedCode: line.replace(healing.previousSelector, healing.newSelector).trim(),
                            reason: `Anchor '${anchor.id}' changed: ${anchor.name}`,
                            confidence: healing.confidence,
                            autoApply: healing.confidence > 0.9
                        });
                    }
                });
            }
        }

        return suggestions;
    }

    // ============================================================
    // LEARNING & HISTORY
    // ============================================================

    /**
     * Record healing attempt
     */
    private recordHealing(
        anchorId: string,
        change: AnchorChange,
        result: HealingResult
    ): void {
        let history = this.healingHistory.get(anchorId);

        if (!history) {
            history = {
                anchorId,
                changes: [],
                healings: [],
                successRate: 0,
                lastUpdated: Date.now()
            };
            this.healingHistory.set(anchorId, history);
        }

        history.changes.push(change);
        history.healings.push(result);
        history.lastUpdated = Date.now();

        // Calculate success rate
        const successes = history.healings.filter(h => h.success).length;
        history.successRate = successes / history.healings.length;

        this.saveHealingData();
    }

    /**
     * Learn from successful healing
     */
    private learnFromHealing(change: AnchorChange, result: HealingResult): void {
        if (!result.success) return;

        const pattern = `${change.changeType}:${this.extractSelectorPattern(change.previousSelector)}`;

        // Find or create pattern
        let existing = this.mutationPatterns.find(p => p.pattern === pattern);

        if (existing) {
            existing.frequency++;
            if (result.confidence > existing.confidence) {
                existing.successfulStrategy = result.strategy;
                existing.confidence = result.confidence;
            }
        } else {
            this.mutationPatterns.push({
                id: `pattern_${crypto.randomBytes(4).toString('hex')}`,
                pattern,
                frequency: 1,
                successfulStrategy: result.strategy,
                confidence: result.confidence
            });
        }

        logger.debug(`🧠 [LEARN] Pattern learned: ${pattern} → ${result.strategy}`);
        this.saveHealingData();
    }

    // ============================================================
    // REAL-TIME MONITORING
    // ============================================================

    /**
     * Start real-time monitoring for anchor changes
     */
    async startMonitoring(page: any, anchors: CognitiveAnchor[]): Promise<void> {
        logger.debug(`🔧 [MONITOR] Starting real-time monitoring for ${anchors.length} anchors`);

        // Setup mutation observer
        await page.evaluate((anchorData: any[]) => {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    // Check if any monitored anchors are affected
                    (window as any).__anchorMutations = (window as any).__anchorMutations || [];
                    (window as any).__anchorMutations.push({
                        type: mutation.type,
                        target: mutation.target.nodeName,
                        timestamp: Date.now()
                    });
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'id', 'data-testid', 'aria-label']
            });

            (window as any).__mutationObserver = observer;
        }, anchors);

        // Start polling for mutations
        const watcherId = `watcher_${Date.now()}`;
        this.activeWatchers.set(watcherId, setInterval(async () => {
            await this.checkForMutations(page, anchors);
        }, 1000));

        this.emit('monitoring:started', { anchors: anchors.length });
    }

    /**
     * Check for mutations
     */
    private async checkForMutations(page: any, anchors: CognitiveAnchor[]): Promise<void> {
        try {
            const mutations = await page.evaluate(() => {
                const m = (window as any).__anchorMutations || [];
                (window as any).__anchorMutations = [];
                return m;
            });

            if (mutations.length > 0) {
                logger.debug(`🔧 [MONITOR] Detected ${mutations.length} mutations`);

                // Check each anchor
                for (const anchor of anchors) {
                    const element: any = await this.neuralMap.findElement(page, anchor.id);
                    
                    if (!element?.found) {
                        logger.debug(`🔧 [MONITOR] Anchor broken: ${anchor.id}`);
                        
                        if (this.config.autoHeal) {
                            const change: AnchorChange = {
                                anchorId: anchor.id,
                                previousSelector: (anchor.selectors[0] as any)?.value || anchor.selectors[0]?.selector || '',
                                previousSignals: anchor.selectors,
                                changeType: 'modified',
                                detectedAt: Date.now(),
                                pageUrl: page.url()
                            };

                            await this.heal(page, anchor, change);
                        }
                    }
                }
            }
        } catch (error) {
            // Page might be navigating, ignore
        }
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        for (const [id, timer] of this.activeWatchers) {
            clearInterval(timer as unknown as number);
        }
        this.activeWatchers.clear();
        this.emit('monitoring:stopped');
    }

    // ============================================================
    // PERSISTENCE
    // ============================================================

    private loadHealingData(): void {
        try {
            const historyPath = path.join(this.config.outputDir, 'healing-history.json');
            if (fs.existsSync(historyPath)) {
                const data = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
                this.healingHistory = new Map(Object.entries(data.history || {}));
                this.mutationPatterns = data.patterns || [];
            }
        } catch {}
    }

    private saveHealingData(): void {
        try {
            const dir = this.config.outputDir;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                history: Object.fromEntries(this.healingHistory),
                patterns: this.mutationPatterns,
                savedAt: Date.now()
            };

            fs.writeFileSync(
                path.join(dir, 'healing-history.json'),
                JSON.stringify(data, null, 2)
            );
        } catch {}
    }

    // ============================================================
    // UTILITIES
    // ============================================================

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Get healing statistics
     */
    getStatistics(): {
        totalHealings: number;
        successRate: number;
        patternsLearned: number;
        topStrategies: Array<{ strategy: string; count: number }>;
    } {
        const allHealings = Array.from(this.healingHistory.values())
            .flatMap(h => h.healings);

        const successfulHealings = allHealings.filter(h => h.success);
        
        const strategyCounts = new Map<string, number>();
        for (const h of successfulHealings) {
            strategyCounts.set(h.strategy, (strategyCounts.get(h.strategy) || 0) + 1);
        }

        return {
            totalHealings: allHealings.length,
            successRate: allHealings.length > 0 
                ? successfulHealings.length / allHealings.length 
                : 0,
            patternsLearned: this.mutationPatterns.length,
            topStrategies: Array.from(strategyCounts.entries())
                .map(([strategy, count]) => ({ strategy, count }))
                .sort((a, b) => b.count - a.count)
        };
    }
}

// ============================================================
// EXPORTS
// ============================================================
export function createSelfHealing(config?: Partial<SelfHealingConfig>): SelfHealingV2 {
    return new SelfHealingV2(config);
}

export { HealingResult, RefactorSuggestion, AnchorChange };
