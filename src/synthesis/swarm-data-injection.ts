/**
 * ╔═══════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                                               ║
 * ║  ███████╗██╗    ██╗ █████╗ ██████╗ ███╗   ███╗    ██████╗  █████╗ ████████╗ █████╗            ║
 * ║  ██╔════╝██║    ██║██╔══██╗██╔══██╗████╗ ████║    ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗           ║
 * ║  ███████╗██║ █╗ ██║███████║██████╔╝██╔████╔██║    ██║  ██║███████║   ██║   ███████║           ║
 * ║  ╚════██║██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║    ██║  ██║██╔══██║   ██║   ██╔══██║           ║
 * ║  ███████║╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║    ██████╔╝██║  ██║   ██║   ██║  ██║           ║
 * ║  ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝           ║
 * ║                                                                                               ║
 * ║                            SWARM DATA INJECTION ENGINE                                        ║
 * ║                   "Neural Fingerprint-Based Unique Data for Each Worker"                      ║
 * ║                                                                                               ║
 * ║   THE FINAL SYNTHESIS - Task 3: Data Factory Injection                                        ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                                        ║
 * ║                                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface NeuralFingerprint {
    workerId: string;
    seed: number;
    createdAt: number;
    entropy: number;
    traits: WorkerTraits;
}

export interface WorkerTraits {
    /** Personality archetype for data generation */
    archetype: 'explorer' | 'builder' | 'analyst' | 'guardian' | 'creator';
    /** Geographic region preference */
    region: 'NA' | 'EU' | 'APAC' | 'LATAM' | 'MEA';
    /** Industry vertical */
    industry: string;
    /** Language preference */
    language: string;
    /** Data complexity level (1-10) */
    complexity: number;
}

export interface SwarmWorkerData {
    fingerprint: NeuralFingerprint;
    user: GeneratedUser;
    company: GeneratedCompany;
    credentials: GeneratedCredentials;
    context: GeneratedContext;
}

export interface GeneratedUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
    birthDate: string;
    address: GeneratedAddress;
}

export interface GeneratedAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface GeneratedCompany {
    name: string;
    domain: string;
    industry: string;
    size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    founded: number;
    employees: number;
}

export interface GeneratedCredentials {
    username: string;
    password: string;
    token: string;
    apiKey: string;
}

export interface GeneratedContext {
    sessionId: string;
    userAgent: string;
    viewport: { width: number; height: number };
    timezone: string;
    locale: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA POOLS (Region-specific)
// ═══════════════════════════════════════════════════════════════════════════════

const DATA_POOLS = {
    firstNames: {
        NA: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia'],
        EU: ['Hans', 'Pierre', 'Marco', 'Lars', 'Erik', 'Jan', 'Sophie', 'Marie', 'Anna', 'Emma', 'Laura', 'Julia'],
        APAC: ['Hiroshi', 'Takeshi', 'Wei', 'Jin', 'Raj', 'Amit', 'Yuki', 'Sakura', 'Mei', 'Lin', 'Priya', 'Aisha'],
        LATAM: ['Carlos', 'Miguel', 'José', 'Luis', 'Juan', 'Diego', 'María', 'Ana', 'Carmen', 'Rosa', 'Elena', 'Sofia'],
        MEA: ['Ahmed', 'Mohammed', 'Omar', 'Ali', 'Hassan', 'Ibrahim', 'Fatima', 'Aisha', 'Sara', 'Mariam', 'Layla', 'Noor']
    },
    lastNames: {
        NA: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
        EU: ['Müller', 'Schmidt', 'Dubois', 'Martin', 'Rossi', 'Ferrari', 'Nielsen', 'Johansson', 'Kowalski', 'Novak'],
        APAC: ['Tanaka', 'Suzuki', 'Wang', 'Li', 'Kim', 'Park', 'Patel', 'Singh', 'Nguyen', 'Tran'],
        LATAM: ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'],
        MEA: ['Hassan', 'Ahmed', 'Ali', 'Ibrahim', 'Mohamed', 'Youssef', 'Mahmoud', 'Mustafa', 'Khalil', 'Said']
    },
    cities: {
        NA: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Toronto', 'Vancouver', 'Montreal'],
        EU: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Stockholm', 'Vienna'],
        APAC: ['Tokyo', 'Shanghai', 'Singapore', 'Sydney', 'Mumbai', 'Seoul', 'Hong Kong', 'Bangkok'],
        LATAM: ['São Paulo', 'Mexico City', 'Buenos Aires', 'Lima', 'Bogotá', 'Santiago', 'Caracas', 'Havana'],
        MEA: ['Dubai', 'Cairo', 'Istanbul', 'Tel Aviv', 'Riyadh', 'Lagos', 'Johannesburg', 'Nairobi']
    },
    industries: [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
        'Manufacturing', 'Energy', 'Transportation', 'Media', 'Real Estate',
        'Hospitality', 'Agriculture', 'Construction', 'Telecommunications', 'Consulting'
    ],
    domains: [
        'tech', 'solutions', 'systems', 'digital', 'cloud', 'data',
        'smart', 'next', 'prime', 'core', 'hub', 'lab', 'works'
    ],
    userAgents: [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    timezones: {
        NA: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
        EU: ['Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome'],
        APAC: ['Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney'],
        LATAM: ['America/Sao_Paulo', 'America/Mexico_City', 'America/Buenos_Aires'],
        MEA: ['Africa/Cairo', 'Asia/Dubai', 'Africa/Johannesburg', 'Asia/Istanbul']
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEEDED RANDOM GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SWARM DATA INJECTOR
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * SwarmDataInjector - Generates unique data for each Swarm worker
 */
export class SwarmDataInjector {
    private static instance: SwarmDataInjector;
    
    private workerDataCache: Map<string, SwarmWorkerData> = new Map();
    private fingerprintRegistry: Map<string, NeuralFingerprint> = new Map();

    private constructor() {}

    static getInstance(): SwarmDataInjector {
        if (!SwarmDataInjector.instance) {
            SwarmDataInjector.instance = new SwarmDataInjector();
        }
        return SwarmDataInjector.instance;
    }

    /**
     * Generate unique neural fingerprint for worker
     */
    generateFingerprint(workerId: string): NeuralFingerprint {
        if (this.fingerprintRegistry.has(workerId)) {
            return this.fingerprintRegistry.get(workerId)!;
        }

        // Generate seed from worker ID
        const seed = this.hashString(workerId);
        const random = new SeededRandom(seed);

        const fingerprint: NeuralFingerprint = {
            workerId,
            seed,
            createdAt: Date.now(),
            entropy: random.next(),
            traits: {
                archetype: random.pick(['explorer', 'builder', 'analyst', 'guardian', 'creator']),
                region: random.pick(['NA', 'EU', 'APAC', 'LATAM', 'MEA']),
                industry: random.pick(DATA_POOLS.industries),
                language: this.getLanguageForRegion(random.pick(['NA', 'EU', 'APAC', 'LATAM', 'MEA'])),
                complexity: random.nextInt(1, 10)
            }
        };

        this.fingerprintRegistry.set(workerId, fingerprint);
        return fingerprint;
    }

    /**
     * Generate complete data package for worker
     */
    generateWorkerData(workerId: string): SwarmWorkerData {
        if (this.workerDataCache.has(workerId)) {
            return this.workerDataCache.get(workerId)!;
        }

        const fingerprint = this.generateFingerprint(workerId);
        const random = new SeededRandom(fingerprint.seed);
        const region = fingerprint.traits.region;

        const user = this.generateUser(random, region);
        const company = this.generateCompany(random, fingerprint.traits.industry);
        const credentials = this.generateCredentials(random, user);
        const context = this.generateContext(random, region);

        const data: SwarmWorkerData = {
            fingerprint,
            user,
            company,
            credentials,
            context
        };

        this.workerDataCache.set(workerId, data);
        
        console.log(`🐝 [SwarmDataInjector] Generated data for worker: ${workerId.slice(0, 8)}...`);
        return data;
    }

    /**
     * Inject data into multiple workers
     */
    injectBatch(workerIds: string[]): Map<string, SwarmWorkerData> {
        const result = new Map<string, SwarmWorkerData>();

        for (const workerId of workerIds) {
            result.set(workerId, this.generateWorkerData(workerId));
        }

        return result;
    }

    /**
     * Get worker data by fingerprint traits
     */
    getWorkersByTrait(
        trait: keyof WorkerTraits,
        value: any
    ): SwarmWorkerData[] {
        return Array.from(this.workerDataCache.values())
            .filter(data => data.fingerprint.traits[trait] === value);
    }

    /**
     * Reset worker data (for re-generation)
     */
    resetWorker(workerId: string): void {
        this.workerDataCache.delete(workerId);
        this.fingerprintRegistry.delete(workerId);
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalWorkers: number;
        byArchetype: Record<string, number>;
        byRegion: Record<string, number>;
    } {
        const workers = Array.from(this.workerDataCache.values());

        const byArchetype: Record<string, number> = {};
        const byRegion: Record<string, number> = {};

        for (const worker of workers) {
            const { archetype, region } = worker.fingerprint.traits;
            byArchetype[archetype] = (byArchetype[archetype] || 0) + 1;
            byRegion[region] = (byRegion[region] || 0) + 1;
        }

        return {
            totalWorkers: workers.length,
            byArchetype,
            byRegion
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE GENERATORS
    // ─────────────────────────────────────────────────────────────────────────

    private generateUser(random: SeededRandom, region: string): GeneratedUser {
        const firstName = random.pick(DATA_POOLS.firstNames[region as keyof typeof DATA_POOLS.firstNames] || DATA_POOLS.firstNames.NA);
        const lastName = random.pick(DATA_POOLS.lastNames[region as keyof typeof DATA_POOLS.lastNames] || DATA_POOLS.lastNames.NA);
        const city = random.pick(DATA_POOLS.cities[region as keyof typeof DATA_POOLS.cities] || DATA_POOLS.cities.NA);

        return {
            id: this.generateUUID(random),
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${random.pick(DATA_POOLS.domains)}.com`,
            phone: this.generatePhone(random, region),
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}`,
            birthDate: this.generateBirthDate(random),
            address: {
                street: `${random.nextInt(100, 9999)} ${random.pick(['Main', 'Oak', 'Pine', 'Maple', 'Cedar'])} ${random.pick(['St', 'Ave', 'Blvd', 'Dr', 'Ln'])}`,
                city,
                state: this.getStateForCity(city, region),
                zip: this.generateZip(random, region),
                country: this.getCountryForRegion(region)
            }
        };
    }

    private generateCompany(random: SeededRandom, industry: string): GeneratedCompany {
        const prefix = random.pick(['Apex', 'Nova', 'Vertex', 'Prime', 'Quantum', 'Nexus', 'Atlas', 'Zenith', 'Titan', 'Omega']);
        const suffix = random.pick(DATA_POOLS.domains);

        const sizes: Array<'startup' | 'small' | 'medium' | 'large' | 'enterprise'> = 
            ['startup', 'small', 'medium', 'large', 'enterprise'];
        const size = random.pick(sizes);

        const employeeRanges = {
            startup: [1, 50],
            small: [51, 200],
            medium: [201, 1000],
            large: [1001, 5000],
            enterprise: [5001, 100000]
        };

        return {
            name: `${prefix} ${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`,
            domain: `${prefix.toLowerCase()}${suffix}.com`,
            industry,
            size,
            founded: random.nextInt(1990, 2024),
            employees: random.nextInt(...employeeRanges[size] as [number, number])
        };
    }

    private generateCredentials(random: SeededRandom, user: GeneratedUser): GeneratedCredentials {
        return {
            username: `${user.firstName.toLowerCase()}_${user.lastName.toLowerCase()}${random.nextInt(1, 999)}`,
            password: this.generatePassword(random),
            token: this.generateToken(random),
            apiKey: this.generateApiKey(random)
        };
    }

    private generateContext(random: SeededRandom, region: string): GeneratedContext {
        const viewports = [
            { width: 1920, height: 1080 },
            { width: 1366, height: 768 },
            { width: 1536, height: 864 },
            { width: 1440, height: 900 },
            { width: 2560, height: 1440 }
        ];

        return {
            sessionId: this.generateUUID(random),
            userAgent: random.pick(DATA_POOLS.userAgents),
            viewport: random.pick(viewports),
            timezone: random.pick(DATA_POOLS.timezones[region as keyof typeof DATA_POOLS.timezones] || DATA_POOLS.timezones.NA),
            locale: this.getLocaleForRegion(region)
        };
    }

    private generateUUID(random: SeededRandom): string {
        const hex = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid += '-';
            } else if (i === 14) {
                uuid += '4';
            } else if (i === 19) {
                uuid += hex[Math.floor(random.next() * 4) + 8];
            } else {
                uuid += hex[Math.floor(random.next() * 16)];
            }
        }
        return uuid;
    }

    private generatePhone(random: SeededRandom, region: string): string {
        const prefixes: Record<string, string> = {
            NA: '+1',
            EU: '+44',
            APAC: '+81',
            LATAM: '+55',
            MEA: '+971'
        };
        const prefix = prefixes[region] || '+1';
        return `${prefix} ${random.nextInt(100, 999)}-${random.nextInt(100, 999)}-${random.nextInt(1000, 9999)}`;
    }

    private generateBirthDate(random: SeededRandom): string {
        const year = random.nextInt(1960, 2005);
        const month = random.nextInt(1, 12).toString().padStart(2, '0');
        const day = random.nextInt(1, 28).toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    private generateZip(random: SeededRandom, region: string): string {
        if (region === 'NA') return random.nextInt(10000, 99999).toString();
        if (region === 'EU') return `${random.pick(['SW', 'NW', 'SE', 'E', 'W'])}${random.nextInt(1, 20)} ${random.nextInt(1, 9)}${random.pick(['AA', 'AB', 'BA', 'BB'])}`;
        return random.nextInt(100000, 999999).toString();
    }

    private generatePassword(random: SeededRandom): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars[Math.floor(random.next() * chars.length)];
        }
        return password;
    }

    private generateToken(random: SeededRandom): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = 'qt_';
        for (let i = 0; i < 32; i++) {
            token += chars[Math.floor(random.next() * chars.length)];
        }
        return token;
    }

    private generateApiKey(random: SeededRandom): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let key = 'QANTUM-';
        for (let i = 0; i < 24; i++) {
            if (i > 0 && i % 4 === 0) key += '-';
            key += chars[Math.floor(random.next() * chars.length)];
        }
        return key;
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private getLanguageForRegion(region: string): string {
        const languages: Record<string, string> = {
            NA: 'en-US',
            EU: 'en-GB',
            APAC: 'ja-JP',
            LATAM: 'es-MX',
            MEA: 'ar-AE'
        };
        return languages[region] || 'en-US';
    }

    private getLocaleForRegion(region: string): string {
        return this.getLanguageForRegion(region);
    }

    private getCountryForRegion(region: string): string {
        const countries: Record<string, string> = {
            NA: 'United States',
            EU: 'United Kingdom',
            APAC: 'Japan',
            LATAM: 'Brazil',
            MEA: 'United Arab Emirates'
        };
        return countries[region] || 'United States';
    }

    private getStateForCity(city: string, region: string): string {
        // Simplified state lookup
        const cityStates: Record<string, string> = {
            'New York': 'NY',
            'Los Angeles': 'CA',
            'Chicago': 'IL',
            'London': 'England',
            'Paris': 'Île-de-France',
            'Tokyo': 'Tokyo',
            'Sydney': 'NSW'
        };
        return cityStates[city] || 'Unknown';
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getSwarmDataInjector = () => SwarmDataInjector.getInstance();

export default SwarmDataInjector;
