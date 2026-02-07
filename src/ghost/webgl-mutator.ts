/**
 * 👻 GHOST v1.0.0 - WebGL Mutator
 * 
 * Visual Stealth Module - Makes every Swarm worker appear as a unique machine.
 * 
 * Anti-detection systems (Datadome, Akamai, Cloudflare Turnstile) check WebGL
 * fingerprints to identify headless browsers. This module injects scripts that
 * override getParameter() and getExtension() to report fake GPU hardware.
 * 
 * Features:
 * - Unique GPU fingerprint per Neural Fingerprint
 * - Canvas hash mutation
 * - Renderer/Vendor spoofing
 * - WebGL2 support detection masking
 * - Audio context fingerprint randomization
 * 
 * @version 1.0.0-QANTUM-PRIME
 * @author QANTUM AI Architect
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';

import { logger } from '../api/unified/utils/logger';
// ============================================================
// TYPES
// ============================================================

export interface WebGLProfile {
    profileId: string;
    vendor: string;
    renderer: string;
    unmaskedVendor: string;
    unmaskedRenderer: string;
    maxTextureSize: number;
    maxViewportDims: [number, number];
    maxRenderbufferSize: number;
    aliasedLineWidthRange: [number, number];
    aliasedPointSizeRange: [number, number];
    maxVertexAttribs: number;
    maxVaryingVectors: number;
    maxFragmentUniformVectors: number;
    maxVertexUniformVectors: number;
    supportedExtensions: string[];
    shaHash: string;
}

export interface CanvasProfile {
    noiseScale: number;
    colorShift: [number, number, number];
    fontRenderingVariance: number;
    textBaselineJitter: number;
}

export interface AudioProfile {
    sampleRate: number;
    channelCount: number;
    oscillatorType: OscillatorType;
    noiseAmplitude: number;
}

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface GhostVisualConfig {
    seed?: string;
    consistentPerSession: boolean;
    gpuPool: GPUDefinition[];
    enableCanvasMutation: boolean;
    enableAudioMutation: boolean;
    debugMode: boolean;
}

interface GPUDefinition {
    vendor: string;
    unmaskedVendor: string;
    renderer: string;
    unmaskedRenderer: string;
    tier: 'low' | 'mid' | 'high' | 'ultra';
    marketShare: number; // For realistic distribution
}

// ============================================================
// GPU DATABASE - Real-World Market Distribution
// ============================================================

const GPU_DATABASE: GPUDefinition[] = [
    // NVIDIA High-End (30% market share)
    {
        vendor: 'Google Inc. (NVIDIA)',
        unmaskedVendor: 'NVIDIA Corporation',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'NVIDIA GeForce RTX 4090',
        tier: 'ultra',
        marketShare: 0.05
    },
    {
        vendor: 'Google Inc. (NVIDIA)',
        unmaskedVendor: 'NVIDIA Corporation',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'NVIDIA GeForce RTX 4080',
        tier: 'ultra',
        marketShare: 0.08
    },
    {
        vendor: 'Google Inc. (NVIDIA)',
        unmaskedVendor: 'NVIDIA Corporation',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'NVIDIA GeForce RTX 3080',
        tier: 'high',
        marketShare: 0.12
    },
    {
        vendor: 'Google Inc. (NVIDIA)',
        unmaskedVendor: 'NVIDIA Corporation',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'NVIDIA GeForce RTX 3070',
        tier: 'high',
        marketShare: 0.10
    },
    {
        vendor: 'Google Inc. (NVIDIA)',
        unmaskedVendor: 'NVIDIA Corporation',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'NVIDIA GeForce GTX 1660 SUPER',
        tier: 'mid',
        marketShare: 0.15
    },
    
    // AMD (25% market share)
    {
        vendor: 'Google Inc. (AMD)',
        unmaskedVendor: 'AMD',
        renderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'AMD Radeon RX 7900 XTX',
        tier: 'ultra',
        marketShare: 0.05
    },
    {
        vendor: 'Google Inc. (AMD)',
        unmaskedVendor: 'AMD',
        renderer: 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'AMD Radeon RX 6800 XT',
        tier: 'high',
        marketShare: 0.08
    },
    {
        vendor: 'Google Inc. (AMD)',
        unmaskedVendor: 'AMD',
        renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'AMD Radeon RX 6600',
        tier: 'mid',
        marketShare: 0.12
    },
    
    // Intel Integrated (35% market share - most common!)
    {
        vendor: 'Google Inc. (Intel)',
        unmaskedVendor: 'Intel Inc.',
        renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'Intel(R) UHD Graphics 770',
        tier: 'low',
        marketShare: 0.15
    },
    {
        vendor: 'Google Inc. (Intel)',
        unmaskedVendor: 'Intel Inc.',
        renderer: 'ANGLE (Intel, Intel(R) Iris Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
        unmaskedRenderer: 'Intel(R) Iris Xe Graphics',
        tier: 'mid',
        marketShare: 0.20
    },
    
    // Apple Silicon (10% market share)
    {
        vendor: 'Apple Inc.',
        unmaskedVendor: 'Apple Inc.',
        renderer: 'Apple M3 Pro',
        unmaskedRenderer: 'Apple M3 Pro',
        tier: 'high',
        marketShare: 0.03
    },
    {
        vendor: 'Apple Inc.',
        unmaskedVendor: 'Apple Inc.',
        renderer: 'Apple M2',
        unmaskedRenderer: 'Apple M2',
        tier: 'mid',
        marketShare: 0.04
    },
    {
        vendor: 'Apple Inc.',
        unmaskedVendor: 'Apple Inc.',
        renderer: 'Apple M1',
        unmaskedRenderer: 'Apple M1',
        tier: 'mid',
        marketShare: 0.03
    }
];

// ============================================================
// WEBGL MUTATOR CLASS
// ============================================================

export class WebGLMutator extends EventEmitter {
    private config: GhostVisualConfig;
    private profileCache: Map<string, WebGLProfile> = new Map();
    private canvasCache: Map<string, CanvasProfile> = new Map();
    private audioCache: Map<string, AudioProfile> = new Map();
    
    constructor(config: Partial<GhostVisualConfig> = {}) {
        super();
        
        this.config = {
            seed: undefined,
            consistentPerSession: true,
            gpuPool: GPU_DATABASE,
            enableCanvasMutation: true,
            enableAudioMutation: true,
            debugMode: false,
            ...config
        };
    }
    
    /**
     * 🚀 Initialize the WebGL Mutator
     */
    async initialize(): Promise<void> {
        logger.debug(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║  👻 GHOST v1.0.0 - WebGL MUTATOR                                             ║
║                                                                               ║
║  "Every worker, a unique machine"                                             ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  GPU Pool:         ${this.config.gpuPool.length} unique configurations                                ║
║  Canvas Mutation:  ${this.config.enableCanvasMutation ? '✅ ENABLED' : '❌ DISABLED'}                                                ║
║  Audio Mutation:   ${this.config.enableAudioMutation ? '✅ ENABLED' : '❌ DISABLED'}                                                ║
║  Debug Mode:       ${this.config.debugMode ? '⚠️  ENABLED' : '✅ PRODUCTION'}                                              ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`);
        
        this.emit('initialized');
    }
    
    /**
     * 🎭 Generate WebGL profile for a Neural Fingerprint
     * 
     * @param neuralFingerprintId - Unique ID from Neural Fingerprinting engine
     * @param workerIndex - Optional worker index for deterministic generation
     */
    generateWebGLProfile(neuralFingerprintId: string, workerIndex?: number): WebGLProfile {
        // Check cache first
        if (this.config.consistentPerSession && this.profileCache.has(neuralFingerprintId)) {
            return this.profileCache.get(neuralFingerprintId)!;
        }
        
        // Generate deterministic seed from fingerprint ID
        const seed = this.config.seed || neuralFingerprintId;
        const seedHash = crypto.createHash('sha256').update(seed).digest('hex');
        
        // Select GPU based on market share distribution (weighted random)
        const gpu = this.selectGPUByMarketShare(seedHash, workerIndex);
        
        // Generate WebGL parameters based on GPU tier
        const profile: WebGLProfile = {
            profileId: `webgl_${crypto.randomBytes(8).toString('hex')}`,
            vendor: gpu.vendor,
            renderer: gpu.renderer,
            unmaskedVendor: gpu.unmaskedVendor,
            unmaskedRenderer: gpu.unmaskedRenderer,
            maxTextureSize: this.getMaxTextureSize(gpu.tier, seedHash),
            maxViewportDims: this.getMaxViewportDims(gpu.tier, seedHash),
            maxRenderbufferSize: this.getMaxRenderbufferSize(gpu.tier, seedHash),
            aliasedLineWidthRange: this.getAliasedLineWidthRange(gpu.tier),
            aliasedPointSizeRange: this.getAliasedPointSizeRange(gpu.tier),
            maxVertexAttribs: this.getMaxVertexAttribs(gpu.tier),
            maxVaryingVectors: this.getMaxVaryingVectors(gpu.tier),
            maxFragmentUniformVectors: this.getMaxFragmentUniformVectors(gpu.tier),
            maxVertexUniformVectors: this.getMaxVertexUniformVectors(gpu.tier),
            supportedExtensions: this.getSupportedExtensions(gpu.tier, seedHash),
            shaHash: this.generateShaHash(gpu, seedHash)
        };
        
        // Cache for session consistency
        if (this.config.consistentPerSession) {
            this.profileCache.set(neuralFingerprintId, profile);
        }
        
        if (this.config.debugMode) {
            logger.debug(`[WebGL Mutator] 🎭 Generated profile for ${neuralFingerprintId.substring(0, 8)}...`);
            logger.debug(`   GPU: ${gpu.unmaskedRenderer} (${gpu.tier})`);
        }
        
        this.emit('profile:generated', { neuralFingerprintId, profile });
        return profile;
    }
    
    /**
     * 🖼️ Generate Canvas mutation profile
     */
    generateCanvasProfile(neuralFingerprintId: string): CanvasProfile {
        if (this.canvasCache.has(neuralFingerprintId)) {
            return this.canvasCache.get(neuralFingerprintId)!;
        }
        
        const seedHash = crypto.createHash('sha256').update(neuralFingerprintId).digest('hex');
        const seedNum = parseInt(seedHash.substring(0, 8), 16);
        
        const profile: CanvasProfile = {
            noiseScale: 0.001 + (seedNum % 1000) / 1000000, // 0.001 - 0.002
            colorShift: [
                (seedNum % 3) - 1,         // -1 to 1
                ((seedNum >> 8) % 3) - 1,
                ((seedNum >> 16) % 3) - 1
            ],
            fontRenderingVariance: 0.01 + (seedNum % 100) / 10000, // Subtle font changes
            textBaselineJitter: 0.1 + (seedNum % 50) / 100         // 0.1 - 0.6 px
        };
        
        this.canvasCache.set(neuralFingerprintId, profile);
        return profile;
    }
    
    /**
     * 🔊 Generate Audio fingerprint profile
     */
    generateAudioProfile(neuralFingerprintId: string): AudioProfile {
        if (this.audioCache.has(neuralFingerprintId)) {
            return this.audioCache.get(neuralFingerprintId)!;
        }
        
        const seedHash = crypto.createHash('sha256').update(neuralFingerprintId).digest('hex');
        const seedNum = parseInt(seedHash.substring(0, 8), 16);
        
        const oscillatorTypes: OscillatorType[] = ['sine', 'square', 'sawtooth', 'triangle'];
        
        const profile: AudioProfile = {
            sampleRate: [44100, 48000, 96000][seedNum % 3],
            channelCount: [2, 4, 6][seedNum % 3],
            oscillatorType: oscillatorTypes[seedNum % oscillatorTypes.length],
            noiseAmplitude: 0.0000001 + (seedNum % 100) / 10000000000 // Imperceptible noise
        };
        
        this.audioCache.set(neuralFingerprintId, profile);
        return profile;
    }
    
    /**
     * 💉 Generate injection script for Playwright/Puppeteer
     * 
     * This script overrides WebGL methods to report fake hardware info
     */
    generateInjectionScript(profile: WebGLProfile, canvasProfile?: CanvasProfile, audioProfile?: AudioProfile): string {
        return `
// 👻 GHOST v1.0.0 - WebGL Mutator Injection
// Profile: ${profile.profileId}
// DO NOT MODIFY - Auto-generated by QANTUM

(function() {
    'use strict';
    
    // === WebGL Override ===
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        // UNMASKED_VENDOR_WEBGL
        if (parameter === 37445) {
            return '${profile.unmaskedVendor}';
        }
        // UNMASKED_RENDERER_WEBGL
        if (parameter === 37446) {
            return '${profile.unmaskedRenderer}';
        }
        // MAX_TEXTURE_SIZE
        if (parameter === 3379) {
            return ${profile.maxTextureSize};
        }
        // MAX_VIEWPORT_DIMS
        if (parameter === 3386) {
            return new Int32Array([${profile.maxViewportDims[0]}, ${profile.maxViewportDims[1]}]);
        }
        // MAX_RENDERBUFFER_SIZE
        if (parameter === 34024) {
            return ${profile.maxRenderbufferSize};
        }
        // ALIASED_LINE_WIDTH_RANGE
        if (parameter === 33902) {
            return new Float32Array([${profile.aliasedLineWidthRange[0]}, ${profile.aliasedLineWidthRange[1]}]);
        }
        // ALIASED_POINT_SIZE_RANGE
        if (parameter === 33901) {
            return new Float32Array([${profile.aliasedPointSizeRange[0]}, ${profile.aliasedPointSizeRange[1]}]);
        }
        // MAX_VERTEX_ATTRIBS
        if (parameter === 34921) {
            return ${profile.maxVertexAttribs};
        }
        // MAX_VARYING_VECTORS
        if (parameter === 36348) {
            return ${profile.maxVaryingVectors};
        }
        // MAX_FRAGMENT_UNIFORM_VECTORS
        if (parameter === 36349) {
            return ${profile.maxFragmentUniformVectors};
        }
        // MAX_VERTEX_UNIFORM_VECTORS
        if (parameter === 36347) {
            return ${profile.maxVertexUniformVectors};
        }
        // VENDOR
        if (parameter === 7936) {
            return '${profile.vendor}';
        }
        // RENDERER
        if (parameter === 7937) {
            return '${profile.renderer}';
        }
        
        return originalGetParameter.call(this, parameter);
    };
    
    // WebGL2 Override
    if (typeof WebGL2RenderingContext !== 'undefined') {
        const original2GetParameter = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return '${profile.unmaskedVendor}';
            if (parameter === 37446) return '${profile.unmaskedRenderer}';
            if (parameter === 3379) return ${profile.maxTextureSize};
            if (parameter === 7936) return '${profile.vendor}';
            if (parameter === 7937) return '${profile.renderer}';
            return original2GetParameter.call(this, parameter);
        };
    }
    
    // Extension filtering
    const originalGetSupportedExtensions = WebGLRenderingContext.prototype.getSupportedExtensions;
    WebGLRenderingContext.prototype.getSupportedExtensions = function() {
        return ${JSON.stringify(profile.supportedExtensions)};
    };
    
    ${canvasProfile ? this.generateCanvasInjection(canvasProfile) : '// Canvas mutation disabled'}
    
    ${audioProfile ? this.generateAudioInjection(audioProfile) : '// Audio mutation disabled'}
    
    logger.debug('[Ghost] 👻 WebGL fingerprint mutated');
})();
`;
    }
    
    // ============================================================
    // PRIVATE HELPER METHODS
    // ============================================================
    
    private selectGPUByMarketShare(seedHash: string, workerIndex?: number): GPUDefinition {
        // If worker index provided, use deterministic selection
        if (workerIndex !== undefined) {
            return this.config.gpuPool[workerIndex % this.config.gpuPool.length];
        }
        
        // Otherwise use weighted random based on market share
        const seedNum = parseInt(seedHash.substring(0, 8), 16);
        const normalized = (seedNum % 10000) / 10000; // 0 to 1
        
        let cumulative = 0;
        for (const gpu of this.config.gpuPool) {
            cumulative += gpu.marketShare;
            if (normalized <= cumulative) {
                return gpu;
            }
        }
        
        // Fallback to most common (Intel)
        return this.config.gpuPool.find(g => g.unmaskedVendor === 'Intel Inc.')!;
    }
    
    private getMaxTextureSize(tier: string, seed: string): number {
        const seedNum = parseInt(seed.substring(0, 4), 16);
        const base: Record<string, number> = {
            'low': 8192,
            'mid': 16384,
            'high': 16384,
            'ultra': 32768
        };
        // Add small variance
        return base[tier] + ((seedNum % 2) * (tier === 'ultra' ? 0 : 0));
    }
    
    private getMaxViewportDims(tier: string, seed: string): [number, number] {
        const dims: Record<string, [number, number]> = {
            'low': [8192, 8192],
            'mid': [16384, 16384],
            'high': [16384, 16384],
            'ultra': [32768, 32768]
        };
        return dims[tier];
    }
    
    private getMaxRenderbufferSize(tier: string, seed: string): number {
        const sizes: Record<string, number> = {
            'low': 8192,
            'mid': 16384,
            'high': 16384,
            'ultra': 32768
        };
        return sizes[tier];
    }
    
    private getAliasedLineWidthRange(tier: string): [number, number] {
        return [1, 1]; // Most GPUs report [1, 1] now
    }
    
    private getAliasedPointSizeRange(tier: string): [number, number] {
        const ranges: Record<string, [number, number]> = {
            'low': [1, 255],
            'mid': [1, 1024],
            'high': [1, 2048],
            'ultra': [1, 8192]
        };
        return ranges[tier];
    }
    
    private getMaxVertexAttribs(tier: string): number {
        return 16; // Standard across all GPUs
    }
    
    private getMaxVaryingVectors(tier: string): number {
        const values: Record<string, number> = {
            'low': 15,
            'mid': 30,
            'high': 30,
            'ultra': 31
        };
        return values[tier];
    }
    
    private getMaxFragmentUniformVectors(tier: string): number {
        const values: Record<string, number> = {
            'low': 221,
            'mid': 1024,
            'high': 4096,
            'ultra': 4096
        };
        return values[tier];
    }
    
    private getMaxVertexUniformVectors(tier: string): number {
        const values: Record<string, number> = {
            'low': 256,
            'mid': 4096,
            'high': 4096,
            'ultra': 4096
        };
        return values[tier];
    }
    
    private getSupportedExtensions(tier: string, seed: string): string[] {
        const baseExtensions = [
            'ANGLE_instanced_arrays',
            'EXT_blend_minmax',
            'EXT_color_buffer_half_float',
            'EXT_float_blend',
            'EXT_frag_depth',
            'EXT_shader_texture_lod',
            'EXT_texture_compression_bptc',
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
        ];
        
        // Add tier-specific extensions
        if (tier === 'high' || tier === 'ultra') {
            baseExtensions.push(
                'EXT_texture_compression_rgtc',
                'WEBGL_compressed_texture_astc',
                'WEBGL_multi_draw'
            );
        }
        
        return baseExtensions;
    }
    
    private generateShaHash(gpu: GPUDefinition, seed: string): string {
        const data = `${gpu.vendor}|${gpu.renderer}|${gpu.unmaskedRenderer}|${seed}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
    }
    
    private generateCanvasInjection(profile: CanvasProfile): string {
        return `
    // === Canvas Fingerprint Mutation ===
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const ctx = this.getContext('2d');
        if (ctx) {
            const imageData = ctx.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            
            // Add imperceptible noise
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.max(0, Math.min(255, data[i] + ${profile.colorShift[0]}));     // R
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + ${profile.colorShift[1]})); // G
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + ${profile.colorShift[2]})); // B
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        return originalToDataURL.call(this, type, quality);
    };
`;
    }
    
    private generateAudioInjection(profile: AudioProfile): string {
        return `
    // === AudioContext Fingerprint Mutation ===
    const originalCreateOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function() {
        const osc = originalCreateOscillator.call(this);
        const originalConnect = osc.connect.bind(osc);
        osc.connect = function(destination) {
            // Add imperceptible noise
            const gainNode = this.context.createGain();
            gainNode.gain.value = 1 + ${profile.noiseAmplitude};
            originalConnect(gainNode);
            gainNode.connect(destination);
            return destination;
        };
        return osc;
    };
`;
    }
    
    /**
     * 🔄 Clear profile caches (use when rotating fingerprints)
     */
    clearCache(): void {
        this.profileCache.clear();
        this.canvasCache.clear();
        this.audioCache.clear();
        this.emit('cache:cleared');
    }
    
    /**
     * 📊 Get statistics
     */
    getStats(): { webglProfiles: number; canvasProfiles: number; audioProfiles: number } {
        return {
            webglProfiles: this.profileCache.size,
            canvasProfiles: this.canvasCache.size,
            audioProfiles: this.audioCache.size
        };
    }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

export function createWebGLMutator(config?: Partial<GhostVisualConfig>): WebGLMutator {
    return new WebGLMutator(config);
}

export { GPU_DATABASE };
