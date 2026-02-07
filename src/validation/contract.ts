/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM CONTRACT VALIDATOR                                                   ║
 * ║   "API contract testing and validation"                                       ║
 * ║                                                                               ║
 * ║   TODO B #27 - Validation: Contract Testing                                   ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

import { SchemaValidator, SchemaDefinition } from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ContractEndpoint {
    method: string;
    path: string;
    description?: string;
    request?: {
        headers?: Record<string, SchemaDefinition | string>;
        params?: Record<string, SchemaDefinition | string>;
        query?: Record<string, SchemaDefinition | string>;
        body?: SchemaDefinition;
    };
    responses: Record<number, {
        description?: string;
        headers?: Record<string, SchemaDefinition | string>;
        body?: SchemaDefinition;
    }>;
}

export interface Contract {
    name: string;
    version: string;
    baseUrl?: string;
    description?: string;
    endpoints: ContractEndpoint[];
}

export interface ContractViolation {
    endpoint: string;
    type: 'request' | 'response';
    field: string;
    message: string;
    expected?: any;
    actual?: any;
}

export interface ContractValidationResult {
    valid: boolean;
    violations: ContractViolation[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class ContractValidator {
    private static instance: ContractValidator;
    private contracts: Map<string, Contract> = new Map();
    private schemaValidator: SchemaValidator;

    private constructor() {
        this.schemaValidator = SchemaValidator.getInstance();
    }

    static getInstance(): ContractValidator {
        if (!ContractValidator.instance) {
            ContractValidator.instance = new ContractValidator();
        }
        return ContractValidator.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTRACT MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register contract
     */
    register(contract: Contract): this {
        this.contracts.set(contract.name, contract);
        return this;
    }

    /**
     * Get contract
     */
    getContract(name: string): Contract | undefined {
        return this.contracts.get(name);
    }

    /**
     * Load contract from OpenAPI spec
     */
    loadFromOpenAPI(spec: any): Contract {
        const contract: Contract = {
            name: spec.info?.title || 'API',
            version: spec.info?.version || '1.0.0',
            description: spec.info?.description,
            baseUrl: spec.servers?.[0]?.url,
            endpoints: []
        };

        const paths = spec.paths || {};

        for (const [path, methods] of Object.entries(paths)) {
            for (const [method, details] of Object.entries(methods as any)) {
                if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
                    const endpoint: ContractEndpoint = {
                        method: method.toUpperCase(),
                        path,
                        description: (details as any).summary || (details as any).description,
                        responses: {}
                    };

                    // Parse request body
                    if ((details as any).requestBody?.content?.['application/json']?.schema) {
                        endpoint.request = {
                            body: this.convertOpenAPISchema(
                                (details as any).requestBody.content['application/json'].schema
                            )
                        };
                    }

                    // Parse parameters
                    const params = (details as any).parameters || [];
                    for (const param of params) {
                        if (!endpoint.request) endpoint.request = {};

                        const schema = this.convertOpenAPISchema(param.schema || {});
                        
                        if (param.in === 'path') {
                            if (!endpoint.request.params) endpoint.request.params = {};
                            endpoint.request.params[param.name] = schema;
                        } else if (param.in === 'query') {
                            if (!endpoint.request.query) endpoint.request.query = {};
                            endpoint.request.query[param.name] = schema;
                        } else if (param.in === 'header') {
                            if (!endpoint.request.headers) endpoint.request.headers = {};
                            endpoint.request.headers[param.name] = schema;
                        }
                    }

                    // Parse responses
                    const responses = (details as any).responses || {};
                    for (const [status, response] of Object.entries(responses)) {
                        const statusCode = parseInt(status);
                        if (!isNaN(statusCode)) {
                            endpoint.responses[statusCode] = {
                                description: (response as any).description
                            };

                            if ((response as any).content?.['application/json']?.schema) {
                                endpoint.responses[statusCode].body = this.convertOpenAPISchema(
                                    (response as any).content['application/json'].schema
                                );
                            }
                        }
                    }

                    contract.endpoints.push(endpoint);
                }
            }
        }

        this.register(contract);
        return contract;
    }

    private convertOpenAPISchema(schema: any): SchemaDefinition {
        const result: SchemaDefinition = {};

        if (schema.type === 'string') {
            result.type = 'string';
            if (schema.format === 'email') result.type = 'email';
            if (schema.format === 'uri') result.type = 'url';
            if (schema.minLength) result.minLength = schema.minLength;
            if (schema.maxLength) result.maxLength = schema.maxLength;
            if (schema.pattern) result.pattern = schema.pattern;
            if (schema.enum) result.enum = schema.enum;
        } else if (schema.type === 'number' || schema.type === 'integer') {
            result.type = 'number';
            if (schema.type === 'integer') result.integer = true;
            if (schema.minimum !== undefined) result.min = schema.minimum;
            if (schema.maximum !== undefined) result.max = schema.maximum;
        } else if (schema.type === 'boolean') {
            result.type = 'boolean';
        } else if (schema.type === 'array') {
            result.type = 'array';
            if (schema.items) result.items = this.convertOpenAPISchema(schema.items);
            if (schema.minItems) result.minItems = schema.minItems;
            if (schema.maxItems) result.maxItems = schema.maxItems;
            if (schema.uniqueItems) result.unique = schema.uniqueItems;
        } else if (schema.type === 'object' || schema.properties) {
            result.type = 'object';
            if (schema.properties) {
                result.properties = {};
                for (const [key, propSchema] of Object.entries(schema.properties)) {
                    result.properties[key] = this.convertOpenAPISchema(propSchema);
                    if (schema.required?.includes(key)) {
                        result.properties[key].required = true;
                    }
                }
            }
            if (schema.additionalProperties !== undefined) {
                result.additionalProperties = typeof schema.additionalProperties === 'object'
                    ? this.convertOpenAPISchema(schema.additionalProperties)
                    : schema.additionalProperties;
            }
        }

        if (schema.nullable) result.nullable = true;
        if (schema.default !== undefined) result.default = schema.default;

        return result;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validate request against contract
     */
    validateRequest(
        contractName: string,
        method: string,
        path: string,
        request: {
            headers?: Record<string, string>;
            params?: Record<string, string>;
            query?: Record<string, string>;
            body?: any;
        }
    ): ContractValidationResult {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            return { valid: false, violations: [{ endpoint: path, type: 'request', field: '', message: `Contract not found: ${contractName}` }] };
        }

        const endpoint = this.findEndpoint(contract, method, path);
        if (!endpoint) {
            return { valid: false, violations: [{ endpoint: path, type: 'request', field: '', message: `Endpoint not found: ${method} ${path}` }] };
        }

        const violations: ContractViolation[] = [];
        const endpointId = `${method} ${path}`;

        if (endpoint.request) {
            // Validate headers
            if (endpoint.request.headers) {
                for (const [name, schema] of Object.entries(endpoint.request.headers)) {
                    const value = request.headers?.[name.toLowerCase()] || request.headers?.[name];
                    const schemaObj = typeof schema === 'string' ? { type: 'string' as const, pattern: schema } : schema;
                    const result = this.schemaValidator.validate(value, schemaObj);
                    if (!result.valid) {
                        violations.push(...result.errors.map(e => ({
                            endpoint: endpointId,
                            type: 'request' as const,
                            field: `headers.${name}`,
                            message: e.message
                        })));
                    }
                }
            }

            // Validate query
            if (endpoint.request.query) {
                for (const [name, schema] of Object.entries(endpoint.request.query)) {
                    const value = request.query?.[name];
                    const schemaObj = typeof schema === 'string' ? { type: 'string' as const, pattern: schema } : schema;
                    const result = this.schemaValidator.validate(value, schemaObj);
                    if (!result.valid) {
                        violations.push(...result.errors.map(e => ({
                            endpoint: endpointId,
                            type: 'request' as const,
                            field: `query.${name}`,
                            message: e.message
                        })));
                    }
                }
            }

            // Validate body
            if (endpoint.request.body && request.body !== undefined) {
                const result = this.schemaValidator.validate(request.body, endpoint.request.body);
                if (!result.valid) {
                    violations.push(...result.errors.map(e => ({
                        endpoint: endpointId,
                        type: 'request' as const,
                        field: e.path ? `body.${e.path}` : 'body',
                        message: e.message
                    })));
                }
            }
        }

        return { valid: violations.length === 0, violations };
    }

    /**
     * Validate response against contract
     */
    validateResponse(
        contractName: string,
        method: string,
        path: string,
        response: {
            status: number;
            headers?: Record<string, string>;
            body?: any;
        }
    ): ContractValidationResult {
        const contract = this.contracts.get(contractName);
        if (!contract) {
            return { valid: false, violations: [{ endpoint: path, type: 'response', field: '', message: `Contract not found: ${contractName}` }] };
        }

        const endpoint = this.findEndpoint(contract, method, path);
        if (!endpoint) {
            return { valid: false, violations: [{ endpoint: path, type: 'response', field: '', message: `Endpoint not found: ${method} ${path}` }] };
        }

        const violations: ContractViolation[] = [];
        const endpointId = `${method} ${path}`;

        const expectedResponse = endpoint.responses[response.status];
        if (!expectedResponse) {
            violations.push({
                endpoint: endpointId,
                type: 'response',
                field: 'status',
                message: `Unexpected status code: ${response.status}`,
                expected: Object.keys(endpoint.responses).join(', '),
                actual: response.status
            });
            return { valid: false, violations };
        }

        // Validate response headers
        if (expectedResponse.headers) {
            for (const [name, schema] of Object.entries(expectedResponse.headers)) {
                const value = response.headers?.[name.toLowerCase()] || response.headers?.[name];
                const schemaObj = typeof schema === 'string' ? { type: 'string' as const, pattern: schema } : schema;
                const result = this.schemaValidator.validate(value, schemaObj);
                if (!result.valid) {
                    violations.push(...result.errors.map(e => ({
                        endpoint: endpointId,
                        type: 'response' as const,
                        field: `headers.${name}`,
                        message: e.message
                    })));
                }
            }
        }

        // Validate response body
        if (expectedResponse.body && response.body !== undefined) {
            const result = this.schemaValidator.validate(response.body, expectedResponse.body);
            if (!result.valid) {
                violations.push(...result.errors.map(e => ({
                    endpoint: endpointId,
                    type: 'response' as const,
                    field: e.path ? `body.${e.path}` : 'body',
                    message: e.message
                })));
            }
        }

        return { valid: violations.length === 0, violations };
    }

    private findEndpoint(contract: Contract, method: string, path: string): ContractEndpoint | undefined {
        return contract.endpoints.find(e => {
            if (e.method !== method.toUpperCase()) return false;

            // Exact match
            if (e.path === path) return true;

            // Pattern match (convert :param to regex)
            const pattern = e.path.replace(/:[\w]+/g, '[^/]+');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(path);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate contract from recorded interactions
     */
    generateContract(
        name: string,
        interactions: Array<{
            method: string;
            path: string;
            request?: any;
            response: { status: number; body?: any };
        }>
    ): Contract {
        const endpoints = new Map<string, ContractEndpoint>();

        for (const interaction of interactions) {
            const key = `${interaction.method} ${interaction.path}`;
            
            let endpoint = endpoints.get(key);
            if (!endpoint) {
                endpoint = {
                    method: interaction.method,
                    path: interaction.path,
                    responses: {}
                };
                endpoints.set(key, endpoint);
            }

            // Add response
            if (!endpoint.responses[interaction.response.status]) {
                endpoint.responses[interaction.response.status] = {};
                if (interaction.response.body) {
                    endpoint.responses[interaction.response.status].body = 
                        this.inferSchema(interaction.response.body);
                }
            }

            // Infer request body schema
            if (interaction.request && !endpoint.request?.body) {
                endpoint.request = {
                    body: this.inferSchema(interaction.request)
                };
            }
        }

        const contract: Contract = {
            name,
            version: '1.0.0',
            endpoints: Array.from(endpoints.values())
        };

        this.register(contract);
        return contract;
    }

    private inferSchema(value: any): SchemaDefinition {
        if (value === null) return { nullable: true };
        if (value === undefined) return {};

        const type = typeof value;

        if (type === 'string') {
            return { type: 'string' };
        } else if (type === 'number') {
            return { type: 'number', integer: Number.isInteger(value) };
        } else if (type === 'boolean') {
            return { type: 'boolean' };
        } else if (Array.isArray(value)) {
            return {
                type: 'array',
                items: value.length > 0 ? this.inferSchema(value[0]) : {}
            };
        } else if (type === 'object') {
            const properties: Record<string, SchemaDefinition> = {};
            for (const [key, val] of Object.entries(value)) {
                properties[key] = this.inferSchema(val);
            }
            return { type: 'object', properties };
        }

        return {};
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getContractValidator = (): ContractValidator => ContractValidator.getInstance();

export default ContractValidator;
