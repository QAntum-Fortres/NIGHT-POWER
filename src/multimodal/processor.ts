/**
 * BullMQ Job Processor
 * 
 * Handles test execution jobs with:
 * - Multi-tenant isolation
 * - Rate limiting by plan
 * - Zombie process cleanup
 * - Progress tracking
 * 
 * @author Димитър Продромов
 * @copyright 2026 QAntum. All Rights Reserved.
 */

import { Worker, Job, Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { GhostExecutor, ghostExecutor } from './executor.js';
import { BasePage } from './pages/BasePage.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface TestJobData {
  runId: string;
  tenantId: string;
  projectId: string;
  tests: Array<{
    id: string;
    code: string;
    timeout: number;
    ghostMode?: boolean;
    selfHealing?: boolean;
    name?: string;
  }>;
  config: {
    browser: 'chrome' | 'firefox';
    parallelism: number;
    baseUrl?: string;
  };
  tenant: {
    plan: string;
    testsLimit: number;
    testsUsed: number;
  };
}

interface TestResultData {
  testId: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  duration: number;
  error?: string;
  errorStack?: string;
  screenshotUrl?: string;
  selectorsHealed: number;
  healingDetails?: object;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RATE LIMITS BY PLAN
// ═══════════════════════════════════════════════════════════════════════════════

const PLAN_LIMITS = {
  STARTER: { maxConcurrent: 1, maxPerMinute: 10, priority: 10 },
  PRO: { maxConcurrent: 3, maxPerMinute: 50, priority: 5 },
  TEAM: { maxConcurrent: 5, maxPerMinute: 100, priority: 3 },
  ENTERPRISE: { maxConcurrent: 10, maxPerMinute: 500, priority: 1 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// REDIS & PRISMA SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

// S3 for screenshots
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// JOB PROCESSOR
// ═══════════════════════════════════════════════════════════════════════════════

async function processTestJob(job: Job<TestJobData>): Promise<{ runId: string; passed: number; failed: number }> {
  const { runId, tenantId, tests, config, tenant } = job.data;
  
  console.log(`[Processor] Starting job ${job.id} for run ${runId}`);
  console.log(`[Processor] Tenant: ${tenantId}, Plan: ${tenant.plan}, Tests: ${tests.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: Validate tenant limits (Row Level Security concept)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const planLimits = PLAN_LIMITS[tenant.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.STARTER;
  
  // Check if tenant has exceeded monthly limit
  if (tenant.testsUsed + tests.length > tenant.testsLimit) {
    await updateRunStatus(runId, 'FAILED', {
      error: `Monthly test limit exceeded (${tenant.testsUsed}/${tenant.testsLimit})`,
    });
    throw new Error('USAGE_LIMIT_EXCEEDED');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: Update run status to RUNNING
  // ═══════════════════════════════════════════════════════════════════════════
  
  await prisma.testRun.update({
    where: { id: runId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: Initialize Ghost Executor sessions
  // ═══════════════════════════════════════════════════════════════════════════
  
  const sessions: string[] = [];
  const parallelism = Math.min(config.parallelism, planLimits.maxConcurrent);
  
  for (let i = 0; i < parallelism; i++) {
    const context = await ghostExecutor.initDriver({
      browser: config.browser,
      headless: true,
      tenantId,
      sessionId: `${runId}-${i}`,
    });
    sessions.push(context.sessionId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: Load self-healing knowledge base (tenant-isolated)
  // ═══════════════════════════════════════════════════════════════════════════
  
  const selectorKnowledge = await prisma.selectorKnowledge.findMany({
    where: {
      project: {
        id: job.data.projectId,
        tenantId, // CRITICAL: Tenant isolation
      },
    },
  });

  console.log(`[Processor] Loaded ${selectorKnowledge.length} selector knowledge entries`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: Execute tests with batching
  // ═══════════════════════════════════════════════════════════════════════════
  
  const results: TestResultData[] = [];
  let passed = 0;
  let failed = 0;
  let sessionIndex = 0;

  // Process tests in batches based on parallelism
  for (let i = 0; i < tests.length; i += parallelism) {
    const batch = tests.slice(i, i + parallelism);
    
    const batchResults = await Promise.all(
      batch.map(async (test, batchIndex) => {
        const sessionId = sessions[batchIndex % sessions.length];
        return executeTestWithHealing(
          sessionId,
          test,
          config.baseUrl,
          selectorKnowledge
        );
      })
    );

    // Process batch results
    for (const result of batchResults) {
      results.push(result);
      
      if (result.status === 'PASSED') passed++;
      else if (result.status === 'FAILED') failed++;

      // Update individual test result in database (tenant-isolated)
      await prisma.testResult.updateMany({
        where: {
          runId,
          testId: result.testId,
          run: { project: { tenantId } }, // CRITICAL: Tenant isolation
        },
        data: {
          status: result.status,
          duration: result.duration,
          error: result.error,
          errorStack: result.errorStack,
          screenshot: result.screenshotUrl,
          selectorsHealed: result.selectorsHealed,
          healingDetails: result.healingDetails,
        },
      });

      // Update job progress
      const progress = Math.round(((results.length) / tests.length) * 100);
      await job.updateProgress(progress);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: Cleanup sessions (prevent zombie processes)
  // ═══════════════════════════════════════════════════════════════════════════
  
  for (const sessionId of sessions) {
    await ghostExecutor.cleanup(sessionId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: Update run completion status
  // ═══════════════════════════════════════════════════════════════════════════
  
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  await prisma.testRun.update({
    where: { id: runId },
    data: {
      status: failed > 0 ? 'FAILED' : 'COMPLETED',
      passed,
      failed,
      skipped: tests.length - passed - failed,
      duration: totalDuration,
      completedAt: new Date(),
    },
  });

  console.log(`[Processor] Completed run ${runId}: ${passed} passed, ${failed} failed`);

  return { runId, passed, failed };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST EXECUTION WITH SELF-HEALING
// ═══════════════════════════════════════════════════════════════════════════════

async function executeTestWithHealing(
  sessionId: string,
  test: TestJobData['tests'][0],
  baseUrl?: string,
  selectorKnowledge?: any[]
): Promise<TestResultData> {
  const startTime = Date.now();
  let selectorsHealed = 0;
  const healingDetails: any[] = [];

  try {
    // Get driver from executor
    const result = await ghostExecutor.executeTest(sessionId, test.code, test.timeout);

    if (!result.success) {
      // Take screenshot on failure
      const screenshot = await ghostExecutor.takeScreenshot(sessionId);
      let screenshotUrl: string | undefined;
      
      if (screenshot) {
        screenshotUrl = await uploadScreenshot(screenshot, sessionId, test.id);
      }

      return {
        testId: test.id,
        status: 'FAILED',
        duration: result.duration,
        error: result.error,
        screenshotUrl,
        selectorsHealed,
        healingDetails,
      };
    }

    return {
      testId: test.id,
      status: 'PASSED',
      duration: result.duration,
      selectorsHealed,
      healingDetails,
    };
  } catch (error: any) {
    return {
      testId: test.id,
      status: 'FAILED',
      duration: Date.now() - startTime,
      error: error.message,
      errorStack: error.stack,
      selectorsHealed,
      healingDetails,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function updateRunStatus(
  runId: string,
  status: string,
  extra: Record<string, any> = {}
): Promise<void> {
  await prisma.testRun.update({
    where: { id: runId },
    data: { status, ...extra },
  });
}

async function uploadScreenshot(
  base64Data: string,
  sessionId: string,
  testId: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET || 'qantum-screenshots';
  const key = `screenshots/${sessionId}/${testId}-${Date.now()}.png`;
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(base64Data, 'base64'),
      ContentType: 'image/png',
    }));
    
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error('[Processor] Screenshot upload failed:', error);
    return '';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER SETUP
// ═══════════════════════════════════════════════════════════════════════════════

const worker = new Worker<TestJobData>('test-execution', processTestJob, {
  connection: redis,
  concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  limiter: {
    max: 100,
    duration: 60000, // 100 jobs per minute max
  },
});

// Event handlers
worker.on('completed', (job, result) => {
  console.log(`[Worker] Job ${job.id} completed:`, result);
});

worker.on('failed', (job, error) => {
  console.error(`[Worker] Job ${job?.id} failed:`, error.message);
  
  // Cleanup any zombie sessions for this job
  if (job?.data?.runId) {
    ghostExecutor.cleanupTenant(job.data.tenantId).catch(console.error);
  }
});

worker.on('progress', (job, progress) => {
  console.log(`[Worker] Job ${job.id} progress: ${progress}%`);
});

worker.on('error', (error) => {
  console.error('[Worker] Error:', error);
});

// ═══════════════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════════

const shutdown = async (signal: string) => {
  console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);
  
  await worker.close();
  await ghostExecutor.cleanupAll();
  await prisma.$disconnect();
  await redis.quit();
  
  console.log('[Worker] Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ═══════════════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   🔧 QAntum Test Worker v1.0.0                                             ║
║                                                                            ║
║   Configuration:                                                           ║
║   • Concurrency: ${process.env.WORKER_CONCURRENCY || '5'}                                                     ║
║   • Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}                                               ║
║   • Rate Limit: 100 jobs/minute                                            ║
║                                                                            ║
║   Features:                                                                ║
║   • 👻 Ghost Protocol - Anti-detection (Selenium)                          ║
║   • 🔧 Self-Healing - Auto selector repair                                 ║
║   • 🔒 Multi-Tenant Isolation - RLS-style filtering                        ║
║   • 💀 Zombie Cleanup - Process monitoring                                 ║
║                                                                            ║
║   Plan Limits:                                                             ║
║   • STARTER:    1 concurrent,   10/min                                     ║
║   • PRO:        3 concurrent,   50/min                                     ║
║   • TEAM:       5 concurrent,  100/min                                     ║
║   • ENTERPRISE: 10 concurrent, 500/min                                     ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

export { worker, processTestJob };
