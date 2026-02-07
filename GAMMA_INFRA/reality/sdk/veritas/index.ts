/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 🔐 VERITAS MODULE - Truth Verification & Encryption Export
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * 
 * @author Dimitar Prodromov
 * @version 17.0.0
 */

export { Veritas } from './Veritas';
export { NeuralVault, ParanoidObfuscation } from './ParanoidObfuscation';

// Re-export types
export type {
  Identity,
  Action,
  VerificationRequest,
  VerificationResult,
  VaultConfig,
  EncryptedPayload,
  AutoRotationConfig,
} from '../../../../types/security.types';
