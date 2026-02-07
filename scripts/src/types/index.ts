/**
 * 🧠 QANTUM HYBRID - Core Types
 * Всички типове на едно място
 */

// ============== BROWSER CONFIG ==============
export type BrowserType = 'chromium' | 'firefox' | 'webkit';
export type ExecutionMode = 'local' | 'grid' | 'browserstack';

export interface BrowserConfig {
  browser: BrowserType;
  headless: boolean;
  slowMo?: number;
  viewport?: { width: number; height: number };
  timeout?: number;
}

// ============== FRAMEWORK CONFIG ==============
export interface MMConfig {
  baseUrl: string;
  browser: BrowserConfig;
  mode: ExecutionMode;
  retries: number;
  selfHealing: boolean;
  parallel: {
    enabled: boolean;
    workers: number;
  };
  reporting: {
    screenshots: boolean;
    traces: boolean;
    har: boolean;
  };
  grid?: {
    url: string;
    capabilities?: Record<string, unknown>;
  };
}

// ============== ELEMENT & LOCATOR ==============
export interface MMElement {
  selector: string;
  shadowRoot?: boolean;
  iframe?: string;
  index?: number;
}

export interface LocatorStrategy {
  css?: string;
  xpath?: string;
  text?: string;
  testId?: string;
  role?: string;
}

// ============== TEST RESULT ==============
export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  trace?: string;
}

// ============== NETWORK ==============
export interface InterceptConfig {
  url: string | RegExp;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | '*';
  response?: {
    status?: number;
    body?: unknown;
    headers?: Record<string, string>;
  };
}

// ============== DEFAULT CONFIG ==============
export const DEFAULT_CONFIG: MMConfig = {
  baseUrl: 'http://localhost:3000',
  browser: {
    browser: 'chromium',
    headless: true,
    timeout: 30000,
    viewport: { width: 1280, height: 720 }
  },
  mode: 'local',
  retries: 3,
  selfHealing: true,
  parallel: {
    enabled: false,
    workers: 4
  },
  reporting: {
    screenshots: true,
    traces: true,
    har: false
  }
};
