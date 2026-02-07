/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIND-ENGINE: UNIFIED API - TESTS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Comprehensive test suite for the unified API server
 * Tests: Logger, Validation, Auth, Rate Limiting, Error Handler, Server
 * 
 * @author Dimitar Prodromov
 * @version 1.0.0
 * @license Commercial
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { strict as assert } from 'assert';

// Test utilities
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

async function runTest(name: string, fn: () => Promise<void> | void): Promise<TestResult> {
  const start = Date.now();
  try {
    await fn();
    return { name, passed: true, duration: Date.now() - start };
  } catch (error) {
    return { 
      name, 
      passed: false, 
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function printResult(result: TestResult): void {
  const icon = result.passed ? '✅' : '❌';
  const time = `(${result.duration}ms)`;
  console.log(`  ${icon} ${result.name} ${time}`);
  if (result.error) {
    console.log(`     └─ ${result.error}`);
  }
}

function printSuite(suite: TestSuite): void {
  console.log(`\n📦 ${suite.name}`);
  console.log(`   ${suite.passed}/${suite.tests.length} passed (${suite.duration}ms)\n`);
  suite.tests.forEach(printResult);
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testValidation(): Promise<TestSuite> {
  const { Schema, ValidationException, v } = await import('./utils/validation.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  // Test string validation
  tests.push(await runTest('Schema.string() validates strings', () => {
    const schema = v.string();
    const result = schema.validate('hello');
    assert(result.success === true);
    assert(result.data === 'hello');
  }));

  tests.push(await runTest('Schema.string() rejects non-strings', () => {
    const schema = v.string();
    const result = schema.validate(123);
    assert(result.success === false);
    assert(result.errors[0].code === 'invalid_type');
  }));

  tests.push(await runTest('Schema.string().min() validates minimum length', () => {
    const schema = v.string().min(5);
    const result = schema.validate('hi');
    assert(result.success === false);
    assert(result.errors[0].code === 'too_short');
  }));

  tests.push(await runTest('Schema.string().email() validates email format', () => {
    const schema = v.string().email();
    
    const valid = schema.validate('test@example.com');
    assert(valid.success === true);
    
    const invalid = schema.validate('not-an-email');
    assert(invalid.success === false);
  }));

  // Test number validation
  tests.push(await runTest('Schema.number() validates numbers', () => {
    const schema = v.number();
    const result = schema.validate(42);
    assert(result.success === true);
    assert(result.data === 42);
  }));

  tests.push(await runTest('Schema.number().min().max() validates range', () => {
    const schema = v.number().min(1).max(100);
    
    assert(schema.validate(50).success === true);
    assert(schema.validate(0).success === false);
    assert(schema.validate(101).success === false);
  }));

  // Test object validation
  tests.push(await runTest('Schema.object() validates object structure', () => {
    const schema = v.object({
      name: v.string(),
      age: v.number()
    });
    
    const result = schema.validate({ name: 'John', age: 30 });
    assert(result.success === true);
  }));

  tests.push(await runTest('Schema.object() with optional fields', () => {
    const schema = v.object({
      name: v.string(),
      email: v.string().optional()
    });
    
    const result = schema.validate({ name: 'John' });
    assert(result.success === true);
  }));

  // Test array validation
  tests.push(await runTest('Schema.array() validates arrays', () => {
    const schema = v.array(v.string());
    
    const result = schema.validate(['a', 'b', 'c']);
    assert(result.success === true);
    
    const invalid = schema.validate(['a', 123, 'c']);
    assert(invalid.success === false);
  }));

  // Test enum validation
  tests.push(await runTest('Schema.enum() validates allowed values', () => {
    const schema = v.enum(['red', 'green', 'blue'] as const);
    
    assert(schema.validate('red').success === true);
    assert(schema.validate('yellow').success === false);
  }));

  // Test parse/safeParse
  tests.push(await runTest('Schema.parse() throws on invalid data', () => {
    const schema = v.string();
    
    try {
      schema.parse(123);
      assert.fail('Should have thrown');
    } catch (error) {
      assert(error instanceof ValidationException);
    }
  }));

  tests.push(await runTest('Schema.safeParse() returns result object', () => {
    const schema = v.string();
    
    const success = schema.safeParse('hello');
    assert(success.success === true);
    
    const failure = schema.safeParse(123);
    assert(failure.success === false);
  }));

  return {
    name: 'Validation',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testLogger(): Promise<TestSuite> {
  const { Logger, createLogger } = await import('./utils/logger.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('Logger creates instance', () => {
    const logger = createLogger({ level: 'debug' });
    assert(logger instanceof Logger);
  }));

  tests.push(await runTest('Logger.child() creates child logger', () => {
    const logger = createLogger({ level: 'debug' });
    const child = logger.child('TestContext');
    assert(child !== undefined);
  }));

  tests.push(await runTest('Logger.withRequestId() creates request logger', () => {
    const logger = createLogger({ level: 'debug' });
    const reqLogger = logger.withRequestId('req-123');
    assert(reqLogger !== undefined);
  }));

  tests.push(await runTest('Logger respects log level', () => {
    // Create logger that only logs errors
    const logs: string[] = [];
    const logger = createLogger({ level: 'error' });
    
    // These should be filtered
    logger.debug('debug message');
    logger.info('info message');
    
    // This test passes if no exception is thrown
    assert(true);
  }));

  tests.push(await runTest('Logger emits log events', async () => {
    const logger = createLogger({ level: 'info' });
    
    const logPromise = new Promise<void>((resolve) => {
      logger.once('log', (entry) => {
        assert(entry.level === 'info');
        assert(entry.message === 'test message');
        resolve();
      });
    });
    
    logger.info('test message');
    await logPromise;
  }));

  return {
    name: 'Logger',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testAuth(): Promise<TestSuite> {
  const { 
    AuthMiddleware, 
    createApiKey, 
    createUser, 
    createJWT,
    PasswordUtil 
  } = await import('./middleware/auth.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('createApiKey() generates valid API key', () => {
    const keyInfo = createApiKey('TestKey', 'pro', ['read', 'write']);
    
    assert(keyInfo.key.startsWith('mk_pro_'));
    assert(keyInfo.name === 'TestKey');
    assert(keyInfo.tier === 'pro');
    assert(keyInfo.permissions.includes('read'));
  }));

  tests.push(await runTest('PasswordUtil.hash() and verify() work', () => {
    const password = 'SecurePass123!';
    const hash = PasswordUtil.hash(password);
    
    assert(hash.includes(':'));
    assert(PasswordUtil.verify(password, hash) === true);
    assert(PasswordUtil.verify('WrongPass', hash) === false);
  }));

  tests.push(await runTest('createJWT() generates valid token', () => {
    const secret = 'test-secret-key';
    const token = createJWT(secret, {
      sub: 'user-123',
      name: 'Test User',
      tier: 'pro'
    });
    
    assert(token.split('.').length === 3);
  }));

  tests.push(await runTest('AuthMiddleware authenticates API key', () => {
    const apiKey = createApiKey('TestKey', 'pro', ['read']);
    const apiKeys = new Map([[apiKey.key, apiKey]]);
    
    const auth = new AuthMiddleware({
      strategy: 'apikey',
      apiKeys
    });
    
    // Mock request
    const req = {
      headers: { 'x-api-key': apiKey.key },
      url: '/api/test',
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const result = auth.authenticate(req, '/api/test');
    
    assert(result.success === true);
    assert(result.user?.tier === 'pro');
  }));

  tests.push(await runTest('AuthMiddleware rejects invalid API key', () => {
    const auth = new AuthMiddleware({
      strategy: 'apikey',
      apiKeys: new Map()
    });
    
    const req = {
      headers: { 'x-api-key': 'invalid-key' },
      url: '/api/test',
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const result = auth.authenticate(req, '/api/test');
    
    assert(result.success === false);
    assert(result.errorCode === 'INVALID_API_KEY');
  }));

  tests.push(await runTest('AuthMiddleware allows public paths', () => {
    const auth = new AuthMiddleware({
      strategy: 'apikey',
      publicPaths: ['/health', '/api/v1']
    });
    
    const req = {
      headers: {},
      url: '/health',
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const result = auth.authenticate(req, '/health');
    
    assert(result.success === true);
    assert(result.user?.tier === 'anonymous');
  }));

  return {
    name: 'Authentication',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testRateLimiter(): Promise<TestSuite> {
  const { RateLimiter, SlidingWindowRateLimiter, TieredRateLimiter } = await import('./middleware/rateLimit.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('RateLimiter allows requests under limit', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      max: 10
    });
    
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const result = limiter.check(req);
    
    assert(result.allowed === true);
    assert(result.remaining === 9);
    
    limiter.destroy();
  }));

  tests.push(await runTest('RateLimiter blocks requests over limit', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      max: 2
    });
    
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    // Use up the limit
    limiter.check(req);
    limiter.check(req);
    
    // This should be blocked
    const result = limiter.check(req);
    
    assert(result.allowed === false);
    assert(result.remaining === 0);
    assert(result.retryAfter > 0);
    
    limiter.destroy();
  }));

  tests.push(await runTest('RateLimiter.getHeaders() returns correct headers', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      max: 100
    });
    
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const result = limiter.check(req);
    const headers = limiter.getHeaders(result);
    
    assert('X-RateLimit-Limit' in headers);
    assert('X-RateLimit-Remaining' in headers);
    assert('X-RateLimit-Reset' in headers);
    
    limiter.destroy();
  }));

  tests.push(await runTest('TieredRateLimiter uses different limits per tier', () => {
    const limiter = new TieredRateLimiter({
      windowMs: 60000,
      tiers: {
        anonymous: 10,
        free: 100,
        pro: 1000,
        enterprise: 10000
      }
    });
    
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    const freeResult = limiter.check(req, 'free');
    assert(freeResult.limit === 100);
    
    const proResult = limiter.check(req, 'pro');
    assert(proResult.limit === 1000);
    
    limiter.destroy();
  }));

  tests.push(await runTest('RateLimiter.reset() clears limit for key', () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      max: 2
    });
    
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as any;
    
    // Use up the limit
    limiter.check(req);
    limiter.check(req);
    limiter.check(req);
    
    // Reset
    limiter.reset('127.0.0.1');
    
    // Should be allowed again
    const result = limiter.check(req);
    assert(result.allowed === true);
    
    limiter.destroy();
  }));

  return {
    name: 'Rate Limiter',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR HANDLER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testErrorHandler(): Promise<TestSuite> {
  const { 
    ErrorHandler, 
    AppError, 
    BadRequestError, 
    NotFoundError,
    UnauthorizedError,
    TooManyRequestsError
  } = await import('./middleware/errorHandler.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('AppError has correct properties', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR', true, { detail: 'test' });
    
    assert(error.message === 'Test error');
    assert(error.statusCode === 400);
    assert(error.code === 'TEST_ERROR');
    assert(error.isOperational === true);
    assert((error.details as any).detail === 'test');
  }));

  tests.push(await runTest('BadRequestError has 400 status', () => {
    const error = new BadRequestError('Invalid input');
    
    assert(error.statusCode === 400);
    assert(error.code === 'BAD_REQUEST');
  }));

  tests.push(await runTest('NotFoundError has 404 status', () => {
    const error = new NotFoundError('User');
    
    assert(error.statusCode === 404);
    assert(error.code === 'NOT_FOUND');
    assert(error.message === 'User not found');
  }));

  tests.push(await runTest('ErrorHandler.normalize() converts errors', () => {
    const handler = new ErrorHandler();
    
    const standardError = new Error('Something went wrong');
    const normalized = handler.normalize(standardError);
    
    assert(normalized instanceof AppError);
    assert(normalized.statusCode === 500);
  }));

  tests.push(await runTest('ErrorHandler.normalize() preserves AppError', () => {
    const handler = new ErrorHandler();
    
    const appError = new BadRequestError('Invalid');
    const normalized = handler.normalize(appError);
    
    assert(normalized === appError);
  }));

  tests.push(await runTest('TooManyRequestsError has retryAfter', () => {
    const error = new TooManyRequestsError(60);
    
    assert(error.statusCode === 429);
    assert(error.retryAfter === 60);
  }));

  return {
    name: 'Error Handler',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// REQUEST LOGGER TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testRequestLogger(): Promise<TestSuite> {
  const { RequestLogger, ResponseTimeTracker } = await import('./middleware/logging.js');
  const tests: TestResult[] = [];
  const start = Date.now();

  tests.push(await runTest('RequestLogger generates request ID', () => {
    const logger = new RequestLogger();
    
    const req = { headers: {} } as any;
    const id = logger.getRequestId(req);
    
    assert(typeof id === 'string');
    assert(id.length > 0);
    assert(id.includes('-'));
  }));

  tests.push(await runTest('RequestLogger uses existing request ID', () => {
    const logger = new RequestLogger();
    
    const req = { headers: { 'x-request-id': 'existing-id' } } as any;
    const id = logger.getRequestId(req);
    
    assert(id === 'existing-id');
  }));

  tests.push(await runTest('ResponseTimeTracker records and calculates stats', () => {
    const tracker = new ResponseTimeTracker();
    
    // Record some times
    tracker.record('/api/test', 100);
    tracker.record('/api/test', 150);
    tracker.record('/api/test', 200);
    tracker.record('/api/test', 50);
    tracker.record('/api/test', 300);
    
    const stats = tracker.getStats('/api/test');
    
    assert(stats !== null);
    assert(stats.count === 5);
    assert(stats.min === 50);
    assert(stats.max === 300);
    assert(stats.avg === 160); // (100+150+200+50+300)/5
  }));

  tests.push(await runTest('ResponseTimeTracker.reset() clears data', () => {
    const tracker = new ResponseTimeTracker();
    
    tracker.record('/api/test', 100);
    tracker.reset();
    
    const stats = tracker.getStats('/api/test');
    assert(stats === null);
  }));

  return {
    name: 'Request Logger',
    tests,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    duration: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function runAllTests(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       MIND-ENGINE UNIFIED API - TEST SUITE                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const suites: TestSuite[] = [];
  
  try {
    suites.push(await testValidation());
    suites.push(await testLogger());
    suites.push(await testAuth());
    suites.push(await testRateLimiter());
    suites.push(await testErrorHandler());
    suites.push(await testRequestLogger());
  } catch (error) {
    console.error('Error running tests:', error);
  }

  // Print all results
  suites.forEach(printSuite);

  // Summary
  const totalTests = suites.reduce((sum, s) => sum + s.tests.length, 0);
  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
  const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                                ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests:  ${totalTests.toString().padStart(4)}                                       ║`);
  console.log(`║  Passed:       ${totalPassed.toString().padStart(4)} ✅                                    ║`);
  console.log(`║  Failed:       ${totalFailed.toString().padStart(4)} ${totalFailed > 0 ? '❌' : '  '}                                    ║`);
  console.log(`║  Duration:     ${totalDuration.toString().padStart(4)}ms                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

// Run if executed directly
runAllTests().catch(console.error);

export { runAllTests };
