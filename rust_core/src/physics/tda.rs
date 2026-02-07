use crate::physics::obi_engine::OrderBookSnapshot;
use rayon::prelude::*;

pub struct TopologicalAnalyzer;

impl TopologicalAnalyzer {
    /// Calculates the "curvature" of the market manifold.
    /// High curvature indicates structural instability (Flash Crash / Pump risk).
    pub fn calculate_curvature(snapshots: &[OrderBookSnapshot]) -> Vec<f64> {
        snapshots.par_iter().map(|s| {
            // 1. Manifold Hypothesis: Market data lies on a lower-dimensional manifold.
            // 2. We measure the "local dimension" or curvature.
            
            // Simplified metric:
            // High Volume + Tight Spread = Flat (Stable)
            // Low Volume + Wide Spread = High Curvature (Unstable)
            
            let total_vol = s.bid_volume + s.ask_volume;
            let spread = (s.ask_price - s.bid_price).abs();
            
            if total_vol == 0.0 {
                return 1.0; // Max instability (Empty book)
            }
            
            // Curvature formula approximation
            // C = Spread / Volume_Density
            let curvature = spread / total_vol;
            
            // Normalize to 0-1 range roughly (assuming typical crypto values)
            // If curvature is high (> 0.1), it's a hole.
            
            curvature.min(1.0)
        }).collect()
    }
    
    /// Detects topological "holes" (Persistence Homology approximation)
    /// Returns true if a significant liquidity void is detected.
    pub fn detect_holes(snapshots: &[OrderBookSnapshot]) -> bool {
        let curvature = self::TopologicalAnalyzer::calculate_curvature(snapshots);
        let avg_curvature: f64 = curvature.iter().sum::<f64>() / curvature.len() as f64;
        
        // Threshold for "Flash Crash" warning
        avg_curvature > 0.05
    }
}
