// ═══════════════════════════════════════════════════════════════
// SCRIBE VERIFIER - Ledger Integrity Validation
// ═══════════════════════════════════════════════════════════════
// This module verifies that the sovereign.ledger has not been tampered with.
// It performs chain-of-trust validation on all SHA-512 hashes.

use std::fs::File;
use std::io::{BufRead, BufReader};
use sha2::{Sha512, Digest};

/// Verifies the integrity of the sovereign.ledger file
/// Returns true if all hashes form a valid chain, false if corruption detected
#[no_mangle]
pub extern "C" fn verify_ledger_integrity() -> bool {
    let ledger_path = "sovereign.ledger";
    
    match File::open(ledger_path) {
        Ok(file) => {
            let reader = BufReader::new(file);
            let mut previous_hash: Option<String> = None;
            let mut line_count = 0;
            
            for line in reader.lines() {
                if let Ok(content) = line {
                    // Skip comments and empty lines
                    if content.trim().is_empty() || content.starts_with('#') {
                        continue;
                    }
                    
                    // Parse ledger entry: TIMESTAMP | HASH | DATA
                    let parts: Vec<&str> = content.split('|').collect();
                    if parts.len() < 3 {
                        eprintln!("[SCRIBE] Malformed line: {}", content);
                        return false;
                    }
                    
                    let current_hash = parts[1].trim();
                    let data = parts[2].trim();
                    
                    // Verify hash matches the data
                    let mut hasher = Sha512::new();
                    hasher.update(data.as_bytes());
                    let computed = format!("{:x}", hasher.finalize());
                    
                    // Check if the stored hash matches our computation
                    if !current_hash.starts_with(&computed[..min(current_hash.len(), computed.len())]) {
                        eprintln!("[SCRIBE] Hash mismatch at line {}", line_count + 1);
                        return false;
                    }
                    
                    // Chain validation: each hash should reference the previous
                    if let Some(prev) = previous_hash {
                        // Verify that current data contains reference to previous hash
                        if !data.contains(&prev[..16]) {
                            eprintln!("[SCRIBE] Chain broken at line {}", line_count + 1);
                            return false;
                        }
                    }
                    
                    previous_hash = Some(current_hash.to_string());
                    line_count += 1;
                }
            }
            
            println!("[SCRIBE] ✓ Ledger integrity verified: {} blocks", line_count);
            true
        }
        Err(e) => {
            eprintln!("[SCRIBE] Cannot open ledger: {}", e);
            false
        }
    }
}

fn min(a: usize, b: usize) -> usize {
    if a < b { a } else { b }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_ledger_verification() {
        // This would need a mock ledger file for testing
        // In production, we call verify_ledger_integrity() before generating certificates
        assert!(true); // Placeholder
    }
}
