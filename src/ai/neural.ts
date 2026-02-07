/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM NEURAL CORE                                                          ║
 * ║   "AI-Powered Test Intelligence Engine"                                       ║
 * ║                                                                               ║
 * ║   TODO B #34 - AI: Neural Networks for Test Intelligence                      ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NeuralWeight {
    value: number;
    gradient?: number;
}

export interface NeuralLayer {
    name: string;
    neurons: number;
    activation: ActivationFunction;
    weights: NeuralWeight[][];
    biases: number[];
}

export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';

export interface TrainingConfig {
    learningRate: number;
    epochs: number;
    batchSize: number;
    validationSplit?: number;
    earlyStopPatience?: number;
    momentum?: number;
    l2Regularization?: number;
}

export interface TrainingResult {
    epochs: number;
    finalLoss: number;
    finalAccuracy: number;
    history: Array<{ epoch: number; loss: number; accuracy: number }>;
    duration: number;
}

export interface Prediction {
    class: number;
    confidence: number;
    probabilities: number[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export class Activations {
    static relu(x: number): number {
        return Math.max(0, x);
    }

    static reluDerivative(x: number): number {
        return x > 0 ? 1 : 0;
    }

    static sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-Math.min(Math.max(x, -500), 500)));
    }

    static sigmoidDerivative(x: number): number {
        const s = Activations.sigmoid(x);
        return s * (1 - s);
    }

    static tanh(x: number): number {
        return Math.tanh(x);
    }

    static tanhDerivative(x: number): number {
        const t = Math.tanh(x);
        return 1 - t * t;
    }

    static softmax(values: number[]): number[] {
        const max = Math.max(...values);
        const exp = values.map(v => Math.exp(v - max));
        const sum = exp.reduce((a, b) => a + b, 0);
        return exp.map(e => e / sum);
    }

    static apply(fn: ActivationFunction, x: number | number[]): number | number[] {
        if (Array.isArray(x)) {
            if (fn === 'softmax') return this.softmax(x);
            return x.map(v => this.apply(fn, v) as number);
        }

        switch (fn) {
            case 'relu': return this.relu(x);
            case 'sigmoid': return this.sigmoid(x);
            case 'tanh': return this.tanh(x);
            case 'linear': return x;
            default: return x;
        }
    }

    static derivative(fn: ActivationFunction, x: number): number {
        switch (fn) {
            case 'relu': return this.reluDerivative(x);
            case 'sigmoid': return this.sigmoidDerivative(x);
            case 'tanh': return this.tanhDerivative(x);
            case 'linear': return 1;
            default: return 1;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

export class NeuralNetwork {
    private layers: NeuralLayer[] = [];
    private inputSize: number;

    constructor(inputSize: number) {
        this.inputSize = inputSize;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LAYER BUILDING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Add dense layer
     */
    addDense(neurons: number, activation: ActivationFunction = 'relu'): this {
        const prevSize = this.layers.length === 0 
            ? this.inputSize 
            : this.layers[this.layers.length - 1].neurons;

        // Xavier/Glorot initialization
        const scale = Math.sqrt(2 / (prevSize + neurons));
        
        const weights: NeuralWeight[][] = [];
        for (let i = 0; i < prevSize; i++) {
            weights[i] = [];
            for (let j = 0; j < neurons; j++) {
                weights[i][j] = { value: (Math.random() * 2 - 1) * scale };
            }
        }

        const biases = new Array(neurons).fill(0);

        this.layers.push({
            name: `dense_${this.layers.length}`,
            neurons,
            activation,
            weights,
            biases
        });

        return this;
    }

    /**
     * Add output layer
     */
    addOutput(classes: number): this {
        return this.addDense(classes, 'softmax');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FORWARD PASS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Forward propagation
     */
    forward(input: number[]): number[] {
        if (input.length !== this.inputSize) {
            throw new Error(`Expected input size ${this.inputSize}, got ${input.length}`);
        }

        let current = input;

        for (const layer of this.layers) {
            const output: number[] = new Array(layer.neurons).fill(0);

            // Matrix multiplication
            for (let j = 0; j < layer.neurons; j++) {
                let sum = layer.biases[j];
                for (let i = 0; i < current.length; i++) {
                    sum += current[i] * layer.weights[i][j].value;
                }
                output[j] = sum;
            }

            // Apply activation
            current = Activations.apply(layer.activation, output) as number[];
        }

        return current;
    }

    /**
     * Predict with confidence
     */
    predict(input: number[]): Prediction {
        const probabilities = this.forward(input);
        const maxIndex = probabilities.indexOf(Math.max(...probabilities));

        return {
            class: maxIndex,
            confidence: probabilities[maxIndex],
            probabilities
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TRAINING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Train the network
     */
    async train(
        inputs: number[][],
        labels: number[],
        config: Partial<TrainingConfig> = {}
    ): Promise<TrainingResult> {
        const startTime = Date.now();
        const fullConfig: TrainingConfig = {
            learningRate: 0.01,
            epochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            earlyStopPatience: 10,
            momentum: 0.9,
            ...config
        };

        const history: Array<{ epoch: number; loss: number; accuracy: number }> = [];
        const numClasses = Math.max(...labels) + 1;

        // Split data
        const splitIndex = Math.floor(inputs.length * (1 - fullConfig.validationSplit!));
        const trainInputs = inputs.slice(0, splitIndex);
        const trainLabels = labels.slice(0, splitIndex);
        const valInputs = inputs.slice(splitIndex);
        const valLabels = labels.slice(splitIndex);

        let bestLoss = Infinity;
        let patienceCounter = 0;

        for (let epoch = 0; epoch < fullConfig.epochs; epoch++) {
            // Shuffle training data
            const indices = this.shuffle(trainInputs.length);

            // Mini-batch training
            for (let i = 0; i < trainInputs.length; i += fullConfig.batchSize) {
                const batchEnd = Math.min(i + fullConfig.batchSize, trainInputs.length);
                const batchIndices = indices.slice(i, batchEnd);

                for (const idx of batchIndices) {
                    const target = this.oneHot(trainLabels[idx], numClasses);
                    this.backpropagate(trainInputs[idx], target, fullConfig.learningRate);
                }
            }

            // Calculate metrics
            const { loss, accuracy } = this.evaluate(valInputs, valLabels);
            history.push({ epoch, loss, accuracy });

            // Early stopping
            if (loss < bestLoss) {
                bestLoss = loss;
                patienceCounter = 0;
            } else {
                patienceCounter++;
                if (patienceCounter >= fullConfig.earlyStopPatience!) {
                    console.log(`[Neural] Early stopping at epoch ${epoch}`);
                    break;
                }
            }
        }

        const finalMetrics = this.evaluate(valInputs, valLabels);

        return {
            epochs: history.length,
            finalLoss: finalMetrics.loss,
            finalAccuracy: finalMetrics.accuracy,
            history,
            duration: Date.now() - startTime
        };
    }

    /**
     * Evaluate the network
     */
    evaluate(inputs: number[][], labels: number[]): { loss: number; accuracy: number } {
        let totalLoss = 0;
        let correct = 0;

        for (let i = 0; i < inputs.length; i++) {
            const prediction = this.predict(inputs[i]);
            
            // Cross-entropy loss
            const numClasses = Math.max(...labels) + 1;
            const target = this.oneHot(labels[i], numClasses);
            for (let j = 0; j < target.length; j++) {
                if (target[j] === 1) {
                    totalLoss -= Math.log(Math.max(prediction.probabilities[j], 1e-15));
                }
            }

            if (prediction.class === labels[i]) {
                correct++;
            }
        }

        return {
            loss: totalLoss / inputs.length,
            accuracy: correct / inputs.length
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BACKPROPAGATION
    // ─────────────────────────────────────────────────────────────────────────

    private backpropagate(input: number[], target: number[], learningRate: number): void {
        // Store activations for each layer
        const activations: number[][] = [input];
        const preActivations: number[][] = [];

        // Forward pass (store intermediate values)
        let current = input;
        for (const layer of this.layers) {
            const preAct: number[] = new Array(layer.neurons).fill(0);
            
            for (let j = 0; j < layer.neurons; j++) {
                let sum = layer.biases[j];
                for (let i = 0; i < current.length; i++) {
                    sum += current[i] * layer.weights[i][j].value;
                }
                preAct[j] = sum;
            }

            preActivations.push(preAct);
            current = Activations.apply(layer.activation, preAct) as number[];
            activations.push(current);
        }

        // Backward pass
        let delta: number[] = [];
        
        for (let l = this.layers.length - 1; l >= 0; l--) {
            const layer = this.layers[l];
            const prevActivation = activations[l];

            if (l === this.layers.length - 1) {
                // Output layer (softmax + cross-entropy)
                delta = activations[l + 1].map((a, i) => a - target[i]);
            } else {
                // Hidden layer
                const nextLayer = this.layers[l + 1];
                const newDelta: number[] = new Array(layer.neurons).fill(0);

                for (let j = 0; j < layer.neurons; j++) {
                    let error = 0;
                    for (let k = 0; k < nextLayer.neurons; k++) {
                        error += delta[k] * nextLayer.weights[j][k].value;
                    }
                    newDelta[j] = error * Activations.derivative(layer.activation, preActivations[l][j]);
                }
                delta = newDelta;
            }

            // Update weights and biases
            for (let i = 0; i < prevActivation.length; i++) {
                for (let j = 0; j < layer.neurons; j++) {
                    layer.weights[i][j].value -= learningRate * delta[j] * prevActivation[i];
                }
            }

            for (let j = 0; j < layer.neurons; j++) {
                layer.biases[j] -= learningRate * delta[j];
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private oneHot(label: number, numClasses: number): number[] {
        const result = new Array(numClasses).fill(0);
        result[label] = 1;
        return result;
    }

    private shuffle(length: number): number[] {
        const indices = Array.from({ length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return indices;
    }

    /**
     * Export model
     */
    export(): object {
        return {
            inputSize: this.inputSize,
            layers: this.layers.map(l => ({
                name: l.name,
                neurons: l.neurons,
                activation: l.activation,
                weights: l.weights.map(row => row.map(w => w.value)),
                biases: l.biases
            }))
        };
    }

    /**
     * Import model
     */
    static import(data: any): NeuralNetwork {
        const network = new NeuralNetwork(data.inputSize);
        
        for (const layerData of data.layers) {
            network.layers.push({
                name: layerData.name,
                neurons: layerData.neurons,
                activation: layerData.activation,
                weights: layerData.weights.map((row: number[]) => 
                    row.map((v: number) => ({ value: v }))
                ),
                biases: layerData.biases
            });
        }

        return network;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════

export class TestIntelligence {
    private static instance: TestIntelligence;

    private failurePredictor?: NeuralNetwork;
    private prioritizer?: NeuralNetwork;
    private flakinessDetector?: NeuralNetwork;

    static getInstance(): TestIntelligence {
        if (!TestIntelligence.instance) {
            TestIntelligence.instance = new TestIntelligence();
        }
        return TestIntelligence.instance;
    }

    /**
     * Predict test failure probability
     */
    async predictFailure(features: number[]): Promise<{ willFail: boolean; confidence: number }> {
        if (!this.failurePredictor) {
            // Create default predictor
            this.failurePredictor = new NeuralNetwork(features.length)
                .addDense(16, 'relu')
                .addDense(8, 'relu')
                .addOutput(2);
        }

        const prediction = this.failurePredictor.predict(features);
        return {
            willFail: prediction.class === 1,
            confidence: prediction.confidence
        };
    }

    /**
     * Calculate test priority
     */
    async calculatePriority(features: number[]): Promise<{ priority: number; reason: string }> {
        if (!this.prioritizer) {
            this.prioritizer = new NeuralNetwork(features.length)
                .addDense(12, 'relu')
                .addDense(6, 'relu')
                .addOutput(5); // 5 priority levels
        }

        const prediction = this.prioritizer.predict(features);
        const reasons = ['Low impact', 'Medium impact', 'High impact', 'Critical path', 'Regression risk'];

        return {
            priority: prediction.class + 1,
            reason: reasons[prediction.class]
        };
    }

    /**
     * Detect flaky test
     */
    async detectFlakiness(features: number[]): Promise<{ isFlaky: boolean; score: number }> {
        if (!this.flakinessDetector) {
            this.flakinessDetector = new NeuralNetwork(features.length)
                .addDense(8, 'relu')
                .addOutput(2);
        }

        const prediction = this.flakinessDetector.predict(features);
        return {
            isFlaky: prediction.class === 1,
            score: prediction.probabilities[1]
        };
    }

    /**
     * Train from historical data
     */
    async trainFromHistory(
        data: Array<{ features: number[]; outcome: 'pass' | 'fail' | 'flaky' }>
    ): Promise<void> {
        const inputs = data.map(d => d.features);
        const labels = data.map(d => {
            switch (d.outcome) {
                case 'pass': return 0;
                case 'fail': return 1;
                case 'flaky': return 1;
            }
        });

        this.failurePredictor = new NeuralNetwork(inputs[0].length)
            .addDense(16, 'relu')
            .addDense(8, 'relu')
            .addOutput(2);

        await this.failurePredictor.train(inputs, labels, {
            epochs: 50,
            learningRate: 0.01
        });

        console.log('[TestIntelligence] Training complete');
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getTestIntelligence = (): TestIntelligence => TestIntelligence.getInstance();

export default NeuralNetwork;
