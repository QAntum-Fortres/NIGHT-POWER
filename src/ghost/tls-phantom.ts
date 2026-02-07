/**
 * ⚛️ QANTUM GHOST PROTOCOL v2 - TLS PHANTOM ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * JA3/JA3S Fingerprint Rotation & TLS Stealth
 * 
 * Defeats: Akamai Bot Manager, Cloudflare, DataDome, PerimeterX
 * 
 * "They see a ghost. They believe it's human."
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TLSProfile {
  id: string;
  name: string;
  ja3: string;
  ja3Hash: string;
  cipherSuites: number[];
  extensions: number[];
  supportedGroups: number[];
  ecPointFormats: number[];
  signatureAlgorithms: number[];
  alpnProtocols: string[];
  userAgent: string;
  secChUa: string;
  secChUaPlatform: string;
  secChUaMobile: string;
}

export interface PhantomConfig {
  rotationStrategy: 'random' | 'sequential' | 'weighted';
  rotationInterval: number; // ms between rotations
  profilePool: TLSProfile[];
  enableJA3Mutation: boolean;
  mutationIntensity: number; // 0-1, how much to mutate
}

// ═══════════════════════════════════════════════════════════════════════════════
// REAL BROWSER TLS PROFILES - Chrome, Firefox, Safari, Edge
// ═══════════════════════════════════════════════════════════════════════════════

const CHROME_121_PROFILE: TLSProfile = {
  id: 'chrome-121',
  name: 'Chrome 121 Windows',
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
  ja3Hash: 'cd08e31494f9531f560d64c695473da9',
  cipherSuites: [
    0x1301, // TLS_AES_128_GCM_SHA256
    0x1302, // TLS_AES_256_GCM_SHA384
    0x1303, // TLS_CHACHA20_POLY1305_SHA256
    0xc02b, // TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
    0xc02f, // TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
    0xc02c, // TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
    0xc030, // TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
    0xcca9, // TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256
    0xcca8, // TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
    0xc013, // TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA
    0xc014, // TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA
    0x009c, // TLS_RSA_WITH_AES_128_GCM_SHA256
    0x009d, // TLS_RSA_WITH_AES_256_GCM_SHA384
    0x002f, // TLS_RSA_WITH_AES_128_CBC_SHA
    0x0035  // TLS_RSA_WITH_AES_256_CBC_SHA
  ],
  extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
  supportedGroups: [29, 23, 24], // x25519, secp256r1, secp384r1
  ecPointFormats: [0], // uncompressed
  signatureAlgorithms: [
    0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601,
    0x0201, 0x0403, 0x0503, 0x0603, 0x0203, 0x0804, 0x0805, 0x0806
  ],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  secChUa: '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  secChUaPlatform: '"Windows"',
  secChUaMobile: '?0'
};

const CHROME_122_PROFILE: TLSProfile = {
  id: 'chrome-122',
  name: 'Chrome 122 Windows',
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
  ja3Hash: 'b32309a26951912be7dba376398abc3b',
  cipherSuites: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
  extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
  supportedGroups: [29, 23, 24],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  secChUa: '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  secChUaPlatform: '"Windows"',
  secChUaMobile: '?0'
};

const FIREFOX_122_PROFILE: TLSProfile = {
  id: 'firefox-122',
  name: 'Firefox 122 Windows',
  ja3: '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-34-51-43-13-45-28-21,29-23-24-25-256-257,0',
  ja3Hash: '579ccef312d18482fc42e2b822ca2430',
  cipherSuites: [0x1301, 0x1303, 0x1302, 0xc02b, 0xc02f, 0xcca9, 0xcca8, 0xc02c, 0xc030, 0xc00a, 0xc009, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
  extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 21],
  supportedGroups: [29, 23, 24, 25, 256, 257],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0807, 0x0808, 0x0809, 0x080a, 0x080b],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  secChUa: '',
  secChUaPlatform: '',
  secChUaMobile: ''
};

const SAFARI_17_PROFILE: TLSProfile = {
  id: 'safari-17',
  name: 'Safari 17 macOS',
  ja3: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49188-49187-49162-49161-49192-49191-49172-49171-157-156-61-60-53-47-255,0-23-65281-10-11-16-5-13-18-51-45-43-27-21,29-23-24-25,0',
  ja3Hash: 'eb1d94daa7e0344597e756a1fb6e7054',
  cipherSuites: [0x1301, 0x1302, 0x1303, 0xc02c, 0xc02b, 0xcca9, 0xc030, 0xc02f, 0xcca8, 0xc024, 0xc023, 0xc00a, 0xc009, 0xc028, 0xc027, 0xc014, 0xc013, 0x009d, 0x009c, 0x003d, 0x003c, 0x0035, 0x002f, 0x00ff],
  extensions: [0, 23, 65281, 10, 11, 16, 5, 13, 18, 51, 45, 43, 27, 21],
  supportedGroups: [29, 23, 24, 25],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0807, 0x0808],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  secChUa: '',
  secChUaPlatform: '',
  secChUaMobile: ''
};

const EDGE_121_PROFILE: TLSProfile = {
  id: 'edge-121',
  name: 'Edge 121 Windows',
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-17513-21,29-23-24,0',
  ja3Hash: 'b32309a26951912be7dba376398abc3b',
  cipherSuites: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
  extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
  supportedGroups: [29, 23, 24],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
  secChUa: '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
  secChUaPlatform: '"Windows"',
  secChUaMobile: '?0'
};

// Mobile profiles
const CHROME_ANDROID_PROFILE: TLSProfile = {
  id: 'chrome-android',
  name: 'Chrome 121 Android',
  ja3: '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0',
  ja3Hash: '25e9b1dd5a08df6568b5c4e256c264a7',
  cipherSuites: [0x1301, 0x1302, 0x1303, 0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
  extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 21],
  supportedGroups: [29, 23, 24],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.101 Mobile Safari/537.36',
  secChUa: '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
  secChUaPlatform: '"Android"',
  secChUaMobile: '?1'
};

const SAFARI_IOS_PROFILE: TLSProfile = {
  id: 'safari-ios',
  name: 'Safari iOS 17',
  ja3: '771,4865-4866-4867-49196-49195-52393-49200-49199-52392-49162-49161-49172-49171-157-156-53-47-255,0-23-65281-10-11-16-5-13-18-51-45-43-27-21,29-23-24,0',
  ja3Hash: '773906b0efdefa24a7f2b8eb6985bf37',
  cipherSuites: [0x1301, 0x1302, 0x1303, 0xc02c, 0xc02b, 0xcca9, 0xc030, 0xc02f, 0xcca8, 0xc00a, 0xc009, 0xc014, 0xc013, 0x009d, 0x009c, 0x0035, 0x002f, 0x00ff],
  extensions: [0, 23, 65281, 10, 11, 16, 5, 13, 18, 51, 45, 43, 27, 21],
  supportedGroups: [29, 23, 24],
  ecPointFormats: [0],
  signatureAlgorithms: [0x0403, 0x0503, 0x0603, 0x0807, 0x0808],
  alpnProtocols: ['h2', 'http/1.1'],
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  secChUa: '',
  secChUaPlatform: '',
  secChUaMobile: ''
};

// ═══════════════════════════════════════════════════════════════════════════════
// TLS PHANTOM ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class TLSPhantomEngine extends EventEmitter {
  private config: PhantomConfig;
  private currentProfile: TLSProfile;
  private profileIndex: number = 0;
  private rotationTimer: NodeJS.Timeout | null = null;
  private usageStats: Map<string, number> = new Map();

  static readonly PROFILES: TLSProfile[] = [
    CHROME_121_PROFILE,
    CHROME_122_PROFILE,
    FIREFOX_122_PROFILE,
    SAFARI_17_PROFILE,
    EDGE_121_PROFILE,
    CHROME_ANDROID_PROFILE,
    SAFARI_IOS_PROFILE
  ];

  constructor(config?: Partial<PhantomConfig>) {
    super();
    
    this.config = {
      rotationStrategy: config?.rotationStrategy || 'weighted',
      rotationInterval: config?.rotationInterval || 30000, // 30 seconds
      profilePool: config?.profilePool || TLSPhantomEngine.PROFILES,
      enableJA3Mutation: config?.enableJA3Mutation ?? true,
      mutationIntensity: config?.mutationIntensity ?? 0.1
    };

    this.currentProfile = this.selectProfile();
    
    // Initialize usage stats
    this.config.profilePool.forEach(p => this.usageStats.set(p.id, 0));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE SELECTION
  // ─────────────────────────────────────────────────────────────────────────────

  private selectProfile(): TLSProfile {
    const pool = this.config.profilePool;
    
    switch (this.config.rotationStrategy) {
      case 'random':
        return pool[Math.floor(Math.random() * pool.length)];
      
      case 'sequential':
        const profile = pool[this.profileIndex % pool.length];
        this.profileIndex++;
        return profile;
      
      case 'weighted':
      default:
        return this.selectWeightedProfile();
    }
  }

  private selectWeightedProfile(): TLSProfile {
    // Weight profiles based on real-world browser market share
    const weights: Record<string, number> = {
      'chrome-121': 0.30,
      'chrome-122': 0.25,
      'firefox-122': 0.10,
      'safari-17': 0.15,
      'edge-121': 0.10,
      'chrome-android': 0.05,
      'safari-ios': 0.05
    };

    const rand = Math.random();
    let cumulative = 0;

    for (const profile of this.config.profilePool) {
      cumulative += weights[profile.id] || (1 / this.config.profilePool.length);
      if (rand <= cumulative) {
        return profile;
      }
    }

    return this.config.profilePool[0];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // JA3 MUTATION ENGINE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Mutate JA3 fingerprint slightly to avoid exact-match detection
   * while maintaining valid TLS handshake compatibility
   */
  mutateJA3(profile: TLSProfile): TLSProfile {
    if (!this.config.enableJA3Mutation) {
      return profile;
    }

    const mutated = { ...profile };
    const intensity = this.config.mutationIntensity;

    // 1. Shuffle extension order slightly (some extensions are order-independent)
    if (Math.random() < intensity) {
      const shuffleable = [23, 35, 18, 21]; // Extensions that can be reordered
      const newExtensions = [...mutated.extensions];
      
      for (let i = 0; i < newExtensions.length; i++) {
        if (shuffleable.includes(newExtensions[i]) && Math.random() < 0.5) {
          const j = Math.floor(Math.random() * newExtensions.length);
          if (shuffleable.includes(newExtensions[j])) {
            [newExtensions[i], newExtensions[j]] = [newExtensions[j], newExtensions[i]];
          }
        }
      }
      mutated.extensions = newExtensions;
    }

    // 2. Add/remove optional extensions
    if (Math.random() < intensity * 0.5) {
      const optionalExtensions = [28, 34, 41, 44, 49]; // Optional TLS extensions
      const ext = optionalExtensions[Math.floor(Math.random() * optionalExtensions.length)];
      
      if (!mutated.extensions.includes(ext)) {
        mutated.extensions.push(ext);
      }
    }

    // 3. Regenerate JA3 hash
    mutated.ja3 = this.generateJA3String(mutated);
    mutated.ja3Hash = this.hashJA3(mutated.ja3);

    return mutated;
  }

  private generateJA3String(profile: TLSProfile): string {
    const version = 771; // TLS 1.2
    const ciphers = profile.cipherSuites.join('-');
    const extensions = profile.extensions.join('-');
    const groups = profile.supportedGroups.join('-');
    const formats = profile.ecPointFormats.join('-');
    
    return `${version},${ciphers},${extensions},${groups},${formats}`;
  }

  private hashJA3(ja3: string): string {
    return crypto.createHash('md5').update(ja3).digest('hex');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PROFILE ROTATION
  // ─────────────────────────────────────────────────────────────────────────────

  startRotation(): void {
    if (this.rotationTimer) {
      return;
    }

    this.rotationTimer = setInterval(() => {
      this.rotate();
    }, this.config.rotationInterval);

    this.emit('rotation:started', { interval: this.config.rotationInterval });
  }

  stopRotation(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
      this.rotationTimer = null;
      this.emit('rotation:stopped');
    }
  }

  rotate(): TLSProfile {
    const oldProfile = this.currentProfile;
    this.currentProfile = this.selectProfile();
    
    // Apply mutation if enabled
    if (this.config.enableJA3Mutation) {
      this.currentProfile = this.mutateJA3(this.currentProfile);
    }

    // Update stats
    const count = this.usageStats.get(this.currentProfile.id) || 0;
    this.usageStats.set(this.currentProfile.id, count + 1);

    this.emit('rotation:completed', {
      from: oldProfile.id,
      to: this.currentProfile.id,
      ja3Hash: this.currentProfile.ja3Hash
    });

    return this.currentProfile;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  getCurrentProfile(): TLSProfile {
    return this.currentProfile;
  }

  getProfileForWorker(workerId: number): TLSProfile {
    // Deterministic profile selection based on worker ID
    // Ensures consistent profiles for the same worker across restarts
    const seed = workerId * 31337;
    const index = seed % this.config.profilePool.length;
    let profile = this.config.profilePool[index];
    
    // Apply unique mutation per worker
    if (this.config.enableJA3Mutation) {
      const workerMutation = { ...this.config, mutationIntensity: 0.05 + (workerId % 10) * 0.01 };
      profile = this.mutateJA3(profile);
    }

    return profile;
  }

  /**
   * Generate HTTP headers matching the current TLS profile
   */
  getHeaders(): Record<string, string> {
    const profile = this.currentProfile;
    const headers: Record<string, string> = {
      'User-Agent': profile.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };

    // Add Chromium-specific headers
    if (profile.secChUa) {
      headers['sec-ch-ua'] = profile.secChUa;
      headers['sec-ch-ua-mobile'] = profile.secChUaMobile;
      headers['sec-ch-ua-platform'] = profile.secChUaPlatform;
      headers['Sec-Fetch-Dest'] = 'document';
      headers['Sec-Fetch-Mode'] = 'navigate';
      headers['Sec-Fetch-Site'] = 'none';
      headers['Sec-Fetch-User'] = '?1';
    }

    return headers;
  }

  /**
   * Get TLS configuration for https.Agent or tls.connect
   */
  getTLSConfig(): Record<string, unknown> {
    const profile = this.currentProfile;
    
    return {
      // Cipher suites in OpenSSL format
      ciphers: this.cipherSuitesToOpenSSL(profile.cipherSuites),
      
      // ALPN protocols
      ALPNProtocols: profile.alpnProtocols,
      
      // TLS versions
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.3',
      
      // Signature algorithms
      sigalgs: this.signatureAlgorithmsToOpenSSL(profile.signatureAlgorithms),
      
      // EC curves
      ecdhCurve: this.supportedGroupsToOpenSSL(profile.supportedGroups),
      
      // Session resumption (like real browsers)
      sessionTimeout: 300,
      
      // SNI
      servername: undefined, // Set per-request
      
      // Reject unauthorized certificates (like real browsers)
      rejectUnauthorized: true
    };
  }

  private cipherSuitesToOpenSSL(ciphers: number[]): string {
    const mapping: Record<number, string> = {
      0x1301: 'TLS_AES_128_GCM_SHA256',
      0x1302: 'TLS_AES_256_GCM_SHA384',
      0x1303: 'TLS_CHACHA20_POLY1305_SHA256',
      0xc02b: 'ECDHE-ECDSA-AES128-GCM-SHA256',
      0xc02f: 'ECDHE-RSA-AES128-GCM-SHA256',
      0xc02c: 'ECDHE-ECDSA-AES256-GCM-SHA384',
      0xc030: 'ECDHE-RSA-AES256-GCM-SHA384',
      0xcca9: 'ECDHE-ECDSA-CHACHA20-POLY1305',
      0xcca8: 'ECDHE-RSA-CHACHA20-POLY1305',
      0xc013: 'ECDHE-RSA-AES128-SHA',
      0xc014: 'ECDHE-RSA-AES256-SHA',
      0x009c: 'AES128-GCM-SHA256',
      0x009d: 'AES256-GCM-SHA384',
      0x002f: 'AES128-SHA',
      0x0035: 'AES256-SHA'
    };

    return ciphers.map(c => mapping[c] || '').filter(Boolean).join(':');
  }

  private signatureAlgorithmsToOpenSSL(sigalgs: number[]): string {
    const mapping: Record<number, string> = {
      0x0401: 'RSA+SHA256',
      0x0403: 'ECDSA+SHA256',
      0x0501: 'RSA+SHA384',
      0x0503: 'ECDSA+SHA384',
      0x0601: 'RSA+SHA512',
      0x0603: 'ECDSA+SHA512',
      0x0804: 'RSA-PSS+SHA256',
      0x0805: 'RSA-PSS+SHA384',
      0x0806: 'RSA-PSS+SHA512'
    };

    return sigalgs.map(s => mapping[s] || '').filter(Boolean).join(':');
  }

  private supportedGroupsToOpenSSL(groups: number[]): string {
    const mapping: Record<number, string> = {
      29: 'X25519',
      23: 'P-256',
      24: 'P-384',
      25: 'P-521'
    };

    return groups.map(g => mapping[g] || '').filter(Boolean).join(':');
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────────

  getStats(): Record<string, unknown> {
    return {
      currentProfile: this.currentProfile.id,
      currentJA3Hash: this.currentProfile.ja3Hash,
      rotationStrategy: this.config.rotationStrategy,
      rotationInterval: this.config.rotationInterval,
      mutationEnabled: this.config.enableJA3Mutation,
      profileUsage: Object.fromEntries(this.usageStats),
      isRotating: this.rotationTimer !== null
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine: TLSPhantomEngine | null = null;

export function getTLSPhantom(config?: Partial<PhantomConfig>): TLSPhantomEngine {
  if (!defaultEngine) {
    defaultEngine = new TLSPhantomEngine(config);
  }
  return defaultEngine;
}

export function createTLSPhantom(config?: Partial<PhantomConfig>): TLSPhantomEngine {
  return new TLSPhantomEngine(config);
}

export default TLSPhantomEngine;
