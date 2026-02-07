/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: MOBILE TESTING
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Mobile device emulation, device farm integration, responsive testing
 * 
 * @author dp | QAntum Labs
 * @version 1.0.0-QANTUM-PRIME
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DeviceDescriptor {
  name: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
  defaultBrowserType?: 'chromium' | 'firefox' | 'webkit';
}

export interface MobileConfig {
  device?: string | DeviceDescriptor;
  orientation?: 'portrait' | 'landscape';
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  permissions?: string[];
  offline?: boolean;
  networkConditions?: NetworkConditions;
}

export interface NetworkConditions {
  offline: boolean;
  downloadThroughput: number;  // bytes/s
  uploadThroughput: number;    // bytes/s
  latency: number;             // ms
}

export interface TouchAction {
  type: 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'scroll';
  x?: number;
  y?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  scale?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export const DEVICES: Record<string, DeviceDescriptor> = {
  // iPhone devices
  'iPhone 12': {
    name: 'iPhone 12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },
  'iPhone 13': {
    name: 'iPhone 13',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },
  'iPhone 14 Pro': {
    name: 'iPhone 14 Pro',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },
  'iPhone 15 Pro Max': {
    name: 'iPhone 15 Pro Max',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },
  'iPhone SE': {
    name: 'iPhone SE',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },

  // iPad devices
  'iPad Pro 11': {
    name: 'iPad Pro 11',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 834, height: 1194 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },
  'iPad Pro 12.9': {
    name: 'iPad Pro 12.9',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'webkit'
  },

  // Android devices
  'Pixel 7': {
    name: 'Pixel 7',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },
  'Pixel 8 Pro': {
    name: 'Pixel 8 Pro',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 448, height: 998 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },
  'Samsung Galaxy S23': {
    name: 'Samsung Galaxy S23',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
    viewport: { width: 360, height: 780 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },
  'Samsung Galaxy S24 Ultra': {
    name: 'Samsung Galaxy S24 Ultra',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 3.5,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },
  'Samsung Galaxy Tab S9': {
    name: 'Samsung Galaxy Tab S9',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium'
  },

  // Desktop modes
  'Desktop Chrome': {
    name: 'Desktop Chrome',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    defaultBrowserType: 'chromium'
  },
  'Desktop Firefox': {
    name: 'Desktop Firefox',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    defaultBrowserType: 'firefox'
  },
  'Desktop Safari': {
    name: 'Desktop Safari',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    defaultBrowserType: 'webkit'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK PRESETS
// ═══════════════════════════════════════════════════════════════════════════════

export const NETWORK_PRESETS: Record<string, NetworkConditions> = {
  'offline': {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0
  },
  'slow-2g': {
    offline: false,
    downloadThroughput: 50 * 1024 / 8,
    uploadThroughput: 25 * 1024 / 8,
    latency: 2000
  },
  '2g': {
    offline: false,
    downloadThroughput: 250 * 1024 / 8,
    uploadThroughput: 50 * 1024 / 8,
    latency: 1000
  },
  '3g': {
    offline: false,
    downloadThroughput: 750 * 1024 / 8,
    uploadThroughput: 250 * 1024 / 8,
    latency: 300
  },
  '4g': {
    offline: false,
    downloadThroughput: 4 * 1024 * 1024 / 8,
    uploadThroughput: 3 * 1024 * 1024 / 8,
    latency: 50
  },
  '5g': {
    offline: false,
    downloadThroughput: 100 * 1024 * 1024 / 8,
    uploadThroughput: 50 * 1024 * 1024 / 8,
    latency: 10
  },
  'wifi': {
    offline: false,
    downloadThroughput: 30 * 1024 * 1024 / 8,
    uploadThroughput: 15 * 1024 * 1024 / 8,
    latency: 20
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE EMULATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class MobileEmulator extends EventEmitter {
  private page: any;
  private device: DeviceDescriptor;
  private orientation: 'portrait' | 'landscape';
  private networkConditions?: NetworkConditions;

  constructor(page: any, config: MobileConfig) {
    super();
    this.page = page;
    this.orientation = config.orientation || 'portrait';
    
    // Resolve device
    if (typeof config.device === 'string') {
      this.device = DEVICES[config.device] || DEVICES['iPhone 12'];
    } else if (config.device) {
      this.device = config.device;
    } else {
      this.device = DEVICES['iPhone 12'];
    }

    if (config.networkConditions) {
      this.networkConditions = config.networkConditions;
    }
  }

  /**
   * Apply device emulation
   */
  async apply(): Promise<void> {
    const viewport = this.getViewport();
    
    await this.page.setViewportSize(viewport);
    
    // Set user agent
    await this.page.setExtraHTTPHeaders({
      'User-Agent': this.device.userAgent
    });

    // Enable touch events if supported
    if (this.device.hasTouch) {
      await this.page.evaluate(() => {
        Object.defineProperty(navigator, 'maxTouchPoints', { value: 5 });
      });
    }

    // Apply network conditions
    if (this.networkConditions) {
      await this.setNetworkConditions(this.networkConditions);
    }

    this.emit('applied', {
      device: this.device.name,
      viewport,
      orientation: this.orientation
    });
  }

  /**
   * Rotate device
   */
  async rotate(): Promise<void> {
    this.orientation = this.orientation === 'portrait' ? 'landscape' : 'portrait';
    const viewport = this.getViewport();
    await this.page.setViewportSize(viewport);
    this.emit('rotated', this.orientation);
  }

  /**
   * Set network conditions
   */
  async setNetworkConditions(conditions: NetworkConditions | string): Promise<void> {
    if (typeof conditions === 'string') {
      this.networkConditions = NETWORK_PRESETS[conditions];
    } else {
      this.networkConditions = conditions;
    }

    // Apply via CDP for Chromium
    const client = await this.page.context().newCDPSession(this.page);
    
    await client.send('Network.emulateNetworkConditions', {
      offline: this.networkConditions.offline,
      downloadThroughput: this.networkConditions.downloadThroughput,
      uploadThroughput: this.networkConditions.uploadThroughput,
      latency: this.networkConditions.latency
    });

    this.emit('networkChanged', this.networkConditions);
  }

  /**
   * Set geolocation
   */
  async setGeolocation(geo: { latitude: number; longitude: number; accuracy?: number }): Promise<void> {
    await this.page.context().setGeolocation({
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracy: geo.accuracy || 100
    });
    this.emit('geolocationChanged', geo);
  }

  /**
   * Perform touch action
   */
  async touch(action: TouchAction): Promise<void> {
    switch (action.type) {
      case 'tap':
        await this.tap(action.x!, action.y!);
        break;
      case 'doubleTap':
        await this.doubleTap(action.x!, action.y!);
        break;
      case 'longPress':
        await this.longPress(action.x!, action.y!, action.duration || 1000);
        break;
      case 'swipe':
        await this.swipe(action.direction!, action.distance || 300);
        break;
      case 'pinch':
        await this.pinch(action.scale || 0.5);
        break;
      case 'scroll':
        await this.scroll(action.direction!, action.distance || 300);
        break;
    }
  }

  private async tap(x: number, y: number): Promise<void> {
    await this.page.touchscreen.tap(x, y);
  }

  private async doubleTap(x: number, y: number): Promise<void> {
    await this.page.touchscreen.tap(x, y);
    await new Promise(r => setTimeout(r, 50));
    await this.page.touchscreen.tap(x, y);
  }

  private async longPress(x: number, y: number, duration: number): Promise<void> {
    await this.page.mouse.move(x, y);
    await this.page.mouse.down();
    await new Promise(r => setTimeout(r, duration));
    await this.page.mouse.up();
  }

  private async swipe(direction: 'up' | 'down' | 'left' | 'right', distance: number): Promise<void> {
    const { width, height } = this.getViewport();
    const centerX = width / 2;
    const centerY = height / 2;

    let startX = centerX, startY = centerY, endX = centerX, endY = centerY;

    switch (direction) {
      case 'up':
        startY = centerY + distance / 2;
        endY = centerY - distance / 2;
        break;
      case 'down':
        startY = centerY - distance / 2;
        endY = centerY + distance / 2;
        break;
      case 'left':
        startX = centerX + distance / 2;
        endX = centerX - distance / 2;
        break;
      case 'right':
        startX = centerX - distance / 2;
        endX = centerX + distance / 2;
        break;
    }

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(endX, endY, { steps: 20 });
    await this.page.mouse.up();
  }

  private async pinch(scale: number): Promise<void> {
    // Pinch gesture simulation
    const { width, height } = this.getViewport();
    
    await this.page.evaluate((scale: number) => {
      window.dispatchEvent(new WheelEvent('wheel', {
        deltaY: scale > 1 ? -100 : 100,
        ctrlKey: true
      }));
    }, scale);
  }

  private async scroll(direction: 'up' | 'down' | 'left' | 'right', distance: number): Promise<void> {
    const deltaX = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const deltaY = direction === 'up' ? -distance : direction === 'down' ? distance : 0;

    await this.page.evaluate(({ deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
      window.scrollBy(deltaX, deltaY);
    }, { deltaX, deltaY });
  }

  private getViewport(): { width: number; height: number } {
    if (this.orientation === 'landscape') {
      return {
        width: this.device.viewport.height,
        height: this.device.viewport.width
      };
    }
    return this.device.viewport;
  }

  getDevice(): DeviceDescriptor {
    return this.device;
  }

  getOrientation(): 'portrait' | 'landscape' {
    return this.orientation;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSIVE TESTER
// ═══════════════════════════════════════════════════════════════════════════════

export class ResponsiveTester extends EventEmitter {
  private page: any;

  constructor(page: any) {
    super();
    this.page = page;
  }

  /**
   * Test across multiple viewports
   */
  async testViewports(
    url: string,
    viewports: Array<{ width: number; height: number; name?: string }>,
    assertions: (page: any, viewport: { width: number; height: number }) => Promise<void>
  ): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];

    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');

      const result: ResponsiveTestResult = {
        viewport,
        name: viewport.name || `${viewport.width}x${viewport.height}`,
        passed: true,
        errors: []
      };

      try {
        await assertions(this.page, viewport);
      } catch (error) {
        result.passed = false;
        result.errors.push((error as Error).message);
      }

      // Take screenshot
      result.screenshot = await this.page.screenshot({ fullPage: true });

      results.push(result);
      this.emit('viewportTested', result);
    }

    return results;
  }

  /**
   * Test across all common breakpoints
   */
  async testBreakpoints(
    url: string,
    assertions: (page: any, viewport: { width: number; height: number }) => Promise<void>
  ): Promise<ResponsiveTestResult[]> {
    return this.testViewports(
      url,
      BREAKPOINTS.map(bp => ({ ...bp.viewport, name: bp.name })),
      assertions
    );
  }

  /**
   * Test across all devices
   */
  async testDevices(
    url: string,
    devices: string[],
    assertions: (page: any, device: DeviceDescriptor) => Promise<void>
  ): Promise<ResponsiveTestResult[]> {
    const results: ResponsiveTestResult[] = [];

    for (const deviceName of devices) {
      const device = DEVICES[deviceName];
      if (!device) continue;

      const emulator = new MobileEmulator(this.page, { device });
      await emulator.apply();
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');

      const result: ResponsiveTestResult = {
        viewport: device.viewport,
        name: device.name,
        device,
        passed: true,
        errors: []
      };

      try {
        await assertions(this.page, device);
      } catch (error) {
        result.passed = false;
        result.errors.push((error as Error).message);
      }

      result.screenshot = await this.page.screenshot({ fullPage: true });
      results.push(result);
    }

    return results;
  }
}

export interface ResponsiveTestResult {
  viewport: { width: number; height: number };
  name: string;
  device?: DeviceDescriptor;
  passed: boolean;
  errors: string[];
  screenshot?: Buffer;
}

interface Breakpoint {
  name: string;
  viewport: { width: number; height: number };
}

export const BREAKPOINTS: Breakpoint[] = [
  { name: 'xs', viewport: { width: 320, height: 568 } },
  { name: 'sm', viewport: { width: 640, height: 480 } },
  { name: 'md', viewport: { width: 768, height: 1024 } },
  { name: 'lg', viewport: { width: 1024, height: 768 } },
  { name: 'xl', viewport: { width: 1280, height: 800 } },
  { name: '2xl', viewport: { width: 1536, height: 864 } },
  { name: 'full-hd', viewport: { width: 1920, height: 1080 } },
  { name: '4k', viewport: { width: 3840, height: 2160 } }
];

// ═══════════════════════════════════════════════════════════════════════════════
// DEVICE FARM CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

export class DeviceFarmClient extends EventEmitter {
  private provider: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: {
    provider: 'browserstack' | 'saucelabs' | 'lambdatest' | 'aws';
    apiKey: string;
    username?: string;
  }) {
    super();
    this.provider = config.provider;
    this.apiKey = config.apiKey;

    // Set base URLs
    const urls: Record<string, string> = {
      browserstack: 'https://hub-cloud.browserstack.com/wd/hub',
      saucelabs: 'https://ondemand.saucelabs.com:443/wd/hub',
      lambdatest: 'https://hub.lambdatest.com/wd/hub',
      aws: 'https://devicefarm.us-west-2.amazonaws.com'
    };

    this.baseUrl = urls[config.provider];
  }

  /**
   * Get available devices
   */
  async getDevices(): Promise<Array<{ name: string; os: string; osVersion: string }>> {
    // API call to provider
    return [
      { name: 'iPhone 15 Pro', os: 'iOS', osVersion: '17.0' },
      { name: 'Pixel 8', os: 'Android', osVersion: '14' },
      { name: 'Samsung Galaxy S24', os: 'Android', osVersion: '14' }
    ];
  }

  /**
   * Create remote session
   */
  async createSession(capabilities: Record<string, any>): Promise<RemoteSession> {
    const sessionId = `session-${Date.now()}`;
    
    return {
      id: sessionId,
      provider: this.provider,
      capabilities,
      status: 'running',
      startTime: new Date()
    };
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    this.emit('sessionEnded', sessionId);
  }
}

export interface RemoteSession {
  id: string;
  provider: string;
  capabilities: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function createMobileEmulator(page: any, config: MobileConfig): MobileEmulator {
  return new MobileEmulator(page, config);
}

export function createResponsiveTester(page: any): ResponsiveTester {
  return new ResponsiveTester(page);
}

export default {
  MobileEmulator,
  ResponsiveTester,
  DeviceFarmClient,
  DEVICES,
  NETWORK_PRESETS,
  BREAKPOINTS,
  createMobileEmulator,
  createResponsiveTester
};
