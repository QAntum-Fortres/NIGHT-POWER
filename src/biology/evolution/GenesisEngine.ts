/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║    ██████╗ ███████╗███╗   ██╗███████╗███████╗██╗███████╗                      ║
 * ║   ██╔════╝ ██╔════╝████╗  ██║██╔════╝██╔════╝██║██╔════╝                      ║
 * ║   ██║  ███╗█████╗  ██╔██╗ ██║█████╗  ███████╗██║███████╗                      ║
 * ║   ██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚════██║██║╚════██║                      ║
 * ║   ╚██████╔╝███████╗██║ ╚████║███████╗███████║██║███████║                      ║
 * ║    ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝╚══════╝                      ║
 * ║                                                                               ║
 * ║   ███████╗███╗   ██╗ ██████╗ ██╗███╗   ██╗███████╗                            ║
 * ║   ██╔════╝████╗  ██║██╔════╝ ██║████╗  ██║██╔════╝                            ║
 * ║   █████╗  ██╔██╗ ██║██║  ███╗██║██╔██╗ ██║█████╗                              ║
 * ║   ██╔══╝  ██║╚██╗██║██║   ██║██║██║╚██╗██║██╔══╝                              ║
 * ║   ███████╗██║ ╚████║╚██████╔╝██║██║ ╚████║███████╗                            ║
 * ║   ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚═╝  ╚═══╝╚══════╝                            ║
 * ║                                                                               ║
 * ║   QAntum v29.1 "THE ADAPTIVE CONSCIOUSNESS" - Genesis Engine                  ║
 * ║   "Жива кодова екосистема - код, който създава код"                           ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                      ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QAntum 5-Layer Architecture
 */
export type QAntumLayer = 
  | 'biology'     // Neural evolution layer
  | 'chemistry'   // Transformation layer
  | 'physics'     // Data & Vector layer
  | 'universe'    // Enterprise layer
  | 'cognition';  // Self-awareness layer

/**
 * Entity Type in the ecosystem
 */
export type EntityType = 
  | 'class' 
  | 'interface' 
  | 'function' 
  | 'module' 
  | 'component' 
  | 'workflow' 
  | 'test';

/**
 * Entity Lifecycle State
 */
export type EntityState = 
  | 'embryo'      // Initial template
  | 'growing'     // Being constructed
  | 'mature'      // Ready for use
  | 'evolving'    // Being modified
  | 'deprecated'  // Marked for removal
  | 'archived';   // Removed from active use

/**
 * Entity Definition
 */
export interface EntityDefinition {
  id: string;
  name: string;
  type: EntityType;
  layer: QAntumLayer;
  state: EntityState;
  
  // Location
  filePath: string;
  lineStart?: number;
  lineEnd?: number;
  
  // Relationships
  dependencies: string[];
  dependents: string[];
  parentEntity?: string;
  childEntities: string[];
  
  // Metadata
  description: string;
  version: string;
  createdAt: Date;
  modifiedAt: Date;
  createdBy: 'genesis' | 'human' | 'hybrid';
  
  // Code
  templateId?: string;
  generatedCode?: string;
  
  // Health
  testCoverage?: number;
  complexity?: number;
  healthScore?: number;
}

/**
 * Code Template
 */
export interface CodeTemplate {
  id: string;
  name: string;
  type: EntityType;
  layer: QAntumLayer;
  
  // Template content
  template: string;
  variables: TemplateVariable[];
  
  // Constraints
  requiredImports: string[];
  requiredDependencies: string[];
  
  // Usage
  usageCount: number;
  successRate: number;
}

/**
 * Template Variable
 */
export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'enum';
  required: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
}

/**
 * Genesis Request
 */
export interface GenesisRequest {
  name: string;
  type: EntityType;
  layer: QAntumLayer;
  description: string;
  
  // Generation options
  templateId?: string;
  variables?: Record<string, unknown>;
  baseOn?: string;  // Entity ID to base on
  
  // Constraints
  targetPath?: string;
  maxLines?: number;
  includeTests?: boolean;
}

/**
 * Genesis Result
 */
export interface GenesisResult {
  success: boolean;
  entity?: EntityDefinition;
  code?: string;
  filePath?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Genesis Engine Configuration
 */
export interface GenesisConfig {
  templateDir: string;
  outputDir: string;
  backpackPath: string;
  autoRegister: boolean;
  validateOnCreate: boolean;
  createTests: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_TEMPLATES: Record<string, CodeTemplate> = {
  'class-biology': {
    id: 'class-biology',
    name: 'Biology Layer Class',
    type: 'class',
    layer: 'biology',
    template: `/**
 * {{className}} - {{description}}
 * 
 * Part of QAntum's Biology Layer (Neural Evolution)
 * @layer biology
 * @version {{version}}
 */

import { EventEmitter } from 'events';

export interface {{className}}Config {
  // Add configuration options
}

export class {{className}} extends EventEmitter {
  private config: {{className}}Config;
  
  constructor(config: Partial<{{className}}Config> = {}) {
    super();
    this.config = { ...this.getDefaultConfig(), ...config };
    this.initialize();
  }
  
  private getDefaultConfig(): {{className}}Config {
    return {
      // Default values
    };
  }
  
  private initialize(): void {
    console.log('🧬 {{className}} initialized');
  }
  
  // Add methods here
}

export default {{className}};
`,
    variables: [
      { name: 'className', description: 'Class name in PascalCase', type: 'string', required: true },
      { name: 'description', description: 'Brief description', type: 'string', required: true },
      { name: 'version', description: 'Version number', type: 'string', required: false, defaultValue: '1.0.0' }
    ],
    requiredImports: ['events'],
    requiredDependencies: [],
    usageCount: 0,
    successRate: 100
  },
  
  'class-chemistry': {
    id: 'class-chemistry',
    name: 'Chemistry Layer Class',
    type: 'class',
    layer: 'chemistry',
    template: `/**
 * {{className}} - {{description}}
 * 
 * Part of QAntum's Chemistry Layer (Transformation)
 * @layer chemistry
 * @version {{version}}
 */

export interface {{className}}Input {
  // Define input structure
}

export interface {{className}}Output {
  // Define output structure
}

export class {{className}} {
  /**
   * Transform input to output
   */
  async transform(input: {{className}}Input): Promise<{{className}}Output> {
    // Implement transformation logic
    throw new Error('Not implemented');
  }
  
  /**
   * Validate input before transformation
   */
  validate(input: {{className}}Input): boolean {
    // Implement validation
    return true;
  }
}

export default {{className}};
`,
    variables: [
      { name: 'className', description: 'Class name in PascalCase', type: 'string', required: true },
      { name: 'description', description: 'Brief description', type: 'string', required: true },
      { name: 'version', description: 'Version number', type: 'string', required: false, defaultValue: '1.0.0' }
    ],
    requiredImports: [],
    requiredDependencies: [],
    usageCount: 0,
    successRate: 100
  },
  
  'interface-standard': {
    id: 'interface-standard',
    name: 'Standard Interface',
    type: 'interface',
    layer: 'cognition',
    template: `/**
 * {{interfaceName}} - {{description}}
 * 
 * @layer {{layer}}
 * @version {{version}}
 */

export interface {{interfaceName}} {
  {{#properties}}
  /** {{description}} */
  {{name}}{{#optional}}?{{/optional}}: {{type}};
  {{/properties}}
}

export default {{interfaceName}};
`,
    variables: [
      { name: 'interfaceName', description: 'Interface name in PascalCase', type: 'string', required: true },
      { name: 'description', description: 'Brief description', type: 'string', required: true },
      { name: 'layer', description: 'QAntum layer', type: 'enum', required: true, enumValues: ['biology', 'chemistry', 'physics', 'universe', 'cognition'] },
      { name: 'version', description: 'Version number', type: 'string', required: false, defaultValue: '1.0.0' },
      { name: 'properties', description: 'Interface properties', type: 'array', required: false, defaultValue: [] }
    ],
    requiredImports: [],
    requiredDependencies: [],
    usageCount: 0,
    successRate: 100
  },
  
  'test-standard': {
    id: 'test-standard',
    name: 'Standard Test Suite',
    type: 'test',
    layer: 'cognition',
    template: `/**
 * Test Suite: {{targetName}}
 * 
 * @layer {{layer}}
 * @coverage {{coverageTarget}}%
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { {{targetName}} } from '{{importPath}}';

describe('{{targetName}}', () => {
  let instance: {{targetName}};
  
  beforeEach(() => {
    instance = new {{targetName}}();
  });
  
  afterEach(() => {
    // Cleanup
  });
  
  describe('initialization', () => {
    it('should create instance with default config', () => {
      expect(instance).toBeDefined();
    });
  });
  
  describe('core functionality', () => {
    it.todo('add test cases here');
  });
  
  describe('edge cases', () => {
    it.todo('add edge case tests');
  });
  
  describe('error handling', () => {
    it.todo('add error handling tests');
  });
});
`,
    variables: [
      { name: 'targetName', description: 'Name of class/function to test', type: 'string', required: true },
      { name: 'layer', description: 'QAntum layer', type: 'enum', required: true, enumValues: ['biology', 'chemistry', 'physics', 'universe', 'cognition'] },
      { name: 'importPath', description: 'Import path for target', type: 'string', required: true },
      { name: 'coverageTarget', description: 'Target coverage %', type: 'number', required: false, defaultValue: 80 }
    ],
    requiredImports: ['vitest'],
    requiredDependencies: ['vitest'],
    usageCount: 0,
    successRate: 100
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: GenesisConfig = {
  templateDir: 'templates',
  outputDir: 'src',
  backpackPath: 'data/backpack.json',
  autoRegister: true,
  validateOnCreate: true,
  createTests: true
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENESIS ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GenesisEngine - Self-Creating Code Ecosystem
 * 
 * The Genesis Engine allows QAntum to create new code entities
 * that follow the 5-layer architecture, maintaining consistency
 * and enabling the system to evolve itself.
 * 
 * Key Capabilities:
 * - Template-based code generation
 * - Entity lifecycle management (embryo → mature → deprecated)
 * - Dependency tracking and validation
 * - Automatic test generation
 * - Health monitoring for created entities
 * 
 * @example
 * ```typescript
 * const genesis = GenesisEngine.getInstance();
 * 
 * // Create a new class in the biology layer
 * const result = await genesis.create({
 *   name: 'NeuralEvolver',
 *   type: 'class',
 *   layer: 'biology',
 *   description: 'Neural network evolution manager'
 * });
 * 
 * // CLI: qantum genesis NeuralEvolver --type class --layer biology
 * ```
 */
export class GenesisEngine extends EventEmitter {
  private static instance: GenesisEngine;
  
  private config: GenesisConfig;
  private templates: Map<string, CodeTemplate> = new Map();
  private entities: Map<string, EntityDefinition> = new Map();
  
  private constructor(config: Partial<GenesisConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.loadDefaultTemplates();
    this.loadEntities();
    
    console.log('🌱 Genesis Engine initialized');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<GenesisConfig>): GenesisEngine {
    if (!GenesisEngine.instance) {
      GenesisEngine.instance = new GenesisEngine(config);
    }
    return GenesisEngine.instance;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPLATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    for (const [id, template] of Object.entries(DEFAULT_TEMPLATES)) {
      this.templates.set(id, template);
    }
    console.log(`📜 Loaded ${this.templates.size} default templates`);
  }
  
  /**
   * Get template by ID
   */
  getTemplate(id: string): CodeTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get all templates
   */
  getAllTemplates(): CodeTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Register a new template
   */
  registerTemplate(template: CodeTemplate): void {
    this.templates.set(template.id, template);
    this.emit('template:registered', template);
  }
  
  /**
   * Find best template for request
   */
  findTemplate(type: EntityType, layer: QAntumLayer): CodeTemplate | undefined {
    const key = `${type}-${layer}`;
    
    // Try exact match
    if (this.templates.has(key)) {
      return this.templates.get(key);
    }
    
    // Try type-only match
    for (const [id, template] of this.templates) {
      if (template.type === type) {
        return template;
      }
    }
    
    return undefined;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CODE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Create a new entity
   */
  async create(request: GenesisRequest): Promise<GenesisResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Validate request
      if (this.config.validateOnCreate) {
        const validation = this.validateRequest(request);
        if (!validation.valid) {
          return { success: false, errors: validation.errors };
        }
        warnings.push(...(validation.warnings || []));
      }
      
      // Find or use specified template
      const template = request.templateId 
        ? this.templates.get(request.templateId)
        : this.findTemplate(request.type, request.layer);
      
      if (!template) {
        return { 
          success: false, 
          errors: [`No template found for ${request.type} in ${request.layer} layer`] 
        };
      }
      
      // Generate code
      const code = this.generateCode(template, {
        ...this.getDefaultVariables(request),
        ...(request.variables || {})
      });
      
      // Determine file path
      const filePath = request.targetPath || this.generateFilePath(request);
      
      // Create entity definition
      const entity: EntityDefinition = {
        id: this.generateEntityId(request.name),
        name: request.name,
        type: request.type,
        layer: request.layer,
        state: 'embryo',
        filePath,
        dependencies: [],
        dependents: [],
        childEntities: [],
        description: request.description,
        version: '1.0.0',
        createdAt: new Date(),
        modifiedAt: new Date(),
        createdBy: 'genesis',
        templateId: template.id,
        generatedCode: code
      };
      
      // Write file
      await this.writeFile(filePath, code);
      entity.state = 'mature';
      
      // Register entity
      if (this.config.autoRegister) {
        this.entities.set(entity.id, entity);
        this.persistEntities();
      }
      
      // Create test if requested
      if (this.config.createTests && request.includeTests !== false) {
        const testResult = await this.createTest(entity);
        if (testResult.warnings) {
          warnings.push(...testResult.warnings);
        }
      }
      
      // Update template usage
      template.usageCount++;
      
      this.emit('entity:created', entity);
      
      return {
        success: true,
        entity,
        code,
        filePath,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
  
  /**
   * Generate code from template
   */
  private generateCode(template: CodeTemplate, variables: Record<string, unknown>): string {
    let code = template.template;
    
    // Simple variable substitution ({{variableName}})
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      code = code.replace(regex, String(value));
    }
    
    // Handle conditional blocks ({{#variable}}...{{/variable}})
    code = code.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
      const value = variables[key];
      if (Array.isArray(value)) {
        return value.map(item => {
          let itemContent = content;
          for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
            itemContent = itemContent.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
          }
          return itemContent;
        }).join('');
      } else if (value) {
        return content;
      }
      return '';
    });
    
    return code;
  }
  
  /**
   * Get default variables for request
   */
  private getDefaultVariables(request: GenesisRequest): Record<string, unknown> {
    return {
      className: request.name,
      interfaceName: request.name,
      targetName: request.name,
      description: request.description,
      layer: request.layer,
      version: '1.0.0',
      importPath: `./${request.name}`
    };
  }
  
  /**
   * Generate file path for entity
   */
  private generateFilePath(request: GenesisRequest): string {
    const layerDirs: Record<QAntumLayer, string> = {
      biology: 'src/biology/evolution',
      chemistry: 'src/chemistry',
      physics: 'src/physics',
      universe: 'src/enterprise',
      cognition: 'src/cognition'
    };
    
    const dir = layerDirs[request.layer];
    const fileName = `${request.name}.ts`;
    
    return path.join(dir, fileName);
  }
  
  /**
   * Generate unique entity ID
   */
  private generateEntityId(name: string): string {
    const hash = crypto.createHash('md5')
      .update(`${name}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8);
    return `entity-${name.toLowerCase()}-${hash}`;
  }
  
  /**
   * Write code to file
   */
  private async writeFile(filePath: string, code: string): Promise<void> {
    const dir = path.dirname(filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, code, 'utf-8');
    console.log(`📝 Created: ${filePath}`);
  }
  
  /**
   * Create test for entity
   */
  private async createTest(entity: EntityDefinition): Promise<GenesisResult> {
    const testTemplate = this.templates.get('test-standard');
    if (!testTemplate) {
      return { success: false, warnings: ['No test template found'] };
    }
    
    const testPath = entity.filePath
      .replace('/src/', '/tests/')
      .replace('.ts', '.test.ts');
    
    const testCode = this.generateCode(testTemplate, {
      targetName: entity.name,
      layer: entity.layer,
      importPath: path.relative(path.dirname(testPath), entity.filePath).replace('.ts', ''),
      coverageTarget: 80
    });
    
    await this.writeFile(testPath, testCode);
    
    return { success: true, filePath: testPath };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Validate genesis request
   */
  private validateRequest(request: GenesisRequest): { 
    valid: boolean; 
    errors?: string[];
    warnings?: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!request.name) {
      errors.push('Name is required');
    }
    if (!request.type) {
      errors.push('Type is required');
    }
    if (!request.layer) {
      errors.push('Layer is required');
    }
    
    // Validate name format (PascalCase)
    if (request.name && !/^[A-Z][a-zA-Z0-9]*$/.test(request.name)) {
      warnings.push('Name should be in PascalCase');
    }
    
    // Check for duplicate
    const existing = Array.from(this.entities.values())
      .find(e => e.name === request.name && e.layer === request.layer);
    if (existing) {
      errors.push(`Entity '${request.name}' already exists in ${request.layer} layer`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ENTITY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get entity by ID
   */
  getEntity(id: string): EntityDefinition | undefined {
    return this.entities.get(id);
  }
  
  /**
   * Get all entities
   */
  getAllEntities(): EntityDefinition[] {
    return Array.from(this.entities.values());
  }
  
  /**
   * Get entities by layer
   */
  getEntitiesByLayer(layer: QAntumLayer): EntityDefinition[] {
    return Array.from(this.entities.values())
      .filter(e => e.layer === layer);
  }
  
  /**
   * Update entity state
   */
  updateEntityState(id: string, state: EntityState): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.state = state;
      entity.modifiedAt = new Date();
      this.persistEntities();
      this.emit('entity:updated', entity);
    }
  }
  
  /**
   * Load entities from backpack
   */
  private loadEntities(): void {
    try {
      if (fs.existsSync(this.config.backpackPath)) {
        const data = JSON.parse(fs.readFileSync(this.config.backpackPath, 'utf-8'));
        if (data.genesisEntities) {
          for (const entity of data.genesisEntities) {
            entity.createdAt = new Date(entity.createdAt);
            entity.modifiedAt = new Date(entity.modifiedAt);
            this.entities.set(entity.id, entity);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load entities:', error);
    }
  }
  
  /**
   * Persist entities to backpack
   */
  private persistEntities(): void {
    try {
      let data: Record<string, unknown> = {};
      
      if (fs.existsSync(this.config.backpackPath)) {
        data = JSON.parse(fs.readFileSync(this.config.backpackPath, 'utf-8'));
      }
      
      data.genesisEntities = Array.from(this.entities.values());
      
      const dir = path.dirname(this.config.backpackPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.config.backpackPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to persist entities:', error);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ECOSYSTEM ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Get ecosystem statistics
   */
  getStats(): {
    totalEntities: number;
    byLayer: Record<QAntumLayer, number>;
    byType: Record<EntityType, number>;
    byState: Record<EntityState, number>;
    templateUsage: Array<{ id: string; count: number }>;
  } {
    const entities = Array.from(this.entities.values());
    
    const byLayer: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byState: Record<string, number> = {};
    
    for (const entity of entities) {
      byLayer[entity.layer] = (byLayer[entity.layer] || 0) + 1;
      byType[entity.type] = (byType[entity.type] || 0) + 1;
      byState[entity.state] = (byState[entity.state] || 0) + 1;
    }
    
    const templateUsage = Array.from(this.templates.values())
      .map(t => ({ id: t.id, count: t.usageCount }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalEntities: entities.length,
      byLayer: byLayer as Record<QAntumLayer, number>,
      byType: byType as Record<EntityType, number>,
      byState: byState as Record<EntityState, number>,
      templateUsage
    };
  }
  
  /**
   * Calculate health score for ecosystem
   */
  calculateEcosystemHealth(): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    
    const entities = Array.from(this.entities.values());
    
    // Check for deprecated entities
    const deprecated = entities.filter(e => e.state === 'deprecated');
    if (deprecated.length > 0) {
      score -= deprecated.length * 5;
      issues.push(`${deprecated.length} deprecated entities need cleanup`);
    }
    
    // Check layer balance
    const stats = this.getStats();
    const layers = Object.keys(stats.byLayer);
    if (layers.length < 3) {
      score -= 10;
      recommendations.push('Consider creating entities in more layers for balanced architecture');
    }
    
    // Check test coverage
    const withTests = entities.filter(e => e.testCoverage && e.testCoverage > 0);
    const testRatio = entities.length > 0 ? withTests.length / entities.length : 1;
    if (testRatio < 0.8) {
      score -= Math.floor((0.8 - testRatio) * 20);
      recommendations.push('Increase test coverage for genesis entities');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACTORY & EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getGenesisEngine = (config?: Partial<GenesisConfig>): GenesisEngine => {
  return GenesisEngine.getInstance(config);
};

export { DEFAULT_TEMPLATES };
export default GenesisEngine;
