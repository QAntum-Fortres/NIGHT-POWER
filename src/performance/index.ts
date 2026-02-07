/**
 * ╔═══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                               ║
 * ║   QANTUM PERFORMANCE MODULE                                                   ║
 * ║   "Unified performance optimization exports"                                  ║
 * ║                                                                               ║
 * ║   © 2025-2026 QAntum | Dimitar Prodromov                                        ║
 * ║                                                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PARALLEL EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ParallelExecutor,
    parallel,
    parallelMap,
    type ParallelStrategy,
    type ParallelTask,
    type TaskResult,
    type ParallelConfig,
    type WorkerStats
} from './parallel.js';

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE POOL
// ═══════════════════════════════════════════════════════════════════════════════

export {
    ResourcePool,
    BrowserPool,
    PagePool,
    ConnectionPool,
    type PoolConfig,
    type ResourceFactory,
    type PooledResource,
    type PoolStats
} from './pool.js';

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILER
// ═══════════════════════════════════════════════════════════════════════════════

export {
    PerformanceProfiler,
    getProfiler,
    Profile,
    ProfileSync,
    type ProfileMeasurement,
    type MemorySnapshot,
    type ProfileReport,
    type ProfileSummary,
    type Hotspot
} from './profiler';

// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADER
// ═══════════════════════════════════════════════════════════════════════════════

export {
    LazyLoader,
    getLazyLoader,
    lazyFn,
    lazyAsync,
    LazyProperty,
    QAntumModules,
    type ModuleLoader,
    type ModuleFactory,
    type LazyModule,
    type LazyLoaderConfig,
    type LoadStats
} from './lazy-loader';

// ═══════════════════════════════════════════════════════════════════════════════
// CACHE
// ═══════════════════════════════════════════════════════════════════════════════

export {
    Cache,
    getCache,
    NamespacedCache,
    CacheRegistry,
    Memoize,
    type CacheEntry,
    type CacheConfig,
    type CacheStats
} from './cache';

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

import PerformanceProfiler from './profiler';
import LazyLoader from './lazy-loader';
import Cache from './cache';

export default {
    Profiler: PerformanceProfiler,
    LazyLoader,
    Cache
};
