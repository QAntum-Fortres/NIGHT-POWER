#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha512};
use std::fs::OpenOptions;
use std::io::Write;
use sysinfo::{CpuExt, System, SystemExt};

#[napi(object)]
#[derive(Deserialize, Serialize)]
pub struct BioPoint {
    pub hr: f64,
    pub oxy: f64,
}

#[napi(object)]
#[derive(Deserialize, Serialize)]
pub struct MarketPoint {
    pub price: f64,
    pub volume: f64,
}

#[napi(object)]
#[derive(Deserialize, Serialize)]
pub struct EnergyData {
    pub battery_level: f64,
}

#[napi(object)]
#[derive(Deserialize, Serialize)]
pub struct InputPayload {
    pub bio_data_stream: Vec<BioPoint>,
    pub market_data_stream: Vec<MarketPoint>,
    pub energy_data_stream: EnergyData,
}

#[napi(object)]
pub struct HardwareMetrics {
    pub cpu_usage: f64,
    pub ram_usage: f64,
    pub temperature: f64,
    pub total_ram_mb: f64,
}

#[napi]
pub fn get_hardware_telemetry() -> HardwareMetrics {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpus = sys.cpus();
    let cpu_avg = if !cpus.is_empty() {
        cpus.iter().map(|cpu| cpu.cpu_usage()).sum::<f32>() / cpus.len() as f32
    } else {
        0.0
    };

    HardwareMetrics {
        cpu_usage: cpu_avg as f64,
        ram_usage: (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0,
        temperature: 0.0,
        total_ram_mb: sys.total_memory() as f64 / 1024.0 / 1024.0,
    }
}

#[napi]
pub fn process_and_sign_cycle(payload: InputPayload) -> Result<f64> {
    let mut total_entropy = 0.0_f64;

    for bio in &payload.bio_data_stream {
        let b_val = (bio.hr * 0.5) + (bio.oxy * 2.0);
        for market in &payload.market_data_stream {
            let m_val = if market.volume > 0.0 {
                market.price / market.volume
            } else {
                0.0
            };
            if b_val > 50.0 && m_val < 0.001 {
                let multiplier = if payload.energy_data_stream.battery_level < 20.0 {
                    2.5
                } else {
                    0.1
                };
                total_entropy += (b_val * m_val) * multiplier;
            } else if b_val < 20.0 && m_val > 0.05 {
                let golden = (b_val * m_val).sqrt();
                if golden > 1.618 {
                    total_entropy -= golden;
                } else {
                    total_entropy += 0.01;
                }
            } else {
                total_entropy += ((b_val.sin()) * (m_val.cos())).abs() * 0.001;
            }
        }
    }

    let final_index = 100.0 - total_entropy.max(0.0).min(100.0);

    // Signing
    let json_data =
        serde_json::to_string(&payload).map_err(|e| Error::from_reason(e.to_string()))?;
    let mut hasher = Sha512::new();
    hasher.update(json_data.as_bytes());
    hasher.update(final_index.to_be_bytes());
    let hash = hasher.finalize();

    if let Ok(mut file) = OpenOptions::new()
        .append(true)
        .create(true)
        .open("sovereign.ledger")
    {
        let _ = writeln!(file, "{:x} | INDEX: {:.4}", hash, final_index);
    }

    Ok(final_index)
}
