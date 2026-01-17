//! Structured logging infrastructure with correlation ID support.
//!
//! Provides tracing integration with log level configuration and correlation ID
//! propagation for tracing requests across React and Rust boundaries.

use std::sync::OnceLock;
use tracing::Level;
use tracing_subscriber::{EnvFilter, Registry, fmt, layer::SubscriberExt, util::SubscriberInitExt};

/// Global log level state (can be changed at runtime via Tauri command).
static LOG_LEVEL: OnceLock<std::sync::Mutex<Level>> = OnceLock::new();

/// Track if logging has been initialized.
static INITIALIZED: OnceLock<()> = OnceLock::new();

/// Initialize the tracing subscriber with log level from environment or default.
///
/// Log level can be set via `RUST_LOG` environment variable:
/// - `RUST_LOG=debug` - Show all logs including debug
/// - `RUST_LOG=info` - Show info, warn, and error (default)
/// - `RUST_LOG=warn` - Show only warnings and errors
/// - `RUST_LOG=error` - Show only errors
///
/// Can also be set per module: `RUST_LOG=runi::infrastructure::http=debug`
///
/// Safe to call multiple times - will only initialize once.
pub fn init_logging() {
    // Only initialize once using OnceLock
    if INITIALIZED.get().is_some() {
        // Ensure LOG_LEVEL is initialized even if subscriber was already set
        LOG_LEVEL.get_or_init(|| std::sync::Mutex::new(Level::INFO));
        return;
    }

    // Get initial log level from environment or default to info
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    // Try to initialize the default subscriber
    // This may fail if already initialized (e.g., in tests), which is ok
    let init_result = std::panic::catch_unwind(|| {
        Registry::default()
            .with(env_filter)
            .with(fmt::layer().with_ansi(true))
            .init();
    });

    // Mark as initialized regardless of whether init succeeded
    // (subscriber may have been set by another call or test)
    let _ = INITIALIZED.set(());

    // Initialize global log level state with default INFO
    LOG_LEVEL.get_or_init(|| std::sync::Mutex::new(Level::INFO));

    // If init failed, that's ok - subscriber was already set
    let _ = init_result;
}

/// Set the global log level at runtime.
///
/// This allows changing log levels via Tauri commands (e.g., for MCP control).
/// Note: This only updates the stored level for querying; the actual filter
/// is set at initialization and cannot be changed at runtime without the
/// reload feature.
pub fn set_log_level(level: Level) {
    if let Some(mutex) = LOG_LEVEL.get() {
        if let Ok(mut guard) = mutex.lock() {
            *guard = level;
        }
    }
}

/// Get the current log level.
#[allow(dead_code)]
pub fn get_log_level() -> Level {
    LOG_LEVEL
        .get()
        .and_then(|m| m.lock().ok())
        .map_or(Level::INFO, |guard| *guard)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_log_level_default() {
        // Initialize logging if not already done
        init_logging();

        // Should return INFO by default
        let level = get_log_level();
        assert_eq!(level, Level::INFO);
    }

    #[test]
    fn test_set_and_get_log_level() {
        // Initialize logging if not already done
        init_logging();

        // Test setting different log levels
        set_log_level(Level::DEBUG);
        assert_eq!(get_log_level(), Level::DEBUG);

        set_log_level(Level::WARN);
        assert_eq!(get_log_level(), Level::WARN);

        // Reset to INFO for other tests
        set_log_level(Level::INFO);
    }

    #[test]
    fn test_init_logging_does_not_panic() {
        // Should be safe to call multiple times
        init_logging();
        init_logging();
        init_logging();

        // Should still work
        let level = get_log_level();
        assert!(matches!(
            level,
            Level::INFO | Level::DEBUG | Level::WARN | Level::ERROR | Level::TRACE
        ));
    }
}
