// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  QANTUM v23.3.0 - Type Definitions Index                                 ║
// ║  "Type-Safe Sovereign" - TypeScript Migration                                 ║
// ║  Re-export all types from a single entry point                                ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

// Re-export core types (excluding duplicates that exist in websocket-protocol)
export * from './core.types.js';

// Re-export websocket-protocol types with proper names
export {
  // Brain activity types
  type BrainActivityType,
  type CognitiveLoadLevel,
  type IBrainWave,
  type INeuralPathway,
  type IBrainWavesBatch,
  type IBrainWavesAggregated,
  
  // Hardware telemetry
  type ThermalState,
  type GPUVendor,
  type ICPUTelemetry,
  type IGPUTelemetry,
  type IMemoryTelemetry,
  type IDiskTelemetry,
  type INetworkTelemetry,
  type IHardwareTelemetry,
  type IProcessTelemetry,
  
  // WebSocket types
  type WSMessageType,
  type WSChannel,
  type IWSMessage,
  type IWSSubscribePayload,
  type IWSUnsubscribePayload,
  type IWSExecuteCommandPayload,
  type IWSCommandResultPayload,
  type IWSAlertPayload,
  type IWSLogPayload,
  type IWSTestUpdatePayload,
  type IWSErrorPayload,
  type WSMessagePayloadMap,
  type TypedWSMessage,
  type WSConnectionState,
  type IWSClientConfig,
  type IWSServerConfig,
  
  // Dashboard types
  type DashboardView,
  type DashboardTheme,
  type IDashboardState,
  
  // Utility types
  type DeepReadonly,
  type MessageIdGenerator,
  type TimestampGenerator,
} from './websocket-protocol.types.js';
