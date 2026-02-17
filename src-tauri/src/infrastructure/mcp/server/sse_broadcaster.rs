// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Generic SSE broadcaster for multi-stream support.
//!
//! Provides a flexible broadcaster that can handle multiple named streams
//! (e.g., "canvas", "collections", "requests") with independent subscriptions.
//!
//! Supports two subscription models:
//! - **Named streams**: Subscribe to a specific stream by name (e.g., "canvas").
//!   Events are broadcast to a stream by name and only reach subscribers of that stream.
//! - **Topic filters**: Subscribe with glob patterns (e.g., `collection:*`, `*:created`).
//!   Events are broadcast by topic and delivered to all subscribers whose patterns match.
//!
//! Unlike `EventBroadcaster` which is specific to `EventEnvelope`, this
//! broadcaster is generic over the event type and supports multiple streams.

use std::collections::HashMap;
use std::sync::Arc;

use glob_match::glob_match;
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
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Channel capacity per subscriber. Limits memory growth from slow/stalled clients.
/// If a subscriber's channel fills up, old events are dropped (backpressure).
const SUBSCRIBER_CHANNEL_CAPACITY: usize = 256;

/// A subscription to a specific stream.
#[derive(Debug)]
struct Subscription {
    /// Unique identifier for this subscription.
    id: SubscriptionId,
    /// Channel sender for delivering events to this subscriber.
    tx: tokio::sync::mpsc::Sender<SseEvent>,
}

/// Glob-based topic filter for SSE subscriptions.
///
/// Holds a list of glob patterns. An event matches if its `event_type`
/// matches **any** of the patterns. An empty pattern list matches everything
/// (equivalent to `["*"]`).
///
/// # Pattern examples
///
/// - `*` — matches all events
/// - `collection:*` — matches `collection:created`, `collection:deleted`, etc.
/// - `*:created` — matches `collection:created`, `request:created`, etc.
/// - `collection:created` — exact match only
#[derive(Debug, Clone)]
pub struct TopicFilter {
    /// Glob patterns to match against event types.
    patterns: Vec<String>,
}

impl TopicFilter {
    /// Create a topic filter from a list of glob patterns.
    ///
    /// An empty list is treated as `["*"]` (match everything).
    #[must_use]
    pub const fn new(patterns: Vec<String>) -> Self {
        Self { patterns }
    }

    /// Create a catch-all filter that matches every topic.
    #[must_use]
    pub fn all() -> Self {
        Self {
            patterns: vec!["*".to_string()],
        }
    }

    /// Parse a comma-separated string of glob patterns.
    ///
    /// Whitespace around each pattern is trimmed. Empty strings after
    /// trimming are ignored. An empty/blank input yields a catch-all filter.
    #[must_use]
    pub fn parse(input: &str) -> Self {
        let patterns: Vec<String> = input
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(String::from)
            .collect();

        if patterns.is_empty() {
            Self::all()
        } else {
            Self::new(patterns)
        }
    }

    /// Test whether an event topic matches this filter.
    ///
    /// Returns `true` if the topic matches **any** of the patterns.
    /// An empty pattern list (catch-all) always returns `true`.
    #[must_use]
    pub fn matches(&self, topic: &str) -> bool {
        if self.patterns.is_empty() {
            return true;
        }
        self.patterns.iter().any(|pat| glob_match(pat, topic))
    }

    /// Get the patterns in this filter.
    #[must_use]
    pub fn patterns(&self) -> &[String] {
        &self.patterns
    }
}

/// A topic-filtered subscription.
#[derive(Debug)]
struct TopicSubscription {
    /// Unique identifier for this subscription.
    id: SubscriptionId,
    /// Channel sender for delivering events to this subscriber.
    tx: tokio::sync::mpsc::Sender<SseEvent>,
    /// Topic filter — events are only delivered if they match.
    filter: TopicFilter,
}

/// Broadcasts SSE events to subscribers on named streams.
///
/// Supports multiple independent streams (e.g., "canvas", "collections")
/// with separate subscriber lists. Each subscriber gets their own channel
/// to receive events from their subscribed stream.
///
/// Also supports topic-filtered subscriptions via [`subscribe_with_topics`]
/// and [`broadcast_to_topic`], where events are matched against glob patterns.
///
/// [`subscribe_with_topics`]: SseBroadcaster::subscribe_with_topics
/// [`broadcast_to_topic`]: SseBroadcaster::broadcast_to_topic
#[derive(Debug, Clone)]
pub struct SseBroadcaster {
    /// Map of stream name to list of subscriptions.
    streams: Arc<RwLock<HashMap<String, Vec<Subscription>>>>,
    /// Map of subscription ID to stream name for cleanup.
    subscription_to_stream: Arc<Mutex<HashMap<SubscriptionId, String>>>,
    /// Topic-filtered subscriptions (not tied to a named stream).
    topic_subscriptions: Arc<RwLock<Vec<TopicSubscription>>>,
}

impl SseBroadcaster {
    /// Create a new SSE broadcaster.
    #[must_use]
    pub fn new() -> Self {
        Self {
            streams: Arc::new(RwLock::new(HashMap::new())),
            subscription_to_stream: Arc::new(Mutex::new(HashMap::new())),
            topic_subscriptions: Arc::new(RwLock::new(Vec::new())),
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

    /// Subscribe with topic-based filtering.
    ///
    /// Returns a `(SubscriptionId, Receiver<SseEvent>)`. The receiver gets
    /// events whose `event_type` matches the given [`TopicFilter`].
    ///
    /// Use [`broadcast_to_topic`] to deliver events to topic subscribers.
    ///
    /// [`broadcast_to_topic`]: SseBroadcaster::broadcast_to_topic
    pub async fn subscribe_with_topics(
        &self,
        filter: TopicFilter,
    ) -> (SubscriptionId, tokio::sync::mpsc::Receiver<SseEvent>) {
        let (tx, rx) = tokio::sync::mpsc::channel(SUBSCRIBER_CHANNEL_CAPACITY);
        let id = SubscriptionId::generate();

        let subscription = TopicSubscription {
            id: id.clone(),
            tx,
            filter,
        };

        self.topic_subscriptions.write().await.push(subscription);

        (id, rx)
    }

    /// Broadcast an event to all subscribers of a stream.
    ///
    /// Returns the number of subscribers that received the event.
    /// Automatically removes any closed subscriptions encountered.
    ///
    /// For slow subscribers whose buffers are full, the event is dropped
    /// (backpressure policy). This prevents unbounded memory growth.
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
                        // Don't increment sent_count since event wasn't actually received
                        tracing::warn!(
                            "SSE subscriber {} buffer full, dropping event",
                            sub.id.as_str()
                        );
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

    /// Broadcast an event to all topic-filtered subscribers whose filter matches.
    ///
    /// The event's `event_type` is tested against each subscriber's
    /// [`TopicFilter`]. Only matching subscribers receive the event.
    ///
    /// Returns the number of subscribers that received the event.
    /// Automatically removes closed subscriptions.
    #[allow(dead_code)]
    #[allow(clippy::significant_drop_tightening)]
    pub async fn broadcast_to_topic(&self, event: SseEvent) -> usize {
        let mut closed_ids = Vec::new();
        let mut sent_count = 0;

        {
            let mut subs = self.topic_subscriptions.write().await;

            for sub in subs.iter() {
                if !sub.filter.matches(&event.event_type) {
                    continue;
                }

                match sub.tx.try_send(event.clone()) {
                    Ok(()) => {
                        sent_count += 1;
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Full(_)) => {
                        tracing::warn!(
                            "SSE topic subscriber {} buffer full, dropping event",
                            sub.id.as_str()
                        );
                    }
                    Err(tokio::sync::mpsc::error::TrySendError::Closed(_)) => {
                        closed_ids.push(sub.id.clone());
                    }
                }
            }

            if !closed_ids.is_empty() {
                subs.retain(|sub| !closed_ids.contains(&sub.id));
            }
        }

        sent_count
    }

    /// Unsubscribe from a stream.
    ///
    /// Returns `true` if the subscription was found and removed, `false` otherwise.
    /// Works for both named-stream and topic-filtered subscriptions.
    pub async fn unsubscribe(&self, subscription_id: &SubscriptionId) -> bool {
        // Try named-stream subscriptions first
        let stream_name = {
            let mut sub_map = self.subscription_to_stream.lock().await;
            sub_map.remove(subscription_id)
        };

        if let Some(stream_name) = stream_name {
            return self
                .streams
                .write()
                .await
                .get_mut(&stream_name)
                .is_some_and(|subscriptions| {
                    let initial_len = subscriptions.len();
                    subscriptions.retain(|sub| &sub.id != subscription_id);
                    subscriptions.len() < initial_len
                });
        }

        // Try topic subscriptions
        let mut topic_subs = self.topic_subscriptions.write().await;
        let initial_len = topic_subs.len();
        topic_subs.retain(|sub| &sub.id != subscription_id);
        topic_subs.len() < initial_len
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

        // Also clean up topic subscriptions
        {
            let mut topic_subs = self.topic_subscriptions.write().await;
            let initial_len = topic_subs.len();
            topic_subs.retain(|sub| !sub.tx.is_closed());
            removed_count += initial_len - topic_subs.len();
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
        let topic_subs = self.topic_subscriptions.read().await;
        streams.values().map(std::vec::Vec::len).sum::<usize>() + topic_subs.len()
    }

    /// Get the number of topic-filtered subscribers.
    #[cfg(test)]
    pub async fn topic_subscriber_count(&self) -> usize {
        self.topic_subscriptions.read().await.len()
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

    // ========================================================================
    // TopicFilter unit tests
    // ========================================================================

    #[test]
    fn test_topic_filter_exact_match() {
        let filter = TopicFilter::new(vec!["collection:created".to_string()]);
        assert!(filter.matches("collection:created"));
        assert!(!filter.matches("collection:deleted"));
        assert!(!filter.matches("request:created"));
    }

    #[test]
    fn test_topic_filter_wildcard_suffix() {
        let filter = TopicFilter::new(vec!["collection:*".to_string()]);
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("collection:deleted"));
        assert!(filter.matches("collection:updated"));
        assert!(!filter.matches("request:created"));
    }

    #[test]
    fn test_topic_filter_wildcard_prefix() {
        let filter = TopicFilter::new(vec!["*:created".to_string()]);
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("request:created"));
        assert!(filter.matches("canvas:created"));
        assert!(!filter.matches("collection:deleted"));
    }

    #[test]
    fn test_topic_filter_star_matches_all() {
        let filter = TopicFilter::new(vec!["*".to_string()]);
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("request:executed"));
        assert!(filter.matches("anything"));
    }

    #[test]
    fn test_topic_filter_multiple_patterns() {
        let filter = TopicFilter::new(vec!["collection:*".to_string(), "request:*".to_string()]);
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("request:executed"));
        assert!(!filter.matches("canvas:updated"));
    }

    #[test]
    fn test_topic_filter_empty_is_catch_all() {
        let filter = TopicFilter::new(vec![]);
        assert!(filter.matches("anything"));
        assert!(filter.matches("collection:created"));
    }

    #[test]
    fn test_topic_filter_all_constructor() {
        let filter = TopicFilter::all();
        assert!(filter.matches("anything"));
        assert_eq!(filter.patterns(), &["*"]);
    }

    #[test]
    fn test_topic_filter_parse_single() {
        let filter = TopicFilter::parse("collection:*");
        assert!(filter.matches("collection:created"));
        assert!(!filter.matches("request:created"));
    }

    #[test]
    fn test_topic_filter_parse_multiple() {
        let filter = TopicFilter::parse("collection:*, request:*");
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("request:executed"));
        assert!(!filter.matches("canvas:updated"));
    }

    #[test]
    fn test_topic_filter_parse_empty_is_catch_all() {
        let filter = TopicFilter::parse("");
        assert!(filter.matches("anything"));
    }

    #[test]
    fn test_topic_filter_parse_whitespace_only_is_catch_all() {
        let filter = TopicFilter::parse("  ,  , ");
        assert!(filter.matches("anything"));
    }

    #[test]
    fn test_topic_filter_parse_trims_whitespace() {
        let filter = TopicFilter::parse("  collection:*  ,  request:*  ");
        assert!(filter.matches("collection:created"));
        assert!(filter.matches("request:executed"));
    }

    // ========================================================================
    // Topic subscription integration tests
    // ========================================================================

    #[tokio::test]
    async fn test_subscribe_with_topics_creates_subscription() {
        let broadcaster = SseBroadcaster::new();
        let (_id, _rx) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;
        assert_eq!(broadcaster.topic_subscriber_count().await, 1);
    }

    #[tokio::test]
    async fn test_broadcast_to_topic_delivers_matching_events() {
        let broadcaster = SseBroadcaster::new();
        let filter = TopicFilter::new(vec!["collection:*".to_string()]);
        let (_id, mut rx) = broadcaster.subscribe_with_topics(filter).await;

        let event = make_event("collection:created", json!({"id": "col_1"}));
        let count = broadcaster.broadcast_to_topic(event.clone()).await;

        assert_eq!(count, 1);
        let received = rx.recv().await.unwrap();
        assert_eq!(received, event);
    }

    #[tokio::test]
    async fn test_broadcast_to_topic_filters_non_matching_events() {
        let broadcaster = SseBroadcaster::new();
        let filter = TopicFilter::new(vec!["collection:*".to_string()]);
        let (_id, mut rx) = broadcaster.subscribe_with_topics(filter).await;

        let event = make_event("request:executed", json!({"id": "req_1"}));
        let count = broadcaster.broadcast_to_topic(event).await;

        assert_eq!(count, 0);
        assert!(rx.try_recv().is_err());
    }

    #[tokio::test]
    async fn test_broadcast_to_topic_multiple_subscribers_different_filters() {
        let broadcaster = SseBroadcaster::new();

        let collection_filter = TopicFilter::new(vec!["collection:*".to_string()]);
        let (_id1, mut rx1) = broadcaster.subscribe_with_topics(collection_filter).await;

        let request_filter = TopicFilter::new(vec!["request:*".to_string()]);
        let (_id2, mut rx2) = broadcaster.subscribe_with_topics(request_filter).await;

        // Collection event — only rx1 should get it
        let col_event = make_event("collection:created", json!({"id": "col_1"}));
        let count = broadcaster.broadcast_to_topic(col_event.clone()).await;
        assert_eq!(count, 1);
        assert_eq!(rx1.recv().await.unwrap(), col_event);
        assert!(rx2.try_recv().is_err());

        // Request event — only rx2 should get it
        let req_event = make_event("request:executed", json!({"id": "req_1"}));
        let count = broadcaster.broadcast_to_topic(req_event.clone()).await;
        assert_eq!(count, 1);
        assert!(rx1.try_recv().is_err());
        assert_eq!(rx2.recv().await.unwrap(), req_event);
    }

    #[tokio::test]
    async fn test_broadcast_to_topic_catch_all_receives_everything() {
        let broadcaster = SseBroadcaster::new();
        let (_id, mut rx) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;

        let event1 = make_event("collection:created", json!({}));
        let event2 = make_event("request:executed", json!({}));

        broadcaster.broadcast_to_topic(event1.clone()).await;
        broadcaster.broadcast_to_topic(event2.clone()).await;

        assert_eq!(rx.recv().await.unwrap(), event1);
        assert_eq!(rx.recv().await.unwrap(), event2);
    }

    #[tokio::test]
    async fn test_unsubscribe_topic_subscription() {
        let broadcaster = SseBroadcaster::new();
        let (id, _rx) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;

        assert_eq!(broadcaster.topic_subscriber_count().await, 1);
        assert!(broadcaster.unsubscribe(&id).await);
        assert_eq!(broadcaster.topic_subscriber_count().await, 0);
    }

    #[tokio::test]
    async fn test_broadcast_to_topic_cleans_up_closed_subscribers() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, rx1) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;
        let (_id2, _rx2) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;

        assert_eq!(broadcaster.topic_subscriber_count().await, 2);

        drop(rx1);

        let count = broadcaster
            .broadcast_to_topic(make_event("test", json!({})))
            .await;
        assert_eq!(count, 1);
        assert_eq!(broadcaster.topic_subscriber_count().await, 1);
    }

    #[tokio::test]
    async fn test_cleanup_closed_includes_topic_subscriptions() {
        let broadcaster = SseBroadcaster::new();
        let (_id, rx) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;

        drop(rx);

        let removed = broadcaster.cleanup_closed().await;
        assert_eq!(removed, 1);
        assert_eq!(broadcaster.topic_subscriber_count().await, 0);
    }

    #[tokio::test]
    async fn test_total_subscriptions_includes_topic_subs() {
        let broadcaster = SseBroadcaster::new();
        let (_id1, _rx1) = broadcaster.subscribe("canvas").await;
        let (_id2, _rx2) = broadcaster.subscribe_with_topics(TopicFilter::all()).await;

        assert_eq!(broadcaster.total_subscriptions().await, 2);
    }

    #[tokio::test]
    async fn test_topic_and_stream_subscriptions_are_independent() {
        let broadcaster = SseBroadcaster::new();

        // Stream subscription
        let (_sid, mut stream_rx) = broadcaster.subscribe("canvas").await;

        // Topic subscription
        let filter = TopicFilter::new(vec!["collection:*".to_string()]);
        let (_tid, mut topic_rx) = broadcaster.subscribe_with_topics(filter).await;

        // Stream broadcast — only stream subscriber gets it
        let stream_event = make_event("canvas:update", json!({}));
        broadcaster.broadcast("canvas", stream_event.clone()).await;
        assert_eq!(stream_rx.recv().await.unwrap(), stream_event);
        assert!(topic_rx.try_recv().is_err());

        // Topic broadcast — only topic subscriber gets it (if matching)
        let topic_event = make_event("collection:created", json!({}));
        broadcaster.broadcast_to_topic(topic_event.clone()).await;
        assert_eq!(topic_rx.recv().await.unwrap(), topic_event);
        assert!(stream_rx.try_recv().is_err());
    }

    // ========================================================================
    // Existing stream-based tests (backwards compatibility)
    // ========================================================================

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
    async fn test_broadcast_backpressure_drops_event_when_buffer_full() {
        let broadcaster = SseBroadcaster::new();
        // Subscribe but hold the receiver without consuming — events accumulate
        let (_id, _rx) = broadcaster.subscribe("canvas").await;

        // Fill the 256-event buffer
        for i in 0..SUBSCRIBER_CHANNEL_CAPACITY {
            let count = broadcaster
                .broadcast("canvas", make_event("fill", json!({"i": i})))
                .await;
            assert_eq!(count, 1, "event {i} should be delivered");
        }

        // The 257th event should be dropped (buffer full / backpressure)
        let count = broadcaster
            .broadcast("canvas", make_event("overflow", json!({"i": 256})))
            .await;
        assert_eq!(count, 0, "event should be dropped when buffer is full");

        // Subscriber must NOT be removed — backpressure is not disconnection
        assert_eq!(
            broadcaster.subscriber_count("canvas").await,
            1,
            "subscriber should remain active after backpressure"
        );
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
