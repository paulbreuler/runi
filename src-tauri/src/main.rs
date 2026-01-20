//! Runi - An intelligent API development partner.
//!
//! This crate provides the Tauri backend for the runi desktop application,
//! handling HTTP request execution, command handlers, and application state management.

mod application;
mod domain;
mod infrastructure;

use infrastructure::commands::{
    clear_request_history, create_proxy_service, delete_history_entry, get_history_batch,
    get_history_count, get_history_ids, get_platform, hello_world, load_request_history,
    save_request_history, set_log_level,
};
use infrastructure::http::execute_request;
use infrastructure::logging::init_logging;

/// Initialize and run the Tauri application.
///
/// Sets up the Tauri builder with plugins, command handlers, and managed state.
/// In debug mode, automatically opens developer tools.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[allow(clippy::large_stack_frames)] // Tauri's generate_context! macro creates large stack frames
pub fn run() {
    // Initialize structured logging before anything else
    init_logging();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
        .invoke_handler(tauri::generate_handler![
            hello_world,
            execute_request,
            get_platform,
            save_request_history,
            load_request_history,
            delete_history_entry,
            clear_request_history,
            get_history_count,
            get_history_ids,
            get_history_batch,
            set_log_level
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
