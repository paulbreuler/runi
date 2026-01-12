// Runi - Main entry point for Tauri application

mod application;
mod domain;
mod infrastructure;

use infrastructure::commands::{create_proxy_service, hello_world};
use infrastructure::http::execute_request;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            let _ = app; // Silence unused warning in release builds
            Ok(())
        })
        .manage(create_proxy_service())
        .invoke_handler(tauri::generate_handler![hello_world, execute_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
