/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM VALIDATION MODULE                                                    ║
 * ║   "Comprehensive validation for data, responses, and contracts"               ║
 * ║                                                                               ║
 * ║   TODO B #25-27 - Validation: Schema, Response, Contract                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export * from './schema.js';
export * from './response.js';
export * from './contract.js';

import { SchemaValidator, SchemaDefinition, Schema, ValidationResult, schema as schemaBuilders } from './schema.js';
import { ResponseAsserter, Response, AssertionResult, assertResponse } from './response.js';
import { ContractValidator, Contract, ContractEndpoint, ContractValidationResult } from './contract.js';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED VALIDATION FACADE
// ═══════════════════════════════════════════════════════════════════════════════

export class QAntumValidation {
    private static instance: QAntumValidation;

    private schemaValidator: SchemaValidator;
    private contractValidator: ContractValidator;

    private constructor() {
        this.schemaValidator = SchemaValidator.getInstance();
        this.contractValidator = ContractValidator.getInstance();
    }

    static getInstance(): QAntumValidation {
        if (!QAntumValidation.instance) {
            QAntumValidation.instance = new QAntumValidation();
        }
        return QAntumValidation.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SCHEMA VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validate data against schema
     */
    validate(value: any, schema: SchemaDefinition | string): ValidationResult {
        return this.schemaValidator.validate(value, schema);
    }

    /**
     * Assert validation
     */
    assert(value: any, schema: SchemaDefinition | string, message?: string): void {
        this.schemaValidator.assert(value, schema, message);
    }

    /**
     * Register schema
     */
    registerSchema(name: string, schema: SchemaDefinition): this {
        this.schemaValidator.register(name, schema);
        return this;
    }

    /**
     * Create schema builder
     */
    schema(): Schema {
        return Schema.create();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESPONSE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Create response asserter
     */
    assertResponse(response: Response): ResponseAsserter {
        return assertResponse(response);
    }

    /**
     * Quick response validation
     */
    validateResponse(response: Response, expectations: {
        status?: number;
        contentType?: string;
        hasProperties?: string[];
        matchesSchema?: SchemaDefinition | string;
    }): AssertionResult {
        const asserter = this.assertResponse(response);

        if (expectations.status !== undefined) {
            asserter.status(expectations.status);
        }

        if (expectations.contentType) {
            asserter.contentType(expectations.contentType);
        }

        if (expectations.hasProperties) {
            for (const prop of expectations.hasProperties) {
                asserter.hasProperty(prop);
            }
        }

        if (expectations.matchesSchema) {
            asserter.matchesSchema(expectations.matchesSchema);
        }

        return asserter.result();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONTRACT VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register contract
     */
    registerContract(contract: Contract): this {
        this.contractValidator.register(contract);
        return this;
    }

    /**
     * Load OpenAPI spec as contract
     */
    loadOpenAPI(spec: any): Contract {
        return this.contractValidator.loadFromOpenAPI(spec);
    }

    /**
     * Validate request against contract
     */
    validateRequest(
        contractName: string,
        method: string,
        path: string,
        request: { headers?: Record<string, string>; params?: Record<string, string>; query?: Record<string, string>; body?: any }
    ): ContractValidationResult {
        return this.contractValidator.validateRequest(contractName, method, path, request);
    }

    /**
     * Validate response against contract
     */
    validateContractResponse(
        contractName: string,
        method: string,
        path: string,
        response: { status: number; headers?: Record<string, string>; body?: any }
    ): ContractValidationResult {
        return this.contractValidator.validateResponse(contractName, method, path, response);
    }

    /**
     * Generate contract from interactions
     */
    generateContract(
        name: string,
        interactions: Array<{ method: string; path: string; request?: any; response: { status: number; body?: any } }>
    ): Contract {
        return this.contractValidator.generateContract(name, interactions);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getValidation = (): QAntumValidation => QAntumValidation.getInstance();

// Quick validation helpers
export const validate = {
    // Schema validation
    data: (value: any, schema: SchemaDefinition | string) => 
        QAntumValidation.getInstance().validate(value, schema),
    
    assert: (value: any, schema: SchemaDefinition | string, msg?: string) => 
        QAntumValidation.getInstance().assert(value, schema, msg),

    // Response validation
    response: (response: Response) => 
        QAntumValidation.getInstance().assertResponse(response),

    // Contract validation
    request: (contract: string, method: string, path: string, req: any) =>
        QAntumValidation.getInstance().validateRequest(contract, method, path, req),

    contractResponse: (contract: string, method: string, path: string, res: any) =>
        QAntumValidation.getInstance().validateContractResponse(contract, method, path, res)
};

// Re-export schema builders
export { schemaBuilders as schema };

export default QAntumValidation;
