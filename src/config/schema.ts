/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CONFIGURATION SCHEMA VALIDATOR                                       ║
 * ║   "Type-safe configuration validation"                                        ║
 * ║                                                                               ║
 * ║   TODO B #43 - Configuration Management                                       ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SchemaType = 
    | 'string' 
    | 'number' 
    | 'boolean' 
    | 'object' 
    | 'array' 
    | 'any'
    | 'null'
    | 'undefined';

export interface SchemaRule {
    type: SchemaType | SchemaType[];
    required?: boolean;
    default?: any;
    description?: string;
    deprecated?: boolean | string;

    // String rules
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp | string;
    enum?: any[];
    format?: 'email' | 'url' | 'uuid' | 'date' | 'datetime' | 'path';

    // Number rules
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
    negative?: boolean;

    // Array rules
    items?: SchemaRule;
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;

    // Object rules
    properties?: { [key: string]: SchemaRule };
    additionalProperties?: boolean | SchemaRule;

    // Custom validation
    validate?: (value: any, key: string, config: any) => boolean | string;
    transform?: (value: any) => any;

    // Environment variable mapping
    env?: string;
    envTransform?: (value: string) => any;
}

export interface Schema {
    [key: string]: SchemaRule;
}

export interface ValidationError {
    key: string;
    message: string;
    value?: any;
    rule?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    config: any;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATS
// ═══════════════════════════════════════════════════════════════════════════════

const FORMATS: { [key: string]: RegExp } = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/[^\s]+$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    date: /^\d{4}-\d{2}-\d{2}$/,
    datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    path: /^[\/\\]?[\w\-\.\s\/\\]+$/
};

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Configuration Schema Validator
 */
export class SchemaValidator {
    private schema: Schema;

    constructor(schema: Schema) {
        this.schema = schema;
    }

    /**
     * Validate configuration against schema
     */
    validate(config: any): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];
        const validatedConfig = { ...config };

        // Check each schema rule
        for (const [key, rule] of Object.entries(this.schema)) {
            const value = this.getValue(config, key);

            // Handle environment variable override
            if (rule.env && process.env[rule.env]) {
                const envValue = process.env[rule.env];
                validatedConfig[key] = rule.envTransform 
                    ? rule.envTransform(envValue)
                    : this.autoTransform(envValue, rule.type);
            }

            // Check deprecated
            if (rule.deprecated && value !== undefined) {
                const msg = typeof rule.deprecated === 'string' 
                    ? rule.deprecated 
                    : `${key} is deprecated`;
                warnings.push({ key, message: msg, value });
            }

            // Check required
            if (rule.required && value === undefined && !rule.default) {
                errors.push({
                    key,
                    message: `Required field '${key}' is missing`,
                    rule: 'required'
                });
                continue;
            }

            // Apply default
            if (value === undefined && rule.default !== undefined) {
                this.setValue(validatedConfig, key, rule.default);
                continue;
            }

            if (value === undefined) continue;

            // Validate type
            const typeError = this.validateType(value, rule, key);
            if (typeError) {
                errors.push(typeError);
                continue;
            }

            // Validate rules based on type
            const ruleErrors = this.validateRules(value, rule, key);
            errors.push(...ruleErrors);

            // Apply transform
            if (rule.transform) {
                this.setValue(validatedConfig, key, rule.transform(value));
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            config: validatedConfig
        };
    }

    /**
     * Validate and throw on error
     */
    validateOrThrow(config: any): any {
        const result = this.validate(config);
        
        if (!result.valid) {
            const message = result.errors
                .map(e => `  - ${e.key}: ${e.message}`)
                .join('\n');
            throw new Error(`Configuration validation failed:\n${message}`);
        }

        return result.config;
    }

    /**
     * Get nested value
     */
    private getValue(config: any, key: string): any {
        const parts = key.split('.');
        let current = config;

        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }

        return current;
    }

    /**
     * Set nested value
     */
    private setValue(config: any, key: string, value: any): void {
        const parts = key.split('.');
        let current = config;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            current[part] = current[part] || {};
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
    }

    /**
     * Validate type
     */
    private validateType(value: any, rule: SchemaRule, key: string): ValidationError | null {
        const types = Array.isArray(rule.type) ? rule.type : [rule.type];
        const actualType = this.getType(value);

        if (!types.includes(actualType) && !types.includes('any')) {
            return {
                key,
                message: `Expected ${types.join(' | ')}, got ${actualType}`,
                value,
                rule: 'type'
            };
        }

        return null;
    }

    /**
     * Get value type
     */
    private getType(value: any): SchemaType {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (Array.isArray(value)) return 'array';
        return typeof value as SchemaType;
    }

    /**
     * Validate specific rules
     */
    private validateRules(value: any, rule: SchemaRule, key: string): ValidationError[] {
        const errors: ValidationError[] = [];
        const type = this.getType(value);

        // String rules
        if (type === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                errors.push({
                    key,
                    message: `String must be at least ${rule.minLength} characters`,
                    value,
                    rule: 'minLength'
                });
            }

            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                errors.push({
                    key,
                    message: `String must be at most ${rule.maxLength} characters`,
                    value,
                    rule: 'maxLength'
                });
            }

            if (rule.pattern) {
                const regex = rule.pattern instanceof RegExp 
                    ? rule.pattern 
                    : new RegExp(rule.pattern);
                if (!regex.test(value)) {
                    errors.push({
                        key,
                        message: `String does not match pattern ${rule.pattern}`,
                        value,
                        rule: 'pattern'
                    });
                }
            }

            if (rule.format && FORMATS[rule.format] && !FORMATS[rule.format].test(value)) {
                errors.push({
                    key,
                    message: `String does not match format '${rule.format}'`,
                    value,
                    rule: 'format'
                });
            }
        }

        // Number rules
        if (type === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                errors.push({
                    key,
                    message: `Number must be at least ${rule.min}`,
                    value,
                    rule: 'min'
                });
            }

            if (rule.max !== undefined && value > rule.max) {
                errors.push({
                    key,
                    message: `Number must be at most ${rule.max}`,
                    value,
                    rule: 'max'
                });
            }

            if (rule.integer && !Number.isInteger(value)) {
                errors.push({
                    key,
                    message: 'Number must be an integer',
                    value,
                    rule: 'integer'
                });
            }

            if (rule.positive && value <= 0) {
                errors.push({
                    key,
                    message: 'Number must be positive',
                    value,
                    rule: 'positive'
                });
            }

            if (rule.negative && value >= 0) {
                errors.push({
                    key,
                    message: 'Number must be negative',
                    value,
                    rule: 'negative'
                });
            }
        }

        // Array rules
        if (type === 'array') {
            if (rule.minItems !== undefined && value.length < rule.minItems) {
                errors.push({
                    key,
                    message: `Array must have at least ${rule.minItems} items`,
                    value: value.length,
                    rule: 'minItems'
                });
            }

            if (rule.maxItems !== undefined && value.length > rule.maxItems) {
                errors.push({
                    key,
                    message: `Array must have at most ${rule.maxItems} items`,
                    value: value.length,
                    rule: 'maxItems'
                });
            }

            if (rule.uniqueItems) {
                const unique = new Set(value.map((v: any) => JSON.stringify(v)));
                if (unique.size !== value.length) {
                    errors.push({
                        key,
                        message: 'Array items must be unique',
                        value,
                        rule: 'uniqueItems'
                    });
                }
            }

            // Validate items
            if (rule.items) {
                for (let i = 0; i < value.length; i++) {
                    const itemErrors = this.validateRules(value[i], rule.items, `${key}[${i}]`);
                    errors.push(...itemErrors);
                }
            }
        }

        // Object rules
        if (type === 'object' && rule.properties) {
            for (const [propKey, propRule] of Object.entries(rule.properties)) {
                const propValue = value[propKey];
                
                if (propRule.required && propValue === undefined) {
                    errors.push({
                        key: `${key}.${propKey}`,
                        message: `Required property '${propKey}' is missing`,
                        rule: 'required'
                    });
                    continue;
                }

                if (propValue !== undefined) {
                    const propErrors = this.validateRules(propValue, propRule, `${key}.${propKey}`);
                    errors.push(...propErrors);
                }
            }
        }

        // Enum validation
        if (rule.enum && !rule.enum.includes(value)) {
            errors.push({
                key,
                message: `Value must be one of: ${rule.enum.join(', ')}`,
                value,
                rule: 'enum'
            });
        }

        // Custom validation
        if (rule.validate) {
            const result = rule.validate(value, key, {});
            if (result !== true) {
                errors.push({
                    key,
                    message: typeof result === 'string' ? result : `Custom validation failed`,
                    value,
                    rule: 'custom'
                });
            }
        }

        return errors;
    }

    /**
     * Auto-transform string from env
     */
    private autoTransform(value: string, type: SchemaType | SchemaType[]): any {
        const primaryType = Array.isArray(type) ? type[0] : type;

        switch (primaryType) {
            case 'number':
                return parseFloat(value);
            case 'boolean':
                return value.toLowerCase() === 'true' || value === '1';
            case 'array':
                return value.split(',').map(v => v.trim());
            case 'object':
                try { return JSON.parse(value); } catch { return value; }
            default:
                return value;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fluent schema builder
 */
export class SchemaBuilder {
    private rule: SchemaRule = { type: 'any' };

    static string(): SchemaBuilder {
        const builder = new SchemaBuilder();
        builder.rule.type = 'string';
        return builder;
    }

    static number(): SchemaBuilder {
        const builder = new SchemaBuilder();
        builder.rule.type = 'number';
        return builder;
    }

    static boolean(): SchemaBuilder {
        const builder = new SchemaBuilder();
        builder.rule.type = 'boolean';
        return builder;
    }

    static object(properties?: { [key: string]: SchemaRule }): SchemaBuilder {
        const builder = new SchemaBuilder();
        builder.rule.type = 'object';
        if (properties) builder.rule.properties = properties;
        return builder;
    }

    static array(items?: SchemaRule): SchemaBuilder {
        const builder = new SchemaBuilder();
        builder.rule.type = 'array';
        if (items) builder.rule.items = items;
        return builder;
    }

    static any(): SchemaBuilder {
        return new SchemaBuilder();
    }

    required(): this {
        this.rule.required = true;
        return this;
    }

    default(value: any): this {
        this.rule.default = value;
        return this;
    }

    description(desc: string): this {
        this.rule.description = desc;
        return this;
    }

    deprecated(message?: string): this {
        this.rule.deprecated = message || true;
        return this;
    }

    min(value: number): this {
        this.rule.min = value;
        this.rule.minLength = value;
        this.rule.minItems = value;
        return this;
    }

    max(value: number): this {
        this.rule.max = value;
        this.rule.maxLength = value;
        this.rule.maxItems = value;
        return this;
    }

    pattern(regex: RegExp | string): this {
        this.rule.pattern = regex;
        return this;
    }

    format(fmt: 'email' | 'url' | 'uuid' | 'date' | 'datetime' | 'path'): this {
        this.rule.format = fmt;
        return this;
    }

    enum(...values: any[]): this {
        this.rule.enum = values;
        return this;
    }

    integer(): this {
        this.rule.integer = true;
        return this;
    }

    positive(): this {
        this.rule.positive = true;
        return this;
    }

    negative(): this {
        this.rule.negative = true;
        return this;
    }

    unique(): this {
        this.rule.uniqueItems = true;
        return this;
    }

    env(name: string, transform?: (value: string) => any): this {
        this.rule.env = name;
        if (transform) this.rule.envTransform = transform;
        return this;
    }

    validate(fn: (value: any, key: string, config: any) => boolean | string): this {
        this.rule.validate = fn;
        return this;
    }

    transform(fn: (value: any) => any): this {
        this.rule.transform = fn;
        return this;
    }

    build(): SchemaRule {
        return { ...this.rule };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const s = SchemaBuilder;
