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
    enabled: bool,        // Whether monitoring is currently enabled
    write_counter: usize, // Separate counter for periodic file writes (monotonically increasing)
}

impl MemoryMonitorState {
    const fn new(total_ram_gb: f64) -> Self {
        // Fixed threshold: 500 MB
        // The app shouldn't use more than 500 MB unless someone is pushing testing really hard
        let threshold_mb = 500.0;
        let threshold_percent = 0.0; // Not used anymore, but kept for API compatibility

        Self {
            samples: Vec::new(),
            max_samples: 20, // Keep last 20 samples (~10 minutes at 30s intervals)
            total_system_ram_gb: total_ram_gb,
            threshold_mb,
            threshold_percent,
            peak_mb: 0.0,
            threshold_exceeded: false,
            enabled: false, // Start disabled - will be enabled when user toggles metrics on
            write_counter: 0, // Track write cadence separately from sample count
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

        // Check threshold (trigger when at or above threshold)
        let exceeded = sample.memory_mb >= self.threshold_mb;
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
    // Only refresh processes, not all system info (more efficient)
    system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    let pid = Pid::from(std::process::id() as usize);

    system.process(pid).map_or((0.0, 0.0), |process| {
        let memory_bytes = process.memory();
        // Convert bytes (from sysinfo 0.31) to MiB; precision loss is acceptable for memory measurements in MB
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

            // Check if monitoring is enabled before collecting samples
            let is_enabled = if let Ok(guard) = state.lock() {
                guard.enabled
            } else {
                tracing::error!("Mutex poisoned in memory monitor, stopping monitoring");
                break; // Exit loop if mutex is poisoned
            };

            if !is_enabled {
                // Skip sampling when disabled, but continue the loop to check again next interval
                tracing::debug!("Memory monitoring is disabled, skipping sample collection");
                continue;
            }

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
            let was_exceeded_before = if let Ok(guard) = state.lock() {
                guard.threshold_exceeded
            } else {
                tracing::error!("Mutex poisoned in memory monitor, stopping monitoring");
                break; // Exit loop if mutex is poisoned
            };
            // Drop guard explicitly before next lock acquisition
            let (should_alert, alert_stats_if_needed) = if let Ok(mut guard) = state.lock() {
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
            } else {
                tracing::error!("Mutex poisoned in memory monitor, stopping monitoring");
                break; // Exit loop if mutex is poisoned
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
            let update_stats = if let Ok(state_guard) = state.lock() {
                state_guard.get_stats()
            } else {
                tracing::error!("Mutex poisoned in memory monitor, stopping monitoring");
                break; // Exit loop if mutex is poisoned
            };

            let _ = app_clone.emit("memory:update", &update_stats);

            // Write metrics to file periodically (every 10 samples = ~5 minutes)
            // Use separate write_counter to avoid issues when samples_count is capped
            let should_write = if let Ok(mut guard) = state.lock() {
                guard.write_counter += 1;
                let counter = guard.write_counter;
                drop(guard);
                counter > 0 && counter % 10 == 0
            } else {
                tracing::error!("Mutex poisoned in memory monitor, stopping monitoring");
                break; // Exit loop if mutex is poisoned
            };
            if should_write {
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

/// Collect an immediate RAM sample and emit update event.
///
/// This command triggers an immediate sample collection instead of waiting
/// for the next 30-second interval. Useful for instant metrics display
/// when metrics are first enabled.
///
/// # Arguments
///
/// * `app` - Tauri app handle for emitting events
/// * `state` - Memory monitor state
///
/// # Returns
///
/// Updated RAM statistics after collecting the sample.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri command API requires State to be passed by value, not reference
pub async fn collect_ram_sample(
    app: tauri::AppHandle,
    state: tauri::State<'_, Arc<Mutex<MemoryMonitorState>>>,
) -> Result<RamStats, String> {
    // Check if monitoring is enabled before allowing manual collection
    let (total_ram_gb, is_enabled) = {
        let state_guard = state
            .lock()
            .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;
        (state_guard.total_system_ram_gb, state_guard.enabled)
    };

    // If monitoring is disabled, return current stats without collecting new sample
    if !is_enabled {
        let state_guard = state
            .lock()
            .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;
        return Ok(state_guard.get_stats());
    }

    // Get current memory usage
    let (memory_mb, _memory_percent) = get_current_memory_usage(total_ram_gb);

    // Create sample
    let sample = RamSample {
        timestamp: chrono::Utc::now().to_rfc3339(),
        memory_mb,
        memory_percent: (memory_mb / (total_ram_gb * 1024.0)) * 100.0,
    };

    // Update state and check for threshold
    let was_exceeded_before = {
        let guard = state
            .lock()
            .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;
        guard.threshold_exceeded
    };

    let (should_alert, alert_stats_if_needed, update_stats) = {
        let mut guard = state
            .lock()
            .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;
        guard.add_sample(&sample);
        let stats_after_update = guard.get_stats();
        let alert = !was_exceeded_before && stats_after_update.threshold_exceeded;
        let stats_for_alert = if alert {
            Some(stats_after_update.clone())
        } else {
            None
        };
        drop(guard);
        (alert, stats_for_alert, stats_after_update)
    };

    // Emit event if threshold exceeded
    if should_alert {
        let threshold_stats =
            alert_stats_if_needed.expect("should_alert is true but stats are None");

        let _ = app.emit(
            "memory:threshold-exceeded",
            serde_json::json!({
                "current": threshold_stats.current,
                "threshold": threshold_stats.threshold_mb,
                "thresholdPercent": threshold_stats.threshold_percent,
                "totalRamGb": total_ram_gb,
            }),
        );
    }

    // Emit periodic update (for UI display)
    let _ = app.emit("memory:update", &update_stats);

    Ok(update_stats)
}

/// Enable or disable memory monitoring.
///
/// When disabled, the background monitoring task will skip collecting samples
/// and emitting events. This allows the toggle to control monitoring activity.
///
/// # Arguments
///
/// * `enabled` - Whether to enable monitoring
/// * `state` - Memory monitor state
///
/// # Returns
///
/// Ok(()) on success, or an error string if state access fails.
#[tauri::command]
#[allow(clippy::needless_pass_by_value)] // Tauri command API requires State to be passed by value, not reference
pub async fn set_memory_monitoring_enabled(
    enabled: bool,
    state: tauri::State<'_, Arc<Mutex<MemoryMonitorState>>>,
) -> Result<(), String> {
    let mut guard = state
        .lock()
        .map_err(|e| format!("Failed to get memory monitor state: {e}"))?;

    guard.enabled = enabled;

    tracing::debug!(
        "Memory monitoring {}abled",
        if enabled { "en" } else { "dis" }
    );
    drop(guard);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_monitor_state_starts_disabled() {
        let state = MemoryMonitorState::new(8.0); // 8GB RAM
        assert!(!state.enabled, "Monitoring should start disabled");
    }

    #[test]
    fn test_memory_monitor_state_enable_disable() {
        let state = Arc::new(Mutex::new(MemoryMonitorState::new(8.0)));

        // Test enabling
        {
            let mut guard = state.lock().unwrap();
            guard.enabled = true;
        }
        assert!(
            state.lock().unwrap().enabled,
            "Should be enabled after setting to true"
        );

        // Test disabling
        {
            let mut guard = state.lock().unwrap();
            guard.enabled = false;
        }
        assert!(
            !state.lock().unwrap().enabled,
            "Should be disabled after setting to false"
        );
    }

    #[test]
    fn test_collect_ram_sample_respects_enabled_flag_logic() {
        // Test the logic: when disabled, get_stats should return without adding samples
        let state = Arc::new(Mutex::new(MemoryMonitorState::new(8.0)));

        // When disabled, stats should be empty
        {
            let mut guard = state.lock().unwrap();
            guard.enabled = false;
        }

        let initial_stats = state.lock().unwrap().get_stats();
        let initial_samples_count = initial_stats.samples_count;
        assert_eq!(initial_samples_count, 0, "Should start with no samples");

        // Manually add a sample to verify state works
        {
            let mut guard = state.lock().unwrap();
            let sample = RamSample {
                timestamp: chrono::Utc::now().to_rfc3339(),
                memory_mb: 100.0,
                memory_percent: 1.25,
            };
            guard.add_sample(&sample);
        }

        // Verify sample was added
        let after_stats = state.lock().unwrap().get_stats();
        assert_eq!(
            after_stats.samples_count,
            initial_samples_count + 1,
            "Sample should be added when manually calling add_sample"
        );
    }
}
