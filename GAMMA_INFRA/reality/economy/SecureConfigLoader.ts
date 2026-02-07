/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🔧 SECURE CONFIG LOADER - Configuration Loading with Integrity Validation
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * Metaphysical Principle: Configuration is the DNA of the system - it determines behavior,
 * capabilities, and constraints. Corrupted configuration leads to corrupted operation.
 * The Secure Config Loader ensures that configuration comes from trusted sources,
 * hasn't been tampered with, and conforms to expected schemas.
 * 
 * "Trust, but verify" - Ronald Reagan
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { resolve, extname } from 'path';
import { createHash, timingSafeEqual } from 'crypto';
import { EventEmitter } from 'events';
import type {
  SecureLoadConfig,
  ConfigValidationResult,
  ThreatLevel,
} from '../../../types/security.types';

// ═══════════════════════════════════════════════════════════════════════════════════════
// 📋 CONFIG LOADER TYPES
// ═══════════════════════════════════════════════════════════════════════════════════════

interface ConfigSchema {
  required?: string[];
  properties?: Record<string, SchemaProperty>;
  additionalProperties?: boolean;
}

interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: unknown[];
  default?: unknown;
  sensitive?: boolean;
}

interface LoadedConfig {
  data: Record<string, unknown>;
  source: string;
  loadedAt: number;
  checksum: string;
  validated: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════════════
// 🔒 SECURE CONFIG LOADER ENGINE
// ═══════════════════════════════════════════════════════════════════════════════════════

export class SecureConfigLoader extends EventEmitter {
  private config: SecureLoadConfig;
  private schemas: Map<string, ConfigSchema>;
  private loadedConfigs: Map<string, LoadedConfig>;
  private checksumCache: Map<string, string>;
  private readonly ALLOWED_EXTENSIONS = ['.json', '.yaml', '.yml', '.env'];
  private readonly MAX_CONFIG_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.schemas = new Map();
    this.loadedConfigs = new Map();
    this.checksumCache = new Map();
    
    this.initializeDefaultSchemas();
  }

  /**
   * Get default loading configuration
   */
  private getDefaultConfig(): SecureLoadConfig {
    return {
      validateChecksum: true,
      encryptionRequired: false,
      allowRemote: false,
      maxSize: this.MAX_CONFIG_SIZE,
      allowedSources: [],
    };
  }

  /**
   * Initialize default schemas for common config types
   */
  private initializeDefaultSchemas(): void {
    // Database config schema
    this.registerSchema('database', {
      required: ['host', 'port', 'database'],
      properties: {
        host: { type: 'string', required: true },
        port: { type: 'number', required: true, minimum: 1, maximum: 65535 },
        database: { type: 'string', required: true },
        username: { type: 'string', sensitive: true },
        password: { type: 'string', sensitive: true, minLength: 8 },
        ssl: { type: 'boolean', default: true },
      },
    });
    
    // API config schema
    this.registerSchema('api', {
      required: ['baseUrl'],
      properties: {
        baseUrl: { type: 'string', required: true, pattern: '^https?://' },
        apiKey: { type: 'string', sensitive: true, minLength: 16 },
        timeout: { type: 'number', minimum: 1000, maximum: 300000, default: 30000 },
        retries: { type: 'number', minimum: 0, maximum: 10, default: 3 },
      },
    });
    
    // Security config schema
    this.registerSchema('security', {
      required: ['enabled'],
      properties: {
        enabled: { type: 'boolean', required: true, default: true },
        secretKey: { type: 'string', sensitive: true, minLength: 32 },
        jwtExpiry: { type: 'number', minimum: 300, default: 3600 },
        csrfEnabled: { type: 'boolean', default: true },
        rateLimitRequests: { type: 'number', minimum: 1, default: 100 },
        rateLimitWindow: { type: 'number', minimum: 1000, default: 900000 },
      },
    });
  }

  /**
   * Register a config schema
   */
  public registerSchema(name: string, schema: ConfigSchema): void {
    this.schemas.set(name, schema);
    this.emit('schemaRegistered', { name });
  }

  /**
   * Load configuration with security checks
   * 
   * @param source - Path to config file or URL (if remote allowed)
   * @param options - Loading options
   */
  public async load(
    source: string,
    options: Partial<SecureLoadConfig> = {}
  ): Promise<Record<string, unknown>> {
    const mergedConfig = { ...this.config, ...options };
    
    // Validate source
    this.validateSource(source, mergedConfig);
    
    // Load content
    const content = await this.loadContent(source, mergedConfig);
    
    // Parse content
    const data = this.parseContent(content, source);
    
    // Validate checksum if provided
    if (mergedConfig.validateChecksum) {
      const checksum = this.calculateChecksum(content);
      const storedChecksum = this.checksumCache.get(source);
      
      if (storedChecksum && !this.compareChecksums(checksum, storedChecksum)) {
        this.emit('checksumMismatch', { source, expected: storedChecksum, actual: checksum });
        throw new Error('Configuration checksum mismatch - file may have been tampered with');
      }
      
      this.checksumCache.set(source, checksum);
    }
    
    // Store loaded config
    const loadedConfig: LoadedConfig = {
      data,
      source,
      loadedAt: Date.now(),
      checksum: this.calculateChecksum(content),
      validated: false,
    };
    this.loadedConfigs.set(source, loadedConfig);
    
    this.emit('configLoaded', { source, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Validate source is allowed
   */
  private validateSource(source: string, config: SecureLoadConfig): void {
    // Check if remote
    if (source.startsWith('http://') || source.startsWith('https://')) {
      if (!config.allowRemote) {
        throw new Error('Remote configuration loading is disabled');
      }
    }
    
    // Check allowed sources if specified
    if (config.allowedSources && config.allowedSources.length > 0) {
      const isAllowed = config.allowedSources.some((allowed) => {
        if (allowed.endsWith('*')) {
          return source.startsWith(allowed.slice(0, -1));
        }
        return source === allowed;
      });
      
      if (!isAllowed) {
        throw new Error(`Source '${source}' is not in the allowed sources list`);
      }
    }
    
    // Check extension for local files
    if (!source.startsWith('http')) {
      const ext = extname(source).toLowerCase();
      if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File extension '${ext}' is not allowed`);
      }
    }
  }

  /**
   * Load content from source
   */
  private async loadContent(source: string, config: SecureLoadConfig): Promise<string> {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return this.loadRemoteContent(source);
    }
    
    return this.loadLocalContent(source, config);
  }

  /**
   * Load local file content
   */
  private loadLocalContent(source: string, config: SecureLoadConfig): string {
    const resolvedPath = resolve(source);
    
    // Check file exists
    if (!existsSync(resolvedPath)) {
      throw new Error(`Configuration file not found: ${resolvedPath}`);
    }
    
    // Check file size
    const stats = statSync(resolvedPath);
    if (config.maxSize && stats.size > config.maxSize) {
      throw new Error(`Configuration file exceeds maximum size of ${config.maxSize} bytes`);
    }
    
    // Check file permissions (should not be world-writable)
    const mode = stats.mode;
    if (mode & 0o002) {
      this.emit('warning', { 
        message: 'Configuration file is world-writable, this is a security risk',
        source,
      });
    }
    
    return readFileSync(resolvedPath, 'utf8');
  }

  /**
   * Load remote content (placeholder - would use fetch in real implementation)
   */
  private async loadRemoteContent(source: string): Promise<string> {
    // In a real implementation, this would use fetch with proper security headers
    throw new Error(`Remote loading from ${source} is not implemented`);
  }

  /**
   * Parse configuration content
   */
  private parseContent(content: string, source: string): Record<string, unknown> {
    const ext = extname(source).toLowerCase();
    
    switch (ext) {
      case '.json':
        return this.parseJSON(content);
      case '.yaml':
      case '.yml':
        return this.parseYAML(content);
      case '.env':
        return this.parseEnv(content);
      default:
        throw new Error(`Unsupported configuration format: ${ext}`);
    }
  }

  /**
   * Parse JSON content with security checks
   */
  private parseJSON(content: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(content);
      
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Configuration must be a JSON object');
      }
      
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse YAML content (simplified - real implementation would use js-yaml)
   */
  private parseYAML(content: string): Record<string, unknown> {
    // Simplified YAML parsing (key: value format only)
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }
      
      const key = trimmed.substring(0, colonIndex).trim();
      let value: unknown = trimmed.substring(colonIndex + 1).trim();
      
      // Type coercion
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (!isNaN(Number(value)) && value !== '') value = Number(value);
      else if (typeof value === 'string') {
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
      }
      
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Parse .env content
   */
  private parseEnv(content: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed === '' || trimmed.startsWith('#')) {
        continue;
      }
      
      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) {
        continue;
      }
      
      const key = trimmed.substring(0, equalsIndex).trim();
      let value = trimmed.substring(equalsIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
    
    return result;
  }

  /**
   * Calculate SHA-256 checksum
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Compare checksums safely (timing-safe)
   */
  private compareChecksums(a: string, b: string): boolean {
    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');
    
    if (bufferA.length !== bufferB.length) {
      return false;
    }
    
    return timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Validate configuration against schema
   */
  public validate(
    data: Record<string, unknown>,
    schemaName: string
  ): ConfigValidationResult {
    const schema = this.schemas.get(schemaName);
    
    if (!schema) {
      return {
        valid: false,
        errors: [`Unknown schema: ${schemaName}`],
        warnings: [],
      };
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === undefined || data[field] === null) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = data[key];
        
        if (value === undefined) {
          if (propSchema.default !== undefined) {
            data[key] = propSchema.default;
          }
          continue;
        }
        
        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== propSchema.type) {
          errors.push(`Field '${key}' must be of type ${propSchema.type}, got ${actualType}`);
          continue;
        }
        
        // String validations
        if (propSchema.type === 'string' && typeof value === 'string') {
          if (propSchema.minLength && value.length < propSchema.minLength) {
            errors.push(`Field '${key}' must be at least ${propSchema.minLength} characters`);
          }
          if (propSchema.maxLength && value.length > propSchema.maxLength) {
            errors.push(`Field '${key}' must be at most ${propSchema.maxLength} characters`);
          }
          if (propSchema.pattern) {
            const regex = new RegExp(propSchema.pattern);
            if (!regex.test(value)) {
              errors.push(`Field '${key}' does not match required pattern`);
            }
          }
        }
        
        // Number validations
        if (propSchema.type === 'number' && typeof value === 'number') {
          if (propSchema.minimum !== undefined && value < propSchema.minimum) {
            errors.push(`Field '${key}' must be at least ${propSchema.minimum}`);
          }
          if (propSchema.maximum !== undefined && value > propSchema.maximum) {
            errors.push(`Field '${key}' must be at most ${propSchema.maximum}`);
          }
        }
        
        // Enum validation
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          errors.push(`Field '${key}' must be one of: ${propSchema.enum.join(', ')}`);
        }
        
        // Sensitive field warnings
        if (propSchema.sensitive) {
          warnings.push(`Field '${key}' contains sensitive data - ensure it's properly protected`);
        }
      }
    }
    
    // Check for unknown properties
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(data)) {
        if (!(key in schema.properties)) {
          warnings.push(`Unknown property: ${key}`);
        }
      }
    }
    
    // Calculate checksum for validated config
    const checksum = this.calculateChecksum(JSON.stringify(data));
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checksum,
    };
  }

  /**
   * Load and validate in one step
   */
  public async loadAndValidate(
    source: string,
    schemaName: string,
    options: Partial<SecureLoadConfig> = {}
  ): Promise<{ data: Record<string, unknown>; validation: ConfigValidationResult }> {
    const data = await this.load(source, options);
    const validation = this.validate(data, schemaName);
    
    // Update loaded config with validation status
    const loaded = this.loadedConfigs.get(source);
    if (loaded) {
      loaded.validated = validation.valid;
    }
    
    return { data, validation };
  }

  /**
   * Store expected checksum for a source
   */
  public setExpectedChecksum(source: string, checksum: string): void {
    this.checksumCache.set(source, checksum);
    this.emit('checksumStored', { source, checksum });
  }

  /**
   * Get checksum for a source
   */
  public getChecksum(source: string): string | undefined {
    return this.checksumCache.get(source);
  }

  /**
   * Get loaded configurations info
   */
  public getLoadedConfigs(): Array<{
    source: string;
    loadedAt: number;
    validated: boolean;
    checksum: string;
  }> {
    return Array.from(this.loadedConfigs.values()).map((config) => ({
      source: config.source,
      loadedAt: config.loadedAt,
      validated: config.validated,
      checksum: config.checksum,
    }));
  }

  /**
   * Get security assessment of configuration
   */
  public assessSecurity(source: string): {
    level: ThreatLevel;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    const loaded = this.loadedConfigs.get(source);
    
    if (!loaded) {
      return {
        level: 'medium',
        issues: ['Configuration not loaded yet'],
        recommendations: ['Load configuration before assessment'],
      };
    }
    
    // Check if validated
    if (!loaded.validated) {
      issues.push('Configuration has not been validated against a schema');
      recommendations.push('Validate configuration against appropriate schema');
    }
    
    // Check for sensitive patterns in config
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /credential/i,
    ];
    
    const checkForSensitive = (obj: unknown, path: string): void => {
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          
          for (const pattern of sensitivePatterns) {
            if (pattern.test(key)) {
              if (typeof value === 'string' && value.length < 16) {
                issues.push(`Potentially weak ${key} at ${currentPath}`);
                recommendations.push(`Ensure ${key} meets security requirements`);
              }
            }
          }
          
          checkForSensitive(value, currentPath);
        }
      }
    };
    
    checkForSensitive(loaded.data, '');
    
    // Determine threat level
    let level: ThreatLevel = 'none';
    if (issues.length > 5) level = 'high';
    else if (issues.length > 2) level = 'medium';
    else if (issues.length > 0) level = 'low';
    
    return { level, issues, recommendations };
  }

  /**
   * Clear loaded configurations
   */
  public clear(): void {
    this.loadedConfigs.clear();
    this.emit('cleared', { timestamp: Date.now() });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.clear();
    this.schemas.clear();
    this.checksumCache.clear();
    this.removeAllListeners();
  }
}

export default SecureConfigLoader;
