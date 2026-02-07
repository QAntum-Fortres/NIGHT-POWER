/**
 * ⚛️ QANTUM GHOST PROTOCOL v2 - VISUAL STEALTH ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * WebGL, Canvas, AudioContext Fingerprint Spoofing
 * 
 * Defeats: FingerprintJS, CreepJS, BotD, PerimeterX Canvas Detection
 * 
 * "Every ghost wears a different face."
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface HardwareProfile {
  id: string;
  vendor: string;
  renderer: string;
  webglVersion: string;
  shadingLanguageVersion: string;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  maxVertexAttribs: number;
  maxVertexUniformVectors: number;
  maxFragmentUniformVectors: number;
  maxVaryingVectors: number;
  aliasedPointSizeRange: [number, number];
  aliasedLineWidthRange: [number, number];
  extensions: string[];
}

export interface CanvasProfile {
  noise: number; // 0-1, amount of noise to add
  colorShift: [number, number, number]; // RGB shift values
  fontRendering: 'default' | 'cleartype' | 'grayscale';
}

export interface AudioProfile {
  sampleRate: number;
  channelCount: number;
  oscillatorOffset: number;
  dynamicsOffset: number;
}

export interface VisualFingerprint {
  id: string;
  hardware: HardwareProfile;
  canvas: CanvasProfile;
  audio: AudioProfile;
  screen: ScreenProfile;
  fonts: string[];
  plugins: PluginProfile[];
  timezone: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  touchPoints: number;
}

export interface ScreenProfile {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
}

export interface PluginProfile {
  name: string;
  description: string;
  filename: string;
  mimeTypes: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// HARDWARE PROFILES - REAL GPU DATA
// ═══════════════════════════════════════════════════════════════════════════════

const GPU_PROFILES: HardwareProfile[] = [
  // NVIDIA Desktop
  {
    id: 'nvidia-rtx-4090',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 2048],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_disjoint_timer_query', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'KHR_parallel_shader_compile', 'OES_element_index_uint', 'OES_fbo_render_mipmap', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object', 'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context', 'WEBGL_multi_draw']
  },
  {
    id: 'nvidia-rtx-3080',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_disjoint_timer_query', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  {
    id: 'nvidia-rtx-3070',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  {
    id: 'nvidia-gtx-1660',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  // AMD Desktop
  {
    id: 'amd-rx-7900',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 8192],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  {
    id: 'amd-rx-6800',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 6800 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 8191],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  // Intel Integrated
  {
    id: 'intel-iris-xe',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 31,
    aliasedPointSizeRange: [1, 255],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  {
    id: 'intel-uhd-630',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    webglVersion: 'WebGL 2.0 (OpenGL ES 3.0 Chromium)',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00 (OpenGL ES GLSL ES 3.0 Chromium)',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 31,
    aliasedPointSizeRange: [1, 255],
    aliasedLineWidthRange: [1, 1],
    extensions: ['ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_half_float', 'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  // Apple
  {
    id: 'apple-m2-pro',
    vendor: 'Apple Inc.',
    renderer: 'Apple M2 Pro',
    webglVersion: 'WebGL 2.0',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 511],
    aliasedLineWidthRange: [1, 1],
    extensions: ['EXT_blend_minmax', 'EXT_color_buffer_float', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object', 'WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc', 'WEBGL_compressed_texture_etc1', 'WEBGL_compressed_texture_pvrtc', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  },
  {
    id: 'apple-m1',
    vendor: 'Apple Inc.',
    renderer: 'Apple M1',
    webglVersion: 'WebGL 2.0',
    shadingLanguageVersion: 'WebGL GLSL ES 3.00',
    maxTextureSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexAttribs: 16,
    maxVertexUniformVectors: 4096,
    maxFragmentUniformVectors: 1024,
    maxVaryingVectors: 32,
    aliasedPointSizeRange: [1, 511],
    aliasedLineWidthRange: [1, 1],
    extensions: ['EXT_blend_minmax', 'EXT_color_buffer_float', 'EXT_color_buffer_half_float', 'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_filter_anisotropic', 'EXT_sRGB', 'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float', 'OES_texture_half_float_linear', 'OES_vertex_array_object', 'WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc', 'WEBGL_compressed_texture_etc1', 'WEBGL_compressed_texture_pvrtc', 'WEBGL_depth_texture', 'WEBGL_draw_buffers', 'WEBGL_lose_context']
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN PROFILES - COMMON RESOLUTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const SCREEN_PROFILES: ScreenProfile[] = [
  { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1 },
  { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1 },
  { width: 3840, height: 2160, availWidth: 3840, availHeight: 2120, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1 },
  { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1.25 },
  { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1.5 },
  { width: 1536, height: 864, availWidth: 1536, availHeight: 824, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1.25 },
  { width: 1366, height: 768, availWidth: 1366, availHeight: 728, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 1 },
  { width: 1440, height: 900, availWidth: 1440, availHeight: 860, colorDepth: 24, pixelDepth: 24, devicePixelRatio: 2 }, // Retina MacBook
  { width: 2880, height: 1800, availWidth: 2880, availHeight: 1760, colorDepth: 30, pixelDepth: 30, devicePixelRatio: 2 }, // Retina MacBook Pro
];

// ═══════════════════════════════════════════════════════════════════════════════
// FONT PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

const WINDOWS_FONTS = [
  'Arial', 'Arial Black', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS',
  'Consolas', 'Courier New', 'Georgia', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
  'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI', 'Segoe UI Symbol',
  'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Wingdings'
];

const MACOS_FONTS = [
  'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia', 'Helvetica',
  'Helvetica Neue', 'Impact', 'Lucida Grande', 'Monaco', 'Palatino', 'Times',
  'Times New Roman', 'Trebuchet MS', 'Verdana', 'SF Pro Display', 'SF Pro Text'
];

const LINUX_FONTS = [
  'Arial', 'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif', 'Droid Sans',
  'Droid Sans Mono', 'Droid Serif', 'FreeMono', 'FreeSans', 'FreeSerif',
  'Liberation Mono', 'Liberation Sans', 'Liberation Serif', 'Noto Sans', 'Ubuntu'
];

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL STEALTH ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export class VisualStealthEngine {
  private profiles: Map<string, VisualFingerprint> = new Map();
  private seedBase: number;

  constructor(seed?: number) {
    this.seedBase = seed || Date.now();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FINGERPRINT GENERATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate unique visual fingerprint for a worker
   */
  generateFingerprint(workerId: number): VisualFingerprint {
    const cached = this.profiles.get(`worker-${workerId}`);
    if (cached) return cached;

    const seed = this.seedBase + workerId * 31337;
    const rng = this.seededRandom(seed);

    // Select base profiles
    const hardware = this.selectHardware(rng);
    const screen = this.selectScreen(rng);
    const platform = this.selectPlatform(rng);

    const fingerprint: VisualFingerprint = {
      id: `phantom-${workerId}-${crypto.randomBytes(4).toString('hex')}`,
      hardware: this.mutateHardware(hardware, rng),
      canvas: this.generateCanvasProfile(rng),
      audio: this.generateAudioProfile(rng),
      screen: this.mutateScreen(screen, rng),
      fonts: this.selectFonts(platform, rng),
      plugins: this.generatePlugins(platform, rng),
      timezone: this.selectTimezone(rng),
      language: this.selectLanguage(rng),
      platform,
      hardwareConcurrency: this.selectCores(rng),
      deviceMemory: this.selectMemory(rng),
      touchPoints: platform === 'Win32' || platform === 'MacIntel' ? 0 : this.selectTouchPoints(rng)
    };

    this.profiles.set(`worker-${workerId}`, fingerprint);
    return fingerprint;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPONENT SELECTION
  // ─────────────────────────────────────────────────────────────────────────────

  private selectHardware(rng: () => number): HardwareProfile {
    const weights = [0.25, 0.20, 0.15, 0.10, 0.08, 0.07, 0.06, 0.05, 0.02, 0.02];
    return this.weightedSelect(GPU_PROFILES, weights, rng);
  }

  private mutateHardware(hardware: HardwareProfile, rng: () => number): HardwareProfile {
    const mutated = { ...hardware };
    
    // Slight variations in max values
    mutated.maxTextureSize = this.varyValue(hardware.maxTextureSize, 0, rng);
    mutated.aliasedPointSizeRange = [
      hardware.aliasedPointSizeRange[0],
      this.varyValue(hardware.aliasedPointSizeRange[1], 5, rng)
    ];

    return mutated;
  }

  private selectScreen(rng: () => number): ScreenProfile {
    return SCREEN_PROFILES[Math.floor(rng() * SCREEN_PROFILES.length)];
  }

  private mutateScreen(screen: ScreenProfile, rng: () => number): ScreenProfile {
    return {
      ...screen,
      availHeight: screen.availHeight - Math.floor(rng() * 40), // Taskbar variation
      availWidth: screen.availWidth - Math.floor(rng() * 10)
    };
  }

  private selectPlatform(rng: () => number): string {
    const platforms = ['Win32', 'Win32', 'Win32', 'MacIntel', 'Linux x86_64'];
    return platforms[Math.floor(rng() * platforms.length)];
  }

  private selectFonts(platform: string, rng: () => number): string[] {
    let fontPool: string[];
    
    switch (platform) {
      case 'MacIntel':
        fontPool = MACOS_FONTS;
        break;
      case 'Linux x86_64':
        fontPool = LINUX_FONTS;
        break;
      default:
        fontPool = WINDOWS_FONTS;
    }

    // Random subset of fonts
    const numFonts = 10 + Math.floor(rng() * 10);
    const shuffled = [...fontPool].sort(() => rng() - 0.5);
    return shuffled.slice(0, numFonts);
  }

  private generatePlugins(platform: string, rng: () => number): PluginProfile[] {
    // Modern browsers report empty plugins for privacy
    // But we can add PDF viewer which is common
    if (rng() < 0.7) {
      return [{
        name: 'PDF Viewer',
        description: 'Portable Document Format',
        filename: 'internal-pdf-viewer',
        mimeTypes: ['application/pdf']
      }, {
        name: 'Chrome PDF Viewer',
        description: 'Portable Document Format',
        filename: 'internal-pdf-viewer',
        mimeTypes: ['application/pdf']
      }];
    }
    return [];
  }

  private selectTimezone(rng: () => number): string {
    const timezones = [
      'America/New_York', 'America/Los_Angeles', 'America/Chicago',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney'
    ];
    return timezones[Math.floor(rng() * timezones.length)];
  }

  private selectLanguage(rng: () => number): string {
    const languages = ['en-US', 'en-GB', 'en-US', 'en-US', 'de-DE', 'fr-FR', 'es-ES'];
    return languages[Math.floor(rng() * languages.length)];
  }

  private selectCores(rng: () => number): number {
    const cores = [4, 6, 8, 8, 8, 12, 16];
    return cores[Math.floor(rng() * cores.length)];
  }

  private selectMemory(rng: () => number): number {
    const memory = [4, 8, 8, 8, 16, 16, 32];
    return memory[Math.floor(rng() * memory.length)];
  }

  private selectTouchPoints(rng: () => number): number {
    return rng() < 0.3 ? Math.floor(rng() * 10) + 1 : 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CANVAS & AUDIO PROFILES
  // ─────────────────────────────────────────────────────────────────────────────

  private generateCanvasProfile(rng: () => number): CanvasProfile {
    return {
      noise: 0.0001 + rng() * 0.0005, // Very subtle noise
      colorShift: [
        Math.floor(rng() * 3) - 1,
        Math.floor(rng() * 3) - 1,
        Math.floor(rng() * 3) - 1
      ],
      fontRendering: ['default', 'cleartype', 'grayscale'][Math.floor(rng() * 3)] as CanvasProfile['fontRendering']
    };
  }

  private generateAudioProfile(rng: () => number): AudioProfile {
    return {
      sampleRate: [44100, 48000][Math.floor(rng() * 2)],
      channelCount: 2,
      oscillatorOffset: (rng() - 0.5) * 0.0001,
      dynamicsOffset: (rng() - 0.5) * 0.0001
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PLAYWRIGHT/PUPPETEER INJECTION SCRIPTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate script to inject into page for fingerprint spoofing
   */
  generateInjectionScript(fingerprint: VisualFingerprint): string {
    return `
(function() {
  'use strict';
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QANTUM GHOST PROTOCOL v2 - Visual Stealth Injection
  // Fingerprint ID: ${fingerprint.id}
  // ═══════════════════════════════════════════════════════════════════════════

  const PHANTOM_ID = '${fingerprint.id}';
  const HARDWARE = ${JSON.stringify(fingerprint.hardware)};
  const SCREEN = ${JSON.stringify(fingerprint.screen)};
  const CANVAS = ${JSON.stringify(fingerprint.canvas)};
  const AUDIO = ${JSON.stringify(fingerprint.audio)};

  // ─────────────────────────────────────────────────────────────────────────
  // WebGL Spoofing
  // ─────────────────────────────────────────────────────────────────────────
  
  const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    // UNMASKED_VENDOR_WEBGL
    if (param === 37445) return HARDWARE.vendor;
    // UNMASKED_RENDERER_WEBGL
    if (param === 37446) return HARDWARE.renderer;
    // MAX_TEXTURE_SIZE
    if (param === 3379) return HARDWARE.maxTextureSize;
    // MAX_VIEWPORT_DIMS
    if (param === 3386) return new Int32Array(HARDWARE.maxViewportDims);
    // MAX_VERTEX_ATTRIBS
    if (param === 34921) return HARDWARE.maxVertexAttribs;
    // MAX_VERTEX_UNIFORM_VECTORS
    if (param === 36347) return HARDWARE.maxVertexUniformVectors;
    // MAX_FRAGMENT_UNIFORM_VECTORS
    if (param === 36349) return HARDWARE.maxFragmentUniformVectors;
    // MAX_VARYING_VECTORS
    if (param === 36348) return HARDWARE.maxVaryingVectors;
    // ALIASED_POINT_SIZE_RANGE
    if (param === 33901) return new Float32Array(HARDWARE.aliasedPointSizeRange);
    // ALIASED_LINE_WIDTH_RANGE
    if (param === 33902) return new Float32Array(HARDWARE.aliasedLineWidthRange);
    
    return originalGetParameter.call(this, param);
  };

  // WebGL2 spoofing
  if (typeof WebGL2RenderingContext !== 'undefined') {
    const originalGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(param) {
      if (param === 37445) return HARDWARE.vendor;
      if (param === 37446) return HARDWARE.renderer;
      if (param === 3379) return HARDWARE.maxTextureSize;
      if (param === 3386) return new Int32Array(HARDWARE.maxViewportDims);
      return originalGetParameter2.call(this, param);
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Canvas Fingerprint Noise
  // ─────────────────────────────────────────────────────────────────────────
  
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      const data = imageData.data;
      
      // Add subtle noise
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < CANVAS.noise) {
          data[i] = Math.min(255, Math.max(0, data[i] + CANVAS.colorShift[0]));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + CANVAS.colorShift[1]));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + CANVAS.colorShift[2]));
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    }
    
    return originalToDataURL.call(this, type, quality);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Screen Properties
  // ─────────────────────────────────────────────────────────────────────────
  
  Object.defineProperties(screen, {
    width: { get: () => SCREEN.width },
    height: { get: () => SCREEN.height },
    availWidth: { get: () => SCREEN.availWidth },
    availHeight: { get: () => SCREEN.availHeight },
    colorDepth: { get: () => SCREEN.colorDepth },
    pixelDepth: { get: () => SCREEN.pixelDepth }
  });

  Object.defineProperty(window, 'devicePixelRatio', {
    get: () => SCREEN.devicePixelRatio
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Navigator Properties
  // ─────────────────────────────────────────────────────────────────────────
  
  Object.defineProperties(navigator, {
    hardwareConcurrency: { get: () => ${fingerprint.hardwareConcurrency} },
    deviceMemory: { get: () => ${fingerprint.deviceMemory} },
    maxTouchPoints: { get: () => ${fingerprint.touchPoints} },
    platform: { get: () => '${fingerprint.platform}' },
    language: { get: () => '${fingerprint.language}' },
    languages: { get: () => ['${fingerprint.language}', 'en'] }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // AudioContext Fingerprint
  // ─────────────────────────────────────────────────────────────────────────
  
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OriginalAudioContext) {
    const originalCreateOscillator = OriginalAudioContext.prototype.createOscillator;
    OriginalAudioContext.prototype.createOscillator = function() {
      const oscillator = originalCreateOscillator.call(this);
      const originalSetFrequency = oscillator.frequency.setValueAtTime;
      oscillator.frequency.setValueAtTime = function(value, time) {
        return originalSetFrequency.call(this, value + AUDIO.oscillatorOffset, time);
      };
      return oscillator;
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WebDriver Detection Prevention
  // ─────────────────────────────────────────────────────────────────────────
  
  // Remove webdriver flag
  delete navigator.webdriver;
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  });

  // Remove automation indicators
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

  // Chrome DevTools Protocol detection
  const originalChrome = window.chrome;
  window.chrome = {
    ...originalChrome,
    runtime: {
      ...originalChrome?.runtime,
      PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
      PlatformArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
      PlatformNaclArch: { ARM: 'arm', X86_32: 'x86-32', X86_64: 'x86-64' },
      RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' }
    }
  };

  // Permissions API spoof
  const originalQuery = navigator.permissions?.query;
  if (originalQuery) {
    navigator.permissions.query = function(parameters) {
      if (parameters.name === 'notifications') {
        return Promise.resolve({ state: Notification.permission });
      }
      return originalQuery.call(this, parameters);
    };
  }

  // Plugins spoof (empty in modern browsers)
  Object.defineProperty(navigator, 'plugins', {
    get: () => {
      const plugins = ${JSON.stringify(fingerprint.plugins)};
      const pluginArray = [];
      plugins.forEach((p, i) => {
        pluginArray[i] = { name: p.name, description: p.description, filename: p.filename };
      });
      pluginArray.length = plugins.length;
      return pluginArray;
    }
  });

  console.log('[QANTUM] Ghost Protocol v2 Active - ID: ' + PHANTOM_ID);
})();
`;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITIES
  // ─────────────────────────────────────────────────────────────────────────────

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  private weightedSelect<T>(items: T[], weights: number[], rng: () => number): T {
    const rand = rng();
    let cumulative = 0;
    
    for (let i = 0; i < items.length; i++) {
      cumulative += weights[i] || (1 / items.length);
      if (rand <= cumulative) {
        return items[i];
      }
    }
    
    return items[0];
  }

  private varyValue(value: number, maxVariation: number, rng: () => number): number {
    return value + Math.floor((rng() - 0.5) * 2 * maxVariation);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  getFingerprint(workerId: number): VisualFingerprint {
    return this.generateFingerprint(workerId);
  }

  getAllProfiles(): Map<string, VisualFingerprint> {
    return this.profiles;
  }

  getStats(): Record<string, unknown> {
    return {
      totalProfiles: this.profiles.size,
      gpuVariants: GPU_PROFILES.length,
      screenVariants: SCREEN_PROFILES.length,
      seedBase: this.seedBase
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════════════════════

let defaultEngine: VisualStealthEngine | null = null;

export function getVisualStealth(seed?: number): VisualStealthEngine {
  if (!defaultEngine) {
    defaultEngine = new VisualStealthEngine(seed);
  }
  return defaultEngine;
}

export function createVisualStealth(seed?: number): VisualStealthEngine {
  return new VisualStealthEngine(seed);
}

export default VisualStealthEngine;
