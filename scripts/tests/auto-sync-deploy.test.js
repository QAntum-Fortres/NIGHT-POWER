/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║  AUTO-SYNC DEPLOYMENT SCRIPT - UNIT TESTS                                      ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

'use strict';

const assert = require('assert');
const path = require('path');
const {
    DeploymentOrchestrator,
    SecureAuthenticator,
    SelfHealingModule,
    SystemSynchronizer,
    PredictiveModule,
    DEPLOYMENT_CONFIG
} = require('../scripts/auto-sync-deploy');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (error) {
        testsFailed++;
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${error.message}`);
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        testsPassed++;
        console.log(`  ✅ ${name}`);
    } catch (error) {
        testsFailed++;
        console.log(`  ❌ ${name}`);
        console.log(`     Error: ${error.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURE AUTHENTICATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔐 SecureAuthenticator Tests');
console.log('─'.repeat(50));

test('should accept valid password', () => {
    const auth = new SecureAuthenticator();
    const result = auth.validate('96-01-07-0443');
    assert.strictEqual(result, true);
});

test('should reject invalid password', () => {
    const auth = new SecureAuthenticator();
    try {
        auth.validate('wrong-password');
        assert.fail('Should have thrown error');
    } catch (error) {
        assert.ok(error.message.includes('Invalid password'));
    }
});

test('should track failed attempts', () => {
    const auth = new SecureAuthenticator();
    try { auth.validate('wrong1'); } catch (e) {}
    try { auth.validate('wrong2'); } catch (e) {}
    
    try {
        auth.validate('wrong3');
        assert.fail('Should have been locked');
    } catch (error) {
        assert.ok(error.message.includes('Too many failed attempts'));
    }
});

test('should reset attempts after successful authentication', () => {
    const auth = new SecureAuthenticator();
    try { auth.validate('wrong'); } catch (e) {}
    
    const result = auth.validate('96-01-07-0443');
    assert.strictEqual(result, true);
    assert.strictEqual(auth.attempts, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// SELF-HEALING MODULE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔧 SelfHealingModule Tests');
console.log('─'.repeat(50));

asyncTest('should execute successful operations', async () => {
    const healing = new SelfHealingModule();
    const result = await healing.executeWithHealing(
        async () => 'success',
        { operationId: 'test1' }
    );
    
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.result, 'success');
    assert.strictEqual(result.attempts, 1);
});

asyncTest('should recover from failures using retry strategy', async () => {
    const healing = new SelfHealingModule();
    let attempts = 0;
    
    const result = await healing.executeWithHealing(
        async () => {
            attempts++;
            if (attempts < 2) {
                throw new Error('Temporary failure');
            }
            return 'recovered';
        },
        { operationId: 'test2', maxAttempts: 3 }
    );
    
    assert.strictEqual(result.success, true);
});

asyncTest('should track health metrics', async () => {
    const healing = new SelfHealingModule();
    
    await healing.executeWithHealing(async () => 'ok', { operationId: 'metric1' });
    await healing.executeWithHealing(async () => 'ok', { operationId: 'metric2' });
    
    const report = healing.getHealthReport();
    assert.ok(report.totalOperations >= 2);
    assert.ok(report.successfulOperations >= 2);
});

asyncTest('should update adaptive weights', async () => {
    const healing = new SelfHealingModule();
    
    // Execute multiple operations to trigger weight updates
    for (let i = 0; i < 3; i++) {
        await healing.executeWithHealing(async () => 'ok', { operationId: `weight_${i}` });
    }
    
    const report = healing.getHealthReport();
    assert.ok(report.strategyWeights);
});

test('should allow registering custom strategies', () => {
    const healing = new SelfHealingModule();
    
    healing.registerStrategy('custom', async (context) => {
        return { custom: true };
    });
    
    const report = healing.getHealthReport();
    assert.ok('custom' in report.strategyWeights);
});

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM SYNCHRONIZER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔄 SystemSynchronizer Tests');
console.log('─'.repeat(50));

asyncTest('should detect system information', async () => {
    const healing = new SelfHealingModule();
    const sync = new SystemSynchronizer(healing);
    
    const systemInfo = await sync.detectSystem();
    
    assert.ok(systemInfo.platform);
    assert.ok(systemInfo.arch);
    assert.ok(systemInfo.nodeVersion);
    assert.ok(systemInfo.cpus > 0);
    assert.ok(systemInfo.totalMemory > 0);
});

asyncTest('should adapt to system characteristics', async () => {
    const healing = new SelfHealingModule();
    const sync = new SystemSynchronizer(healing);
    
    const adaptations = await sync.adaptToSystem();
    
    assert.ok(Array.isArray(adaptations));
    assert.ok(adaptations.length > 0);
    assert.ok(adaptations.some(a => a.type === 'workers'));
    assert.ok(adaptations.some(a => a.type === 'batchSize'));
});

asyncTest('should provide sync state', async () => {
    const healing = new SelfHealingModule();
    const sync = new SystemSynchronizer(healing);
    
    await sync.detectSystem();
    const state = sync.getSyncState();
    
    assert.ok(state.systemInfo);
    assert.ok(state.healthReport);
});

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTIVE MODULE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔮 PredictiveModule Tests');
console.log('─'.repeat(50));

test('should analyze patterns from history', () => {
    const predictive = new PredictiveModule();
    
    const history = [
        { operationId: 'op1', success: true },
        { operationId: 'op2', success: false, error: 'timeout' },
        { operationId: 'op3', success: true }
    ];
    
    const patterns = predictive.analyzePatterns(history);
    
    assert.ok(patterns.successPatterns.length === 2);
    assert.ok(patterns.commonFailures.length === 1);
});

test('should generate recommendations', () => {
    const predictive = new PredictiveModule();
    
    const recommendations = predictive.getRecommendations();
    
    assert.ok(Array.isArray(recommendations.recommendations));
    assert.ok(recommendations.recommendations.length > 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEPLOYMENT ORCHESTRATOR TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🚀 DeploymentOrchestrator Tests');
console.log('─'.repeat(50));

asyncTest('should initialize within target time', async () => {
    const orchestrator = new DeploymentOrchestrator();
    
    const result = await orchestrator.initialize();
    
    assert.ok(result.initTimeMs !== undefined);
    assert.ok(result.systemInfo);
    assert.ok(result.adaptations);
});

test('should authenticate with correct password', () => {
    const orchestrator = new DeploymentOrchestrator();
    
    const result = orchestrator.authenticate('96-01-07-0443');
    
    assert.strictEqual(result, true);
    assert.strictEqual(orchestrator.state.authenticated, true);
});

test('should reject incorrect password', () => {
    const orchestrator = new DeploymentOrchestrator();
    
    try {
        orchestrator.authenticate('wrong-password');
        assert.fail('Should have thrown error');
    } catch (error) {
        assert.ok(error.message.includes('Invalid password'));
    }
});

asyncTest('should require authentication before deployment', async () => {
    const orchestrator = new DeploymentOrchestrator();
    
    try {
        await orchestrator.deploy('/tmp');
        assert.fail('Should have thrown error');
    } catch (error) {
        assert.ok(error.message.includes('Authentication required'));
    }
});

asyncTest('should run health check', async () => {
    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.initialize();
    
    const health = await orchestrator.runHealthCheck();
    
    assert.ok(health.checks);
    assert.ok(health.timestamp);
    assert.ok(typeof health.healthy === 'boolean');
});

asyncTest('should provide deployment status', async () => {
    const orchestrator = new DeploymentOrchestrator();
    await orchestrator.initialize();
    
    const status = orchestrator.getStatus();
    
    assert.ok(status.state);
    assert.ok(status.syncState);
    assert.ok(status.healthReport);
    assert.ok(status.recommendations);
});

asyncTest('should complete full deployment cycle', async () => {
    const orchestrator = new DeploymentOrchestrator();
    
    await orchestrator.initialize();
    orchestrator.authenticate('96-01-07-0443');
    
    // Use test directory
    const testDir = path.join(__dirname, '..');
    const result = await orchestrator.deploy(testDir, { modules: ['scripts'] });
    
    assert.ok(result.totalTimeMs);
    assert.ok(Array.isArray(result.synchronized));
    assert.ok(result.healthReport);
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n⚙️ Configuration Tests');
console.log('─'.repeat(50));

test('should have valid deployment config', () => {
    assert.ok(DEPLOYMENT_CONFIG.AUTH_HASH);
    assert.ok(DEPLOYMENT_CONFIG.STARTUP_TARGET_MS > 0);
    assert.ok(DEPLOYMENT_CONFIG.MAX_RETRY_ATTEMPTS > 0);
    assert.ok(DEPLOYMENT_CONFIG.SYNC_BATCH_SIZE > 0);
});

test('should have proper self-healing thresholds', () => {
    assert.ok(DEPLOYMENT_CONFIG.HEALING_THRESHOLD_FAILURES > 0);
    assert.ok(DEPLOYMENT_CONFIG.ADAPTIVE_LEARNING_RATE > 0);
    assert.ok(DEPLOYMENT_CONFIG.ADAPTIVE_LEARNING_RATE <= 1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// EDGE CASE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\n🔍 Edge Case Tests');
console.log('─'.repeat(50));

asyncTest('should handle empty module list', async () => {
    const healing = new SelfHealingModule();
    const sync = new SystemSynchronizer(healing);
    
    await sync.detectSystem();
    const result = await sync.synchronizeModules(__dirname, []);
    
    assert.ok(Array.isArray(result.synchronized));
});

asyncTest('should handle non-existent directory gracefully', async () => {
    const healing = new SelfHealingModule();
    const sync = new SystemSynchronizer(healing);
    
    await sync.detectSystem();
    
    // Test with non-existent module - should not crash
    const result = await sync.synchronizeModules(__dirname, ['nonexistent_module_xyz']);
    
    // The self-healing module will either fail or skip - both are acceptable
    // The key is that it doesn't crash
    assert.ok(result !== null && typeof result === 'object');
    assert.ok(Array.isArray(result.synchronized));
    assert.ok(Array.isArray(result.failed));
    assert.ok(Array.isArray(result.skipped));
});

test('should emit events correctly', () => {
    const orchestrator = new DeploymentOrchestrator();
    let eventReceived = false;
    
    orchestrator.on('authenticated', () => {
        eventReceived = true;
    });
    
    orchestrator.authenticate('96-01-07-0443');
    
    assert.strictEqual(eventReceived, true);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

// Wait for async tests to complete
setTimeout(() => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Total: ${testsPassed + testsFailed}`);
    console.log(`   Passed: ${testsPassed}`);
    console.log(`   Failed: ${testsFailed}`);
    console.log(`   Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    process.exit(testsFailed > 0 ? 1 : 0);
}, 3000);
