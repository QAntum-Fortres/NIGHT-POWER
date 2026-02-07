/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM DATA MODULE                                                          ║
 * ║   "Unified test data management facade"                                       ║
 * ║                                                                               ║
 * ║   TODO B #38-40 - Data Module Complete                                        ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
    Factory,
    FactoryManager,
    FactoryBuilder,
    FactoryConfig,
    FactoryDefinition,
    FactoryTrait,
    getFactoryManager,
    defineFactory,
    factory,
    factories
} from './factory';

export {
    Faker,
    faker,
    fake
} from './faker';

export {
    FixtureManager,
    FixtureSet,
    FixtureConfig,
    FixtureLoader,
    FixtureData,
    getFixtureManager,
    configureFixtures,
    fixture
} from './fixtures';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIFIED DATA
// ═══════════════════════════════════════════════════════════════════════════════

import { Factory, FactoryManager, defineFactory } from './factory';
import { Faker, faker, fake } from './faker';
import { FixtureManager, fixture } from './fixtures';

/**
 * Unified QAntum Data
 */
export class QAntumData {
    private static instance: QAntumData;
    
    readonly faker: Faker;
    readonly factories: FactoryManager;
    readonly fixtures: FixtureManager;

    private constructor() {
        this.faker = faker;
        this.factories = FactoryManager.getInstance();
        this.fixtures = FixtureManager.getInstance();
    }

    static getInstance(): QAntumData {
        if (!QAntumData.instance) {
            QAntumData.instance = new QAntumData();
        }
        return QAntumData.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUICK DATA GENERATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate user data
     */
    user(overrides?: Partial<User>): User {
        return {
            id: this.faker.uuid(),
            firstName: this.faker.firstName(),
            lastName: this.faker.lastName(),
            email: this.faker.email(),
            username: this.faker.username(),
            avatar: this.faker.avatar(),
            createdAt: this.faker.pastDate(),
            ...overrides
        };
    }

    /**
     * Generate multiple users
     */
    users(count: number, overrides?: Partial<User>): User[] {
        return Array.from({ length: count }, () => this.user(overrides));
    }

    /**
     * Generate product data
     */
    product(overrides?: Partial<Product>): Product {
        return {
            id: this.faker.uuid(),
            name: this.faker.words(2),
            description: this.faker.paragraph(),
            price: parseFloat(this.faker.price()),
            category: this.faker.pick(['Electronics', 'Clothing', 'Books', 'Food', 'Sports']),
            inStock: this.faker.boolean(0.8),
            createdAt: this.faker.pastDate(),
            ...overrides
        };
    }

    /**
     * Generate multiple products
     */
    products(count: number, overrides?: Partial<Product>): Product[] {
        return Array.from({ length: count }, () => this.product(overrides));
    }

    /**
     * Generate order data
     */
    order(overrides?: Partial<Order>): Order {
        const items = Array.from({ length: this.faker.number(1, 5) }, () => ({
            productId: this.faker.uuid(),
            quantity: this.faker.number(1, 10),
            price: parseFloat(this.faker.price())
        }));

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        return {
            id: this.faker.uuid(),
            userId: this.faker.uuid(),
            items,
            total,
            status: this.faker.pick(['pending', 'processing', 'shipped', 'delivered']),
            createdAt: this.faker.pastDate(),
            ...overrides
        };
    }

    /**
     * Generate address
     */
    address(): Address {
        return this.faker.address() as Address;
    }

    /**
     * Generate company
     */
    company(overrides?: Partial<Company>): Company {
        return {
            id: this.faker.uuid(),
            name: this.faker.companyName(),
            industry: this.faker.pick(['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing']),
            employees: this.faker.number(10, 10000),
            website: this.faker.url(),
            address: this.address(),
            ...overrides
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEEDING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Set seed for reproducible data
     */
    seed(value: number): this {
        this.faker.seed(value);
        return this;
    }

    /**
     * Generate seeded data set
     */
    seededDataSet(seed: number): {
        users: User[];
        products: Product[];
        orders: Order[];
    } {
        this.seed(seed);
        
        const users = this.users(10);
        const products = this.products(20);
        const orders = Array.from({ length: 15 }, () => 
            this.order({ userId: this.faker.pick(users).id })
        );

        return { users, products, orders };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatar?: string;
    createdAt: Date;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    inStock: boolean;
    createdAt: Date;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    total: number;
    status: string;
    createdAt: Date;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface Company {
    id: string;
    name: string;
    industry: string;
    employees: number;
    website: string;
    address: Address;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export const getQAntumData = (): QAntumData => QAntumData.getInstance();

// Combined data utilities
export const data = {
    // Faker shortcuts
    fake,
    
    // Factory shortcuts
    factory: <T extends object>(name?: string) => new Factory<T>({ definition: () => ({} as T) }),
    define: defineFactory,
    
    // Fixture shortcuts
    fixture,
    
    // Quick generators
    user: (o?: Partial<User>) => QAntumData.getInstance().user(o),
    users: (n: number, o?: Partial<User>) => QAntumData.getInstance().users(n, o),
    product: (o?: Partial<Product>) => QAntumData.getInstance().product(o),
    products: (n: number, o?: Partial<Product>) => QAntumData.getInstance().products(n, o),
    order: (o?: Partial<Order>) => QAntumData.getInstance().order(o),
    company: (o?: Partial<Company>) => QAntumData.getInstance().company(o),
    address: () => QAntumData.getInstance().address(),
    
    // Seeding
    seed: (s: number) => QAntumData.getInstance().seed(s),
    seededSet: (s: number) => QAntumData.getInstance().seededDataSet(s)
};

export default QAntumData;
