/**
 * ⚛️ TLS PHANTOM - JA3/JA3S Fingerprint Rotation Engine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Rotates TLS fingerprints to evade JA3-based bot detection
 * 
 * @author DIMITAR PRODROMOV
 * @version 1.0.0
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface TLSProfile {
  name: string;
  ja3Hash: string;
  userAgent: string;
  secChUa: string;
  platform: string;
  cipherSuites: number[];
  extensions: number[];
  ellipticCurves: number[];
  ecPointFormats: number[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BROWSER PROFILES DATABASE - Real fingerprints from legitimate browsers
// ═══════════════════════════════════════════════════════════════════════════════

const BROWSER_PROFILES: TLSProfile[] = [
  {
    name: 'Chrome 120 Windows',
    ja3Hash: 'cd08e31494f9531f560d64c695473da9',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    platform: 'Windows',
    cipherSuites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    ellipticCurves: [29, 23, 24],
    ecPointFormats: [0]
  },
  {
    name: 'Chrome 121 Windows',
    ja3Hash: 'b32309a26951912be7dba376398abc3b',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    secChUa: '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
    platform: 'Windows',
    cipherSuites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    ellipticCurves: [29, 23, 24],
    ecPointFormats: [0]
  },
  {
    name: 'Chrome 120 macOS',
    ja3Hash: 'a441c63e61ae4d34a0b4ce98d32e4f27',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    platform: 'macOS',
    cipherSuites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    ellipticCurves: [29, 23, 24],
    ecPointFormats: [0]
  },
  {
    name: 'Firefox 121 Windows',
    ja3Hash: '579ccef312d18482fc42e2b822ca2430',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    secChUa: '',
    platform: 'Windows',
    cipherSuites: [4865, 4867, 4866, 49195, 49199, 52393, 52392, 49196, 49200, 49162, 49161, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 21],
    ellipticCurves: [29, 23, 24, 25],
    ecPointFormats: [0]
  },
  {
    name: 'Firefox 122 Windows',
    ja3Hash: '88e5765ab84d4a9c4a3c1a9c9f128c72',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    secChUa: '',
    platform: 'Windows',
    cipherSuites: [4865, 4867, 4866, 49195, 49199, 52393, 52392, 49196, 49200, 49162, 49161, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 34, 51, 43, 13, 45, 28, 21],
    ellipticCurves: [29, 23, 24, 25],
    ecPointFormats: [0]
  },
  {
    name: 'Safari 17 macOS',
    ja3Hash: '773906b0efdefa24a7f2b8eb6985bf37',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    secChUa: '',
    platform: 'macOS',
    cipherSuites: [4865, 4866, 4867, 49196, 49195, 52393, 49200, 49199, 52392, 49162, 49161, 49172, 49171, 157, 156, 53, 47],
    extensions: [0, 23, 65281, 10, 11, 16, 5, 13, 18, 51, 45, 43, 27, 21],
    ellipticCurves: [29, 23, 24],
    ecPointFormats: [0]
  },
  {
    name: 'Edge 120 Windows',
    ja3Hash: 'de52e3e70b2e8f68e83f1c3a7e5e6b4e',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
    platform: 'Windows',
    cipherSuites: [4865, 4866, 4867, 49195, 49199, 49196, 49200, 52393, 52392, 49171, 49172, 156, 157, 47, 53],
    extensions: [0, 23, 65281, 10, 11, 35, 16, 5, 13, 18, 51, 45, 43, 27, 17513, 21],
    ellipticCurves: [29, 23, 24],
    ecPointFormats: [0]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// TLS PHANTOM CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class TLSPhantom {
  private currentProfile: TLSProfile;
  private rotationHistory: string[] = [];
  private maxHistorySize = 10;

  constructor() {
    this.currentProfile = this.selectRandomProfile();
    console.log(`[TLS-PHANTOM] 🔐 Initialized with profile: ${this.currentProfile.name}`);
  }

  /**
   * Get current TLS profile
   */
  getCurrentProfile(): TLSProfile {
    return { ...this.currentProfile };
  }

  /**
   * Get a random profile (without rotation)
   */
  getRandomProfile(): TLSProfile {
    return { ...BROWSER_PROFILES[Math.floor(Math.random() * BROWSER_PROFILES.length)] };
  }

  /**
   * Rotate to a new TLS fingerprint
   */
  rotate(): TLSProfile {
    // Avoid repeating recent profiles
    let newProfile: TLSProfile;
    let attempts = 0;
    
    do {
      newProfile = this.selectRandomProfile();
      attempts++;
    } while (
      this.rotationHistory.includes(newProfile.ja3Hash) && 
      attempts < BROWSER_PROFILES.length
    );

    // Update history
    this.rotationHistory.push(newProfile.ja3Hash);
    if (this.rotationHistory.length > this.maxHistorySize) {
      this.rotationHistory.shift();
    }

    this.currentProfile = newProfile;
    console.log(`[TLS-PHANTOM] 🔄 Rotated to: ${newProfile.name}`);
    
    return { ...newProfile };
  }

  /**
   * Get profile matching specific browser
   */
  getProfileByBrowser(browserName: string): TLSProfile | null {
    const profile = BROWSER_PROFILES.find(p => 
      p.name.toLowerCase().includes(browserName.toLowerCase())
    );
    return profile ? { ...profile } : null;
  }

  /**
   * Generate JA3 string from profile
   */
  generateJA3String(profile: TLSProfile): string {
    const version = '771'; // TLS 1.2
    const ciphers = profile.cipherSuites.join('-');
    const extensions = profile.extensions.join('-');
    const curves = profile.ellipticCurves.join('-');
    const formats = profile.ecPointFormats.join('-');
    
    return `${version},${ciphers},${extensions},${curves},${formats}`;
  }

  /**
   * Get all available profiles
   */
  getAvailableProfiles(): string[] {
    return BROWSER_PROFILES.map(p => p.name);
  }

  /**
   * Get rotation statistics
   */
  getStats(): { rotations: number; currentProfile: string; historySize: number } {
    return {
      rotations: this.rotationHistory.length,
      currentProfile: this.currentProfile.name,
      historySize: this.rotationHistory.length
    };
  }

  private selectRandomProfile(): TLSProfile {
    return BROWSER_PROFILES[Math.floor(Math.random() * BROWSER_PROFILES.length)];
  }
}

export default TLSPhantom;
