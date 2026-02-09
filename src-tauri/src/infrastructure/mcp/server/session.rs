// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! MCP session management.
//!
//! Tracks active client sessions identified by `Mcp-Session-Id` headers.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Manages active MCP client sessions.
#[derive(Debug)]
pub struct SessionManager {
    sessions: Arc<RwLock<HashMap<String, SessionInfo>>>,
}

/// Information about an active session.
#[derive(Debug, Clone)]
#[allow(dead_code)] // Fields used for future session introspection
pub struct SessionInfo {
    /// Session identifier.
    pub id: String,
    /// When the session was created (Unix timestamp).
    pub created_at: u64,
}

impl SessionManager {
    /// Create a new session manager.
    #[must_use]
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new session and return its ID.
    pub async fn create_session(&self) -> String {
        let id = Uuid::now_v7().to_string();
        let info = SessionInfo {
            id: id.clone(),
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        };
        self.sessions.write().await.insert(id.clone(), info);
        id
    }

    /// Check if a session exists.
    pub async fn has_session(&self, id: &str) -> bool {
        self.sessions.read().await.contains_key(id)
    }

    /// Remove a session.
    pub async fn remove_session(&self, id: &str) -> bool {
        self.sessions.write().await.remove(id).is_some()
    }

    /// Get the number of active sessions.
    pub async fn session_count(&self) -> usize {
        self.sessions.read().await.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_session() {
        let manager = SessionManager::new();
        let id = manager.create_session().await;
        assert!(!id.is_empty());
        assert!(manager.has_session(&id).await);
    }

    #[tokio::test]
    async fn test_remove_session() {
        let manager = SessionManager::new();
        let id = manager.create_session().await;
        assert!(manager.remove_session(&id).await);
        assert!(!manager.has_session(&id).await);
    }

    #[tokio::test]
    async fn test_remove_nonexistent_session() {
        let manager = SessionManager::new();
        assert!(!manager.remove_session("nonexistent").await);
    }

    #[tokio::test]
    async fn test_session_count() {
        let manager = SessionManager::new();
        assert_eq!(manager.session_count().await, 0);
        manager.create_session().await;
        manager.create_session().await;
        assert_eq!(manager.session_count().await, 2);
    }

    #[tokio::test]
    async fn test_sessions_have_unique_ids() {
        let manager = SessionManager::new();
        let id1 = manager.create_session().await;
        let id2 = manager.create_session().await;
        assert_ne!(id1, id2);
    }
}
