/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * IDE MODULE INDEX
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * "The Sovereign Sidebar - Централизиран експорт на всички IDE компоненти."
 * 
 * 🔐 PROTECTED: All modules are hardware-locked via SovereignLock
 * 
 * @author Димитър Продромов / Mister Mind
 * @copyright 2026 QAntum Empire. ЛИЧЕН. НЕ ЗА РАЗПРОСТРАНЕНИЕ.
 * @version 30.5.0 - THE SOVEREIGN PLUG-IN
 */

// VS Code Extension
export { activate, deactivate } from './extension';

// Webview Provider
export { OmegaViewProvider } from './OmegaViewProvider';

// Backend Server
export { OmegaServer, omegaServer } from './OmegaServer';

// Sovereign Lock (Hardware Protection)
export { SovereignLock, sovereignLock, requireCreator } from './SovereignLock';

// Types
export type {
  ServerConfig,
  ApiRequest,
  ApiResponse,
  SystemStatus,
} from './OmegaServer';
