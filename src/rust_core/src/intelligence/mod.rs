//! # Intelligence Module
//! 
//! This module contains the cognitive infrastructure of the Sovereign Engine:
//! - AkashicLink: Memory-to-Truth cryptographic bridge
//! - (Future) Hallucination Guard: Rust-native contradiction detector
//! - (Future) Semantic Anchor: Vector-based consistency checker

pub mod akashic_link;

pub use akashic_link::{AkashicLink, AkashicRecord, NeuralMessage};
