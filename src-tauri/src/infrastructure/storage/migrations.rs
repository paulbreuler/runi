// Copyright (c) 2026 BaseState LLC
// SPDX-License-Identifier: MIT

//! Database migration framework for `SQLite`.
//!
//! This module provides a version-controlled migration system for `SQLite` databases.
//! Migrations are embedded at compile time and applied in order.
//!
//! # Adding a new migration
//!
//! 1. Create a new SQL file in `src-tauri/migrations/` named `VXXX_description.sql`
//!    where XXX is the version number (e.g., `V001_initial_schema.sql`).
//! 2. Add the migration to the `MIGRATIONS` array in this file.
//! 3. Run `cargo test` to verify the migration applies correctly.
//!
//! # Migration format
//!
//! Each migration file should contain valid `SQLite` statements.
//! Migrations are applied in a transaction and rolled back on failure.

use rusqlite::Connection;

/// A database migration with version number and SQL content.
#[derive(Debug, Clone, Copy)]
pub struct Migration {
    /// Version number (must be unique and sequential).
    pub version: u32,
    /// Short description for logging.
    pub name: &'static str,
    /// SQL statements to execute.
    pub sql: &'static str,
}

/// All migrations, embedded at compile time.
///
/// **IMPORTANT:** Add new migrations at the end of this array.
/// Never modify existing migrations - create a new one instead.
pub static MIGRATIONS: &[Migration] = &[Migration {
    version: 1,
    name: "initial_schema",
    sql: include_str!("../../../migrations/V001_initial_schema.sql"),
}];

/// Apply all pending migrations to the database.
///
/// This function:
/// 1. Creates the migration tracking table if it doesn't exist
/// 2. Checks which migrations have already been applied
/// 3. Applies any pending migrations in order
/// 4. Records each successful migration
///
/// # Errors
///
/// Returns an error if:
/// - Creating the migration table fails
/// - Any migration fails to apply
/// - Recording a migration fails
pub fn apply_migrations(conn: &Connection) -> Result<(), String> {
    // Create migration tracking table
    conn.execute(
        r"
        CREATE TABLE IF NOT EXISTS _migrations (
            version INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
        ",
        [],
    )
    .map_err(|e| format!("Failed to create migrations table: {e}"))?;

    // Get current version
    let current_version: u32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM _migrations",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to get current version: {e}"))?;

    // Apply pending migrations
    for migration in MIGRATIONS {
        if migration.version <= current_version {
            continue; // Already applied
        }

        tracing::info!(
            "Applying migration V{:03}: {}",
            migration.version,
            migration.name
        );

        // Execute migration in a transaction
        let tx = conn
            .unchecked_transaction()
            .map_err(|e| format!("Failed to start transaction: {e}"))?;

        tx.execute_batch(migration.sql)
            .map_err(|e| format!("Migration V{:03} failed: {e}", migration.version))?;

        // Record the migration
        tx.execute(
            "INSERT INTO _migrations (version, name) VALUES (?1, ?2)",
            rusqlite::params![migration.version, migration.name],
        )
        .map_err(|e| format!("Failed to record migration: {e}"))?;

        tx.commit()
            .map_err(|e| format!("Failed to commit migration: {e}"))?;

        tracing::info!(
            "Migration V{:03}: {} applied successfully",
            migration.version,
            migration.name
        );
    }

    Ok(())
}

/// Get the current database schema version.
///
/// # Errors
///
/// Returns an error if the query fails.
#[allow(dead_code)]
pub fn get_current_version(conn: &Connection) -> Result<u32, String> {
    // Check if migrations table exists
    let table_exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_migrations')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check migrations table: {e}"))?;

    if !table_exists {
        return Ok(0);
    }

    conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM _migrations",
        [],
        |row| row.get(0),
    )
    .map_err(|e| format!("Failed to get version: {e}"))
}

/// Get the list of applied migrations.
///
/// # Errors
///
/// Returns an error if the query fails.
#[allow(dead_code)]
pub fn get_applied_migrations(conn: &Connection) -> Result<Vec<(u32, String, String)>, String> {
    // Check if migrations table exists
    let table_exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_migrations')",
            [],
            |row| row.get(0),
        )
        .map_err(|e| format!("Failed to check migrations table: {e}"))?;

    if !table_exists {
        return Ok(Vec::new());
    }

    let mut stmt = conn
        .prepare("SELECT version, name, applied_at FROM _migrations ORDER BY version")
        .map_err(|e| format!("Failed to prepare statement: {e}"))?;

    let migrations = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .map_err(|e| format!("Failed to query migrations: {e}"))?
        .filter_map(Result::ok)
        .collect();

    Ok(migrations)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_apply_migrations_creates_table() {
        let conn = Connection::open_in_memory().unwrap();
        apply_migrations(&conn).unwrap();

        // Verify migrations table exists
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_migrations')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(exists);
    }

    #[test]
    fn test_migrations_are_tracked() {
        let conn = Connection::open_in_memory().unwrap();
        apply_migrations(&conn).unwrap();

        let version = get_current_version(&conn).unwrap();
        assert!(version >= 1, "At least one migration should be applied");
    }

    #[test]
    fn test_migrations_are_idempotent() {
        let conn = Connection::open_in_memory().unwrap();

        // Apply twice
        apply_migrations(&conn).unwrap();
        apply_migrations(&conn).unwrap();

        // Should still have same version
        let applied = get_applied_migrations(&conn).unwrap();
        let unique_versions: std::collections::HashSet<_> =
            applied.iter().map(|(v, _, _)| v).collect();
        assert_eq!(
            applied.len(),
            unique_versions.len(),
            "No duplicate migrations"
        );
    }

    #[test]
    fn test_history_table_created() {
        let conn = Connection::open_in_memory().unwrap();
        apply_migrations(&conn).unwrap();

        // Verify history table exists with correct schema
        let exists: bool = conn
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='history')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(exists, "history table should exist after migrations");
    }
}
