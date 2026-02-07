
export interface UncertaintyEstimate { }
export interface UncertaintySource { }
export type UncertaintyType = 'aleatoric' | 'epistemic';
export type UncertaintyLevel = 'low' | 'medium' | 'high';
export interface Prediction { }
export interface CalibrationResult { }
export interface PredictionFactor { }

export class UncertaintyQuantifier {
    constructor() { }
}

export function createUncertaintyQuantifier() {
    return new UncertaintyQuantifier();
}
