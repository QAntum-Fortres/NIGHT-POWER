/**
 * @fileoverview Semantic Engine - Accessibility Tree Mapping for intelligent element finding
 * @module engines/SemanticEngine
 * @version 8.5.0
 */

/**
 * SemanticEngine builds an accessibility map of the page and finds elements by semantic description
 * @class
 */
class SemanticEngine {
    /**
     * Create a SemanticEngine instance
     * @param {WebDriver} driver - Selenium WebDriver instance
     */
    constructor(driver) {
        /** @type {WebDriver} */
        this.driver = driver;
        /** @type {Array<Object>} */
        this.elementMap = [];
    }

    /**
     * Inject script to map all interactive elements on the page
     * @returns {Promise<Array<Object>>} Array of element info objects
     */
    async buildAccessibilityMap() {
        const script = `
            return (function() {
                const elements = [];
                const interactiveSelectors = [
                    'button', 'a', 'input', 'select', 'textarea',
                    '[role="button"]', '[role="link"]', '[role="checkbox"]',
                    '[role="radio"]', '[role="textbox"]', '[role="combobox"]',
                    '[onclick]', '[tabindex]', 'label'
                ];
                
                document.querySelectorAll(interactiveSelectors.join(',')).forEach((el, index) => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    if (window.getComputedStyle(el).display === 'none') return;
                    if (window.getComputedStyle(el).visibility === 'hidden') return;
                    
                    // Get accessible name
                    let name = el.getAttribute('aria-label') 
                        || el.getAttribute('title')
                        || el.getAttribute('placeholder')
                        || el.getAttribute('alt')
                        || el.innerText?.trim().substring(0, 100)
                        || el.value
                        || '';
                    
                    // Get role
                    let role = el.getAttribute('role') || el.tagName.toLowerCase();
                    if (el.type) role = el.type;
                    
                    // Build unique selector
                    let selector = '';
                    if (el.id) selector = '#' + el.id;
                    else if (el.name) selector = '[name="' + el.name + '"]';
                    else if (el.className && typeof el.className === 'string') {
                        const cls = el.className.split(' ')[0];
                        if (cls) selector = '.' + cls;
                    }
                    if (!selector) selector = el.tagName.toLowerCase() + ':nth-of-type(' + (index + 1) + ')';
                    
                    elements.push({
                        index,
                        role,
                        name: name.substring(0, 100),
                        tag: el.tagName.toLowerCase(),
                        type: el.type || '',
                        id: el.id || '',
                        selector,
                        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                        isVisible: rect.top < window.innerHeight && rect.bottom > 0,
                        attributes: {
                            href: el.href || '',
                            value: el.value || '',
                            checked: el.checked || false,
                            disabled: el.disabled || false,
                            required: el.required || false
                        }
                    });
                });
                
                return elements;
            })();
        `;
        
        try {
            this.elementMap = await this.driver.executeScript(script);
            return this.elementMap;
        } catch (e) {
            console.warn(`   ⚠️ Accessibility map failed: ${e.message}`);
            return [];
        }
    }

    /**
     * Find element by semantic description like "button Login" or "input email"
     * @param {string} description - Semantic description of the element
     * @returns {Object|null} Best matching element or null
     */
    findBySemantics(description) {
        const desc = description.toLowerCase();
        
        // Parse semantic query: "button Login", "input email", "checkbox terms"
        const roleMatches = {
            'button': ['button', 'submit', 'reset'],
            'link': ['a', 'link'],
            'input': ['input', 'text', 'textbox', 'field'],
            'checkbox': ['checkbox'],
            'radio': ['radio'],
            'select': ['select', 'dropdown', 'combobox'],
            'textarea': ['textarea']
        };
        
        let targetRole = null;
        let targetText = desc;
        
        for (const [role, keywords] of Object.entries(roleMatches)) {
            for (const kw of keywords) {
                if (desc.startsWith(kw + ' ') || desc.startsWith(kw + ':')) {
                    targetRole = role;
                    targetText = desc.replace(new RegExp('^' + kw + '[:\\s]+'), '').trim();
                    break;
                }
            }
            if (targetRole) break;
        }
        
        // Score each element
        const scored = this.elementMap.map(el => {
            let score = 0;
            const elName = (el.name || '').toLowerCase();
            const elId = (el.id || '').toLowerCase();
            
            // Role match
            if (targetRole) {
                if (el.role === targetRole || el.tag === targetRole || el.type === targetRole) {
                    score += 50;
                }
            }
            
            // Text match
            if (elName.includes(targetText)) score += 30;
            if (elName === targetText) score += 20;
            if (elId.includes(targetText)) score += 15;
            
            // Visibility bonus
            if (el.isVisible) score += 10;
            
            // Not disabled
            if (!el.attributes.disabled) score += 5;
            
            return { ...el, score };
        });
        
        // Return best match
        scored.sort((a, b) => b.score - a.score);
        return scored.length > 0 && scored[0].score > 20 ? scored[0] : null;
    }

    /**
     * Get formatted map for AI analysis
     * @returns {string} Human-readable element map
     */
    getMapForAI() {
        const visible = this.elementMap.filter(e => e.isVisible).slice(0, 50);
        return visible.map(e => 
            `[${e.index}] ${e.role}${e.type ? '(' + e.type + ')' : ''}: "${e.name}" → ${e.selector}`
        ).join('\n');
    }
}

module.exports = { SemanticEngine };
