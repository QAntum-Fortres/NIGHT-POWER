/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: CAPTCHA SOLVER
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Universal captcha solving with support for multiple providers:
 * - 2Captcha (reCAPTCHA v2/v3, hCaptcha, FunCaptcha, image captcha)
 * - AntiCaptcha
 * - CapMonster
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import { Page } from 'playwright';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export type CaptchaProvider = '2captcha' | 'anticaptcha' | 'capmonster' | 'capsolver';
export type CaptchaType = 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'funcaptcha' | 'image' | 'text' | 'turnstile';

export interface CaptchaSolverConfig {
  provider: CaptchaProvider;
  apiKey: string;
  timeout?: number;
  pollingInterval?: number;
  softId?: string;
  debug?: boolean;
}

export interface RecaptchaV2Task {
  type: 'recaptcha_v2';
  siteKey: string;
  pageUrl: string;
  isInvisible?: boolean;
  dataS?: string;
  proxyType?: string;
  proxyAddress?: string;
  proxyPort?: number;
  proxyLogin?: string;
  proxyPassword?: string;
}

export interface RecaptchaV3Task {
  type: 'recaptcha_v3';
  siteKey: string;
  pageUrl: string;
  action?: string;
  minScore?: number;
}

export interface HCaptchaTask {
  type: 'hcaptcha';
  siteKey: string;
  pageUrl: string;
  isInvisible?: boolean;
}

export interface FunCaptchaTask {
  type: 'funcaptcha';
  publicKey: string;
  pageUrl: string;
  serviceUrl?: string;
}

export interface ImageCaptchaTask {
  type: 'image';
  base64Image: string;
  phrase?: boolean;
  caseSensitive?: boolean;
  numeric?: 0 | 1 | 2;
  minLength?: number;
  maxLength?: number;
}

export interface TurnstileTask {
  type: 'turnstile';
  siteKey: string;
  pageUrl: string;
}

export type CaptchaTask = RecaptchaV2Task | RecaptchaV3Task | HCaptchaTask | FunCaptchaTask | ImageCaptchaTask | TurnstileTask;

export interface CaptchaSolution {
  taskId: string;
  solution: string;
  cost?: number;
  solveTime?: number;
  ip?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE CAPTCHA SOLVER
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class BaseCaptchaSolver extends EventEmitter {
  protected config: CaptchaSolverConfig;
  protected baseUrl: string = '';

  constructor(config: CaptchaSolverConfig) {
    super();
    this.config = {
      timeout: 120000,
      pollingInterval: 5000,
      debug: false,
      ...config
    };
  }

  /**
   * Solve any captcha type
   */
  async solve(task: CaptchaTask): Promise<CaptchaSolution> {
    const startTime = Date.now();
    this.emit('captcha:solving', { type: task.type });

    try {
      // Create task
      const taskId = await this.createTask(task);
      this.emit('captcha:task_created', { taskId, type: task.type });

      // Wait for solution
      const solution = await this.waitForResult(taskId);
      
      const solveTime = Date.now() - startTime;
      this.emit('captcha:solved', { taskId, solveTime, type: task.type });

      return {
        taskId,
        solution,
        solveTime
      };
    } catch (error) {
      this.emit('captcha:error', { error, type: task.type });
      throw error;
    }
  }

  /**
   * Create captcha task
   */
  protected abstract createTask(task: CaptchaTask): Promise<string>;

  /**
   * Get task result
   */
  protected abstract getResult(taskId: string): Promise<string | null>;

  /**
   * Wait for result with polling
   */
  protected async waitForResult(taskId: string): Promise<string> {
    const startTime = Date.now();
    const timeout = this.config.timeout!;
    const interval = this.config.pollingInterval!;

    while (Date.now() - startTime < timeout) {
      await this.sleep(interval);

      const result = await this.getResult(taskId);
      if (result) {
        return result;
      }
    }

    throw new Error(`Captcha solve timeout after ${timeout}ms`);
  }

  /**
   * Get balance
   */
  abstract getBalance(): Promise<number>;

  /**
   * Report incorrect captcha
   */
  abstract reportIncorrect(taskId: string): Promise<void>;

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * HTTP request helper
   */
  protected async request(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Debug log
   */
  protected log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[CaptchaSolver]', ...args);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2CAPTCHA SOLVER
// ═══════════════════════════════════════════════════════════════════════════════

export class TwoCaptchaSolver extends BaseCaptchaSolver {
  protected baseUrl = 'https://2captcha.com';

  protected async createTask(task: CaptchaTask): Promise<string> {
    const params: any = {
      key: this.config.apiKey,
      json: 1,
      soft_id: this.config.softId
    };

    switch (task.type) {
      case 'recaptcha_v2':
        params.method = 'userrecaptcha';
        params.googlekey = task.siteKey;
        params.pageurl = task.pageUrl;
        if (task.isInvisible) params.invisible = 1;
        if (task.dataS) params.data_s = task.dataS;
        break;

      case 'recaptcha_v3':
        params.method = 'userrecaptcha';
        params.version = 'v3';
        params.googlekey = task.siteKey;
        params.pageurl = task.pageUrl;
        if (task.action) params.action = task.action;
        if (task.minScore) params.min_score = task.minScore;
        break;

      case 'hcaptcha':
        params.method = 'hcaptcha';
        params.sitekey = task.siteKey;
        params.pageurl = task.pageUrl;
        if (task.isInvisible) params.invisible = 1;
        break;

      case 'funcaptcha':
        params.method = 'funcaptcha';
        params.publickey = task.publicKey;
        params.pageurl = task.pageUrl;
        if (task.serviceUrl) params.surl = task.serviceUrl;
        break;

      case 'image':
        params.method = 'base64';
        params.body = task.base64Image;
        if (task.phrase) params.phrase = 1;
        if (task.caseSensitive) params.regsense = 1;
        if (task.numeric !== undefined) params.numeric = task.numeric;
        if (task.minLength) params.min_len = task.minLength;
        if (task.maxLength) params.max_len = task.maxLength;
        break;

      case 'turnstile':
        params.method = 'turnstile';
        params.sitekey = task.siteKey;
        params.pageurl = task.pageUrl;
        break;

      default:
        throw new Error(`Unsupported captcha type: ${(task as any).type}`);
    }

    const queryString = new URLSearchParams(params).toString();
    const response = await this.request(`${this.baseUrl}/in.php?${queryString}`);

    if (response.status !== 1) {
      throw new Error(`2Captcha error: ${response.request}`);
    }

    return response.request;
  }

  protected async getResult(taskId: string): Promise<string | null> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
      action: 'get',
      id: taskId,
      json: '1'
    });

    const response = await this.request(`${this.baseUrl}/res.php?${params}`);

    if (response.status === 1) {
      return response.request;
    }

    if (response.request === 'CAPCHA_NOT_READY') {
      return null;
    }

    throw new Error(`2Captcha error: ${response.request}`);
  }

  async getBalance(): Promise<number> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
      action: 'getbalance',
      json: '1'
    });

    const response = await this.request(`${this.baseUrl}/res.php?${params}`);
    return parseFloat(response.request);
  }

  async reportIncorrect(taskId: string): Promise<void> {
    const params = new URLSearchParams({
      key: this.config.apiKey,
      action: 'reportbad',
      id: taskId,
      json: '1'
    });

    await this.request(`${this.baseUrl}/res.php?${params}`);
    this.emit('captcha:reported', { taskId });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTICAPTCHA SOLVER
// ═══════════════════════════════════════════════════════════════════════════════

export class AntiCaptchaSolver extends BaseCaptchaSolver {
  protected baseUrl = 'https://api.anti-captcha.com';

  protected async createTask(task: CaptchaTask): Promise<string> {
    let taskPayload: any = {};

    switch (task.type) {
      case 'recaptcha_v2':
        taskPayload = {
          type: task.isInvisible ? 'RecaptchaV2TaskProxyless' : 'NoCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey,
          isInvisible: task.isInvisible
        };
        break;

      case 'recaptcha_v3':
        taskPayload = {
          type: 'RecaptchaV3TaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey,
          minScore: task.minScore || 0.3,
          pageAction: task.action
        };
        break;

      case 'hcaptcha':
        taskPayload = {
          type: 'HCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey,
          isInvisible: task.isInvisible
        };
        break;

      case 'funcaptcha':
        taskPayload = {
          type: 'FunCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websitePublicKey: task.publicKey,
          funcaptchaApiJSSubdomain: task.serviceUrl
        };
        break;

      case 'image':
        taskPayload = {
          type: 'ImageToTextTask',
          body: task.base64Image,
          phrase: task.phrase,
          case: task.caseSensitive,
          numeric: task.numeric,
          minLength: task.minLength,
          maxLength: task.maxLength
        };
        break;

      case 'turnstile':
        taskPayload = {
          type: 'TurnstileTaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey
        };
        break;
    }

    const response = await this.request(`${this.baseUrl}/createTask`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        task: taskPayload
      })
    });

    if (response.errorId !== 0) {
      throw new Error(`AntiCaptcha error: ${response.errorCode} - ${response.errorDescription}`);
    }

    return String(response.taskId);
  }

  protected async getResult(taskId: string): Promise<string | null> {
    const response = await this.request(`${this.baseUrl}/getTaskResult`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId: parseInt(taskId)
      })
    });

    if (response.errorId !== 0) {
      throw new Error(`AntiCaptcha error: ${response.errorCode} - ${response.errorDescription}`);
    }

    if (response.status === 'ready') {
      return response.solution.gRecaptchaResponse || 
             response.solution.token ||
             response.solution.text;
    }

    return null;
  }

  async getBalance(): Promise<number> {
    const response = await this.request(`${this.baseUrl}/getBalance`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey
      })
    });

    return response.balance;
  }

  async reportIncorrect(taskId: string): Promise<void> {
    await this.request(`${this.baseUrl}/reportIncorrectRecaptcha`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId: parseInt(taskId)
      })
    });
    this.emit('captcha:reported', { taskId });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPMONSTER SOLVER
// ═══════════════════════════════════════════════════════════════════════════════

export class CapMonsterSolver extends BaseCaptchaSolver {
  protected baseUrl = 'https://api.capmonster.cloud';

  protected async createTask(task: CaptchaTask): Promise<string> {
    let taskPayload: any = {};

    switch (task.type) {
      case 'recaptcha_v2':
        taskPayload = {
          type: 'NoCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey
        };
        break;

      case 'recaptcha_v3':
        taskPayload = {
          type: 'RecaptchaV3TaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey,
          minScore: task.minScore || 0.3,
          pageAction: task.action
        };
        break;

      case 'hcaptcha':
        taskPayload = {
          type: 'HCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey
        };
        break;

      case 'funcaptcha':
        taskPayload = {
          type: 'FunCaptchaTaskProxyless',
          websiteURL: task.pageUrl,
          websitePublicKey: task.publicKey,
          funcaptchaApiJSSubdomain: task.serviceUrl
        };
        break;

      case 'image':
        taskPayload = {
          type: 'ImageToTextTask',
          body: task.base64Image
        };
        break;

      case 'turnstile':
        taskPayload = {
          type: 'TurnstileTask',
          websiteURL: task.pageUrl,
          websiteKey: task.siteKey
        };
        break;
    }

    const response = await this.request(`${this.baseUrl}/createTask`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        task: taskPayload
      })
    });

    if (response.errorId !== 0) {
      throw new Error(`CapMonster error: ${response.errorCode}`);
    }

    return String(response.taskId);
  }

  protected async getResult(taskId: string): Promise<string | null> {
    const response = await this.request(`${this.baseUrl}/getTaskResult`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId: parseInt(taskId)
      })
    });

    if (response.errorId !== 0) {
      throw new Error(`CapMonster error: ${response.errorCode}`);
    }

    if (response.status === 'ready') {
      return response.solution.gRecaptchaResponse ||
             response.solution.token ||
             response.solution.text;
    }

    return null;
  }

  async getBalance(): Promise<number> {
    const response = await this.request(`${this.baseUrl}/getBalance`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey
      })
    });

    return response.balance;
  }

  async reportIncorrect(taskId: string): Promise<void> {
    await this.request(`${this.baseUrl}/reportIncorrectRecaptcha`, {
      method: 'POST',
      body: JSON.stringify({
        clientKey: this.config.apiKey,
        taskId: parseInt(taskId)
      })
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAPTCHA SOLVER FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export class CaptchaSolver extends EventEmitter {
  private solver: BaseCaptchaSolver;
  private page: Page | null = null;

  constructor(config: CaptchaSolverConfig) {
    super();

    switch (config.provider) {
      case '2captcha':
        this.solver = new TwoCaptchaSolver(config);
        break;
      case 'anticaptcha':
        this.solver = new AntiCaptchaSolver(config);
        break;
      case 'capmonster':
        this.solver = new CapMonsterSolver(config);
        break;
      default:
        throw new Error(`Unknown captcha provider: ${config.provider}`);
    }

    // Forward events
    this.solver.on('captcha:solving', (data) => this.emit('captcha:solving', data));
    this.solver.on('captcha:solved', (data) => this.emit('captcha:solved', data));
    this.solver.on('captcha:error', (data) => this.emit('captcha:error', data));
  }

  /**
   * Set page for auto-detection
   */
  setPage(page: Page): void {
    this.page = page;
  }

  /**
   * Solve reCAPTCHA v2
   */
  async solveRecaptchaV2(siteKey: string, pageUrl: string, isInvisible: boolean = false): Promise<string> {
    const solution = await this.solver.solve({
      type: 'recaptcha_v2',
      siteKey,
      pageUrl,
      isInvisible
    });
    return solution.solution;
  }

  /**
   * Solve reCAPTCHA v3
   */
  async solveRecaptchaV3(siteKey: string, pageUrl: string, action?: string, minScore?: number): Promise<string> {
    const solution = await this.solver.solve({
      type: 'recaptcha_v3',
      siteKey,
      pageUrl,
      action,
      minScore
    });
    return solution.solution;
  }

  /**
   * Solve hCaptcha
   */
  async solveHCaptcha(siteKey: string, pageUrl: string): Promise<string> {
    const solution = await this.solver.solve({
      type: 'hcaptcha',
      siteKey,
      pageUrl
    });
    return solution.solution;
  }

  /**
   * Solve FunCaptcha
   */
  async solveFunCaptcha(publicKey: string, pageUrl: string, serviceUrl?: string): Promise<string> {
    const solution = await this.solver.solve({
      type: 'funcaptcha',
      publicKey,
      pageUrl,
      serviceUrl
    });
    return solution.solution;
  }

  /**
   * Solve Cloudflare Turnstile
   */
  async solveTurnstile(siteKey: string, pageUrl: string): Promise<string> {
    const solution = await this.solver.solve({
      type: 'turnstile',
      siteKey,
      pageUrl
    });
    return solution.solution;
  }

  /**
   * Solve image captcha
   */
  async solveImage(base64Image: string, options: Partial<ImageCaptchaTask> = {}): Promise<string> {
    const solution = await this.solver.solve({
      type: 'image',
      base64Image,
      ...options
    });
    return solution.solution;
  }

  /**
   * Auto-detect and solve captcha on current page
   */
  async autoSolve(): Promise<string | null> {
    if (!this.page) {
      throw new Error('Page not set. Call setPage() first.');
    }

    const pageUrl = this.page.url();

    // Check for reCAPTCHA
    const recaptchaSiteKey = await this.detectRecaptcha();
    if (recaptchaSiteKey) {
      const isV3 = await this.isRecaptchaV3();
      if (isV3) {
        return this.solveRecaptchaV3(recaptchaSiteKey, pageUrl);
      }
      const isInvisible = await this.isInvisibleRecaptcha();
      return this.solveRecaptchaV2(recaptchaSiteKey, pageUrl, isInvisible);
    }

    // Check for hCaptcha
    const hcaptchaSiteKey = await this.detectHCaptcha();
    if (hcaptchaSiteKey) {
      return this.solveHCaptcha(hcaptchaSiteKey, pageUrl);
    }

    // Check for Turnstile
    const turnstileSiteKey = await this.detectTurnstile();
    if (turnstileSiteKey) {
      return this.solveTurnstile(turnstileSiteKey, pageUrl);
    }

    return null;
  }

  /**
   * Inject solution into page
   */
  async injectSolution(solution: string, type: 'recaptcha' | 'hcaptcha' | 'turnstile' = 'recaptcha'): Promise<void> {
    if (!this.page) throw new Error('Page not set');

    switch (type) {
      case 'recaptcha':
        await this.page.evaluate((token) => {
          const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
          if (textarea) {
            textarea.value = token;
            textarea.style.display = 'none';
          }
          // Also try callback
          if ((window as any).grecaptcha && (window as any).grecaptcha.callback) {
            (window as any).grecaptcha.callback(token);
          }
        }, solution);
        break;

      case 'hcaptcha':
        await this.page.evaluate((token) => {
          const textarea = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.value = token;
          }
          // Trigger callback
          if ((window as any).hcaptcha) {
            (window as any).hcaptcha.execute({ response: token });
          }
        }, solution);
        break;

      case 'turnstile':
        await this.page.evaluate((token) => {
          const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
          if (input) {
            input.value = token;
          }
        }, solution);
        break;
    }

    this.emit('captcha:injected', { type });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETECTION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async detectRecaptcha(): Promise<string | null> {
    if (!this.page) return null;

    return this.page.evaluate(() => {
      // Check for reCAPTCHA element
      const recaptcha = document.querySelector('.g-recaptcha');
      if (recaptcha) {
        return recaptcha.getAttribute('data-sitekey');
      }

      // Check for reCAPTCHA script
      const scripts = Array.from(document.querySelectorAll('script'));
      for (const script of scripts) {
        const src = script.src || '';
        const match = src.match(/[?&]render=([^&]+)/);
        if (match) return match[1];
      }

      // Check grecaptcha object
      if ((window as any).grecaptcha) {
        const iframe = document.querySelector('iframe[src*="recaptcha"]');
        if (iframe) {
          const src = iframe.getAttribute('src') || '';
          const match = src.match(/k=([^&]+)/);
          if (match) return match[1];
        }
      }

      return null;
    });
  }

  private async isRecaptchaV3(): Promise<boolean> {
    if (!this.page) return false;

    return this.page.evaluate(() => {
      // V3 is usually loaded with render parameter
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src.includes('render='));
    });
  }

  private async isInvisibleRecaptcha(): Promise<boolean> {
    if (!this.page) return false;

    return this.page.evaluate(() => {
      const recaptcha = document.querySelector('.g-recaptcha');
      return recaptcha?.getAttribute('data-size') === 'invisible';
    });
  }

  private async detectHCaptcha(): Promise<string | null> {
    if (!this.page) return null;

    return this.page.evaluate(() => {
      const hcaptcha = document.querySelector('.h-captcha');
      return hcaptcha?.getAttribute('data-sitekey') || null;
    });
  }

  private async detectTurnstile(): Promise<string | null> {
    if (!this.page) return null;

    return this.page.evaluate(() => {
      const turnstile = document.querySelector('.cf-turnstile');
      return turnstile?.getAttribute('data-sitekey') || null;
    });
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    return this.solver.getBalance();
  }

  /**
   * Report incorrect solution
   */
  async reportIncorrect(taskId: string): Promise<void> {
    return this.solver.reportIncorrect(taskId);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

export function createCaptchaSolver(provider: CaptchaProvider, apiKey: string): CaptchaSolver {
  return new CaptchaSolver({ provider, apiKey });
}

export default CaptchaSolver;
