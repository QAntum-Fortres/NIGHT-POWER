/**
 * VERITAS SDK - Main Entry Point
 * @module @mistermind/veritas-sdk
 */

export { Veritas } from './Veritas';
export { 
    IVeritasSDK, 
    VeritasConfig, 
    AssimilationResult, 
    VerificationResult, 
    SymbolRegistry, 
    LicenseInfo 
} from './IVeritasSDK';
export { 
    VeritasLicenseEngine, 
    getVeritasLicenseEngine,
    VERITAS_LICENSE_TIERS,
    LicenseType,
    LicenseTier,
    GeneratedLicense,
    createStripeCheckout
} from './CommercializationEngine';
export {
    NeuralMapper,
    getNeuralMapper,
    NeuralNode,
    NeuralMap,
    HallucinationRisk
} from './NeuralMapper';

// Default export
import { Veritas } from './Veritas';
export default Veritas;
