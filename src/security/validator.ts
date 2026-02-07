/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM INPUT VALIDATOR                                                      ║
 * ║   "Runtime validation for all inputs"                                         ║
 * ║                                                                               ║
 * ║   TODO B #43 - Security: Input Validation                                     ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ValidatorFn<T = any> = (value: T) => ValidationResult;

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    value?: any;  // Sanitized/transformed value
}

export interface ValidationError {
    path: string;
    message: string;
    code: string;
    expected?: any;
    received?: any;
}

export interface SchemaDefinition {
    [key: string]: FieldSchema | Schema;
}

export interface FieldSchema {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any';
    required?: boolean;
    default?: any;
    validators?: ValidatorFn[];
    transform?: (value: any) => any;
    items?: FieldSchema;  // For arrays
    properties?: SchemaDefinition;  // For nested objects
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════════

export const validators = {
    // String validators
    minLength: (min: number): ValidatorFn<string> => (value) => ({
        valid: typeof value === 'string' && value.length >= min,
        errors: value.length < min ? [{
            path: '',
            message: `Must be at least ${min} characters`,
            code: 'MIN_LENGTH',
            expected: min,
            received: value.length
        }] : []
    }),

    maxLength: (max: number): ValidatorFn<string> => (value) => ({
        valid: typeof value === 'string' && value.length <= max,
        errors: value.length > max ? [{
            path: '',
            message: `Must be at most ${max} characters`,
            code: 'MAX_LENGTH',
            expected: max,
            received: value.length
        }] : []
    }),

    pattern: (regex: RegExp, message?: string): ValidatorFn<string> => (value) => ({
        valid: regex.test(value),
        errors: !regex.test(value) ? [{
            path: '',
            message: message || `Must match pattern ${regex}`,
            code: 'PATTERN'
        }] : []
    }),

    email: (): ValidatorFn<string> => validators.pattern(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Must be a valid email address'
    ),

    url: (): ValidatorFn<string> => validators.pattern(
        /^https?:\/\/[^\s/$.?#].[^\s]*$/,
        'Must be a valid URL'
    ),

    alphanumeric: (): ValidatorFn<string> => validators.pattern(
        /^[a-zA-Z0-9]+$/,
        'Must contain only alphanumeric characters'
    ),

    noHtml: (): ValidatorFn<string> => (value) => ({
        valid: !/<[^>]*>/g.test(value),
        errors: /<[^>]*>/g.test(value) ? [{
            path: '',
            message: 'HTML tags are not allowed',
            code: 'NO_HTML'
        }] : []
    }),

    noSql: (): ValidatorFn<string> => (value) => {
        const sqlPatterns = [
            /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b/i,
            /--/,
            /;$/,
            /\/\*/
        ];
        const hasSql = sqlPatterns.some(p => p.test(value));
        return {
            valid: !hasSql,
            errors: hasSql ? [{
                path: '',
                message: 'Potential SQL injection detected',
                code: 'SQL_INJECTION'
            }] : []
        };
    },

    // Number validators
    min: (min: number): ValidatorFn<number> => (value) => ({
        valid: value >= min,
        errors: value < min ? [{
            path: '',
            message: `Must be at least ${min}`,
            code: 'MIN',
            expected: min,
            received: value
        }] : []
    }),

    max: (max: number): ValidatorFn<number> => (value) => ({
        valid: value <= max,
        errors: value > max ? [{
            path: '',
            message: `Must be at most ${max}`,
            code: 'MAX',
            expected: max,
            received: value
        }] : []
    }),

    integer: (): ValidatorFn<number> => (value) => ({
        valid: Number.isInteger(value),
        errors: !Number.isInteger(value) ? [{
            path: '',
            message: 'Must be an integer',
            code: 'INTEGER'
        }] : []
    }),

    positive: (): ValidatorFn<number> => (value) => ({
        valid: value > 0,
        errors: value <= 0 ? [{
            path: '',
            message: 'Must be positive',
            code: 'POSITIVE'
        }] : []
    }),

    // Array validators
    minItems: (min: number): ValidatorFn<any[]> => (value) => ({
        valid: Array.isArray(value) && value.length >= min,
        errors: value.length < min ? [{
            path: '',
            message: `Must have at least ${min} items`,
            code: 'MIN_ITEMS',
            expected: min,
            received: value.length
        }] : []
    }),

    maxItems: (max: number): ValidatorFn<any[]> => (value) => ({
        valid: Array.isArray(value) && value.length <= max,
        errors: value.length > max ? [{
            path: '',
            message: `Must have at most ${max} items`,
            code: 'MAX_ITEMS',
            expected: max,
            received: value.length
        }] : []
    }),

    unique: (): ValidatorFn<any[]> => (value) => {
        const unique = new Set(value.map(v => JSON.stringify(v))).size === value.length;
        return {
            valid: unique,
            errors: !unique ? [{
                path: '',
                message: 'All items must be unique',
                code: 'UNIQUE'
            }] : []
        };
    },

    // Generic
    oneOf: <T>(allowed: T[]): ValidatorFn<T> => (value) => ({
        valid: allowed.includes(value),
        errors: !allowed.includes(value) ? [{
            path: '',
            message: `Must be one of: ${allowed.join(', ')}`,
            code: 'ONE_OF',
            expected: allowed,
            received: value
        }] : []
    }),

    custom: <T>(fn: (value: T) => boolean, message: string): ValidatorFn<T> => (value) => ({
        valid: fn(value),
        errors: !fn(value) ? [{
            path: '',
            message,
            code: 'CUSTOM'
        }] : []
    })
};

// ═══════════════════════════════════════════════════════════════════════════════
// SANITIZERS
// ═══════════════════════════════════════════════════════════════════════════════

export const sanitizers = {
    trim: (value: string): string => value.trim(),
    
    lowercase: (value: string): string => value.toLowerCase(),
    
    uppercase: (value: string): string => value.toUpperCase(),
    
    escape: (value: string): string => {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    },
    
    stripHtml: (value: string): string => {
        return value.replace(/<[^>]*>/g, '');
    },
    
    normalizeWhitespace: (value: string): string => {
        return value.replace(/\s+/g, ' ').trim();
    },
    
    toNumber: (value: any): number => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    },
    
    toBoolean: (value: any): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            return ['true', '1', 'yes'].includes(value.toLowerCase());
        }
        return Boolean(value);
    },
    
    toArray: (value: any): any[] => {
        if (Array.isArray(value)) return value;
        return [value];
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export class Schema {
    private fields: Map<string, FieldSchema> = new Map();
    private strict: boolean = true;

    static create(): Schema {
        return new Schema();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIELD DEFINITIONS
    // ─────────────────────────────────────────────────────────────────────────

    string(name: string): StringField {
        const field: FieldSchema = { type: 'string', validators: [] };
        this.fields.set(name, field);
        return new StringField(field);
    }

    number(name: string): NumberField {
        const field: FieldSchema = { type: 'number', validators: [] };
        this.fields.set(name, field);
        return new NumberField(field);
    }

    boolean(name: string): BooleanField {
        const field: FieldSchema = { type: 'boolean', validators: [] };
        this.fields.set(name, field);
        return new BooleanField(field);
    }

    array(name: string, itemSchema?: FieldSchema): ArrayField {
        const field: FieldSchema = { type: 'array', validators: [], items: itemSchema };
        this.fields.set(name, field);
        return new ArrayField(field);
    }

    object(name: string, schema: Schema): ObjectField {
        const field: FieldSchema = { 
            type: 'object', 
            validators: [],
            properties: Object.fromEntries(schema.fields)
        };
        this.fields.set(name, field);
        return new ObjectField(field);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    allowUnknown(): this {
        this.strict = false;
        return this;
    }

    validate(data: Record<string, any>): ValidationResult {
        const errors: ValidationError[] = [];
        const result: Record<string, any> = {};

        // Check for unknown fields in strict mode
        if (this.strict) {
            for (const key of Object.keys(data)) {
                if (!this.fields.has(key)) {
                    errors.push({
                        path: key,
                        message: 'Unknown field',
                        code: 'UNKNOWN_FIELD'
                    });
                }
            }
        }

        // Validate each field
        for (const [name, schema] of this.fields) {
            const value = data[name];
            const fieldErrors = this.validateField(name, value, schema);
            
            if (fieldErrors.length > 0) {
                errors.push(...fieldErrors);
            } else {
                // Apply transform if present
                result[name] = schema.transform ? schema.transform(value) : value;
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            value: errors.length === 0 ? result : undefined
        };
    }

    private validateField(path: string, value: any, schema: FieldSchema): ValidationError[] {
        const errors: ValidationError[] = [];

        // Check required
        if (value === undefined || value === null) {
            if (schema.required) {
                errors.push({
                    path,
                    message: 'Field is required',
                    code: 'REQUIRED'
                });
            }
            return errors;
        }

        // Check type
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (schema.type !== 'any' && actualType !== schema.type) {
            errors.push({
                path,
                message: `Expected ${schema.type}, got ${actualType}`,
                code: 'TYPE_MISMATCH',
                expected: schema.type,
                received: actualType
            });
            return errors;
        }

        // Run validators
        for (const validator of schema.validators || []) {
            const result = validator(value);
            if (!result.valid) {
                errors.push(...result.errors.map(e => ({
                    ...e,
                    path: e.path ? `${path}.${e.path}` : path
                })));
            }
        }

        // Validate array items
        if (schema.type === 'array' && schema.items) {
            for (let i = 0; i < value.length; i++) {
                const itemErrors = this.validateField(`${path}[${i}]`, value[i], schema.items);
                errors.push(...itemErrors);
            }
        }

        // Validate object properties
        if (schema.type === 'object' && schema.properties) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                const propErrors = this.validateField(
                    `${path}.${propName}`,
                    value[propName],
                    propSchema as FieldSchema
                );
                errors.push(...propErrors);
            }
        }

        return errors;
    }

    toJSON(): Record<string, FieldSchema> {
        return Object.fromEntries(this.fields);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

class BaseField<T extends FieldSchema> {
    constructor(protected schema: T) {}

    required(): this {
        this.schema.required = true;
        return this;
    }

    optional(): this {
        this.schema.required = false;
        return this;
    }

    default(value: any): this {
        this.schema.default = value;
        return this;
    }

    custom(validator: ValidatorFn): this {
        this.schema.validators = this.schema.validators || [];
        this.schema.validators.push(validator);
        return this;
    }
}

class StringField extends BaseField<FieldSchema> {
    minLength(min: number): this {
        this.schema.validators!.push(validators.minLength(min));
        return this;
    }

    maxLength(max: number): this {
        this.schema.validators!.push(validators.maxLength(max));
        return this;
    }

    pattern(regex: RegExp, message?: string): this {
        this.schema.validators!.push(validators.pattern(regex, message));
        return this;
    }

    email(): this {
        this.schema.validators!.push(validators.email());
        return this;
    }

    url(): this {
        this.schema.validators!.push(validators.url());
        return this;
    }

    alphanumeric(): this {
        this.schema.validators!.push(validators.alphanumeric());
        return this;
    }

    noHtml(): this {
        this.schema.validators!.push(validators.noHtml());
        return this;
    }

    noSql(): this {
        this.schema.validators!.push(validators.noSql());
        return this;
    }

    trim(): this {
        this.schema.transform = sanitizers.trim;
        return this;
    }

    lowercase(): this {
        this.schema.transform = sanitizers.lowercase;
        return this;
    }

    escape(): this {
        this.schema.transform = sanitizers.escape;
        return this;
    }
}

class NumberField extends BaseField<FieldSchema> {
    min(min: number): this {
        this.schema.validators!.push(validators.min(min));
        return this;
    }

    max(max: number): this {
        this.schema.validators!.push(validators.max(max));
        return this;
    }

    integer(): this {
        this.schema.validators!.push(validators.integer());
        return this;
    }

    positive(): this {
        this.schema.validators!.push(validators.positive());
        return this;
    }
}

class BooleanField extends BaseField<FieldSchema> {}

class ArrayField extends BaseField<FieldSchema> {
    minItems(min: number): this {
        this.schema.validators!.push(validators.minItems(min));
        return this;
    }

    maxItems(max: number): this {
        this.schema.validators!.push(validators.maxItems(max));
        return this;
    }

    unique(): this {
        this.schema.validators!.push(validators.unique());
        return this;
    }
}

class ObjectField extends BaseField<FieldSchema> {}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATOR DECORATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @ValidateInput - Validate method parameters using schema
 */
export function ValidateInput(schema: Schema, argIndex: number = 0): MethodDecorator {
    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ) {
        const original = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const input = args[argIndex];
            const result = schema.validate(input);

            if (!result.valid) {
                const errorMsg = result.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                throw new Error(`Validation failed: ${errorMsg}`);
            }

            // Replace with sanitized value
            args[argIndex] = result.value;
            return original.apply(this, args);
        };

        return descriptor;
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT VALIDATOR SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

export class InputValidator {
    private schemas: Map<string, Schema> = new Map();

    register(name: string, schema: Schema): void {
        this.schemas.set(name, schema);
    }

    validate(schemaName: string, data: Record<string, any>): ValidationResult {
        const schema = this.schemas.get(schemaName);
        if (!schema) {
            return {
                valid: false,
                errors: [{
                    path: '',
                    message: `Schema '${schemaName}' not found`,
                    code: 'SCHEMA_NOT_FOUND'
                }]
            };
        }
        return schema.validate(data);
    }

    validateOrThrow(schemaName: string, data: Record<string, any>): Record<string, any> {
        const result = this.validate(schemaName, data);
        if (!result.valid) {
            const errorMsg = result.errors.map(e => `${e.path}: ${e.message}`).join(', ');
            throw new Error(`Validation failed for '${schemaName}': ${errorMsg}`);
        }
        return result.value!;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default {
    Schema,
    validators,
    sanitizers,
    InputValidator,
    ValidateInput
};
