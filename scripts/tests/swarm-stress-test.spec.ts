/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🧪 SWARM STRESS TEST - JEST INTEGRATION
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Jest wrapper for "THE HAMMER" Protocol stress test
 * Run with: npm run test:swarm
 * 
 * @copyright 2025 Димитър Продромов. All Rights Reserved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { SwarmStressTest, STRESS_CONFIG, StressMetrics } from './swarm-stress-test';

// Increase Jest timeout for stress test
jest.setTimeout(120000); // 2 minutes

describe('🔥 Swarm Extreme Stress Test - "THE HAMMER" Protocol', () => {
    let testResults: StressMetrics;

    beforeAll(async () => {
        console.log('\n🚀 Starting Swarm Stress Test...\n');
        
        // Override config for faster CI/CD runs
        (STRESS_CONFIG as any).WORKER_COUNT = 500;
        (STRESS_CONFIG as any).TEST_DURATION_MS = 15000; // 15 seconds
        (STRESS_CONFIG as any).CHAOS_START_DELAY_MS = 3000;
        
        const test = new SwarmStressTest();
        testResults = await test.run();
    });

    describe('📈 Message Throughput', () => {
        it('should generate messages at high throughput', () => {
            expect(testResults.messagesGenerated).toBeGreaterThan(10000);
            console.log(`   ✓ Generated ${testResults.messagesGenerated.toLocaleString()} messages`);
        });

        it('should receive majority of messages', () => {
            const receiveRate = testResults.messagesReceived / testResults.messagesGenerated;
            expect(receiveRate).toBeGreaterThan(0.9); // 90% receive rate
            console.log(`   ✓ Receive rate: ${(receiveRate * 100).toFixed(2)}%`);
        });

        it('should maintain throughput above 1000 msg/sec', () => {
            expect(testResults.throughput).toBeGreaterThan(1000);
            console.log(`   ✓ Throughput: ${testResults.throughput.toFixed(0)} msg/sec`);
        });
    });

    describe('📉 Message Loss', () => {
        it('should have less than 5% message loss', () => {
            expect(testResults.lossPercentage).toBeLessThan(5);
            console.log(`   ✓ Loss rate: ${testResults.lossPercentage.toFixed(4)}%`);
        });

        it('should not reach breaking point under normal load', () => {
            // Breaking point is acceptable, but should be at high worker count
            if (testResults.breakingPointReached) {
                expect(testResults.breakingPointWorkerCount).toBeGreaterThan(300);
                console.log(`   ⚠ Breaking point at ${testResults.breakingPointWorkerCount} workers`);
            } else {
                console.log(`   ✓ No breaking point reached`);
            }
        });
    });

    describe('⏱️ Latency', () => {
        it('should have average latency under 100ms', () => {
            expect(testResults.avgLatency).toBeLessThan(100);
            console.log(`   ✓ Avg latency: ${testResults.avgLatency.toFixed(2)}ms`);
        });

        it('should have P99 latency under 500ms', () => {
            expect(testResults.p99Latency).toBeLessThan(500);
            console.log(`   ✓ P99 latency: ${testResults.p99Latency.toFixed(2)}ms`);
        });

        it('should have max latency under 2000ms', () => {
            expect(testResults.maxLatency).toBeLessThan(2000);
            console.log(`   ✓ Max latency: ${testResults.maxLatency.toFixed(2)}ms`);
        });
    });

    describe('🔒 SharedArrayBuffer Race Conditions', () => {
        it('should have ZERO race conditions', () => {
            expect(testResults.raceConditionsDetected).toBe(0);
            console.log(`   ✓ Race conditions: ${testResults.raceConditionsDetected}`);
        });
    });

    describe('💀 Chaos Resilience', () => {
        it('should assassinate workers during test', () => {
            expect(testResults.workersAssassinated).toBeGreaterThan(0);
            console.log(`   ✓ Workers assassinated: ${testResults.workersAssassinated}`);
        });

        it('should respawn all assassinated workers', () => {
            expect(testResults.workersRespawned).toBe(testResults.workersAssassinated);
            console.log(`   ✓ Workers respawned: ${testResults.workersRespawned}`);
        });
    });

    describe('⚡ Load Balancing', () => {
        it('should redistribute tasks within 500ms threshold', () => {
            const maxLoadBalanceTime = Math.max(...testResults.loadBalanceTime, 0);
            expect(maxLoadBalanceTime).toBeLessThan(500);
            console.log(`   ✓ Max load balance time: ${maxLoadBalanceTime}ms`);
        });

        it('should have average load balance time under 300ms', () => {
            const avgTime = testResults.loadBalanceTime.length > 0
                ? testResults.loadBalanceTime.reduce((a, b) => a + b, 0) / testResults.loadBalanceTime.length
                : 0;
            expect(avgTime).toBeLessThan(300);
            console.log(`   ✓ Avg load balance time: ${avgTime.toFixed(2)}ms`);
        });
    });

    describe('🧠 Memory Management', () => {
        it('should keep peak memory under 1GB', () => {
            expect(testResults.peakMemoryUsage).toBeLessThan(1024);
            console.log(`   ✓ Peak memory: ${testResults.peakMemoryUsage.toFixed(2)} MB`);
        });
    });

    afterAll(() => {
        console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  🏁 STRESS TEST COMPLETE                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
    });
});

// Quick sanity check tests (for CI/CD)
describe('🧪 Swarm Quick Sanity Check', () => {
    it('should export SwarmStressTest class', () => {
        expect(SwarmStressTest).toBeDefined();
        expect(typeof SwarmStressTest).toBe('function');
    });

    it('should have valid STRESS_CONFIG', () => {
        expect(STRESS_CONFIG.WORKER_COUNT).toBeGreaterThan(0);
        expect(STRESS_CONFIG.HAMMER_INTERVAL_MS).toBeGreaterThan(0);
        expect(STRESS_CONFIG.TEST_DURATION_MS).toBeGreaterThan(0);
    });

    it('should calculate WORKERS_PER_THREAD correctly', () => {
        const expected = Math.ceil(STRESS_CONFIG.WORKER_COUNT / STRESS_CONFIG.THREAD_POOL_SIZE);
        expect(STRESS_CONFIG.WORKERS_PER_THREAD).toBe(expected);
    });
});
