/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   ██╗   ██╗██╗███████╗██╗   ██╗ █████╗ ██╗          ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗║
 * ║   ██║   ██║██║██╔════╝██║   ██║██╔══██╗██║         ██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝║
 * ║   ██║   ██║██║███████╗██║   ██║███████║██║         ██║  ███╗███████║██║   ██║███████╗   ██║   ║
 * ║   ╚██╗ ██╔╝██║╚════██║██║   ██║██╔══██║██║         ██║   ██║██╔══██║██║   ██║╚════██║   ██║   ║
 * ║    ╚████╔╝ ██║███████║╚██████╔╝██║  ██║███████╗    ╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ║
 * ║     ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ║
 * ║                                                                                               ║
 * ║                         VISUAL GHOSTING INTEGRATION ENGINE                                    ║
 * ║                  "Fake-but-Perfect Rendering for Canvas Fingerprinting"                       ║
 * ║                                                                                               ║
 * ║   THE FINAL SYNTHESIS - Task 2: Visual Ghosting                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CanvasFingerprint {
    hash: string;
    width: number;
    height: number;
    dataUrl: string;
    entropy: number;
}

export interface GhostRenderConfig {
    /** Enable perlin noise injection */
    noiseEnabled: boolean;
    /** Noise intensity (0.0 - 1.0) */
    noiseIntensity: number;
    /** Fake GPU vendor */
    gpuVendor: string;
    /** Fake GPU renderer */
    gpuRenderer: string;
    /** Canvas hash mutation seed */
    hashSeed: number;
    /** WebGL parameter spoofing */
    webglSpoof: boolean;
    /** Audio context fingerprint masking */
    audioMask: boolean;
}

export interface RenderInterception {
    original: ImageData;
    modified: ImageData;
    timestamp: number;
    fingerprint: CanvasFingerprint;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERLIN NOISE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Perlin Noise for organic canvas modifications
 */
class PerlinNoise {
    private permutation: number[] = [];
    private p: number[] = [];

    constructor(seed: number = Date.now()) {
        this.initPermutation(seed);
    }

    private initPermutation(seed: number): void {
        const random = this.seededRandom(seed);
        
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = i;
        }

        // Fisher-Yates shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }

        // Duplicate for overflow
        this.p = [...this.permutation, ...this.permutation];
    }

    private seededRandom(seed: number): () => number {
        return () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(a: number, b: number, t: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number): number {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise2D(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;

        return this.lerp(
            this.lerp(this.grad(this.p[A], x, y), this.grad(this.p[B], x - 1, y), u),
            this.lerp(this.grad(this.p[A + 1], x, y - 1), this.grad(this.p[B + 1], x - 1, y - 1), u),
            v
        );
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL GHOST ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VisualGhostEngine - Intercepts and modifies canvas fingerprinting attempts
 */
export class VisualGhostEngine {
    private static instance: VisualGhostEngine;
    
    private config: GhostRenderConfig;
    private perlin: PerlinNoise;
    private interceptedRenders: RenderInterception[] = [];
    private fingerprintCache: Map<string, CanvasFingerprint> = new Map();

    private constructor(config: Partial<GhostRenderConfig> = {}) {
        this.config = {
            noiseEnabled: true,
            noiseIntensity: 0.02,
            gpuVendor: 'Intel Inc.',
            gpuRenderer: 'Intel Iris OpenGL Engine',
            hashSeed: Date.now(),
            webglSpoof: true,
            audioMask: true,
            ...config
        };

        this.perlin = new PerlinNoise(this.config.hashSeed);
    }

    static getInstance(config?: Partial<GhostRenderConfig>): VisualGhostEngine {
        if (!VisualGhostEngine.instance) {
            VisualGhostEngine.instance = new VisualGhostEngine(config);
        }
        return VisualGhostEngine.instance;
    }

    /**
     * Apply ghost modifications to canvas ImageData
     */
    ghostify(imageData: ImageData): ImageData {
        if (!this.config.noiseEnabled) {
            return imageData;
        }

        const data = new Uint8ClampedArray(imageData.data);
        const width = imageData.width;
        const height = imageData.height;

        // Apply perlin noise to each pixel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;

                // Generate noise value for this position
                const noiseValue = this.perlin.noise2D(x * 0.1, y * 0.1);
                const modification = Math.floor(noiseValue * this.config.noiseIntensity * 10);

                // Apply subtle modification to RGB channels (not alpha)
                data[i] = this.clamp(data[i] + modification);     // R
                data[i + 1] = this.clamp(data[i + 1] + modification); // G
                data[i + 2] = this.clamp(data[i + 2] + modification); // B
                // data[i + 3] unchanged (Alpha)
            }
        }

        return new ImageData(data, width, height);
    }

    /**
     * Generate fake-but-consistent canvas fingerprint
     */
    generateFakeFingerprint(width: number = 200, height: number = 50): CanvasFingerprint {
        const cacheKey = `${width}x${height}-${this.config.hashSeed}`;
        
        if (this.fingerprintCache.has(cacheKey)) {
            return this.fingerprintCache.get(cacheKey)!;
        }

        // Generate deterministic but unique fingerprint based on seed
        const hash = this.generateDeterministicHash(width, height);
        const entropy = 0.7 + (this.config.hashSeed % 1000) / 3333; // 0.7-1.0 range

        const fingerprint: CanvasFingerprint = {
            hash,
            width,
            height,
            dataUrl: this.generateFakeDataUrl(width, height),
            entropy
        };

        this.fingerprintCache.set(cacheKey, fingerprint);
        return fingerprint;
    }

    /**
     * Intercept canvas toDataURL call
     */
    interceptToDataURL(
        originalData: string,
        canvas: { width: number; height: number }
    ): string {
        // Generate consistent fake data URL
        const fake = this.generateFakeDataUrl(canvas.width, canvas.height);
        
        console.log(`👻 [VisualGhost] Intercepted toDataURL: ${canvas.width}x${canvas.height}`);
        
        return fake;
    }

    /**
     * Get WebGL parameter spoofing values
     */
    getWebGLSpoofParams(): {
        vendor: string;
        renderer: string;
        extensions: string[];
        maxTextureSize: number;
        maxViewportDims: [number, number];
    } {
        return {
            vendor: this.config.gpuVendor,
            renderer: this.config.gpuRenderer,
            extensions: [
                'ANGLE_instanced_arrays',
                'EXT_blend_minmax',
                'EXT_color_buffer_half_float',
                'EXT_disjoint_timer_query',
                'EXT_float_blend',
                'EXT_frag_depth',
                'EXT_shader_texture_lod',
                'EXT_texture_compression_bptc',
                'EXT_texture_compression_rgtc',
                'EXT_texture_filter_anisotropic',
                'OES_element_index_uint',
                'OES_fbo_render_mipmap',
                'OES_standard_derivatives',
                'OES_texture_float',
                'OES_texture_float_linear',
                'OES_texture_half_float',
                'OES_texture_half_float_linear',
                'OES_vertex_array_object',
                'WEBGL_color_buffer_float',
                'WEBGL_compressed_texture_s3tc',
                'WEBGL_compressed_texture_s3tc_srgb',
                'WEBGL_debug_renderer_info',
                'WEBGL_debug_shaders',
                'WEBGL_depth_texture',
                'WEBGL_draw_buffers',
                'WEBGL_lose_context'
            ],
            maxTextureSize: 16384,
            maxViewportDims: [32767, 32767]
        };
    }

    /**
     * Get AudioContext fingerprint masking
     */
    getAudioContextMask(): {
        sampleRate: number;
        channelCount: number;
        oscillatorFrequency: number;
        noiseFloor: number;
    } {
        // Generate consistent but varied audio fingerprint
        const seed = this.config.hashSeed;
        
        return {
            sampleRate: 44100 + (seed % 4) * 100, // 44100, 44200, 44300, or 44400
            channelCount: 2,
            oscillatorFrequency: 1000 + (seed % 100),
            noiseFloor: -100 + (seed % 20) // -100 to -80 dB
        };
    }

    /**
     * Record interception for analysis
     */
    recordInterception(original: ImageData, modified: ImageData): void {
        this.interceptedRenders.push({
            original,
            modified,
            timestamp: Date.now(),
            fingerprint: this.generateFakeFingerprint(original.width, original.height)
        });

        // Keep only last 100 interceptions
        if (this.interceptedRenders.length > 100) {
            this.interceptedRenders.shift();
        }
    }

    /**
     * Get interception statistics
     */
    getStats(): {
        totalInterceptions: number;
        uniqueFingerprints: number;
        lastInterception: number | null;
    } {
        return {
            totalInterceptions: this.interceptedRenders.length,
            uniqueFingerprints: this.fingerprintCache.size,
            lastInterception: this.interceptedRenders.length > 0
                ? this.interceptedRenders[this.interceptedRenders.length - 1].timestamp
                : null
        };
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<GhostRenderConfig>): void {
        this.config = { ...this.config, ...config };
        
        if (config.hashSeed !== undefined) {
            this.perlin = new PerlinNoise(config.hashSeed);
            this.fingerprintCache.clear();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private clamp(value: number): number {
        return Math.max(0, Math.min(255, value));
    }

    private generateDeterministicHash(width: number, height: number): string {
        const seed = this.config.hashSeed;
        const input = `${width}-${height}-${seed}`;
        
        // Simple deterministic hash
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return Math.abs(hash).toString(36).padStart(12, '0');
    }

    private generateFakeDataUrl(width: number, height: number): string {
        // Generate deterministic fake base64 data
        const seed = this.config.hashSeed;
        const fakeData = this.generatePseudoBase64(width * height * 4, seed);
        
        return `data:image/png;base64,${fakeData}`;
    }

    private generatePseudoBase64(length: number, seed: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let random = seed;

        for (let i = 0; i < Math.min(length, 1000); i++) {
            random = (random * 9301 + 49297) % 233280;
            result += chars[Math.floor((random / 233280) * 64)];
        }

        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL + GHOST PROTOCOL BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * VisualGhostBridge - Connects Visual Module with Ghost Protocol
 */
export class VisualGhostBridge {
    private ghostEngine: VisualGhostEngine;

    constructor(config?: Partial<GhostRenderConfig>) {
        this.ghostEngine = VisualGhostEngine.getInstance(config);
    }

    /**
     * Process screenshot with ghost protection
     */
    processScreenshot(imageData: ImageData): {
        original: ImageData;
        ghosted: ImageData;
        fingerprint: CanvasFingerprint;
    } {
        const ghosted = this.ghostEngine.ghostify(imageData);
        const fingerprint = this.ghostEngine.generateFakeFingerprint(
            imageData.width,
            imageData.height
        );

        this.ghostEngine.recordInterception(imageData, ghosted);

        return {
            original: imageData,
            ghosted,
            fingerprint
        };
    }

    /**
     * Get ghost engine instance
     */
    getEngine(): VisualGhostEngine {
        return this.ghostEngine;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getVisualGhost = (config?: Partial<GhostRenderConfig>) => 
    VisualGhostEngine.getInstance(config);

export default VisualGhostEngine;
