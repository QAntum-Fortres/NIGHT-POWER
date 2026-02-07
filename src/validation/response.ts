/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM RESPONSE ASSERTER                                                    ║
 * ║   "Fluent assertions for API responses"                                       ║
 * ║                                                                               ║
 * ║   TODO B #26 - Validation: Response Assertions                                ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { SchemaValidator, SchemaDefinition } from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Response {
    status: number;
    statusText?: string;
    headers: Record<string, string> | Headers | Map<string, string>;
    body?: any;
    data?: any;
    json?: () => Promise<any>;
    text?: () => Promise<string>;
    ok?: boolean;
    url?: string;
}

export interface AssertionError {
    message: string;
    expected?: any;
    actual?: any;
}

export interface AssertionResult {
    passed: boolean;
    errors: AssertionError[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESPONSE ASSERTER
// ═══════════════════════════════════════════════════════════════════════════════

export class ResponseAsserter {
    private response: Response;
    private errors: AssertionError[] = [];
    private _body: any;
    private _text: string = '';

    constructor(response: Response) {
        this.response = response;
        this._body = response.body ?? response.data;
    }

    /**
     * Create asserter from response
     */
    static from(response: Response): ResponseAsserter {
        return new ResponseAsserter(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATUS ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assert status code
     */
    status(expected: number): this {
        if (this.response.status !== expected) {
            this.addError(`Expected status ${expected}, got ${this.response.status}`, expected, this.response.status);
        }
        return this;
    }

    /**
     * Assert status in range
     */
    statusBetween(min: number, max: number): this {
        if (this.response.status < min || this.response.status > max) {
            this.addError(`Expected status between ${min}-${max}, got ${this.response.status}`);
        }
        return this;
    }

    /**
     * Assert success status (2xx)
     */
    ok(): this {
        return this.statusBetween(200, 299);
    }

    /**
     * Assert created (201)
     */
    created(): this {
        return this.status(201);
    }

    /**
     * Assert no content (204)
     */
    noContent(): this {
        return this.status(204);
    }

    /**
     * Assert bad request (400)
     */
    badRequest(): this {
        return this.status(400);
    }

    /**
     * Assert unauthorized (401)
     */
    unauthorized(): this {
        return this.status(401);
    }

    /**
     * Assert forbidden (403)
     */
    forbidden(): this {
        return this.status(403);
    }

    /**
     * Assert not found (404)
     */
    notFound(): this {
        return this.status(404);
    }

    /**
     * Assert server error (5xx)
     */
    serverError(): this {
        return this.statusBetween(500, 599);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HEADER ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assert header exists
     */
    hasHeader(name: string): this {
        const value = this.getHeader(name);
        if (value === undefined || value === null) {
            this.addError(`Expected header '${name}' to exist`);
        }
        return this;
    }

    /**
     * Assert header value
     */
    header(name: string, expected: string | RegExp): this {
        const value = this.getHeader(name);
        
        if (value === undefined || value === null) {
            this.addError(`Expected header '${name}' to exist`);
        } else if (expected instanceof RegExp) {
            if (!expected.test(value)) {
                this.addError(`Expected header '${name}' to match ${expected}`, expected.source, value);
            }
        } else if (value !== expected) {
            this.addError(`Expected header '${name}' to be '${expected}'`, expected, value);
        }

        return this;
    }

    /**
     * Assert content type
     */
    contentType(expected: string): this {
        return this.header('content-type', new RegExp(expected, 'i'));
    }

    /**
     * Assert JSON content type
     */
    isJson(): this {
        return this.contentType('application/json');
    }

    /**
     * Assert HTML content type
     */
    isHtml(): this {
        return this.contentType('text/html');
    }

    private getHeader(name: string): string | undefined {
        const headers = this.response.headers;
        const lowerName = name.toLowerCase();

        if (headers instanceof Map) {
            return headers.get(lowerName) || headers.get(name);
        }
        
        if (typeof headers.get === 'function') {
            return (headers as Headers).get(lowerName) || undefined;
        }

        const obj = headers as Record<string, string>;
        return obj[lowerName] || obj[name];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BODY ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Assert body equals
     */
    bodyEquals(expected: any): this {
        if (JSON.stringify(this._body) !== JSON.stringify(expected)) {
            this.addError('Body does not match expected', expected, this._body);
        }
        return this;
    }

    /**
     * Assert body contains
     */
    bodyContains(expected: any): this {
        const bodyStr = typeof this._body === 'string' 
            ? this._body 
            : JSON.stringify(this._body);
        const expectedStr = typeof expected === 'string'
            ? expected
            : JSON.stringify(expected);

        if (!bodyStr.includes(expectedStr)) {
            this.addError(`Body does not contain '${expectedStr}'`);
        }
        return this;
    }

    /**
     * Assert body has property
     */
    hasProperty(path: string): this {
        const value = this.getProperty(path);
        if (value === undefined) {
            this.addError(`Expected property '${path}' to exist`);
        }
        return this;
    }

    /**
     * Assert property value
     */
    property(path: string, expected: any): this {
        const value = this.getProperty(path);
        
        if (value === undefined) {
            this.addError(`Expected property '${path}' to exist`);
        } else if (JSON.stringify(value) !== JSON.stringify(expected)) {
            this.addError(`Expected property '${path}' to be '${expected}'`, expected, value);
        }

        return this;
    }

    /**
     * Assert property matches
     */
    propertyMatches(path: string, pattern: RegExp): this {
        const value = this.getProperty(path);
        
        if (value === undefined) {
            this.addError(`Expected property '${path}' to exist`);
        } else if (!pattern.test(String(value))) {
            this.addError(`Expected property '${path}' to match ${pattern}`);
        }

        return this;
    }

    /**
     * Assert array length
     */
    arrayLength(path: string, expected: number): this {
        const value = this.getProperty(path);
        
        if (!Array.isArray(value)) {
            this.addError(`Expected property '${path}' to be an array`);
        } else if (value.length !== expected) {
            this.addError(`Expected array at '${path}' to have length ${expected}`, expected, value.length);
        }

        return this;
    }

    /**
     * Assert array min length
     */
    arrayMinLength(path: string, min: number): this {
        const value = this.getProperty(path);
        
        if (!Array.isArray(value)) {
            this.addError(`Expected property '${path}' to be an array`);
        } else if (value.length < min) {
            this.addError(`Expected array at '${path}' to have at least ${min} items`);
        }

        return this;
    }

    private getProperty(path: string): any {
        const parts = path.split('.');
        let value = this._body;

        for (const part of parts) {
            if (value === undefined || value === null) return undefined;
            
            // Handle array indices
            const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
            if (arrayMatch) {
                value = value[arrayMatch[1]];
                if (Array.isArray(value)) {
                    value = value[parseInt(arrayMatch[2])];
                } else {
                    return undefined;
                }
            } else {
                value = value[part];
            }
        }

        return value;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEMA VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validate body against schema
     */
    matchesSchema(schema: SchemaDefinition | string): this {
        const validator = SchemaValidator.getInstance();
        const result = validator.validate(this._body, schema);

        if (!result.valid) {
            for (const error of result.errors) {
                this.addError(`Schema validation: ${error.path || 'root'}: ${error.message}`);
            }
        }

        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CUSTOM ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Custom assertion
     */
    satisfies(predicate: (response: Response, body: any) => boolean, message: string): this {
        if (!predicate(this.response, this._body)) {
            this.addError(message);
        }
        return this;
    }

    /**
     * Assert on body with callback
     */
    assertBody(assertion: (body: any) => void): this {
        try {
            assertion(this._body);
        } catch (error) {
            this.addError(error instanceof Error ? error.message : String(error));
        }
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get assertion result
     */
    result(): AssertionResult {
        return {
            passed: this.errors.length === 0,
            errors: [...this.errors]
        };
    }

    /**
     * Assert all passed
     */
    assert(): void {
        if (this.errors.length > 0) {
            const messages = this.errors.map(e => e.message).join('\n');
            throw new Error(`Response assertion failed:\n${messages}`);
        }
    }

    /**
     * Get body
     */
    getBody(): any {
        return this._body;
    }

    private addError(message: string, expected?: any, actual?: any): void {
        this.errors.push({ message, expected, actual });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const assertResponse = (response: Response): ResponseAsserter => 
    ResponseAsserter.from(response);

export default ResponseAsserter;
