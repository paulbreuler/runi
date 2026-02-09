// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Transport abstraction for MCP message exchange.
//!
//! The [`Transport`] trait decouples the MCP server logic from the
//! underlying communication mechanism (HTTP/SSE, stdio, in-memory).
//!
//! Currently used in tests only — will be used for stdio transport.

#![allow(dead_code)]

use async_trait::async_trait;
use tokio::sync::mpsc;

/// Abstraction for bidirectional MCP message transport.
///
/// Implementations handle the physical delivery of JSON-RPC messages.
/// The server writes outbound messages via [`send`](Transport::send)
/// and reads inbound messages from the [`receiver`](Transport::receiver).
#[async_trait]
pub trait Transport: Send + Sync {
    /// Send an outbound message (JSON-RPC response or notification).
    ///
    /// # Errors
    ///
    /// Returns an error if the message cannot be delivered.
    async fn send(&self, message: String) -> Result<(), String>;

    /// Get a receiver for inbound messages.
    ///
    /// The caller owns the receiver and reads messages from it.
    async fn receiver(&self) -> mpsc::UnboundedReceiver<String>;
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Compile-time verification that Transport can be used as a trait object.
    #[allow(dead_code)]
    fn assert_object_safe(_: &dyn Transport) {}

    /// Verify the trait is Send + Sync (required for multi-threaded Tauri runtime).
    #[allow(dead_code)]
    fn assert_send_sync<T: Send + Sync>() {}

    #[test]
    fn test_transport_is_send_sync() {
        // Compile-time check: Transport requires Send + Sync
        fn check<T: Transport>() {
            assert_send_sync::<T>();
        }
        // This test passes at compile time — no runtime assertion needed.
        let _ = check::<crate::infrastructure::mcp::fake_transport::FakeTransport>;
    }
}
