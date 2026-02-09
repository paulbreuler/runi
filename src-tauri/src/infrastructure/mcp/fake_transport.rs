// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! In-memory transport for testing the MCP server without HTTP.
//!
//! Captures sent messages and allows injecting inbound messages
//! via an `mpsc` channel.

#![allow(dead_code)]

use std::sync::Arc;

use async_trait::async_trait;
use tokio::sync::{Mutex, mpsc};

use crate::domain::mcp::transport::Transport;

/// In-memory MCP transport for unit and integration tests.
pub struct FakeTransport {
    /// Messages sent by the server (captured for assertions).
    sent: Arc<Mutex<Vec<String>>>,
    /// Sender half for injecting inbound messages.
    inbound_tx: mpsc::UnboundedSender<String>,
    /// Receiver half consumed once via [`Transport::receiver`].
    inbound_rx: Arc<Mutex<Option<mpsc::UnboundedReceiver<String>>>>,
}

impl FakeTransport {
    /// Create a new fake transport with empty state.
    #[must_use]
    pub fn new() -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        Self {
            sent: Arc::new(Mutex::new(Vec::new())),
            inbound_tx: tx,
            inbound_rx: Arc::new(Mutex::new(Some(rx))),
        }
    }

    /// Inject an inbound message (simulates a client sending a request).
    ///
    /// # Errors
    ///
    /// Returns an error if the channel is closed.
    pub fn inject(&self, message: String) -> Result<(), String> {
        self.inbound_tx
            .send(message)
            .map_err(|e| format!("Failed to inject message: {e}"))
    }

    /// Get all messages sent by the server.
    pub async fn sent_messages(&self) -> Vec<String> {
        self.sent.lock().await.clone()
    }
}

#[async_trait]
impl Transport for FakeTransport {
    async fn send(&self, message: String) -> Result<(), String> {
        self.sent.lock().await.push(message);
        Ok(())
    }

    async fn receiver(&self) -> mpsc::UnboundedReceiver<String> {
        self.inbound_rx
            .lock()
            .await
            .take()
            .expect("receiver() called more than once")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_send_captures_messages() {
        let transport = FakeTransport::new();
        transport.send("hello".to_string()).await.unwrap();
        transport.send("world".to_string()).await.unwrap();

        let sent = transport.sent_messages().await;
        assert_eq!(sent, vec!["hello", "world"]);
    }

    #[tokio::test]
    async fn test_inject_and_receive() {
        let transport = FakeTransport::new();
        transport.inject("request1".to_string()).unwrap();
        transport.inject("request2".to_string()).unwrap();

        let mut rx = transport.receiver().await;
        assert_eq!(rx.recv().await.unwrap(), "request1");
        assert_eq!(rx.recv().await.unwrap(), "request2");
    }

    #[tokio::test]
    async fn test_empty_initially() {
        let transport = FakeTransport::new();
        let sent = transport.sent_messages().await;
        assert!(sent.is_empty());
    }

    #[tokio::test]
    async fn test_roundtrip_inject_send() {
        let transport = FakeTransport::new();

        // Inject inbound
        transport
            .inject(r#"{"jsonrpc":"2.0","id":1,"method":"initialize"}"#.to_string())
            .unwrap();

        // Read from receiver
        let mut rx = transport.receiver().await;
        let msg = rx.recv().await.unwrap();
        assert!(msg.contains("initialize"));

        // Send outbound
        transport
            .send(r#"{"jsonrpc":"2.0","id":1,"result":{}}"#.to_string())
            .await
            .unwrap();

        let sent = transport.sent_messages().await;
        assert_eq!(sent.len(), 1);
        assert!(sent[0].contains("result"));
    }
}
