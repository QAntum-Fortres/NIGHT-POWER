/**
 * @fileoverview Self-Healing Engine - Advanced element recovery and retry logic
 * @module engines/SelfHealingEngine
 * @version 8.5.0
 */

const { By, until } = require('selenium-webdriver');
const { CONFIG, TIMING } = require('../config/constants');

/**
 * SelfHealingEngine provides automatic element recovery with multiple fallback strategies
 * @class
 */
class SelfHealingEngine {
    /**
     * Create a SelfHealingEngine instance
     * @param {WebDriver} driver - Selenium WebDriver instance
     * @param {KnowledgeBase} knowledge - Knowledge base for learning selectors
     */
    constructor(driver, knowledge) {
        /** @type {WebDriver} */
        this.driver = driver;
        /** @type {KnowledgeBase} */
        this.knowledge = knowledge;
        /** @type {Map<string, Array<string>>} Failed selectors and their alternatives */
        this.failedSelectors = new Map();
        /** @type {number} */
        this.recoveryAttempts = 0;
        /** @type {string|null} */
        this.lastSuccessfulSelector = null;
        /** @type {string} */
        this.currentDomain = '';
    }

    /**
     * Generate all possible alternative selectors for an element
     * @param {string} selector - Original selector
     * @param {Object} elementInfo - Additional element information
     * @returns {Array<string>} Array of alternative selectors
     */
    generateAlternatives(selector, elementInfo = {}) {
        const alternatives = new Set();
        alternatives.add(selector);
        
        // From element info if available
        if (elementInfo.id) {
            alternatives.add(`#${elementInfo.id}`);
            alternatives.add(`[id="${elementInfo.id}"]`);
            alternatives.add(`//*[@id="${elementInfo.id}"]`);
        }
        if (elementInfo.name) {
            alternatives.add(`[name="${elementInfo.name}"]`);
            alternatives.add(`//*[@name="${elementInfo.name}"]`);
        }
        if (elementInfo.className) {
            const classes = elementInfo.className.split(' ').filter(c => c);
            classes.forEach(c => {
                alternatives.add(`.${c}`);
                alternatives.add(`[class*="${c}"]`);
            });
        }
        if (elementInfo.text) {
            const text = elementInfo.text.substring(0, 50);
            alternatives.add(`//*[contains(text(),"${text}")]`);
            alternatives.add(`//*[normalize-space()="${text}"]`);
            alternatives.add(`//button[contains(.,"${text}")]`);
            alternatives.add(`//a[contains(.,"${text}")]`);
        }
        if (elementInfo.ariaLabel) {
            alternatives.add(`[aria-label="${elementInfo.ariaLabel}"]`);
            alternatives.add(`//*[@aria-label="${elementInfo.ariaLabel}"]`);
        }
        if (elementInfo.placeholder) {
            alternatives.add(`[placeholder="${elementInfo.placeholder}"]`);
            alternatives.add(`[placeholder*="${elementInfo.placeholder}"]`);
        }
        if (elementInfo.dataTestId) {
            alternatives.add(`[data-testid="${elementInfo.dataTestId}"]`);
            alternatives.add(`[data-test="${elementInfo.dataTestId}"]`);
            alternatives.add(`[data-cy="${elementInfo.dataTestId}"]`);
        }
        
        // Parse original selector and generate variations
        if (selector.startsWith('#')) {
            const id = selector.substring(1);
            alternatives.add(`[id="${id}"]`);
            alternatives.add(`[id*="${id}"]`);
            alternatives.add(`//*[@id="${id}"]`);
            alternatives.add(`//*[contains(@id,"${id}")]`);
        } else if (selector.startsWith('.')) {
            const cls = selector.substring(1);
            alternatives.add(`[class*="${cls}"]`);
            alternatives.add(`//*[contains(@class,"${cls}")]`);
        } else if (!selector.startsWith('[') && !selector.startsWith('/') && !selector.includes('>')) {
            // Plain text - try as text content
            alternatives.add(`//*[contains(text(),"${selector}")]`);
            alternatives.add(`//button[contains(text(),"${selector}")]`);
            alternatives.add(`//a[contains(text(),"${selector}")]`);
            alternatives.add(`//span[contains(text(),"${selector}")]`);
            alternatives.add(`//label[contains(text(),"${selector}")]`);
            alternatives.add(`//*[contains(@value,"${selector}")]`);
            alternatives.add(`[placeholder*="${selector}"]`);
            alternatives.add(`[aria-label*="${selector}"]`);
            alternatives.add(`[title*="${selector}"]`);
        }
        
        // Get learned successful selectors from knowledge base
        if (this.knowledge) {
            const learned = this.knowledge.getBestSelectors(this.currentDomain || '', selector);
            learned.forEach(l => alternatives.add(l.selector));
        }
        
        return Array.from(alternatives).slice(0, CONFIG.SELF_HEALING.alternativeStrategies);
    }

    /**
     * Check if element is truly interactable
     * @param {WebElement} element - Element to check
     * @returns {Promise<Object>} Interactability check results
     */
    async isElementInteractable(element) {
        try {
            const checks = await this.driver.executeScript(`
                const el = arguments[0];
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                
                // Check visibility
                const isVisible = rect.width > 0 && rect.height > 0 &&
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    style.opacity !== '0';
                
                // Check if in viewport
                const inViewport = rect.top < window.innerHeight && rect.bottom > 0 &&
                    rect.left < window.innerWidth && rect.right > 0;
                
                // Check if not covered by another element
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const topElement = document.elementFromPoint(centerX, centerY);
                const notCovered = el === topElement || el.contains(topElement) || 
                    (topElement && topElement.contains(el));
                
                // Check if not disabled
                const notDisabled = !el.disabled && !el.hasAttribute('aria-disabled');
                
                return {
                    isVisible,
                    inViewport,
                    notCovered,
                    notDisabled,
                    isInteractable: isVisible && inViewport && notCovered && notDisabled,
                    coveringElement: !notCovered ? (topElement?.tagName + '.' + topElement?.className) : null
                };
            `, element);
            
            return checks;
        } catch (e) {
            console.warn(`   ⚠️ Interactable check failed: ${e.message}`);
            return { isInteractable: false, error: e.message };
        }
    }

    /**
     * Dismiss overlays, popups, modals automatically
     * @returns {Promise<boolean>} True if any overlay was dismissed
     */
    async dismissOverlays() {
        if (!CONFIG.SELF_HEALING.autoDismissOverlays) return false;
        
        try {
            const dismissed = await this.driver.executeScript(`
                let dismissed = 0;
                
                // Common overlay selectors
                const overlaySelectors = [
                    '[class*="overlay"]', '[class*="modal"]', '[class*="popup"]',
                    '[class*="dialog"]', '[class*="banner"]', '[class*="notification"]',
                    '[role="dialog"]', '[role="alertdialog"]',
                    '.intercom-messenger', '#intercom-container',
                    '[class*="cookie"]', '[class*="consent"]',
                    '[class*="chat-widget"]', '[class*="chatbot"]'
                ];
                
                // Close button selectors
                const closeSelectors = [
                    '[class*="close"]', '[aria-label*="close"]', '[aria-label*="Close"]',
                    '[class*="dismiss"]', 'button[class*="x"]', '.close-btn',
                    '[data-dismiss]', '[data-close]'
                ];
                
                // Try to click close buttons on overlays
                overlaySelectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(overlay => {
                        if (overlay.offsetParent !== null) {
                            // Try to find and click close button
                            closeSelectors.forEach(closeSel => {
                                const closeBtn = overlay.querySelector(closeSel);
                                if (closeBtn) {
                                    closeBtn.click();
                                    dismissed++;
                                }
                            });
                            
                            // Or just hide the overlay
                            if (overlay.style.position === 'fixed' || 
                                window.getComputedStyle(overlay).position === 'fixed') {
                                overlay.style.display = 'none';
                                dismissed++;
                            }
                        }
                    });
                });
                
                return dismissed;
            `);
            
            if (dismissed > 0) {
                console.log(`   🧹 Dismissed ${dismissed} overlay(s)`);
                await this.sleep(TIMING.RETRY_BASE_MS);
            }
            
            return dismissed > 0;
        } catch (e) {
            // Silent fail is OK for overlay dismissal
            return false;
        }
    }

    /**
     * Smart scroll to element with viewport check
     * @param {WebElement} element - Element to scroll to
     * @returns {Promise<void>}
     */
    async scrollToElement(element) {
        if (!CONFIG.SELF_HEALING.autoScroll) return;
        
        try {
            await this.driver.executeScript(`
                const el = arguments[0];
                const rect = el.getBoundingClientRect();
                
                // Only scroll if not in viewport
                if (rect.top < 0 || rect.bottom > window.innerHeight) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            `, element);
            await this.sleep(TIMING.SCROLL_WAIT_MS);
        } catch (e) {
            // Scroll failure is non-critical
        }
    }

    /**
     * Wait for DOM stability (no mutations)
     * @param {number} timeout - Max wait time in ms
     * @returns {Promise<void>}
     */
    async waitForDomStable(timeout = CONFIG.TIMEOUTS.domStable) {
        try {
            await this.driver.executeScript(`
                return new Promise((resolve) => {
                    let timer;
                    const observer = new MutationObserver(() => {
                        clearTimeout(timer);
                        timer = setTimeout(() => {
                            observer.disconnect();
                            resolve(true);
                        }, ${timeout});
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true
                    });
                    
                    // Initial timer
                    timer = setTimeout(() => {
                        observer.disconnect();
                        resolve(true);
                    }, ${timeout});
                });
            `);
        } catch (e) {
            // DOM stability check failure is non-critical
        }
    }

    /**
     * Wait for network to become idle
     * @param {number} timeout - Max wait time in ms
     * @returns {Promise<void>}
     */
    async waitForNetworkIdle(timeout = CONFIG.TIMEOUTS.networkIdle) {
        try {
            await this.driver.executeScript(`
                return new Promise((resolve) => {
                    let pending = 0;
                    let timer;
                    
                    const check = () => {
                        clearTimeout(timer);
                        if (pending === 0) {
                            timer = setTimeout(resolve, 500);
                        }
                    };
                    
                    // Override fetch
                    const originalFetch = window.fetch;
                    window.fetch = (...args) => {
                        pending++;
                        return originalFetch.apply(this, args).finally(() => {
                            pending--;
                            check();
                        });
                    };
                    
                    // Timeout fallback
                    setTimeout(resolve, ${timeout});
                    check();
                });
            `);
        } catch (e) {
            // Network idle check failure is non-critical
        }
    }

    /**
     * Main healing method - Find element with auto-recovery
     * @param {string} selector - Original selector
     * @param {number} timeout - Max timeout
     * @returns {Promise<Object>} Result with element or error
     */
    async healAndFind(selector, timeout = CONFIG.TIMEOUTS.element) {
        const alternatives = this.generateAlternatives(selector);
        const adaptiveTimeout = CONFIG.SELF_HEALING.adaptiveTimeout;
        
        for (let attempt = 0; attempt < CONFIG.SELF_HEALING.maxRetries; attempt++) {
            const attemptTimeout = adaptiveTimeout ? timeout * (1 + attempt * 0.3) : timeout;
            const timePerAlt = Math.max(1500, attemptTimeout / Math.min(alternatives.length, 5));
            
            // Wait for DOM stability before attempting
            if (attempt > 0) {
                await this.waitForDomStable();
                await this.dismissOverlays();
            }
            
            for (const alt of alternatives) {
                try {
                    let element = null;
                    
                    // Find element based on selector type
                    if (alt.startsWith('//') || alt.startsWith('(//')) {
                        element = await this.driver.wait(
                            until.elementLocated(By.xpath(alt)),
                            timePerAlt
                        );
                    } else if (alt.startsWith('#') && !alt.includes(' ') && !alt.includes('[')) {
                        element = await this.driver.wait(
                            until.elementLocated(By.id(alt.substring(1))),
                            timePerAlt
                        );
                    } else if (alt.startsWith('.') && !alt.includes(' ') && !alt.includes('[')) {
                        element = await this.driver.wait(
                            until.elementLocated(By.className(alt.substring(1))),
                            timePerAlt
                        );
                    } else {
                        element = await this.driver.wait(
                            until.elementLocated(By.css(alt)),
                            timePerAlt
                        );
                    }
                    
                    if (!element) continue;
                    
                    // Verify element is interactable
                    const checks = await this.isElementInteractable(element);
                    
                    if (!checks.isInteractable) {
                        // Try to fix
                        if (!checks.inViewport) {
                            await this.scrollToElement(element);
                        }
                        if (!checks.notCovered) {
                            await this.dismissOverlays();
                        }
                        
                        // Re-check
                        const recheck = await this.isElementInteractable(element);
                        if (!recheck.isInteractable) continue;
                    }
                    
                    // Success! Learn this selector
                    this.lastSuccessfulSelector = alt;
                    if (alt !== selector) {
                        console.log(`   🔄 Healed: "${selector}" → "${alt}"`);
                        if (!this.failedSelectors.has(selector)) {
                            this.failedSelectors.set(selector, []);
                        }
                        this.failedSelectors.get(selector).push(alt);
                    }
                    
                    return { element, usedStrategy: alt, healed: alt !== selector };
                    
                } catch {
                    continue;
                }
            }
            
            // Before next attempt, try to rebuild semantic map
            console.log(`   ⚠️ Attempt ${attempt + 1}/${CONFIG.SELF_HEALING.maxRetries} failed, retrying...`);
        }
        
        return { element: null, error: `Self-healing exhausted for: ${selector}` };
    }

    /**
     * Execute action with self-healing wrapper
     * @param {Function} action - Action to execute
     * @param {string} selector - Element selector
     * @param {...any} args - Additional arguments for action
     * @returns {Promise<Object>} Result of action
     */
    async executeWithHealing(action, selector, ...args) {
        const result = await this.healAndFind(selector);
        
        if (!result.element) {
            return { success: false, error: result.error };
        }
        
        try {
            await action(result.element, ...args);
            return { success: true, strategy: result.usedStrategy, healed: result.healed };
        } catch (e) {
            // Handle stale element
            if (e.name === 'StaleElementReferenceError' && CONFIG.SELF_HEALING.staleElementRetry) {
                console.log(`   🔄 Stale element, re-finding...`);
                const retry = await this.healAndFind(selector);
                if (retry.element) {
                    try {
                        await action(retry.element, ...args);
                        return { success: true, strategy: retry.usedStrategy, healed: true };
                    } catch (e2) {
                        return { success: false, error: e2.message };
                    }
                }
            }
            return { success: false, error: e.message };
        }
    }

    /**
     * Memory cleanup - call periodically to prevent memory leaks
     * @returns {void}
     */
    cleanup() {
        if (this.failedSelectors.size > 100) {
            // Keep only the 50 most recent entries
            const entries = Array.from(this.failedSelectors.entries());
            this.failedSelectors.clear();
            entries.slice(-50).forEach(([k, v]) => this.failedSelectors.set(k, v));
            console.log('   🧹 Self-healing cache cleaned');
        }
    }

    /**
     * Sleep helper
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = { SelfHealingEngine };
