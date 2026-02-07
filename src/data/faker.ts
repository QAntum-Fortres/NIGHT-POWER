/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DATA FAKER                                                           ║
 * ║   "Realistic test data generation"                                            ║
 * ║                                                                               ║
 * ║   TODO B #39 - Data: Faker integration                                        ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SEEDED RANDOM
// ═══════════════════════════════════════════════════════════════════════════════

class SeededRandom {
    private seed: number;

    constructor(seed: number = Date.now()) {
        this.seed = seed;
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    float(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    boolean(probability: number = 0.5): boolean {
        return this.next() < probability;
    }

    pick<T>(array: T[]): T {
        return array[this.int(0, array.length - 1)];
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    setSeed(seed: number): void {
        this.seed = seed;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA POOLS
// ═══════════════════════════════════════════════════════════════════════════════

const DATA = {
    firstNames: [
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
        'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
        'Thomas', 'Sarah', 'Christopher', 'Karen', 'Daniel', 'Nancy', 'Matthew', 'Lisa'
    ],
    lastNames: [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White'
    ],
    domains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'],
    words: [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
        'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud'
    ],
    companies: [
        'Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Stark Industries',
        'Wayne Enterprises', 'Cyberdyne', 'Oscorp', 'Massive Dynamic', 'Aperture Science'
    ],
    streets: [
        'Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St',
        'Park Ave', 'Lake Blvd', 'River Rd', 'Hill St', 'Valley Dr', 'Forest Ave'
    ],
    cities: [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
        'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville'
    ],
    countries: [
        'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
        'Australia', 'Japan', 'Brazil', 'India', 'Mexico'
    ],
    jobTitles: [
        'Software Engineer', 'Product Manager', 'Designer', 'Data Scientist',
        'DevOps Engineer', 'QA Engineer', 'Business Analyst', 'Project Manager',
        'CEO', 'CTO', 'VP Engineering', 'Director', 'Consultant', 'Architect'
    ],
    colors: [
        'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
        'black', 'white', 'gray', 'brown', 'cyan', 'magenta'
    ]
};

// ═══════════════════════════════════════════════════════════════════════════════
// FAKER
// ═══════════════════════════════════════════════════════════════════════════════

export class Faker {
    private static instance: Faker;
    private random: SeededRandom;

    private constructor(seed?: number) {
        this.random = new SeededRandom(seed);
    }

    static getInstance(seed?: number): Faker {
        if (!Faker.instance) {
            Faker.instance = new Faker(seed);
        }
        return Faker.instance;
    }

    /**
     * Set seed for reproducible data
     */
    seed(value: number): this {
        this.random.setSeed(value);
        return this;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PERSON
    // ─────────────────────────────────────────────────────────────────────────

    firstName(): string {
        return this.random.pick(DATA.firstNames);
    }

    lastName(): string {
        return this.random.pick(DATA.lastNames);
    }

    fullName(): string {
        return `${this.firstName()} ${this.lastName()}`;
    }

    email(firstName?: string, lastName?: string): string {
        const fn = (firstName || this.firstName()).toLowerCase();
        const ln = (lastName || this.lastName()).toLowerCase();
        const domain = this.random.pick(DATA.domains);
        const num = this.random.int(1, 999);
        return `${fn}.${ln}${num}@${domain}`;
    }

    username(): string {
        const first = this.firstName().toLowerCase();
        const num = this.random.int(1, 9999);
        return `${first}${num}`;
    }

    avatar(): string {
        const id = this.random.int(1, 1000);
        return `https://i.pravatar.cc/150?img=${id}`;
    }

    jobTitle(): string {
        return this.random.pick(DATA.jobTitles);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADDRESS
    // ─────────────────────────────────────────────────────────────────────────

    streetAddress(): string {
        const num = this.random.int(1, 9999);
        const street = this.random.pick(DATA.streets);
        return `${num} ${street}`;
    }

    city(): string {
        return this.random.pick(DATA.cities);
    }

    state(): string {
        const states = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
        return this.random.pick(states);
    }

    zipCode(): string {
        return String(this.random.int(10000, 99999));
    }

    country(): string {
        return this.random.pick(DATA.countries);
    }

    address(): { street: string; city: string; state: string; zip: string; country: string } {
        return {
            street: this.streetAddress(),
            city: this.city(),
            state: this.state(),
            zip: this.zipCode(),
            country: this.country()
        };
    }

    latitude(): number {
        return this.random.float(-90, 90);
    }

    longitude(): number {
        return this.random.float(-180, 180);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COMPANY
    // ─────────────────────────────────────────────────────────────────────────

    company(): string {
        return this.random.pick(DATA.companies);
    }

    companyName(): string {
        const suffixes = ['Inc', 'LLC', 'Corp', 'Ltd', 'Group', 'Solutions'];
        return `${this.lastName()} ${this.random.pick(suffixes)}`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNET
    // ─────────────────────────────────────────────────────────────────────────

    url(): string {
        const protocols = ['http', 'https'];
        const protocol = this.random.pick(protocols);
        const domain = this.random.pick(DATA.domains);
        return `${protocol}://${domain}`;
    }

    ip(): string {
        return `${this.random.int(1, 255)}.${this.random.int(0, 255)}.${this.random.int(0, 255)}.${this.random.int(1, 255)}`;
    }

    ipv6(): string {
        const parts: string[] = [];
        for (let i = 0; i < 8; i++) {
            parts.push(this.random.int(0, 65535).toString(16).padStart(4, '0'));
        }
        return parts.join(':');
    }

    mac(): string {
        const parts: string[] = [];
        for (let i = 0; i < 6; i++) {
            parts.push(this.random.int(0, 255).toString(16).padStart(2, '0'));
        }
        return parts.join(':');
    }

    userAgent(): string {
        const browsers = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Firefox/120.0'
        ];
        return this.random.pick(browsers);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEXT
    // ─────────────────────────────────────────────────────────────────────────

    word(): string {
        return this.random.pick(DATA.words);
    }

    words(count: number = 5): string {
        return Array.from({ length: count }, () => this.word()).join(' ');
    }

    sentence(wordCount: number = 10): string {
        const words = this.words(wordCount);
        return words.charAt(0).toUpperCase() + words.slice(1) + '.';
    }

    paragraph(sentenceCount: number = 5): string {
        return Array.from({ length: sentenceCount }, () => this.sentence()).join(' ');
    }

    text(paragraphCount: number = 3): string {
        return Array.from({ length: paragraphCount }, () => this.paragraph()).join('\n\n');
    }

    slug(wordCount: number = 3): string {
        return this.words(wordCount).toLowerCase().replace(/\s+/g, '-');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NUMBERS
    // ─────────────────────────────────────────────────────────────────────────

    number(min: number = 0, max: number = 1000): number {
        return this.random.int(min, max);
    }

    float(min: number = 0, max: number = 100, precision: number = 2): number {
        const value = this.random.float(min, max);
        return Number(value.toFixed(precision));
    }

    price(min: number = 1, max: number = 1000): string {
        return this.float(min, max, 2).toFixed(2);
    }

    percentage(): number {
        return this.random.int(0, 100);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DATE & TIME
    // ─────────────────────────────────────────────────────────────────────────

    date(start?: Date, end?: Date): Date {
        const startTime = start?.getTime() || Date.now() - 365 * 24 * 60 * 60 * 1000;
        const endTime = end?.getTime() || Date.now();
        return new Date(this.random.int(startTime, endTime));
    }

    pastDate(years: number = 1): Date {
        const now = Date.now();
        const past = now - years * 365 * 24 * 60 * 60 * 1000;
        return new Date(this.random.int(past, now));
    }

    futureDate(years: number = 1): Date {
        const now = Date.now();
        const future = now + years * 365 * 24 * 60 * 60 * 1000;
        return new Date(this.random.int(now, future));
    }

    timestamp(): number {
        return this.date().getTime();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // IDENTIFIERS
    // ─────────────────────────────────────────────────────────────────────────

    uuid(): string {
        const hex = '0123456789abcdef';
        let uuid = '';
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid += '-';
            } else if (i === 14) {
                uuid += '4';
            } else if (i === 19) {
                uuid += hex[this.random.int(8, 11)];
            } else {
                uuid += hex[this.random.int(0, 15)];
            }
        }
        return uuid;
    }

    objectId(): string {
        const hex = '0123456789abcdef';
        return Array.from({ length: 24 }, () => hex[this.random.int(0, 15)]).join('');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MISC
    // ─────────────────────────────────────────────────────────────────────────

    boolean(probability: number = 0.5): boolean {
        return this.random.boolean(probability);
    }

    color(): string {
        return this.random.pick(DATA.colors);
    }

    hexColor(): string {
        const hex = '0123456789ABCDEF';
        return '#' + Array.from({ length: 6 }, () => hex[this.random.int(0, 15)]).join('');
    }

    phone(): string {
        const area = this.random.int(200, 999);
        const exchange = this.random.int(200, 999);
        const subscriber = this.random.int(1000, 9999);
        return `(${area}) ${exchange}-${subscriber}`;
    }

    pick<T>(array: T[]): T {
        return this.random.pick(array);
    }

    shuffle<T>(array: T[]): T[] {
        return this.random.shuffle(array);
    }

    sample<T>(array: T[], count: number): T[] {
        return this.shuffle(array).slice(0, count);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const faker = Faker.getInstance();

// Module shortcuts
export const fake = {
    // Person
    name: () => faker.fullName(),
    firstName: () => faker.firstName(),
    lastName: () => faker.lastName(),
    email: () => faker.email(),
    username: () => faker.username(),
    avatar: () => faker.avatar(),
    job: () => faker.jobTitle(),

    // Address
    address: () => faker.address(),
    city: () => faker.city(),
    country: () => faker.country(),
    zip: () => faker.zipCode(),

    // Company
    company: () => faker.companyName(),

    // Internet
    url: () => faker.url(),
    ip: () => faker.ip(),

    // Text
    word: () => faker.word(),
    words: (n?: number) => faker.words(n),
    sentence: () => faker.sentence(),
    paragraph: () => faker.paragraph(),
    slug: () => faker.slug(),

    // Numbers
    number: (min?: number, max?: number) => faker.number(min, max),
    float: (min?: number, max?: number) => faker.float(min, max),
    price: () => faker.price(),

    // Date
    date: () => faker.date(),
    past: () => faker.pastDate(),
    future: () => faker.futureDate(),

    // IDs
    uuid: () => faker.uuid(),
    id: () => faker.objectId(),

    // Misc
    bool: () => faker.boolean(),
    color: () => faker.hexColor(),
    phone: () => faker.phone(),
    pick: <T>(arr: T[]) => faker.pick(arr)
};

export default Faker;
