/**
 * Behavior Analysis Module
 * @module behavior
 */

export {
  UserFlowAnalyzer,
  HeatmapGenerator,
  SessionRecorder,
  BehaviorReporter,
  createFlowAnalyzer,
  createHeatmapGenerator,
  createSessionRecorder,
  createBehaviorReporter
} from './BehaviorAnalysis';

export type {
  UserAction,
  FlowStep,
  ElementInfo,
  FlowAnalysis,
  FlowPattern,
  HeatmapData,
  AttentionZone,
  SessionRecording,
  RecordedAction
} from './BehaviorAnalysis';
