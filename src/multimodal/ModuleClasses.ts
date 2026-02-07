/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║   ███╗   ███╗ ██████╗ ██████╗ ██╗   ██╗██╗     ███████╗                                       ║
 * ║   ████╗ ████║██╔═══██╗██╔══██╗██║   ██║██║     ██╔════╝                                       ║
 * ║   ██╔████╔██║██║   ██║██║  ██║██║   ██║██║     █████╗                                         ║
 * ║   ██║╚██╔╝██║██║   ██║██║  ██║██║   ██║██║     ██╔══╝                                         ║
 * ║   ██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╔╝███████╗███████╗                                       ║
 * ║   ╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝                                       ║
 * ║                                                                                               ║
 * ║    ██████╗██╗      █████╗ ███████╗███████╗███████╗███████╗                                    ║
 * ║   ██╔════╝██║     ██╔══██╗██╔════╝██╔════╝██╔════╝██╔════╝                                    ║
 * ║   ██║     ██║     ███████║███████╗███████╗█████╗  ███████╗                                    ║
 * ║   ██║     ██║     ██╔══██║╚════██║╚════██║██╔══╝  ╚════██║                                    ║
 * ║   ╚██████╗███████╗██║  ██║███████║███████║███████╗███████║                                    ║
 * ║    ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚══════╝                                    ║
 * ║                                                                                               ║
 * ║   КЛАСОВА АРХИТЕКТУРА НА МОДУЛИТЕ                                                             ║
 * ║   Групиране по функционалност - не песъчинки, а кабели                                        ║
 * ║                                                                                               ║
 * ║   "Когато всеки модул е свързан с кабел, проблемът се засича веднага."                        ║
 * ║                                                                                               ║
 * ║   Created: 2026-01-02 | QAntum Empire                                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE CLASS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Базов интерфейс за всеки модул
 */
export interface IModule {
    readonly name: string;
    readonly className: ModuleClassName;
    readonly version: string;
    readonly status: ModuleStatus;

    initialize(): Promise<void>;
    healthCheck(): Promise<HealthResult>;
    shutdown(): Promise<void>;
}

export type ModuleClassName =
    | 'INTELLIGENCE'  // 🧠 Анализ и синхронизация
    | 'OMEGA'         // ⚡ Команден център
    | 'PHYSICS'       // 🔬 Математика и изчисления
    | 'FORTRESS'      // 🏰 Сигурност
    | 'BIOLOGY'       // 🧬 Еволюция и учене
    | 'GUARDIANS'     // 🛡️ Мониторинг
    | 'REALITY'       // 🌐 Външни интерфейси
    | 'CHEMISTRY';    // 🔗 Свързващи модули

export type ModuleStatus = 'healthy' | 'warning' | 'error' | 'offline';

export interface HealthResult {
    status: ModuleStatus;
    message: string;
    metrics?: Record<string, number>;
    lastCheck: Date;
}

export interface ModuleConnection {
    from: string;
    to: string;
    type: 'dependency' | 'event' | 'data';
    strength: 'strong' | 'medium' | 'weak';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const MODULE_CLASS_REGISTRY: Record<ModuleClassName, ClassDefinition> = {
    INTELLIGENCE: {
        emoji: '🧠',
        name: 'INTELLIGENCE',
        description: 'Intelligence & Analysis Layer - Мозъкът на екосистемата',
        color: '#667eea',
        modules: [
            'EcosystemSyncValidator',
            'EcosystemHarmonizer',
            'CrossProjectSynergy',
            'SovereignAudit',
            'HealthMonitor',
            'VectorSync',
            'PricingSyncEngine',
            'DeepSeekLink'
        ],
        dependencies: ['PHYSICS', 'OMEGA'],
        dependents: ['GUARDIANS', 'REALITY']
    },

    OMEGA: {
        emoji: '⚡',
        name: 'OMEGA',
        description: 'Command & Control Center - Централата на властта',
        color: '#764ba2',
        modules: [
            'SovereignMagnet',
            'SovereignNucleus',
            'OmegaServer',
            'GenesisEngine'
        ],
        dependencies: ['PHYSICS', 'FORTRESS'],
        dependents: ['INTELLIGENCE', 'GUARDIANS']
    },

    PHYSICS: {
        emoji: '🔬',
        name: 'PHYSICS',
        description: 'Mathematical & Computational Core - Чистата математика',
        color: '#00ff88',
        modules: [
            'NeuralInference',
            'VectorEngine',
            'MatrixOps',
            'TensorCore',
            'GPUAccelerator'
        ],
        dependencies: [],
        dependents: ['OMEGA', 'INTELLIGENCE', 'BIOLOGY']
    },

    FORTRESS: {
        emoji: '🏰',
        name: 'FORTRESS',
        description: 'Security & Authentication - Непробиваемата стена',
        color: '#ff6b6b',
        modules: [
            'VaultGuard',
            'TokenManager',
            'CryptoEngine',
            'AccessControl',
            'AuditLogger'
        ],
        dependencies: ['PHYSICS'],
        dependents: ['OMEGA', 'REALITY']
    },

    BIOLOGY: {
        emoji: '🧬',
        name: 'BIOLOGY',
        description: 'Evolution & Learning Systems - Еволюцията на кода',
        color: '#ffd93d',
        modules: [
            'EvolutionEngine',
            'LearningCore',
            'AdaptiveSystem',
            'GeneticOptimizer',
            'NeuralEvolver'
        ],
        dependencies: ['PHYSICS'],
        dependents: ['INTELLIGENCE']
    },

    GUARDIANS: {
        emoji: '🛡️',
        name: 'GUARDIANS',
        description: 'Monitoring & Self-Healing - Вечните пазители',
        color: '#4ecdc4',
        modules: [
            'UnifiedGuardian',
            'EternalGuardian',
            'NucleusMapper',
            'HealthDaemon',
            'SelfHealer'
        ],
        dependencies: ['INTELLIGENCE', 'OMEGA'],
        dependents: []
    },

    REALITY: {
        emoji: '🌐',
        name: 'REALITY',
        description: 'External Interfaces - Връзката с външния свят',
        color: '#ff9f43',
        modules: [
            'APIGateway',
            'WebhookManager',
            'RESTController',
            'GraphQLServer',
            'WebSocketHub'
        ],
        dependencies: ['FORTRESS', 'INTELLIGENCE'],
        dependents: []
    },

    CHEMISTRY: {
        emoji: '🔗',
        name: 'CHEMISTRY',
        description: 'Connectors & Adapters - Лепилото на системата',
        color: '#a29bfe',
        modules: [
            'EventBridge',
            'DataTransformer',
            'ProtocolAdapter',
            'MessageQueue',
            'StateSync'
        ],
        dependencies: [],
        dependents: ['INTELLIGENCE', 'OMEGA', 'REALITY']
    }
};

export interface ClassDefinition {
    emoji: string;
    name: ModuleClassName;
    description: string;
    color: string;
    modules: string[];
    dependencies: ModuleClassName[];
    dependents: ModuleClassName[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE MODULE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class BaseModule extends EventEmitter implements IModule {
    abstract readonly name: string;
    abstract readonly className: ModuleClassName;
    readonly version: string = '1.0.0';

    protected _status: ModuleStatus = 'offline';
    protected _lastHealth: HealthResult | null = null;
    protected _connections: ModuleConnection[] = [];

    get status(): ModuleStatus {
        return this._status;
    }

    async initialize(): Promise<void> {
        this._status = 'healthy';
        this.emit('initialized', { module: this.name, class: this.className });
    }

    async healthCheck(): Promise<HealthResult> {
        this._lastHealth = {
            status: this._status,
            message: `${this.name} is ${this._status}`,
            lastCheck: new Date()
        };
        return this._lastHealth;
    }

    async shutdown(): Promise<void> {
        this._status = 'offline';
        this.emit('shutdown', { module: this.name });
    }

    connect(target: IModule, type: ModuleConnection['type'] = 'dependency'): void {
        this._connections.push({
            from: this.name,
            to: target.name,
            type,
            strength: 'strong'
        });
        this.emit('connected', { from: this.name, to: target.name, type });
    }

    getConnections(): ModuleConnection[] {
        return [...this._connections];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASS ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════════

export class ClassOrchestrator extends EventEmitter {
    private modules: Map<string, IModule> = new Map();
    private classes: Map<ModuleClassName, Set<string>> = new Map();

    constructor() {
        super();
        // Initialize class sets
        for (const className of Object.keys(MODULE_CLASS_REGISTRY) as ModuleClassName[]) {
            this.classes.set(className, new Set());
        }
    }

    /**
     * Регистрира модул в съответния клас
     */
    register(module: IModule): void {
        this.modules.set(module.name, module);
        this.classes.get(module.className)?.add(module.name);
        this.emit('registered', { module: module.name, class: module.className });
    }

    /**
     * Връща всички модули от даден клас
     */
    getClassModules(className: ModuleClassName): IModule[] {
        const moduleNames = this.classes.get(className);
        if (!moduleNames) return [];

        return Array.from(moduleNames)
            .map(name => this.modules.get(name))
            .filter((m): m is IModule => m !== undefined);
    }

    /**
     * Проверява здравето на цял клас
     */
    async checkClassHealth(className: ModuleClassName): Promise<ClassHealthReport> {
        const modules = this.getClassModules(className);
        const results: HealthResult[] = [];

        for (const module of modules) {
            results.push(await module.healthCheck());
        }

        const healthyCount = results.filter(r => r.status === 'healthy').length;
        const totalCount = results.length;

        return {
            className,
            definition: MODULE_CLASS_REGISTRY[className],
            modules: results,
            healthScore: totalCount > 0 ? (healthyCount / totalCount) * 100 : 100,
            status: healthyCount === totalCount ? 'healthy' : healthyCount > 0 ? 'warning' : 'error'
        };
    }

    /**
     * Проверява здравето на цялата екосистема
     */
    async checkEcosystemHealth(): Promise<EcosystemHealthReport> {
        const classReports: ClassHealthReport[] = [];

        for (const className of Object.keys(MODULE_CLASS_REGISTRY) as ModuleClassName[]) {
            classReports.push(await this.checkClassHealth(className));
        }

        const totalScore = classReports.reduce((sum, r) => sum + r.healthScore, 0) / classReports.length;

        return {
            timestamp: new Date(),
            classes: classReports,
            totalModules: this.modules.size,
            healthScore: totalScore,
            status: totalScore >= 90 ? 'healthy' : totalScore >= 70 ? 'warning' : 'error',
            connections: this.getAllConnections()
        };
    }

    /**
     * Връща всички връзки между модулите
     */
    getAllConnections(): ModuleConnection[] {
        const connections: ModuleConnection[] = [];

        for (const module of this.modules.values()) {
            if ('getConnections' in module && typeof module.getConnections === 'function') {
                connections.push(...(module as BaseModule).getConnections());
            }
        }

        return connections;
    }

    /**
     * Намира всички модули, свързани с даден модул
     */
    findConnectedModules(moduleName: string): string[] {
        const connections = this.getAllConnections();
        const connected: Set<string> = new Set();

        for (const conn of connections) {
            if (conn.from === moduleName) connected.add(conn.to);
            if (conn.to === moduleName) connected.add(conn.from);
        }

        return Array.from(connected);
    }

    /**
     * Визуализира класовата архитектура
     */
    visualize(): string {
        let output = '\n╔═══════════════════════════════════════════════════════════════════════════════╗\n';
        output += '║                       CLASS ARCHITECTURE MAP                                  ║\n';
        output += '╠═══════════════════════════════════════════════════════════════════════════════╣\n';

        for (const [className, definition] of Object.entries(MODULE_CLASS_REGISTRY)) {
            const modules = this.getClassModules(className as ModuleClassName);
            const healthyCount = modules.filter(m => m.status === 'healthy').length;

            output += `║  ${definition.emoji} ${className.padEnd(15)} │ ${healthyCount}/${modules.length} modules │ ${definition.description.substring(0, 30)}...  ║\n`;

            for (const dep of definition.dependencies) {
                output += `║     └── depends on: ${MODULE_CLASS_REGISTRY[dep].emoji} ${dep.padEnd(45)}║\n`;
            }
        }

        output += '╚═══════════════════════════════════════════════════════════════════════════════╝\n';

        return output;
    }
}

export interface ClassHealthReport {
    className: ModuleClassName;
    definition: ClassDefinition;
    modules: HealthResult[];
    healthScore: number;
    status: ModuleStatus;
}

export interface EcosystemHealthReport {
    timestamp: Date;
    classes: ClassHealthReport[];
    totalModules: number;
    healthScore: number;
    status: ModuleStatus;
    connections: ModuleConnection[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════════════════════

let orchestratorInstance: ClassOrchestrator | null = null;

export function getOrchestrator(): ClassOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new ClassOrchestrator();
    }
    return orchestratorInstance;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE MODULE IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Intelligence Module Example
 */
export class IntelligenceModule extends BaseModule {
    readonly name: string;
    readonly className: ModuleClassName = 'INTELLIGENCE';

    constructor(name: string) {
        super();
        this.name = name;
    }
}

/**
 * Guardian Module Example
 */
export class GuardianModule extends BaseModule {
    readonly name: string;
    readonly className: ModuleClassName = 'GUARDIANS';

    constructor(name: string) {
        super();
        this.name = name;
    }

    async healthCheck(): Promise<HealthResult> {
        // Guardian-specific health check
        return {
            status: 'healthy',
            message: `${this.name} is actively monitoring`,
            metrics: {
                checksPerformed: 100,
                issuesFound: 0,
                autoHealed: 5
            },
            lastCheck: new Date()
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    BaseModule as Module,
    ClassOrchestrator as Orchestrator,
    MODULE_CLASS_REGISTRY as ClassRegistry
};
