/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM SCHEMA VALIDATOR                                                     ║
 * ║   "Powerful schema validation for any data structure"                         ║
 * ║                                                                               ║
 * ║   TODO B #25 - Validation: Schema-based Validation                            ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SchemaType = 
    | 'string' | 'number' | 'boolean' | 'object' | 'array' 
    | 'null' | 'undefined' | 'any' | 'date' | 'email' | 'url';

export interface ValidationError {
    path: string;
    message: string;
    value?: any;
    expected?: any;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}

export interface SchemaDefinition {
    type?: SchemaType | SchemaType[];
    required?: boolean;
    nullable?: boolean;
    default?: any;
    // String validations
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp | string;
    enum?: any[];
    // Number validations
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;
    // Array validations
    items?: SchemaDefinition;
    minItems?: number;
    maxItems?: number;
    unique?: boolean;
    // Object validations
    properties?: Record<string, SchemaDefinition>;
    additionalProperties?: boolean | SchemaDefinition;
    // Custom validation
    validate?: (value: any) => boolean | string;
    transform?: (value: any) => any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class SchemaValidator {
    private static instance: SchemaValidator;
    private schemas: Map<string, SchemaDefinition> = new Map();

    static getInstance(): SchemaValidator {
        if (!SchemaValidator.instance) {
            SchemaValidator.instance = new SchemaValidator();
        }
        return SchemaValidator.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEMA MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register schema
     */
    register(name: string, schema: SchemaDefinition): this {
        this.schemas.set(name, schema);
        return this;
    }

    /**
     * Get registered schema
     */
    getSchema(name: string): SchemaDefinition | undefined {
        return this.schemas.get(name);
    }

    /**
     * Remove schema
     */
    removeSchema(name: string): boolean {
        return this.schemas.delete(name);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validate value against schema
     */
    validate(value: any, schema: SchemaDefinition | string, path: string = ''): ValidationResult {
        const schemaObj = typeof schema === 'string' 
            ? this.schemas.get(schema) 
            : schema;

        if (!schemaObj) {
            return { valid: false, errors: [{ path, message: `Schema not found: ${schema}` }] };
        }

        const errors: ValidationError[] = [];

        // Check required
        if (value === undefined) {
            if (schemaObj.required) {
                errors.push({ path, message: 'Value is required', value });
            } else if (schemaObj.default !== undefined) {
                value = schemaObj.default;
            }
            return { valid: errors.length === 0, errors };
        }

        // Check nullable
        if (value === null) {
            if (!schemaObj.nullable) {
                errors.push({ path, message: 'Value cannot be null', value });
            }
            return { valid: errors.length === 0, errors };
        }

        // Transform if specified
        if (schemaObj.transform) {
            value = schemaObj.transform(value);
        }

        // Type validation
        if (schemaObj.type) {
            const types = Array.isArray(schemaObj.type) ? schemaObj.type : [schemaObj.type];
            const actualType = this.getType(value);
            
            if (!types.includes(actualType as SchemaType) && !types.includes('any')) {
                errors.push({ 
                    path, 
                    message: `Expected type ${types.join(' | ')}, got ${actualType}`,
                    value,
                    expected: types
                });
                return { valid: false, errors };
            }
        }

        // Type-specific validations
        const actualType = this.getType(value);

        if (actualType === 'string') {
            errors.push(...this.validateString(value, schemaObj, path));
        } else if (actualType === 'number') {
            errors.push(...this.validateNumber(value, schemaObj, path));
        } else if (actualType === 'array') {
            errors.push(...this.validateArray(value, schemaObj, path));
        } else if (actualType === 'object') {
            errors.push(...this.validateObject(value, schemaObj, path));
        }

        // Enum validation
        if (schemaObj.enum && !schemaObj.enum.includes(value)) {
            errors.push({ 
                path, 
                message: `Value must be one of: ${schemaObj.enum.join(', ')}`,
                value,
                expected: schemaObj.enum
            });
        }

        // Custom validation
        if (schemaObj.validate) {
            const result = schemaObj.validate(value);
            if (result !== true) {
                errors.push({ 
                    path, 
                    message: typeof result === 'string' ? result : 'Custom validation failed',
                    value
                });
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate with schema name
     */
    validateNamed(value: any, schemaName: string): ValidationResult {
        return this.validate(value, schemaName);
    }

    /**
     * Assert validation
     */
    assert(value: any, schema: SchemaDefinition | string, message?: string): void {
        const result = this.validate(value, schema);
        if (!result.valid) {
            const errorMessages = result.errors.map(e => `${e.path || 'root'}: ${e.message}`).join(', ');
            throw new Error(message || `Validation failed: ${errorMessages}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TYPE-SPECIFIC VALIDATORS
    // ─────────────────────────────────────────────────────────────────────────

    private validateString(value: string, schema: SchemaDefinition, path: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.minLength !== undefined && value.length < schema.minLength) {
            errors.push({ 
                path, 
                message: `String must be at least ${schema.minLength} characters`,
                value
            });
        }

        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            errors.push({ 
                path, 
                message: `String must be at most ${schema.maxLength} characters`,
                value
            });
        }

        if (schema.pattern) {
            const regex = typeof schema.pattern === 'string' 
                ? new RegExp(schema.pattern) 
                : schema.pattern;
            if (!regex.test(value)) {
                errors.push({ 
                    path, 
                    message: `String must match pattern: ${regex.source}`,
                    value
                });
            }
        }

        // Special string types
        if (schema.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push({ path, message: 'Invalid email format', value });
            }
        }

        if (schema.type === 'url') {
            try {
                new URL(value);
            } catch {
                errors.push({ path, message: 'Invalid URL format', value });
            }
        }

        return errors;
    }

    private validateNumber(value: number, schema: SchemaDefinition, path: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.min !== undefined && value < schema.min) {
            errors.push({ 
                path, 
                message: `Number must be at least ${schema.min}`,
                value
            });
        }

        if (schema.max !== undefined && value > schema.max) {
            errors.push({ 
                path, 
                message: `Number must be at most ${schema.max}`,
                value
            });
        }

        if (schema.integer && !Number.isInteger(value)) {
            errors.push({ path, message: 'Number must be an integer', value });
        }

        if (schema.positive && value <= 0) {
            errors.push({ path, message: 'Number must be positive', value });
        }

        if (schema.negative && value >= 0) {
            errors.push({ path, message: 'Number must be negative', value });
        }

        return errors;
    }

    private validateArray(value: any[], schema: SchemaDefinition, path: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.minItems !== undefined && value.length < schema.minItems) {
            errors.push({ 
                path, 
                message: `Array must have at least ${schema.minItems} items`,
                value
            });
        }

        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            errors.push({ 
                path, 
                message: `Array must have at most ${schema.maxItems} items`,
                value
            });
        }

        if (schema.unique) {
            const uniqueSet = new Set(value.map(v => JSON.stringify(v)));
            if (uniqueSet.size !== value.length) {
                errors.push({ path, message: 'Array must have unique items', value });
            }
        }

        if (schema.items) {
            for (let i = 0; i < value.length; i++) {
                const itemResult = this.validate(value[i], schema.items, `${path}[${i}]`);
                errors.push(...itemResult.errors);
            }
        }

        return errors;
    }

    private validateObject(value: Record<string, any>, schema: SchemaDefinition, path: string): ValidationError[] {
        const errors: ValidationError[] = [];

        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                const propPath = path ? `${path}.${key}` : key;
                const propResult = this.validate(value[key], propSchema, propPath);
                errors.push(...propResult.errors);
            }
        }

        // Check additional properties
        if (schema.additionalProperties !== undefined && schema.properties) {
            const definedKeys = Object.keys(schema.properties);
            const actualKeys = Object.keys(value);
            const additionalKeys = actualKeys.filter(k => !definedKeys.includes(k));

            if (additionalKeys.length > 0) {
                if (schema.additionalProperties === false) {
                    for (const key of additionalKeys) {
                        errors.push({ 
                            path: path ? `${path}.${key}` : key, 
                            message: 'Additional property not allowed',
                            value: value[key]
                        });
                    }
                } else if (typeof schema.additionalProperties === 'object') {
                    for (const key of additionalKeys) {
                        const propPath = path ? `${path}.${key}` : key;
                        const propResult = this.validate(value[key], schema.additionalProperties, propPath);
                        errors.push(...propResult.errors);
                    }
                }
            }
        }

        return errors;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private getType(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        if (value instanceof Date) return 'date';
        return typeof value;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export class Schema {
    private schema: SchemaDefinition = {};

    private constructor() {}

    static create(): Schema {
        return new Schema();
    }

    // Type methods
    string(): this { this.schema.type = 'string'; return this; }
    number(): this { this.schema.type = 'number'; return this; }
    boolean(): this { this.schema.type = 'boolean'; return this; }
    object(): this { this.schema.type = 'object'; return this; }
    array(): this { this.schema.type = 'array'; return this; }
    date(): this { this.schema.type = 'date'; return this; }
    email(): this { this.schema.type = 'email'; return this; }
    url(): this { this.schema.type = 'url'; return this; }
    any(): this { this.schema.type = 'any'; return this; }

    // Modifiers
    required(): this { this.schema.required = true; return this; }
    nullable(): this { this.schema.nullable = true; return this; }
    default(value: any): this { this.schema.default = value; return this; }

    // String validations
    min(value: number): this { this.schema.minLength = value; this.schema.min = value; return this; }
    max(value: number): this { this.schema.maxLength = value; this.schema.max = value; return this; }
    length(min: number, max?: number): this { 
        this.schema.minLength = min; 
        this.schema.maxLength = max ?? min; 
        return this; 
    }
    pattern(regex: RegExp | string): this { this.schema.pattern = regex; return this; }
    enum(...values: any[]): this { this.schema.enum = values; return this; }

    // Number validations
    integer(): this { this.schema.integer = true; return this; }
    positive(): this { this.schema.positive = true; return this; }
    negative(): this { this.schema.negative = true; return this; }

    // Array validations
    items(schema: SchemaDefinition | Schema): this { 
        this.schema.items = schema instanceof Schema ? schema.build() : schema;
        return this; 
    }
    minItems(value: number): this { this.schema.minItems = value; return this; }
    maxItems(value: number): this { this.schema.maxItems = value; return this; }
    unique(): this { this.schema.unique = true; return this; }

    // Object validations
    properties(props: Record<string, SchemaDefinition | Schema>): this {
        this.schema.properties = {};
        for (const [key, value] of Object.entries(props)) {
            this.schema.properties[key] = value instanceof Schema ? value.build() : value;
        }
        return this;
    }
    additionalProperties(allow: boolean | SchemaDefinition | Schema): this {
        if (allow instanceof Schema) {
            this.schema.additionalProperties = allow.build();
        } else {
            this.schema.additionalProperties = allow as boolean | SchemaDefinition;
        }
        return this;
    }

    // Custom validation
    validate(fn: (value: any) => boolean | string): this { 
        this.schema.validate = fn; 
        return this; 
    }
    transform(fn: (value: any) => any): this { 
        this.schema.transform = fn; 
        return this; 
    }

    // Build
    build(): SchemaDefinition {
        return { ...this.schema };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getValidator = (): SchemaValidator => SchemaValidator.getInstance();

// Quick schema builders
export const schema = {
    string: () => Schema.create().string(),
    number: () => Schema.create().number(),
    boolean: () => Schema.create().boolean(),
    object: () => Schema.create().object(),
    array: () => Schema.create().array(),
    email: () => Schema.create().email(),
    url: () => Schema.create().url(),
    any: () => Schema.create().any()
};

export default SchemaValidator;
