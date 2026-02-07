/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: VALIDATION UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Schema validation with Zod-like patterns
 * Type-safe request validation
 * 
 * @author Dimitar Prodromov
 * @version 26.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'undefined';

interface SchemaDefinition {
  type: SchemaType | SchemaType[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  items?: Schema;
  properties?: Record<string, Schema>;
  custom?: (value: unknown) => boolean | string;
  transform?: (value: unknown) => unknown;
  default?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export class Schema<T = unknown> {
  private def: SchemaDefinition;

  private constructor(def: SchemaDefinition) {
    this.def = def;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FACTORY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  static string(): Schema<string> {
    return new Schema({ type: 'string', required: true });
  }

  static number(): Schema<number> {
    return new Schema({ type: 'number', required: true });
  }

  static boolean(): Schema<boolean> {
    return new Schema({ type: 'boolean', required: true });
  }

  static object<T extends Record<string, Schema>>(
    properties: T
  ): Schema<{ [K in keyof T]: SchemaInfer<T[K]> }> {
    return new Schema({
      type: 'object',
      required: true,
      properties: properties as Record<string, Schema>
    }) as Schema<{ [K in keyof T]: SchemaInfer<T[K]> }>;
  }

  static array<T>(items: Schema<T>): Schema<T[]> {
    return new Schema({
      type: 'array',
      required: true,
      items: items as Schema
    }) as Schema<T[]>;
  }

  static literal<T extends string | number | boolean>(value: T): Schema<T> {
    return new Schema({
      type: typeof value as SchemaType,
      required: true,
      enum: [value]
    }) as Schema<T>;
  }

  static union<T extends Schema[]>(...schemas: T): Schema<SchemaInfer<T[number]>> {
    // Simplified union - in production use proper union handling
    return schemas[0] as Schema<SchemaInfer<T[number]>>;
  }

  static enum<T extends readonly string[]>(values: T): Schema<T[number]> {
    return new Schema({
      type: 'string',
      required: true,
      enum: values as unknown as unknown[]
    }) as Schema<T[number]>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIERS
  // ═══════════════════════════════════════════════════════════════════════════

  optional(): Schema<T | undefined> {
    return new Schema({ ...this.def, required: false }) as Schema<T | undefined>;
  }

  nullable(): Schema<T | null> {
    const types = Array.isArray(this.def.type) 
      ? [...this.def.type, 'null'] 
      : [this.def.type, 'null'];
    return new Schema({ ...this.def, type: types as SchemaType[] }) as Schema<T | null>;
  }

  default(value: T): Schema<T> {
    return new Schema({ ...this.def, default: value });
  }

  min(value: number): Schema<T> {
    return new Schema({ 
      ...this.def, 
      ...(this.def.type === 'string' ? { minLength: value } : { min: value })
    });
  }

  max(value: number): Schema<T> {
    return new Schema({ 
      ...this.def, 
      ...(this.def.type === 'string' ? { maxLength: value } : { max: value })
    });
  }

  length(min: number, max?: number): Schema<T> {
    return new Schema({ 
      ...this.def, 
      minLength: min, 
      maxLength: max ?? min 
    });
  }

  pattern(regex: RegExp): Schema<T> {
    return new Schema({ ...this.def, pattern: regex });
  }

  email(): Schema<T> {
    return new Schema({ 
      ...this.def, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    });
  }

  url(): Schema<T> {
    return new Schema({ 
      ...this.def, 
      pattern: /^https?:\/\/.+/ 
    });
  }

  uuid(): Schema<T> {
    return new Schema({ 
      ...this.def, 
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i 
    });
  }

  custom(fn: (value: T) => boolean | string): Schema<T> {
    return new Schema({ ...this.def, custom: fn as (value: unknown) => boolean | string });
  }

  transform<U>(fn: (value: T) => U): Schema<U> {
    return new Schema({ ...this.def, transform: fn as (value: unknown) => unknown }) as Schema<U>;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  validate(value: unknown, path: string = ''): ValidationResult<T> {
    const errors: ValidationError[] = [];

    // Handle undefined
    if (value === undefined) {
      if (this.def.default !== undefined) {
        return { success: true, data: this.def.default as T };
      }
      if (!this.def.required) {
        return { success: true, data: undefined as T };
      }
      errors.push({
        path: path || 'root',
        message: 'Required field is missing',
        code: 'required'
      });
      return { success: false, errors };
    }

    // Handle null
    if (value === null) {
      const types = Array.isArray(this.def.type) ? this.def.type : [this.def.type];
      if (!types.includes('null')) {
        errors.push({
          path: path || 'root',
          message: 'Value cannot be null',
          code: 'invalid_type',
          expected: types.join(' | '),
          received: 'null'
        });
        return { success: false, errors };
      }
      return { success: true, data: null as T };
    }

    // Type check
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    const expectedTypes = Array.isArray(this.def.type) ? this.def.type : [this.def.type];
    
    if (!expectedTypes.includes(actualType as SchemaType)) {
      errors.push({
        path: path || 'root',
        message: `Expected ${expectedTypes.join(' | ')}, got ${actualType}`,
        code: 'invalid_type',
        expected: expectedTypes.join(' | '),
        received: actualType
      });
      return { success: false, errors };
    }

    // Enum check
    if (this.def.enum && !this.def.enum.includes(value)) {
      errors.push({
        path: path || 'root',
        message: `Value must be one of: ${this.def.enum.join(', ')}`,
        code: 'invalid_enum',
        received: String(value)
      });
      return { success: false, errors };
    }

    // String validations
    if (typeof value === 'string') {
      if (this.def.minLength !== undefined && value.length < this.def.minLength) {
        errors.push({
          path: path || 'root',
          message: `String must be at least ${this.def.minLength} characters`,
          code: 'too_short'
        });
      }
      if (this.def.maxLength !== undefined && value.length > this.def.maxLength) {
        errors.push({
          path: path || 'root',
          message: `String must be at most ${this.def.maxLength} characters`,
          code: 'too_long'
        });
      }
      if (this.def.pattern && !this.def.pattern.test(value)) {
        errors.push({
          path: path || 'root',
          message: 'String does not match required pattern',
          code: 'invalid_pattern'
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (this.def.min !== undefined && value < this.def.min) {
        errors.push({
          path: path || 'root',
          message: `Number must be at least ${this.def.min}`,
          code: 'too_small'
        });
      }
      if (this.def.max !== undefined && value > this.def.max) {
        errors.push({
          path: path || 'root',
          message: `Number must be at most ${this.def.max}`,
          code: 'too_big'
        });
      }
    }

    // Array validations
    if (Array.isArray(value) && this.def.items) {
      value.forEach((item, index) => {
        const result = this.def.items!.validate(item, `${path}[${index}]`);
        if (!result.success && 'errors' in result) {
          errors.push(...result.errors);
        }
      });
    }

    // Object validations
    if (typeof value === 'object' && !Array.isArray(value) && this.def.properties) {
      const obj = value as Record<string, unknown>;
      
      for (const [key, schema] of Object.entries(this.def.properties)) {
        const result = schema.validate(obj[key], path ? `${path}.${key}` : key);
        if (!result.success && 'errors' in result) {
          errors.push(...result.errors);
        }
      }
    }

    // Custom validation
    if (this.def.custom) {
      const customResult = this.def.custom(value);
      if (customResult !== true) {
        errors.push({
          path: path || 'root',
          message: typeof customResult === 'string' ? customResult : 'Custom validation failed',
          code: 'custom'
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Transform
    let finalValue: unknown = value;
    if (this.def.transform) {
      finalValue = this.def.transform(value);
    }

    return { success: true, data: finalValue as T };
  }

  parse(value: unknown): T {
    const result = this.validate(value);
    if (!result.success && 'errors' in result) {
      throw new ValidationException(result.errors);
    }
    return (result as any).data;
  }

  safeParse(value: unknown): ValidationResult<T> {
    return this.validate(value);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE INFERENCE
// ═══════════════════════════════════════════════════════════════════════════════

export type SchemaInfer<T> = T extends Schema<infer U> ? U : never;

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION EXCEPTION
// ═══════════════════════════════════════════════════════════════════════════════

export class ValidationException extends Error {
  public readonly errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    const message = errors.map(e => `${e.path}: ${e.message}`).join('; ');
    super(`Validation failed: ${message}`);
    this.name = 'ValidationException';
    this.errors = errors;
  }

  toJSON(): { message: string; errors: ValidationError[] } {
    return {
      message: this.message,
      errors: this.errors
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const CommonSchemas = {
  /** UUID v4 */
  uuid: Schema.string().uuid(),
  
  /** Email address */
  email: Schema.string().email(),
  
  /** URL */
  url: Schema.string().url(),
  
  /** Non-empty string */
  nonEmptyString: Schema.string().min(1),
  
  /** Positive integer */
  positiveInt: Schema.number().min(1).custom(v => Number.isInteger(v) || 'Must be an integer'),
  
  /** Port number */
  port: Schema.number().min(1).max(65535).custom(v => Number.isInteger(v) || 'Must be an integer'),
  
  /** Browser type */
  browser: Schema.enum(['chromium', 'firefox', 'webkit'] as const),
  
  /** Test status */
  testStatus: Schema.enum(['pending', 'running', 'passed', 'failed', 'skipped'] as const),
  
  /** Job status */
  jobStatus: Schema.enum(['queued', 'running', 'completed', 'failed', 'cancelled'] as const),
  
  /** Pagination */
  pagination: Schema.object({
    page: Schema.number().min(1).default(1).optional(),
    limit: Schema.number().min(1).max(100).default(20).optional()
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

export const RequestSchemas = {
  /** Create session request */
  createSession: Schema.object({
    browser: CommonSchemas.browser.optional().default('chromium'),
    headless: Schema.boolean().optional().default(true),
    viewport: Schema.object({
      width: Schema.number().min(320).max(3840).optional(),
      height: Schema.number().min(240).max(2160).optional()
    }).optional(),
    timeout: Schema.number().min(1000).max(300000).optional().default(30000),
    userAgent: Schema.string().optional()
  }),

  /** Run tests request */
  runTests: Schema.object({
    tests: Schema.array(Schema.string().min(1)),
    browser: CommonSchemas.browser.optional().default('chromium'),
    workers: Schema.number().min(1).max(16).optional().default(4),
    retries: Schema.number().min(0).max(5).optional().default(0),
    timeout: Schema.number().min(1000).max(600000).optional().default(30000),
    reporter: Schema.enum(['json', 'html', 'junit'] as const).optional().default('json'),
    env: Schema.object({}).optional()
  }),

  /** Navigate request */
  navigate: Schema.object({
    url: Schema.string().url(),
    waitUntil: Schema.enum(['load', 'domcontentloaded', 'networkidle'] as const).optional()
  }),

  /** Click request */
  click: Schema.object({
    selector: Schema.string().min(1),
    button: Schema.enum(['left', 'right', 'middle'] as const).optional().default('left'),
    clickCount: Schema.number().min(1).max(3).optional().default(1),
    timeout: Schema.number().min(0).optional()
  }),

  /** Type request */
  type: Schema.object({
    selector: Schema.string().min(1),
    text: Schema.string(),
    delay: Schema.number().min(0).optional().default(0),
    clear: Schema.boolean().optional().default(false)
  }),

  /** Screenshot request */
  screenshot: Schema.object({
    fullPage: Schema.boolean().optional().default(false),
    format: Schema.enum(['png', 'jpeg', 'webp'] as const).optional().default('png'),
    quality: Schema.number().min(0).max(100).optional(),
    selector: Schema.string().optional()
  }),

  /** Evaluate request */
  evaluate: Schema.object({
    script: Schema.string().min(1),
    args: Schema.array(Schema.string()).optional()
  })
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const v = {
  string: Schema.string,
  number: Schema.number,
  boolean: Schema.boolean,
  object: Schema.object,
  array: Schema.array,
  literal: Schema.literal,
  union: Schema.union,
  enum: Schema.enum
};

export default Schema;
