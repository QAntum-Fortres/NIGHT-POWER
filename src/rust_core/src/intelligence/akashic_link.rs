//! # AkashicLink - The Memory-to-Truth Bridge
//! 
//! This module connects the NeuralBackpack (context memory) with the Sovereign Ledger.
//! Every decision is now cryptographically linked to its logical provenance.
//!
//! ## Architecture
//! ```
//! NeuralBackpack.ts  -->  AkashicLink.rs  -->  sovereign.ledger
//!    (Memory)              (Seal)              (Immutable Proof)
//! ```

use serde::{Deserialize, Serialize};
use sha2::{Sha512, Digest};

/// Represents a single message from the NeuralBackpack
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct NeuralMessage {
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

/// The Akashic Record - a sealed snapshot of consciousness at decision time
#[derive(Deserialize, Serialize, Debug)]
pub struct AkashicRecord {
    pub context_seal: String,      // SHA-512 of the last N messages
    pub message_count: usize,      // How many messages were sealed
    pub decision_index: f64,       // The calculated entropy/stability index
    pub veritas_approved: bool,    // Did Veritas validate this?
    pub timestamp: u64,            // Unix timestamp of sealing
}

/// The AkashicLink - connects memory to truth
pub struct AkashicLink;

impl AkashicLink {
    /// Computes the SHA-512 "Semantic Seal" of the entire context
    /// This hash represents the state of consciousness at decision time
    pub fn compute_context_seal(messages: &[NeuralMessage]) -> String {
        let mut hasher = Sha512::new();
        
        for msg in messages {
            // Hash: role + content + timestamp (in order)
            hasher.update(msg.role.as_bytes());
            hasher.update(b"|");
            hasher.update(msg.content.as_bytes());
            hasher.update(b"|");
            hasher.update(msg.timestamp.to_be_bytes());
            hasher.update(b"\n");
        }
        
        format!("{:x}", hasher.finalize())
    }

    /// Creates a full Akashic Record linking context to decision
    pub fn create_record(
        messages: &[NeuralMessage],
        decision_index: f64,
        veritas_approved: bool
    ) -> AkashicRecord {
        let seal = Self::compute_context_seal(messages);
        
        AkashicRecord {
            context_seal: seal,
            message_count: messages.len(),
            decision_index,
            veritas_approved,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }

    /// Verifies that a new record is logically consistent with the previous
    /// Returns false if the chain is broken (tampering detected)
    pub fn verify_chain_continuity(
        current: &AkashicRecord,
        previous: &AkashicRecord
    ) -> bool {
        // Rule 1: Time must flow forward
        if current.timestamp <= previous.timestamp {
            return false;
        }
        
        // Rule 2: Context seals must differ (consciousness evolved)
        if current.context_seal == previous.context_seal {
            return false; // Stale consciousness = suspicious
        }
        
        // Rule 3: Veritas must approve both
        if !current.veritas_approved || !previous.veritas_approved {
            return false;
        }
        
        true
    }

    /// Formats the record for human-readable ledger output
    pub fn format_for_ledger(record: &AkashicRecord) -> String {
        format!(
            "AKASHIC_SEAL: {} | MESSAGES: {} | INDEX: {:.4} | VERITAS: {} | TS: {}",
            &record.context_seal[..16], // First 16 chars for readability
            record.message_count,
            record.decision_index,
            if record.veritas_approved { "PASS" } else { "FAIL" },
            record.timestamp
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_seal_deterministic() {
        let messages = vec![
            NeuralMessage {
                role: "user".into(),
                content: "Analyze BTC volatility".into(),
                timestamp: 1705300000,
            },
            NeuralMessage {
                role: "assistant".into(),
                content: "Volatility is low, market stable".into(),
                timestamp: 1705300010,
            },
        ];

        let seal1 = AkashicLink::compute_context_seal(&messages);
        let seal2 = AkashicLink::compute_context_seal(&messages);

        // Same input = same seal (deterministic)
        assert_eq!(seal1, seal2);
        assert_eq!(seal1.len(), 128); // SHA-512 = 128 hex chars
    }

    #[test]
    fn test_record_creation() {
        let messages = vec![
            NeuralMessage {
                role: "user".into(),
                content: "Test".into(),
                timestamp: 1705300000,
            },
        ];

        let record = AkashicLink::create_record(&messages, 0.95, true);

        assert_eq!(record.message_count, 1);
        assert!(record.veritas_approved);
        assert!(record.decision_index > 0.0);
    }
}
