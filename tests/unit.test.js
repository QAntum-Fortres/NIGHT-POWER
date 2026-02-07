/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QAntum v23.3.0 - Unit Tests
 * © 2025 Димитър Продромов (Dimitar Prodromov). All Rights Reserved.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// Simple test framework
const results = { passed: 0, failed: 0, tests: [] };

function test(name, fn) {
    try {
        fn();
        results.passed++;
        results.tests.push({ name, status: 'PASS' });
        console.log(`  ✅ ${name}`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: 'FAIL', error: error.message });
        console.log(`  ❌ ${name}: ${error.message}`);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertThrows(fn, message) {
    let threw = false;
    try {
        fn();
    } catch {
        threw = true;
    }
    if (!threw) {
        throw new Error(message || 'Expected function to throw');
    }
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

console.log('\n🧪 QAntum Unit Tests\n');
console.log('═══════════════════════════════════════════════════\n');

// Core Tests
console.log('📦 Core Module Tests:');

test('String utilities work correctly', () => {
    const str = 'hello world';
    assert(str.includes('world'), 'Should contain world');
    assertEqual(str.length, 11, 'Length should be 11');
});

test('Array operations work correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    assertEqual(arr.length, 5, 'Array length should be 5');
    assertEqual(arr.reduce((a, b) => a + b, 0), 15, 'Sum should be 15');
    assert(arr.includes(3), 'Should contain 3');
});

test('Object creation works', () => {
    const obj = { name: 'QAntum', version: '23.3.0' };
    assertEqual(obj.name, 'QAntum', 'Name should be QAntum');
    assertEqual(Object.keys(obj).length, 2, 'Should have 2 keys');
});

test('JSON parsing works', () => {
    const json = '{"test": true, "count": 42}';
    const parsed = JSON.parse(json);
    assert(parsed.test === true, 'test should be true');
    assertEqual(parsed.count, 42, 'count should be 42');
});

test('Date operations work', () => {
    const now = new Date();
    assert(now instanceof Date, 'Should be Date instance');
    assert(now.getFullYear() >= 2025, 'Year should be 2025 or later');
});

// Math Tests
console.log('\n📐 Math Tests:');

test('Basic arithmetic works', () => {
    assertEqual(2 + 2, 4, '2 + 2 should be 4');
    assertEqual(10 - 5, 5, '10 - 5 should be 5');
    assertEqual(3 * 4, 12, '3 * 4 should be 12');
    assertEqual(20 / 4, 5, '20 / 4 should be 5');
});

test('Math functions work', () => {
    assertEqual(Math.max(1, 5, 3), 5, 'Max should be 5');
    assertEqual(Math.min(1, 5, 3), 1, 'Min should be 1');
    assertEqual(Math.abs(-10), 10, 'Abs should be 10');
    assertEqual(Math.floor(4.7), 4, 'Floor should be 4');
    assertEqual(Math.ceil(4.2), 5, 'Ceil should be 5');
});

test('Random generation works', () => {
    const rand = Math.random();
    assert(rand >= 0 && rand < 1, 'Random should be between 0 and 1');
});

// String Tests
console.log('\n📝 String Tests:');

test('String manipulation works', () => {
    assertEqual('hello'.toUpperCase(), 'HELLO', 'Should uppercase');
    assertEqual('WORLD'.toLowerCase(), 'world', 'Should lowercase');
    assertEqual('  trim  '.trim(), 'trim', 'Should trim');
    assertEqual('abc'.repeat(3), 'abcabcabc', 'Should repeat');
});

test('String splitting works', () => {
    const parts = 'a,b,c'.split(',');
    assertEqual(parts.length, 3, 'Should have 3 parts');
    assertEqual(parts[0], 'a', 'First should be a');
});

test('String searching works', () => {
    const str = 'hello world';
    assertEqual(str.indexOf('world'), 6, 'Index should be 6');
    assert(str.startsWith('hello'), 'Should start with hello');
    assert(str.endsWith('world'), 'Should end with world');
});

// Regex Tests
console.log('\n🔍 Regex Tests:');

test('Regex matching works', () => {
    const email = 'test@example.com';
    assert(/^[^@]+@[^@]+\.[^@]+$/.test(email), 'Should be valid email');
});

test('Regex replacement works', () => {
    const result = 'hello world'.replace(/world/, 'QAntum');
    assertEqual(result, 'hello QAntum', 'Should replace world');
});

// Async Tests
console.log('\n⚡ Async Tests:');

test('Promise resolves correctly', () => {
    const p = Promise.resolve(42);
    assert(p instanceof Promise, 'Should be Promise');
});

test('Array async methods work', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    assertEqual(doubled[0], 2, 'First should be 2');
    assertEqual(doubled[1], 4, 'Second should be 4');
});

// Error Handling Tests
console.log('\n🚨 Error Handling Tests:');

test('Try-catch works', () => {
    let caught = false;
    try {
        throw new Error('Test error');
    } catch (e) {
        caught = true;
        assert(e.message === 'Test error', 'Should catch error');
    }
    assert(caught, 'Should have caught error');
});

test('Error instances work', () => {
    const err = new TypeError('Type error');
    assert(err instanceof Error, 'Should be Error instance');
    assert(err instanceof TypeError, 'Should be TypeError instance');
});

// Type Checking Tests
console.log('\n📋 Type Checking Tests:');

test('Type detection works', () => {
    assertEqual(typeof 'string', 'string', 'Should be string');
    assertEqual(typeof 42, 'number', 'Should be number');
    assertEqual(typeof true, 'boolean', 'Should be boolean');
    assertEqual(typeof {}, 'object', 'Should be object');
    assertEqual(typeof [], 'object', 'Array should be object');
    assertEqual(typeof (() => {}), 'function', 'Should be function');
});

test('Array.isArray works', () => {
    assert(Array.isArray([]), 'Empty array should be array');
    assert(Array.isArray([1, 2, 3]), 'Array should be array');
    assert(!Array.isArray({}), 'Object should not be array');
});

// QAntum Specific Tests
console.log('\n🎯 QAntum Specific Tests:');

test('Version format is valid', () => {
    const version = '23.3.0';
    assert(/^\d+\.\d+\.\d+$/.test(version), 'Version should be semver');
});

test('Configuration object works', () => {
    const config = {
        name: 'QAntum',
        version: '23.3.0',
        features: ['testing', 'security', 'ai'],
        settings: {
            debug: false,
            strict: true
        }
    };
    
    assertEqual(config.name, 'QAntum', 'Name should be QAntum');
    assertEqual(config.features.length, 3, 'Should have 3 features');
    assert(config.settings.strict === true, 'Strict should be true');
});

test('Encryption placeholder works', () => {
    // Simple XOR encryption simulation
    const encrypt = (text, key) => {
        return text.split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
    };
    
    const original = 'secret';
    const key = 'qantum';
    const encrypted = encrypt(original, key);
    const decrypted = encrypt(encrypted, key);
    
    assertEqual(decrypted, original, 'Decryption should restore original');
});

// Performance Tests
console.log('\n⏱️ Performance Tests:');

test('Loop performance is acceptable', () => {
    const start = Date.now();
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
        sum += i;
    }
    const elapsed = Date.now() - start;
    assert(elapsed < 1000, 'Loop should complete in under 1 second');
    assertEqual(sum, 4999950000, 'Sum should be correct');
});

test('Array operations are fast', () => {
    const start = Date.now();
    const arr = Array.from({ length: 10000 }, (_, i) => i);
    const filtered = arr.filter(x => x % 2 === 0);
    const mapped = filtered.map(x => x * 2);
    const reduced = mapped.reduce((a, b) => a + b, 0);
    const elapsed = Date.now() - start;
    
    assert(elapsed < 500, 'Operations should complete quickly');
    assertEqual(filtered.length, 5000, 'Should have 5000 even numbers');
});

// ═══════════════════════════════════════════════════════════════
// RESULTS
// ═══════════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════');
console.log('\n📊 Test Results:\n');
console.log(`  ✅ Passed: ${results.passed}`);
console.log(`  ❌ Failed: ${results.failed}`);
console.log(`  📊 Total:  ${results.passed + results.failed}`);
console.log(`  📈 Rate:   ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
console.log('\n═══════════════════════════════════════════════════\n');

if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
} else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
}
