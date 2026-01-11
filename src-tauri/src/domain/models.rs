// Domain models for the application

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HelloWorldResponse {
    pub message: String,
    pub timestamp: u64,
}

impl HelloWorldResponse {
    pub fn new(message: String) -> Self {
        Self {
            message,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        }
    }
}
