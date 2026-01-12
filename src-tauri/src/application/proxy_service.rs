// Proxy service - initial interception stub
// This will be expanded with HTTP proxy functionality

use crate::domain::models::HelloWorldResponse;

pub struct ProxyService;

impl ProxyService {
    #[must_use]
    pub const fn new() -> Self {
        Self
    }

    #[must_use]
    #[allow(clippy::unused_self)] // Method signature for future state access
    pub fn hello_world(&self) -> HelloWorldResponse {
        HelloWorldResponse::new("Hello from Runi!".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hello_world() {
        let service = ProxyService::new();
        let response = service.hello_world();
        assert_eq!(response.message, "Hello from Runi!");
        assert!(response.timestamp > 0);
    }
}
