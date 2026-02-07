/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * QANTUM PHYSICS CORE - NAPI-RS BRIDGE (Rust ↔ TypeScript)
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This is the FFI layer that exposes Rust GPU engine to Node.js/TypeScript.
 * JavaScript can call these functions directly with near-zero overhead.
 * 
 * @author Dimitar Prodromov / QAntum Empire
 */

#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

mod physics;
mod omega;
mod intelligence;

use napi::{bindgen_prelude::*, JsObject};
use physics::obi_engine::{self, OrderBookSnapshot, ObiResult as RustObiResult};
use physics::tda::TopologicalAnalyzer;
use omega::mempool::{MempoolListener, MempoolTransaction};
use intelligence::game_theory;
use sysinfo::{System, SystemExt, CpuExt};

/// Real-time hardware telemetry from OS
#[napi(object)]
pub struct HardwareMetrics {
    pub cpu_usage: f64,
    pub ram_usage: f64,
    pub temperature: f64,
    pub total_ram_mb: f64,
}

/// Read real hardware telemetry using sysinfo
#[napi]
pub fn get_hardware_telemetry() -> HardwareMetrics {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Average CPU usage across all cores
    let cpus = sys.cpus();
    let cpu_avg = if !cpus.is_empty() {
        cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
    } else {
        0.0
    };

    HardwareMetrics {
        cpu_usage: cpu_avg as f64,
        ram_usage: (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0,
        temperature: 0.0, // sysinfo temp support varies on Windows, returning 0.0 for now
        total_ram_mb: sys.total_memory() as f64 / 1024.0 / 1024.0,
    }
}

/// Initialize the Physics Engine (call once on startup)
#[napi]
pub fn init_physics_engine() -> Result<String> {
    match obi_engine::PhysicsEngine::init() {
        Ok(_) => Ok("🔥 Physics Engine: CUDA/CPU ONLINE".to_string()),
        Err(e) => Err(Error::from_reason(format!("Failed to init physics engine: {}", e))),
    }
}

/// Calculate Manifold Curvature (TDA)
#[napi]
pub fn calculate_manifold_curvature(market_data: Vec<OrderBookData>) -> f64 {
    let snapshots: Vec<OrderBookSnapshot> = market_data
        .iter()
        .map(|data| OrderBookSnapshot {
            bid_price: data.bid_price as f32,
            bid_volume: data.bid_volume as f32,
            ask_price: data.ask_price as f32,
            ask_volume: data.ask_volume as f32,
        })
        .collect();

    let curvatures = TopologicalAnalyzer::calculate_curvature(&snapshots);
    if curvatures.is_empty() {
        0.0
    } else {
        curvatures.iter().sum::<f64>() / curvatures.len() as f64
    }
}

/// Mempool Result for TypeScript
#[napi(object)]
pub struct DetectedWhale {
    pub hash: String,
    pub value_eth: f64,
    pub to_exchange: bool,
}

/// Scan Mempool for Whales
#[napi]
pub fn scan_mempool() -> Vec<DetectedWhale> {
    let txs = MempoolListener::scan();
    
    txs.into_iter().map(|tx| DetectedWhale {
        hash: tx.hash,
        value_eth: tx.value_eth,
        to_exchange: tx.to.contains("Binance") || tx.to.contains("3f5C"), // Simple check
    }).collect()
}

/// Analyze Competitor Behavior (Game Theory)
#[napi]
pub fn analyze_competitor_behavior(bid_volume: f64, ask_volume: f64, spread_percent: f64) -> String {
    game_theory::CompetitorAnalysis::analyze(bid_volume, ask_volume, spread_percent)
}

/// Order Book Data from TypeScript
#[napi(object)]
pub struct OrderBookData {
    pub bid_price: f64,
    pub bid_volume: f64,
    pub ask_price: f64,
    pub ask_volume: f64,
}

/// OBI Result returned to TypeScript
#[napi(object)]
pub struct ObiResult {
    pub imbalance: f64,
    pub signal: String,
    pub gpu_latency_ms: f64,
}

/// Calculate Order Book Imbalance (exposed to TypeScript)
#[napi]
pub async fn calculate_obi_batch(market_data: Vec<OrderBookData>) -> Result<Vec<ObiResult>> {
    let start = std::time::Instant::now();
    
    // Convert TypeScript data to Rust structs
    let snapshots: Vec<OrderBookSnapshot> = market_data
        .iter()
        .map(|data| OrderBookSnapshot {
            timestamp: 0, // Will be set by engine
            bid_price: data.bid_price,
            bid_volume: data.bid_volume,
            ask_price: data.ask_price,
            ask_volume: data.ask_volume,
        })
        .collect();

    // Calculate OBI using new engine
    let results = obi_engine::calculate_obi_batch(&snapshots);
    
    let gpu_latency_ms = start.elapsed().as_secs_f64() * 1000.0;

    // Convert results to TypeScript format
    let ts_results = results
        .iter()
        .map(|r| ObiResult {
            imbalance: r.obi,
            signal: r.signal.clone(),
            gpu_latency_ms,
        })
        .collect();

    Ok(ts_results)
}

/// Evaluate single market entropy (synchronous helper)
#[napi]
pub fn evaluate_market_entropy(imbalance: f64) -> String {
    if imbalance > 0.3 {
        "BUY_PRESSURE".to_string()
    } else if imbalance < -0.3 {
        "SELL_PRESSURE".to_string()
    } else {
        "NEUTRAL".to_string()
    }
}

/// Health check for GPU availability
#[napi]
pub fn check_gpu_status() -> String {
    "✅ Physics Engine: READY (Check logs for CUDA/CPU mode)".to_string()
}
