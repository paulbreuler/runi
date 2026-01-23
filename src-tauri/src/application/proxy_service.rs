// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Proxy service - initial interception stub
// This will be expanded with HTTP proxy functionality

use crate::domain::models::HelloWorldResponse;

pub struct ProxyService;

impl ProxyService {
    #[must_use]
    pub const fn new() -> Self {
        Self
    }

    /// Returns a hello world response.
    ///
    /// This is a placeholder method that will be expanded with actual proxy functionality.
    #[must_use]
    pub fn hello_world() -> HelloWorldResponse {
        HelloWorldResponse::new("Hello from Runi!".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello_world() {
        let response = ProxyService::hello_world();
        assert_eq!(response.message, "Hello from Runi!");
        assert!(response.timestamp > 0);
    }
}
