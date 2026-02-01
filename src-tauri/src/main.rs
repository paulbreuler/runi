// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Runi - An intelligent API development partner.
//!
//! This crate provides the Tauri backend for the runi desktop application,
//! handling HTTP request execution, command handlers, and application state management.

mod application;
mod domain;
mod infrastructure;

use infrastructure::commands::{
    clear_request_history, cmd_add_httpbin_collection, cmd_delete_collection, cmd_list_collections,
    cmd_load_collection, cmd_save_collection, create_proxy_service, delete_history_entry,
    get_history_batch, get_history_count, get_history_ids, get_platform, get_process_startup_time,
    get_system_specs, hello_world, load_request_history, save_request_history, set_log_level,
    write_startup_timing,
};
use infrastructure::http::execute_request;
use infrastructure::logging::init_logging;
use infrastructure::memory_monitor::{
    collect_ram_sample, get_ram_stats, set_memory_monitoring_enabled, start_memory_monitor,
};
use sysinfo::System;
use tauri::Manager;

/// Initialize and run the Tauri application.
///
/// Sets up the Tauri builder with plugins, command handlers, and managed state.
/// In debug mode, automatically opens developer tools.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
#[allow(clippy::large_stack_frames)] // Tauri's generate_context! macro creates large stack frames
pub fn run() {
    // Record process startup time (at the very start of main, before any initialization)
    // This measures from process launch until Tauri setup completes
    let process_start_time = std::time::Instant::now();

    // Initialize structured logging before anything else
    init_logging();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(move |app| {
            #[cfg(debug_assertions)]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            // Calculate time from process start to Tauri setup completion
            // This includes: Rust init, Tauri init, plugin init, WebView creation
            // Note: This doesn't include HTML/JS loading time, which is measured separately in frontend
            let process_startup_ms = process_start_time.elapsed().as_millis() as f64;
            app.manage(std::sync::Mutex::new(process_startup_ms));

            // Get system RAM for memory monitoring
            let mut system = System::new();
            system.refresh_memory();
            // sysinfo::System::total_memory() returns KiB; convert KiB -> GiB by dividing by 1024^2
            let total_ram_gb = system.total_memory() as f64 / (1024.0 * 1024.0);

            // Start memory monitoring service (heartbeat sampling)
            let app_handle = app.handle();
            start_memory_monitor(app_handle, total_ram_gb);

            Ok(())
        })
        .manage(create_proxy_service())
        .invoke_handler(tauri::generate_handler![
            hello_world,
            execute_request,
            get_platform,
            get_process_startup_time,
            get_system_specs,
            get_ram_stats,
            collect_ram_sample,
            set_memory_monitoring_enabled,
            save_request_history,
            load_request_history,
            delete_history_entry,
            clear_request_history,
            get_history_count,
            get_history_ids,
            get_history_batch,
            cmd_save_collection,
            cmd_load_collection,
            cmd_list_collections,
            cmd_delete_collection,
            cmd_add_httpbin_collection,
            set_log_level,
            write_startup_timing
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}
