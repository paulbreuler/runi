// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Generic SSE broadcaster for multi-stream support.
//!
//! Provides a flexible broadcaster that can handle multiple named streams
//! (e.g., "canvas", "collections", "requests") with independent subscriptions.
//!
//! Unlike `EventBroadcaster` which is specific to `EventEnvelope`, this
//! broadcaster is generic over the event type and supports multiple streams.

use std::collections::HashMap;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

/// A single SSE event with type and data.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SseEvent {
    /// Event type (e.g., "`canvas:node_added`", "`collection:created`").
    pub event_type: String,
    /// Event data as JSON value.
    pub data: serde_json::Value,
}

impl SseEvent {
    /// Create a new SSE event.
    #[must_use]
    #[allow(dead_code)]
    pub const fn new(event_type: String, data: serde_json::Value) -> Self {
        Self { event_type, data }
    }
}

/// Subscription handle for a stream.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SubscriptionId(String);

impl SubscriptionId {
    /// Generate a new unique subscription ID.
    #[must_use]
    fn generate() -> Self {
        Self(Uuid::now_v7().to_string())
    }

    /// Get the inner string value.
    #[must_use]
    #[allow(dead_code)]
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Channel capacity per subscriber. Limits memory growth from slow/stalled clients.
/// If a subscriber's channel fills up, old events are dropped (backpressure).
const SUBSCRIBER_CHANNEL_CAPACITY: usize = 256;

/// A subscription to a specific stream.
#[derive(Debug)]
#[allow(dead_code)]
struct Subscription {
    /// Unique identifier for this subscription.
    id: SubscriptionId,
    /// Channel sender for delivering events to this subscriber.
    tx: tokio::sync::mpsc::Sender<SseEvent>,
}

/// Broadcasts SSE events to subscribers on named streams.
///
/// Supports multiple independent streams (e.g., "canvas", "collections")
/// with separate subscriber lists. Each subscriber gets their own channel
/// to receive events from their subscribed stream.
#[derive(Debug, Clone)]
pub struct SseBroadcaster {
    /// Map of stream name to list of subscriptions.
    streams: Arc<RwLock<HashMap<String, Vec<Subscription>>>>,
    /// Map of subscription ID to stream name for cleanup.
    subscription_to_stream: Arc<Mutex<HashMap<SubscriptionId, String>>>,
}

impl SseBroadcaster {
    /// Create a new SSE broadcaster.
    #[must_use]
    pub fn new() -> Self {
        Self {
            streams: Arc::new(RwLock::new(HashMap::new())),
            subscription_to_stream: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Subscribe to a named stream.
    ///
    /// Returns a tuple of `(SubscriptionId, Receiver<SseEvent>)`.
    /// The receiver will get all events broadcast to this stream until
    /// the subscription is explicitly unsubscribed or the receiver is dropped.
    ///
    /// The channel has a bounded capacity to prevent unbounded memory growth.
    /// If a slow subscriber's buffer fills up, old events will be dropped.
    pub async fn subscribe(
        &self,
        stream_name: &str,
    ) -> (SubscriptionId, tokio::sync::mpsc::Receiver<SseEvent>) {
        let (tx, rx) = tokio::sync::mpsc::channel(SUBSCRIBER_CHANNEL_CAPACITY);
        let id = SubscriptionId::generate();

        let subscription = Subscription { id: id.clone(), tx };

        // Add subscription to stream
        {
            let mut streams = self.streams.write().await;
            streams
                .entry(stream_name.to_string())
                .or_default()
                .push(subscription);
        }

        // Track subscription to stream mapping
        self.subscription_to_stream
            .lock()
            .await
            .insert(id.clone(), stream_name.to_string());

        (id, rx)
    }

    /// Broadcast an event to all subscribers of a stream.
    ///
    /// Returns the number of subscribers that received the event.
    /// Automatically removes any closed subscriptions encountered.
    ///
    /// For slow subscribers whose buffers are full, the event is dropped
    /// (backpressure policy). This prevents unbounded memory growth.
    #[allow(dead_code)]
    #[allow(clippy::significant_drop_tightening)]
    pub async fn broadcast(&self, stream_name: &str, event: SseEvent) -> usize {
        let mut closed_ids = Vec::new();
        let mut sent_count = 0;

        {
            let mut streams = self.streams.write().await;
            let Some(subscriptions) = streams.get_mut(stream_name) else {
                return 0;
            };

            for sub in subscriptions.iter() {
                match sub.tx.try_send(event.clone()) {
                    Ok(()) => {
                        sent_count += 1;
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                        // Buffer full - drop event (backpressure)
                        tracing::warn!(
                            "SSE subscriber {} buffer full, dropping event",
                            sub.id.as_str()
                        );
                        sent_count += 1; // Still count as "sent" since subscriber is alive
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => {
                        // Subscriber disconnected
                        closed_ids.push(sub.id.clone());
                    }
                }
            }

            // Remove closed subscriptions from stream
            if !closed_ids.is_empty() {
                subscriptions.retain(|sub| !closed_ids.contains(&sub.id));
            }
        }

        // Remove from subscription_to_stream map (outside streams lock)
        if !closed_ids.is_empty() {
            let mut sub_map = self.subscription_to_stream.lock().await;
            for id in closed_ids {
                sub_map.remove(&id);
            }
        }

        sent_count
    }

    /// Unsubscribe from a stream.
    ///
    /// Returns `true` if the subscription was found and removed, `false` otherwise.
    #[allow(dead_code)]
    pub async fn unsubscribe(&self, subscription_id: &SubscriptionId) -> bool {
        // Find which stream this subscription belongs to
        let stream_name = {
            let mut sub_map = self.subscription_to_stream.lock().await;
            sub_map.remove(subscription_id)
        };

        let Some(stream_name) = stream_name else {
            return false;
        };

        // Remove from stream subscriptions
        self.streams
            .write()
            .await
            .get_mut(&stream_name)
            .is_some_and(|subscriptions| {
                let initial_len = subscriptions.len();
                subscriptions.retain(|sub| &sub.id != subscription_id);
                subscriptions.len() < initial_len
            })
    }

    /// Clean up all closed connections.
    ///
    /// Probes each subscription's channel and removes those that are closed.
    /// Returns the number of subscriptions removed.
    #[allow(dead_code)]
    #[allow(clippy::significant_drop_tightening)]
    pub async fn cleanup_closed(&self) -> usize {
        let mut removed_count = 0;
        let mut all_closed_ids = Vec::new();

        {
            let mut streams = self.streams.write().await;
            for subscriptions in streams.values_mut() {
                let initial_len = subscriptions.len();

                // Find closed subscriptions
                for sub in subscriptions.iter().filter(|sub| sub.tx.is_closed()) {
                    all_closed_ids.push(sub.id.clone());
                }

                // Retain only subscriptions with open channels
                subscriptions.retain(|sub| !sub.tx.is_closed());

                removed_count += initial_len - subscriptions.len();
            }
        }

        // Remove from subscription_to_stream map
        if !all_closed_ids.is_empty() {
            let mut sub_map = self.subscription_to_stream.lock().await;
            sub_map.retain(|id, _| !all_closed_ids.contains(id));
        }

        removed_count
    }

    /// Get the number of subscribers for a stream.
    #[cfg(test)]
    pub async fn subscriber_count(&self, stream_name: &str) -> usize {
        let streams = self.streams.read().await;
        streams.get(stream_name).map_or(0, std::vec::Vec::len)
    }

    /// Get the total number of active subscriptions across all streams.
    #[cfg(test)]
    pub async fn total_subscriptions(&self) -> usize {
        let streams = self.streams.read().await;
        streams.values().map(std::vec::Vec::len).sum()
    }
}

impl Default for SseBroadcaster {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn make_event(event_type: &str, data: serde_json::Value) -> SseEvent {
        SseEvent::new(event_type.to_string(), data)
    }

    #[tokio::test]
    async fn test_new_broadcaster_has_no_subscriptions() {
        let broadcaster = SseBroadcaster::new();
        assert_eq!(broadcaster.total_subscriptions().await, 0);
    }

    #[tokio::test]
    async fn test_subscribe_creates_subscription() {
        let broadcaster = SseBroadcaster::new();
        let (_id, _rx) = broadcaster.subscribe("canvas").await;
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
    }

    #[tokio::test]
    async fn test_subscribe_multiple_streams() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, _rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe("collections").await;
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
        assert_eq!(broadcaster.subscriber_count("collections").await, 1);
    }

    #[tokio::test]
    async fn test_subscribe_multiple_to_same_stream() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, _rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe("canvas").await;
        assert_eq!(broadcaster.subscriber_count("canvas").await, 2);
    }

    #[tokio::test]
    async fn test_broadcast_to_nonexistent_stream_returns_zero() {
        let broadcaster = SseBroadcaster::new();
        let count = broadcaster
            .broadcast("canvas", make_event("test", json!({})))
            .await;
        assert_eq!(count, 0);
    }

    #[tokio::test]
    async fn test_broadcast_to_subscriber() {
        let broadcaster = SseBroadcaster::new();
        let (_id, mut rx) = broadcaster.subscribe("canvas").await;

        let event = make_event("canvas:node_added", json!({"id": "node_1"}));
        let count = broadcaster.broadcast("canvas", event.clone()).await;

        assert_eq!(count, 1);
        let received = rx.recv().await.unwrap();
        assert_eq!(received, event);
    }

    #[tokio::test]
    async fn test_broadcast_to_multiple_subscribers() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, mut rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, mut rx2) = broadcaster.subscribe("canvas").await;

        let event = make_event("canvas:node_added", json!({"id": "node_1"}));
        let count = broadcaster.broadcast("canvas", event.clone()).await;

        assert_eq!(count, 2);
        assert_eq!(rx1.recv().await.unwrap(), event);
        assert_eq!(rx2.recv().await.unwrap(), event);
    }

    #[tokio::test]
    async fn test_broadcast_to_different_streams() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, mut rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, mut rx2) = broadcaster.subscribe("collections").await;

        let canvas_event = make_event("canvas:node_added", json!({"id": "node_1"}));
        let collection_event = make_event("collection:created", json!({"id": "col_1"}));

        broadcaster.broadcast("canvas", canvas_event.clone()).await;
        broadcaster
            .broadcast("collections", collection_event.clone())
            .await;

        // Each subscriber only gets events from their stream
        assert_eq!(rx1.recv().await.unwrap(), canvas_event);
        assert_eq!(rx2.recv().await.unwrap(), collection_event);

        // No cross-contamination
        assert!(rx1.try_recv().is_err());
        assert!(rx2.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_unsubscribe_removes_subscription() {
        let broadcaster = SseBroadcaster::new();
        let (id, _rx) = broadcaster.subscribe("canvas").await;

        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
        assert!(broadcaster.unsubscribe(&id).await);
        assert_eq!(broadcaster.subscriber_count("canvas").await, 0);
    }

    #[tokio::test]
    async fn test_unsubscribe_nonexistent_returns_false() {
        let broadcaster = SseBroadcaster::new();
        let fake_id = SubscriptionId("nonexistent".to_string());
        assert!(!broadcaster.unsubscribe(&fake_id).await);
    }

    #[tokio::test]
    async fn test_unsubscribe_stops_receiving_events() {
        let broadcaster = SseBroadcaster::new();
        let (id, mut rx) = broadcaster.subscribe("canvas").await;

        broadcaster
            .broadcast("canvas", make_event("test1", json!({})))
            .await;
        assert!(rx.recv().await.is_some());

        broadcaster.unsubscribe(&id).await;

        broadcaster
            .broadcast("canvas", make_event("test2", json!({})))
            .await;
        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_cleanup_closed_removes_dropped_receivers() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe("canvas").await;

        assert_eq!(broadcaster.subscriber_count("canvas").await, 2);

        // Drop one receiver
        drop(rx1);

        // Cleanup should detect and remove the closed subscription
        let removed = broadcaster.cleanup_closed().await;
        assert_eq!(removed, 1);
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
    }

    #[tokio::test]
    async fn test_cleanup_closed_with_no_closed_subscriptions() {
        let broadcaster = SseBroadcaster::new();
        let (_id, _rx) = broadcaster.subscribe("canvas").await;

        let removed = broadcaster.cleanup_closed().await;
        assert_eq!(removed, 0);
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
    }

    #[tokio::test]
    async fn test_broadcast_automatically_removes_closed_subscriptions() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe("canvas").await;

        assert_eq!(broadcaster.subscriber_count("canvas").await, 2);

        // Drop one receiver
        drop(rx1);

        // Broadcasting should automatically clean up the closed subscription
        let count = broadcaster
            .broadcast("canvas", make_event("test", json!({})))
            .await;
        assert_eq!(count, 1);
        assert_eq!(broadcaster.subscriber_count("canvas").await, 1);
    }

    #[test]
    fn test_sse_event_creation() {
        let event = SseEvent::new("test".to_string(), json!({"key": "value"}));
        assert_eq!(event.event_type, "test");
        assert_eq!(event.data, json!({"key": "value"}));
    }

    #[test]
    fn test_sse_event_serialization() {
        let event = SseEvent::new("canvas:update".to_string(), json!({"id": "node_1"}));
        let json = serde_json::to_value(&event).unwrap();
        assert_eq!(json["event_type"], "canvas:update");
        assert_eq!(json["data"]["id"], "node_1");
    }

    #[test]
    fn test_sse_event_deserialization() {
        let json = json!({
            "event_type": "collection:created",
            "data": {"id": "col_1", "name": "Test"}
        });
        let event: SseEvent = serde_json::from_value(json).unwrap();
        assert_eq!(event.event_type, "collection:created");
        assert_eq!(event.data["name"], "Test");
    }

    #[test]
    fn test_subscription_id_generation() {
        let id1 = SubscriptionId::generate();
        let id2 = SubscriptionId::generate();
        assert_ne!(id1, id2);
        assert!(!id1.as_str().is_empty());
    }

    #[tokio::test]
    async fn test_total_subscriptions_across_streams() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, _rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe("canvas").await;
        let (_id3, _rx3) = broadcaster.subscribe("collections").await;

        assert_eq!(broadcaster.total_subscriptions().await, 3);
    }
}
