// Tauri command handlers

use crate::application::proxy_service::ProxyService;
use crate::domain::models::HelloWorldResponse;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Initialize the proxy service
pub fn create_proxy_service() -> Arc<Mutex<ProxyService>> {
    Arc::new(Mutex::new(ProxyService::new()))
}

/// Hello world command handler
#[tauri::command]
pub async fn hello_world(
    service: tauri::State<'_, Arc<Mutex<ProxyService>>>,
) -> Result<HelloWorldResponse, String> {
    let service = service.lock().await;
    Ok(service.hello_world())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_hello_world_command() {
        let service = create_proxy_service();
        // Test the service directly as integration tests will cover the command
        let response = service.lock().await.hello_world();
        assert_eq!(response.message, "Hello from Runi!");
    }
}
