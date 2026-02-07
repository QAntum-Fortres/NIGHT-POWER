use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Debug)]
pub struct MempoolTransaction {
    pub hash: String,
    pub from: String,
    pub to: String,
    pub value_eth: f64,
    pub timestamp: u64,
}

pub struct MempoolListener;

impl MempoolListener {
    pub fn scan() -> Vec<MempoolTransaction> {
        // SIMULATION: In a real scenario, this would connect to an Ethereum Node WebSocket
        // and filter pending transactions.
        
        let mut suspicious_txs = Vec::new();
        
        // Simulate a random chance of a Whale movement based on time
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis();
        
        // 20% chance of detecting a whale per scan
        if now % 5 == 0 { 
            suspicious_txs.push(MempoolTransaction {
                hash: format!("0x{:x}", now),
                from: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".to_string(), // Known Whale
                to: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE".to_string(), // Binance Hot Wallet
                value_eth: 10000.0 + (now % 50000) as f64 / 1000.0, // 10k - 60k ETH
                timestamp: now as u64,
            });
        }
        
        suspicious_txs
    }
}
