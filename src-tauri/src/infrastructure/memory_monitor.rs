// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

// Memory monitoring service for RAM usage tracking and alerts

use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use sysinfo::{Pid, System};
use tauri::{AppHandle, Emitter, Manager};
use tokio::time::{Duration, interval};

/// RAM usage sample at a point in time.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RamSample {
    timestamp: String,
    memory_mb: f64,
    memory_percent: f64, // Percentage of total system RAM
}

/// RAM monitoring statistics.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RamStats {
    current: f64,             // Current RAM usage in MB
    average: f64,             // Running average in MB
    peak: f64,                // Peak usage in MB
    samples_count: usize,     // Number of samples collected
    threshold_exceeded: bool, // Whether threshold has been exceeded
    threshold_mb: f64,        // Threshold in MB
    threshold_percent: f64,   // Threshold as percentage of total RAM
}

/// RAM monitoring state.
pub struct MemoryMonitorState {
    samples: Vec<RamSample>,
    max_samples: usize, // Keep last N samples for running average
    #[allow(dead_code)] // Stored for future use (e.g., percentage calculations)
    total_system_ram_gb: f64,
    threshold_mb: f64,
    threshold_percent: f64,
    peak_mb: f64,
    threshold_exceeded: bool,
}

impl MemoryMonitorState {
    fn new(total_ram_gb: f64) -> Self {
        // Calculate threshold: 40% of total RAM or 1.5GB absolute, whichever is lower
        // This ensures it works on Raspberry Pi (4-8GB) without killing the system
        let threshold_percent = 0.40; // 40% of total RAM
        let threshold_absolute_mb = 1536.0; // 1.5GB absolute
        let threshold_from_percent = (total_ram_gb * 1024.0) * threshold_percent;
        let threshold_mb = threshold_from_percent.min(threshold_absolute_mb);

        Self {
            samples: Vec::new(),
            max_samples: 20, // Keep last 20 samples (~10 minutes at 30s intervals)
            total_system_ram_gb: total_ram_gb,
            threshold_mb,
            threshold_percent,
            peak_mb: 0.0,
            threshold_exceeded: false,
        }
    }

    fn add_sample(&mut self, sample: &RamSample) {
        self.samples.push(sample.clone());
        if self.samples.len() > self.max_samples {
            self.samples.remove(0); // Remove oldest sample
        }

        // Update peak
        if sample.memory_mb > self.peak_mb {
            self.peak_mb = sample.memory_mb;
        }

        // Check threshold
        let exceeded = sample.memory_mb > self.threshold_mb;
        if exceeded && !self.threshold_exceeded {
            self.threshold_exceeded = true;
        }
    }

    fn get_stats(&self) -> RamStats {
        let current = self.samples.last().map_or(0.0, |s| s.memory_mb);

        // Calculate running average
        let average = if self.samples.is_empty() {
            0.0
        } else {
            // Precision loss is acceptable for sample count (max 20 samples)
            #[allow(clippy::cast_precision_loss)]
            let count = self.samples.len() as f64;
            self.samples.iter().map(|s| s.memory_mb).sum::<f64>() / count
        };

        RamStats {
            current,
            average,
            peak: self.peak_mb,
            samples_count: self.samples.len(),
            threshold_exceeded: self.threshold_exceeded,
            threshold_mb: self.threshold_mb,
            threshold_percent: self.threshold_percent,
        }
    }
}

/// Get current process memory usage.
///
/// Returns memory usage in MB and as percentage of total system RAM.
fn get_current_memory_usage(total_ram_gb: f64) -> (f64, f64) {
    let mut system = System::new();
    system.refresh_all();
    let pid = Pid::from(std::process::id() as usize);

    system.process(pid).map_or((0.0, 0.0), |process| {
        let memory_bytes = process.memory();
        // Convert u64 to f64 (precision loss is acceptable for memory measurements in MB)
        #[allow(clippy::cast_precision_loss)]
        let process_memory_mb = memory_bytes as f64 / (1024.0 * 1024.0);
        let system_ram_mb = total_ram_gb * 1024.0;
        let memory_percent = (process_memory_mb / system_ram_mb) * 100.0;
        (process_memory_mb, memory_percent)
    })
}

/// Start the memory monitoring service.
///
/// This runs a background task that samples RAM usage every 30 seconds,
/// maintains a running average, and emits events when thresholds are exceeded.
///
/// # Arguments
///
/// * `app` - Tauri app handle for emitting events
/// * `total_ram_gb` - Total system RAM in GB
pub fn start_memory_monitor(app: &AppHandle, total_ram_gb: f64) {
    let state = Arc::new(Mutex::new(MemoryMonitorState::new(total_ram_gb)));
    let state_for_task = Arc::clone(&state);
    let app_clone = app.clone();

    // Store state in app for commands to access (before spawning task)
    app.manage(state);

    // Spawn background task for periodic sampling using Tauri's async runtime
    tauri::async_runtime::spawn(async move {
        let state = state_for_task;
        let mut interval = interval(Duration::from_secs(30)); // Sample every 30 seconds
        interval.tick().await; // Skip first immediate tick

        loop {
            interval.tick().await;

            // Get current memory usage
            let (memory_mb, memory_percent) = get_current_memory_usage(total_ram_gb);

            // Create sample
            let sample = RamSample {
                timestamp: chrono::Utc::now().to_rfc3339(),
                memory_mb,
                memory_percent,
            };

            // Update state and check for threshold
            // Extract needed values while holding the lock, then drop before async operations
            let was_exceeded_before = {
                let guard = state.lock().unwrap();
                guard.threshold_exceeded
            };
            // Drop guard explicitly before next lock acquisition
            let (should_alert, alert_stats_if_needed) = {
                let mut guard = state.lock().unwrap();
                guard.add_sample(&sample);
                let stats_after_update = guard.get_stats();
                let alert = !was_exceeded_before && stats_after_update.threshold_exceeded;
                // Clone stats before dropping guard (needed for async emit)
                let stats_for_alert = if alert {
                    Some(stats_after_update.clone())
                } else {
                    None
                };
                drop(guard); // Explicitly drop before returning
                (alert, stats_for_alert)
            };

            // Emit event if threshold exceeded
            if should_alert {
                let threshold_stats =
                    alert_stats_if_needed.expect("should_alert is true but stats are None");

                let _ = app_clone.emit(
                    "memory:threshold-exceeded",
                    serde_json::json!({
                        "current": threshold_stats.current,
                        "threshold": threshold_stats.threshold_mb,
                        "thresholdPercent": threshold_stats.threshold_percent,
                        "totalRamGb": total_ram_gb,
                    }),
                );
            }

            // Emit periodic update (for UI display, if needed)
            let update_stats = {
                let state_guard = state.lock().unwrap();
                state_guard.get_stats()
            };

            let _ = app_clone.emit("memory:update", &update_stats);

            // Write metrics to file periodically (every 10 samples = ~5 minutes)
            if update_stats.samples_count > 0 && update_stats.samples_count % 10 == 0 {
                if let Err(e) = write_ram_metrics_to_file(&app_clone, &update_stats).await {
                    tracing::warn!("Failed to write RAM metrics: {}", e);
                }
            }
        }
    });
}

/// Write RAM metrics to file for basestate.io and analysis.
///
/// Writes to `ram-metrics.json` in the app data directory.
async fn write_ram_metrics_to_file(app: &AppHandle, stats: &RamStats) -> Result<(), String> {
    // Get app data directory
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    // Ensure directory exists
    tokio::fs::create_dir_all(&app_data_dir)
        .await
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    // Write metrics file
    let metrics_file = app_data_dir.join("ram-metrics.json");
    let metrics_json = serde_json::to_string_pretty(stats)
        .map_err(|e| format!("Failed to serialize RAM metrics: {e}"))?;

    tokio::fs::write(&metrics_file, metrics_json.as_bytes())
        .await
        .map_err(|e| format!("Failed to write RAM metrics file: {e}"))?;

    Ok(())
}

/// Get current RAM statistics.
///
/// # Arguments
///
/// * `state` - Memory monitor state
///
/// # Returns
///
/// Current RAM statistics including average, peak, and threshold status.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri command API requires State to be passed by value, not reference
pub fn get_ram_stats(
    state: tauri::State<'_, Arc<Mutex<MemoryMonitorState>>>,
) -> Result<RamStats, String> {
    let state_guard = state
        .lock()
        .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;
    Ok(state_guard.get_stats())
}
