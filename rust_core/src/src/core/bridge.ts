import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

let physics: any = null;

// Attempt to load the Rust binary
const potentialPaths = [
    '../../../src/rust_core/index.node',
    '../../../../src/rust_core/index.node',
    '../../../rust_core/index.node',
    '../../rust_core/index.node',
    './rust_core/index.node',
    '../../../index.node'
];

for (const p of potentialPaths) {
    try {
        const fullPath = path.resolve(process.cwd(), p);
        if (fs.existsSync(fullPath)) {
            physics = require(fullPath);
            console.log(`[BRIDGE] ✅ Rust Core Loaded from ${p}`);
            break;
        }
    } catch (e) {
        // Continue
    }
}

if (!physics) {
    console.warn('[BRIDGE] ⚠️ Rust Core binary not found. Using MOCK mode.');
    physics = {
        init_physics_engine: () => "MOCK_ENGINE_INIT",
        check_gpu_status: () => "⚠️ MOCK_GPU_MODE",
        calculate_obi_batch: async () => [],
        calculate_manifold_curvature: () => Math.random() * 0.1,
        scan_mempool: () => [
            { hash: '0xMockWhale', value_eth: 50000, to_exchange: true }
        ],
        analyze_competitor_behavior: () => "MOCK_ANALYSIS: DEPLOY_BAIT",
        evaluate_market_entropy: () => "NEUTRAL",
        get_hardware_telemetry: () => ({
            cpu_usage: 0.0,
            ram_usage: 0.0,
            temperature: 0.0,
            total_ram_mb: 0.0
        }),
        process_and_sign_cycle: (payload: any) => 100.0
    };
} else {
    // NAPI-RS typically uses camelCase for functions and object properties
    const native = physics;
    physics = {
        ...native,
        get_hardware_telemetry: () => {
            const data = native.getHardwareTelemetry();
            return {
                cpu_usage: data.cpuUsage,
                ram_usage: data.ramUsage,
                temperature: data.temperature,
                total_ram_mb: data.totalRamMb
            };
        },
        process_and_sign_cycle: (payload: any) => native.processAndSignCycle(payload)
    };
}

export const Physics = physics;
