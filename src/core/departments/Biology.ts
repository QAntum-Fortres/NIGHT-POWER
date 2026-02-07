/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   BIOLOGY DEPARTMENT - VSH & AMNIOTIC ENGINE                                  ║
 * ║   "Genetic Strategy Synthesis & Swarm Intelligence"                           ║
 * ║                                                                               ║
 * ║   Implements:                                                                 ║
 * ║   - Genetic Algorithm for strategy evolution                                  ║
 * ║   - Swarm Intelligence (1000 micro-agents)                                    ║
 * ║   - Fitness-based natural selection                                           ║
 * ║                                                                               ║
 * ║   © 2026 QAntum Empire | VortexAI Architecture                                ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TradingStrategy {
    id: string;
    genome: number[]; // Strategy parameters (entry threshold, exit threshold, risk %, etc.)
    fitness: number;
    generation: number;
    wins: number;
    losses: number;
    totalProfit: number;
}

export interface SwarmConfig {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    eliteCount: number;
    maxGenerations: number;
}

export interface MicroAgent {
    id: string;
    strategy: TradingStrategy;
    active: boolean;
    lastAction: string;
    performance: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENETIC SWARM
// ═══════════════════════════════════════════════════════════════════════════════

export class GeneticSwarm {
    private config: SwarmConfig;
    private population: TradingStrategy[] = [];
    private agents: MicroAgent[] = [];
    private generation = 0;
    private bestStrategy: TradingStrategy | null = null;

    constructor(config: Partial<SwarmConfig> = {}) {
        this.config = {
            populationSize: 1000,
            mutationRate: 0.1,
            crossoverRate: 0.7,
            eliteCount: 50,
            maxGenerations: 100,
            ...config,
        };

        this.initializePopulation();
    }

    /**
     * Initialize random population
     */
    private initializePopulation(): void {
        console.log(`[Biology] 🧬 Initializing population of ${this.config.populationSize} strategies...`);

        for (let i = 0; i < this.config.populationSize; i++) {
            const strategy: TradingStrategy = {
                id: `strategy_${i}`,
                genome: this.randomGenome(),
                fitness: 0,
                generation: 0,
                wins: 0,
                losses: 0,
                totalProfit: 0,
            };

            this.population.push(strategy);

            // Create micro-agent for each strategy
            this.agents.push({
                id: `agent_${i}`,
                strategy,
                active: true,
                lastAction: 'IDLE',
                performance: 0,
            });
        }

        console.log(`[Biology] ✅ Population initialized with ${this.population.length} strategies`);
    }

    /**
     * Generate random genome (strategy parameters)
     * Genome: [entryThreshold, exitThreshold, riskPercent, stopLoss, takeProfit]
     */
    private randomGenome(): number[] {
        return [
            Math.random() * 0.05, // Entry threshold (0-5%)
            Math.random() * 0.05, // Exit threshold (0-5%)
            Math.random() * 0.1,  // Risk percent (0-10%)
            Math.random() * 0.2,  // Stop loss (0-20%)
            Math.random() * 0.5,  // Take profit (0-50%)
        ];
    }

    /**
     * Evaluate fitness of all strategies
     */
    evaluateFitness(marketData: any[]): void {
        console.log(`[Biology] 📊 Evaluating fitness for generation ${this.generation}...`);

        for (const strategy of this.population) {
            // Simulate trading with this strategy
            const result = this.simulateTrades(strategy, marketData);

            strategy.fitness = result.fitness;
            strategy.wins = result.wins;
            strategy.losses = result.losses;
            strategy.totalProfit = result.totalProfit;
        }

        // Sort by fitness
        this.population.sort((a, b) => b.fitness - a.fitness);
        this.bestStrategy = this.population[0];

        console.log(`[Biology] 🏆 Best fitness: ${this.bestStrategy.fitness.toFixed(4)} (Strategy: ${this.bestStrategy.id})`);
    }

    /**
     * Simulate trades with a strategy
     */
    private simulateTrades(strategy: TradingStrategy, marketData: any[]): {
        fitness: number;
        wins: number;
        losses: number;
        totalProfit: number;
    } {
        let wins = 0;
        let losses = 0;
        let totalProfit = 0;

        // Simple simulation (replace with real backtesting logic)
        for (let i = 1; i < marketData.length; i++) {
            const priceChange = (marketData[i].price - marketData[i - 1].price) / marketData[i - 1].price;

            if (Math.abs(priceChange) > strategy.genome[0]) {
                // Entry signal
                const profit = priceChange * strategy.genome[2]; // Risk-adjusted profit

                if (profit > 0) {
                    wins++;
                    totalProfit += profit;
                } else {
                    losses++;
                    totalProfit += profit;
                }
            }
        }

        const fitness = wins > 0 ? (totalProfit / (wins + losses)) * (wins / (wins + losses + 1)) : 0;

        return { fitness, wins, losses, totalProfit };
    }

    /**
     * Evolve population (selection, crossover, mutation)
     */
    evolve(): void {
        console.log(`[Biology] 🔄 Evolving generation ${this.generation}...`);

        const newPopulation: TradingStrategy[] = [];

        // Elitism: Keep top performers
        for (let i = 0; i < this.config.eliteCount; i++) {
            newPopulation.push({ ...this.population[i], generation: this.generation + 1 });
        }

        // Generate offspring
        while (newPopulation.length < this.config.populationSize) {
            const parent1 = this.selectParent();
            const parent2 = this.selectParent();

            let offspring = this.crossover(parent1, parent2);
            offspring = this.mutate(offspring);

            newPopulation.push(offspring);
        }

        this.population = newPopulation;
        this.generation++;

        console.log(`[Biology] ✅ Generation ${this.generation} created`);
    }

    /**
     * Tournament selection
     */
    private selectParent(): TradingStrategy {
        const tournamentSize = 5;
        const tournament: TradingStrategy[] = [];

        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            tournament.push(this.population[randomIndex]);
        }

        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0];
    }

    /**
     * Crossover (single-point)
     */
    private crossover(parent1: TradingStrategy, parent2: TradingStrategy): TradingStrategy {
        if (Math.random() > this.config.crossoverRate) {
            return { ...parent1 };
        }

        const crossoverPoint = Math.floor(Math.random() * parent1.genome.length);
        const childGenome = [
            ...parent1.genome.slice(0, crossoverPoint),
            ...parent2.genome.slice(crossoverPoint),
        ];

        return {
            id: `strategy_gen${this.generation}_${Date.now()}`,
            genome: childGenome,
            fitness: 0,
            generation: this.generation + 1,
            wins: 0,
            losses: 0,
            totalProfit: 0,
        };
    }

    /**
     * Mutation
     */
    private mutate(strategy: TradingStrategy): TradingStrategy {
        const mutatedGenome = strategy.genome.map((gene) => {
            if (Math.random() < this.config.mutationRate) {
                return gene + (Math.random() - 0.5) * 0.1; // Small random change
            }
            return gene;
        });

        return {
            ...strategy,
            genome: mutatedGenome,
        };
    }

    /**
     * Get best strategy
     */
    getBestStrategy(): TradingStrategy | null {
        return this.bestStrategy;
    }

    /**
     * Get swarm statistics
     */
    getStats() {
        return {
            generation: this.generation,
            populationSize: this.population.length,
            activeAgents: this.agents.filter((a) => a.active).length,
            bestFitness: this.bestStrategy?.fitness || 0,
            avgFitness: this.population.reduce((sum, s) => sum + s.fitness, 0) / this.population.length,
        };
    }
}

export default GeneticSwarm;
