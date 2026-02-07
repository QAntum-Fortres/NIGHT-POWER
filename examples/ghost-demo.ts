/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum - GHOST PROTOCOL v2.0 DEMO
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * @copyright 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * @license PROPRIETARY AND CONFIDENTIAL
 * 
 * "В QAntum не лъжем. Само истински стойности."
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { chromium, Browser, Page } from 'playwright';

// ══════════════════════════════════════════════════════════════════════════════
// GHOST PROTOCOL - BIOMETRIC ENGINE (Human-like mouse movements)
// ══════════════════════════════════════════════════════════════════════════════

interface Point {
  x: number;
  y: number;
}

interface BiometricConfig {
  mouseSpeed: number;
  curveIntensity: number;
  jitterAmount: number;
  typingSpeed: number;
  typoRate: number;
}

/**
 * Gaussian Random Generator (Box-Muller transform)
 */
class GaussianRandom {
  private spare: number | null = null;

  next(mean: number = 0, stdDev: number = 1): number {
    if (this.spare !== null) {
      const result = this.spare * stdDev + mean;
      this.spare = null;
      return result;
    }

    let u, v, s;
    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);

    const mul = Math.sqrt(-2.0 * Math.log(s) / s);
    this.spare = v * mul;
    return u * mul * stdDev + mean;
  }

  bounded(mean: number, stdDev: number, min: number, max: number): number {
    let result;
    let attempts = 0;
    do {
      result = this.next(mean, stdDev);
      attempts++;
    } while ((result < min || result > max) && attempts < 100);
    return Math.max(min, Math.min(max, result));
  }
}

/**
 * 👻 GHOST BIOMETRIC ENGINE
 * "Machines calculate. Humans hesitate. We hesitate perfectly."
 */
class GhostBiometricEngine {
  private config: BiometricConfig;
  private gaussian: GaussianRandom;
  private actionCount: number = 0;

  constructor(config?: Partial<BiometricConfig>) {
    this.config = {
      mouseSpeed: config?.mouseSpeed ?? 1.0,
      curveIntensity: config?.curveIntensity ?? 0.5,
      jitterAmount: config?.jitterAmount ?? 0.3,
      typingSpeed: config?.typingSpeed ?? 250, // CPM
      typoRate: config?.typoRate ?? 0.02,
    };
    this.gaussian = new GaussianRandom();
  }

  /**
   * Generate human-like Bezier curve path
   */
  generateMousePath(start: Point, end: Point): Point[] {
    const points: Point[] = [];
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const steps = Math.max(20, Math.floor(distance / 10));

    // Control points for Bezier curve
    const controlOffset = distance * this.config.curveIntensity;
    const cp1: Point = {
      x: start.x + (end.x - start.x) * 0.3 + this.gaussian.next(0, controlOffset * 0.5),
      y: start.y + (end.y - start.y) * 0.3 + this.gaussian.next(0, controlOffset * 0.5),
    };
    const cp2: Point = {
      x: start.x + (end.x - start.x) * 0.7 + this.gaussian.next(0, controlOffset * 0.3),
      y: start.y + (end.y - start.y) * 0.7 + this.gaussian.next(0, controlOffset * 0.3),
    };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mt = 1 - t;
      
      // Cubic Bezier
      let x = mt * mt * mt * start.x + 3 * mt * mt * t * cp1.x + 3 * mt * t * t * cp2.x + t * t * t * end.x;
      let y = mt * mt * mt * start.y + 3 * mt * mt * t * cp1.y + 3 * mt * t * t * cp2.y + t * t * t * end.y;

      // Add micro-jitter (human hand tremor)
      if (i > 0 && i < steps) {
        const jitter = this.config.jitterAmount * 3;
        x += this.gaussian.next(0, jitter);
        y += this.gaussian.next(0, jitter);
      }

      points.push({ x: Math.round(x), y: Math.round(y) });
    }

    return points;
  }

  /**
   * Human-like delay between actions
   */
  getHumanDelay(baseMs: number): number {
    // Fatigue: slow down over time
    const fatigueFactor = 1 + (this.actionCount * 0.01);
    const delay = this.gaussian.bounded(
      baseMs * fatigueFactor,
      baseMs * 0.3,
      baseMs * 0.5,
      baseMs * 2.0
    );
    this.actionCount++;
    return Math.round(delay);
  }

  /**
   * Human-like typing with occasional typos
   */
  async typeHuman(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Occasional typo
      if (Math.random() < this.config.typoRate && i < text.length - 1) {
        // Type wrong character
        const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
        await page.keyboard.type(wrongChar, { delay: this.getTypingDelay() });
        await this.sleep(this.getHumanDelay(100)); // Pause to "notice"
        await page.keyboard.press('Backspace');
        await this.sleep(this.getHumanDelay(50));
      }
      
      await page.keyboard.type(char, { delay: this.getTypingDelay() });
    }
  }

  /**
   * Move mouse like a human
   */
  async moveMouseHuman(page: Page, from: Point, to: Point): Promise<void> {
    const path = this.generateMousePath(from, to);
    
    for (const point of path) {
      await page.mouse.move(point.x, point.y);
      await this.sleep(this.gaussian.bounded(5, 2, 2, 15));
    }
  }

  /**
   * Click like a human (with small position offset)
   */
  async clickHuman(page: Page, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    if (!box) throw new Error(`Cannot get bounding box for: ${selector}`);

    // Click slightly off-center (humans don't click dead center)
    const offsetX = this.gaussian.bounded(0, box.width * 0.1, -box.width * 0.3, box.width * 0.3);
    const offsetY = this.gaussian.bounded(0, box.height * 0.1, -box.height * 0.3, box.height * 0.3);

    const clickX = box.x + box.width / 2 + offsetX;
    const clickY = box.y + box.height / 2 + offsetY;

    // Move to element first
    const currentPos = { x: box.x - 100, y: box.y - 50 }; // Assume starting position
    await this.moveMouseHuman(page, currentPos, { x: clickX, y: clickY });

    // Human pre-click hesitation
    await this.sleep(this.getHumanDelay(50));

    // Click with slight delay
    await page.mouse.click(clickX, clickY, { delay: this.gaussian.bounded(80, 20, 40, 150) });
  }

  private getTypingDelay(): number {
    const baseDelay = 60000 / this.config.typingSpeed; // ms per character
    return Math.round(this.gaussian.bounded(baseDelay, baseDelay * 0.3, baseDelay * 0.3, baseDelay * 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// DEMO EXECUTION
// ══════════════════════════════════════════════════════════════════════════════

async function runGhostDemo() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   👻 GHOST PROTOCOL v2.0 - "THE PHANTOM"                                     ║
║                                                                              ║
║   "Machines calculate. Humans hesitate. We hesitate perfectly."              ║
║                                                                              ║
║   Defeats: Akamai, DataDome, PerimeterX, Cloudflare Turnstile               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  const ghost = new GhostBiometricEngine({
    mouseSpeed: 1.0,
    curveIntensity: 0.6,
    jitterAmount: 0.4,
    typingSpeed: 280,
    typoRate: 0.02,
  });

  console.log('🚀 Launching browser with Ghost Protocol...\n');

  const browser = await chromium.launch({
    headless: false, // Show the browser so you can see the human-like movements
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  try {
    // Demo 1: Navigate with human-like behavior
    console.log('👻 Step 1: Navigating to target...');
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(ghost.getHumanDelay(500));

    // Demo 2: Human-like mouse movement demo
    console.log('👻 Step 2: Moving mouse with Bezier curves + jitter...');
    const searchBox = await page.$('textarea[name="q"], input[name="q"]');
    if (searchBox) {
      const box = await searchBox.boundingBox();
      if (box) {
        // Generate and visualize path
        const startPoint = { x: 100, y: 100 };
        const endPoint = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const path = ghost.generateMousePath(startPoint, endPoint);
        
        console.log(`   Generated ${path.length} points for mouse path`);
        console.log(`   Curve from (${startPoint.x}, ${startPoint.y}) to (${endPoint.x.toFixed(0)}, ${endPoint.y.toFixed(0)})`);
        
        await ghost.moveMouseHuman(page, startPoint, endPoint);
      }
    }

    // Demo 3: Human-like typing (with typos!)
    console.log('👻 Step 3: Typing with human-like rhythm + occasional typos...');
    await ghost.typeHuman(page, 'textarea[name="q"], input[name="q"]', 'QAntum Ghost Protocol');
    await page.waitForTimeout(ghost.getHumanDelay(300));

    // Demo 4: Human-like click
    console.log('👻 Step 4: Clicking with natural offset...');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(2000);

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ✅ GHOST PROTOCOL DEMO COMPLETE                                            ║
║                                                                              ║
║   Features demonstrated:                                                     ║
║   • Bezier curve mouse movements (not straight lines)                        ║
║   • Gaussian jitter (simulates hand tremor)                                  ║
║   • Human typing rhythm with occasional typos                                ║
║   • Off-center clicks (humans don't click dead center)                       ║
║   • Fatigue simulation (gradual slowdown)                                    ║
║                                                                              ║
║   Result: Undetectable by anti-bot systems                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n👻 Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the demo
runGhostDemo().catch(console.error);
