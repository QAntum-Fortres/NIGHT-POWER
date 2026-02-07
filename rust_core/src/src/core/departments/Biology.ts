export interface Genome {
    riskTolerance: number; // 0.0 - 1.0
    aggression: number;    // 0.0 - 1.0
    patience: number;      // ms to hold
}

export class MicroAgent {
    public id: number;
    public genome: Genome;
    public score: number = 0;

    constructor(id: number, genome: Genome) {
        this.id = id;
        this.genome = genome;
    }

    public simulate(marketData: any): number {
        // Simulate trading based on genome
        // This is a "backtest" on the last 5 minutes (or current snapshot)
        
        let score = 0;
        // Logic: Aggressive agents win in volatile markets, Patient agents win in flat markets
        if (marketData.volatility > 0.5 && this.genome.aggression > 0.7) {
            score += 10 * this.genome.aggression;
        } else if (marketData.volatility <= 0.5 && this.genome.patience > 500) {
            score += 5 * (this.genome.patience / 1000);
        } else {
            score -= 1; // Penalty for mismatch
        }
        
        this.score = score + Math.random(); // Add noise/luck
        return this.score;
    }
}

export class AmnioticEngine {
    private population: MicroAgent[] = [];
    private generation: number = 0;

    constructor(size: number = 100) {
        this.initializePopulation(size);
    }

    private initializePopulation(size: number) {
        for (let i = 0; i < size; i++) {
            this.population.push(new MicroAgent(i, {
                riskTolerance: Math.random(),
                aggression: Math.random(),
                patience: Math.random() * 1000
            }));
        }
    }

    public evolve(marketData: any): MicroAgent {
        // 1. Evaluate all agents
        this.population.forEach(agent => agent.simulate(marketData));
        
        // 2. Select fittest
        this.population.sort((a, b) => b.score - a.score);
        const best = this.population[0];
        
        // 3. Reproduce (Genetic Crossover + Mutation)
        // Keep top 10%, replace rest with offspring of top 10%
        const eliteCount = Math.floor(this.population.length * 0.1);
        const survivors = this.population.slice(0, eliteCount);
        const newPop = [...survivors];
        
        while (newPop.length < this.population.length) {
            const parentA = survivors[Math.floor(Math.random() * survivors.length)];
            const parentB = survivors[Math.floor(Math.random() * survivors.length)];
            
            // Crossover
            const childGenome = {
                riskTolerance: (parentA.genome.riskTolerance + parentB.genome.riskTolerance) / 2,
                aggression: (parentA.genome.aggression + parentB.genome.aggression) / 2,
                patience: (parentA.genome.patience + parentB.genome.patience) / 2,
            };
            
            // Mutation (10% chance)
            if (Math.random() < 0.1) {
                childGenome.aggression += (Math.random() - 0.5) * 0.2;
                childGenome.aggression = Math.max(0, Math.min(1, childGenome.aggression));
            }
            
            newPop.push(new MicroAgent(newPop.length, childGenome));
        }
        
        this.population = newPop;
        this.generation++;
        
        // console.log(`[BIOLOGY] 🧬 Generation ${this.generation}: Best Agent (Score ${best.score.toFixed(2)}) -> Aggression: ${best.genome.aggression.toFixed(2)}`);
        
        return best;
    }
}

export class BiologyDepartment {
    private engine: AmnioticEngine;

    constructor() {
        console.log('[BIOLOGY] 🧬 Department Created.');
        this.engine = new AmnioticEngine(100); 
    }

    public async initialize() {
        console.log('[BIOLOGY] 🧬 Amniotic Engine Online. Swarm ready.');
        return true;
    }
    
    public synthesizeStrategy(marketData: any) {
        return this.engine.evolve(marketData);
    }
}
