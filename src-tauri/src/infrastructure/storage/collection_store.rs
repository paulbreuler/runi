use crate::domain::collection::{Collection, CollectionMetadata};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
#[cfg(test)]
use std::sync::{Mutex, OnceLock};

const COLLECTIONS_DIR_NAME: &str = "collections";
const SCHEMA_COMMENT: &str =
    "# yaml-language-server: $schema=https://runi.dev/schema/collection/v1.json\n";

/// Get the collections storage directory.
///
/// ## Resolution Order
/// 1. Environment variable `RUNI_COLLECTIONS_DIR` (if set)
/// 2. Project root + `/collections/` (default, git-friendly)
///
/// ## Project Root Detection
/// - In dev mode: Uses `CARGO_MANIFEST_DIR/../collections/` (repo root, avoids Tauri rebuild triggers)
/// - In production: Uses current working directory + `/collections/`
///
/// ## Examples
/// - Default (dev): `/path/to/runi/collections/` (repo root)
/// - Default (prod): `./collections/` (user's project directory)
/// - Override: `RUNI_COLLECTIONS_DIR=/path/to/collections runi`
pub fn get_collections_dir() -> Result<PathBuf, String> {
    // Check test override first (cfg(test) only)
    #[cfg(test)]
    if let Some(override_dir) = collections_dir_override() {
        ensure_dir(&override_dir)?;
        return Ok(override_dir);
    }

    // Check environment variable override first
    if let Ok(env_dir) = std::env::var("RUNI_COLLECTIONS_DIR") {
        let dir = PathBuf::from(env_dir);
        if dir.exists() && !dir.is_dir() {
            return Err(format!(
                "RUNI_COLLECTIONS_DIR is not a directory: {}",
                dir.display()
            ));
        }
        ensure_dir(&dir)?;
        return Ok(dir);
    }

    // In dev mode, use project root to avoid Tauri rebuild triggers.
    // CARGO_MANIFEST_DIR is set as a runtime env var by both `cargo test` and
    // `cargo run` (and by Tauri's dev harness), so this branch reliably fires
    // during development. In production builds it's absent, falling through
    // to current_dir() which resolves to the user's project directory.
    let base_dir = if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        // Dev mode: go up one level from src-tauri/ to repo root
        PathBuf::from(manifest_dir)
            .parent()
            .ok_or_else(|| "Failed to get parent directory of CARGO_MANIFEST_DIR".to_string())?
            .to_path_buf()
    } else {
        // Production: use current working directory
        std::env::current_dir()
            .map_err(|e| format!("Failed to get current working directory: {e}"))?
    };

    let dir = base_dir.join(COLLECTIONS_DIR_NAME);
    ensure_dir(&dir)?;
    Ok(dir)
}

/// Save a collection to disk with deterministic serialization.
///
/// # Determinism Guarantees
/// - `BTreeMap` fields serialize in alphabetical key order
/// - Struct fields serialize in declaration order
/// - Timestamps use UTC with Z suffix
/// - No random elements in output
///
/// # Atomic Write
/// 1. Serialize to YAML string
/// 2. Write to temp file in same directory
/// 3. Rename temp → final (atomic on most filesystems)
pub fn save_collection(collection: &Collection) -> Result<PathBuf, String> {
    let dir = get_collections_dir()?;
    save_collection_in_dir(collection, &dir)
}

/// Save a collection to the specified directory with deterministic serialization.
///
/// Returns an error if another collection (different ID) already has the same name.
pub fn save_collection_in_dir(collection: &Collection, dir: &Path) -> Result<PathBuf, String> {
    ensure_dir(dir)?;
    check_name_unique(collection, dir)?;
    let filename = format!("{}.yaml", collection.id);
    let path = dir.join(&filename);

    let yaml = serde_yaml_ng::to_string(collection)
        .map_err(|e| format!("Failed to serialize collection: {e}"))?;
    let yaml_with_schema = format!("{SCHEMA_COMMENT}{yaml}");

    let temp_path = temp_path_for(dir, &collection.id);
    let mut file =
        fs::File::create(&temp_path).map_err(|e| format!("Failed to create temp file: {e}"))?;
    file.write_all(yaml_with_schema.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {e}"))?;
    file.sync_all()
        .map_err(|e| format!("Failed to sync temp file: {e}"))?;
    drop(file);

    fs::rename(&temp_path, &path).map_err(|e| format!("Failed to rename temp file: {e}"))?;

    Ok(path)
}

/// Load a collection from disk.
pub fn load_collection(collection_id: &str) -> Result<Collection, String> {
    let dir = get_collections_dir()?;
    load_collection_in_dir(collection_id, &dir)
}

/// Load a collection from the specified directory.
pub fn load_collection_in_dir(collection_id: &str, dir: &Path) -> Result<Collection, String> {
    let path = dir.join(format!("{collection_id}.yaml"));

    if !path.exists() {
        return Err(format!("Collection not found: {collection_id}"));
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read collection file: {e}"))?;
    let yaml_content = strip_yaml_comments(&content);

    serde_yaml_ng::from_str(&yaml_content)
        .map_err(|e| format!("Failed to parse collection YAML: {e}"))
}

/// List all saved collections (metadata only for performance).
pub fn list_collections() -> Result<Vec<CollectionSummary>, String> {
    let dir = get_collections_dir()?;
    list_collections_in_dir(&dir)
}

/// List all saved collections in the specified directory.
pub fn list_collections_in_dir(dir: &Path) -> Result<Vec<CollectionSummary>, String> {
    ensure_dir(dir)?;

    let mut summaries = Vec::new();
    let entries =
        fs::read_dir(dir).map_err(|e| format!("Failed to read collections directory: {e}"))?;

    for entry in entries {
        let Ok(entry) = entry else { continue };

        let path = entry.path();
        if !is_yaml_file(&path) || is_temp_file(&path) {
            continue;
        }

        if let Ok(summary) = load_collection_summary(&path) {
            summaries.push(summary);
        }
    }

    summaries.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(summaries)
}

/// Open an existing runi collection `.yaml` file from an arbitrary disk location.
///
/// Reads the file, validates it as a `Collection`, assigns a new ID,
/// and saves it into the managed collections directory.
pub fn open_collection_file(path: &Path) -> Result<Collection, String> {
    let dir = get_collections_dir()?;
    open_collection_file_in_dir(path, &dir)
}

/// Open an existing runi collection file into the specified collections directory.
///
/// # Behavior
/// 1. Read file at `path`
/// 2. Deserialize as `Collection`
/// 3. Assign a new generated ID (the opened file is a copy)
/// 4. Update `modified_at` timestamp
/// 5. Check name uniqueness against existing collections
/// 6. Save to collections dir
pub fn open_collection_file_in_dir(path: &Path, dir: &Path) -> Result<Collection, String> {
    if !path.exists() {
        return Err(format!("Collection file not found: {}", path.display()));
    }

    let content =
        fs::read_to_string(path).map_err(|e| format!("Failed to read collection file: {e}"))?;
    let yaml_content = strip_yaml_comments(&content);

    let mut collection: Collection = serde_yaml_ng::from_str(&yaml_content)
        .map_err(|e| format!("Failed to parse collection file: {e}"))?;

    // Assign a new ID — the opened collection is treated as a copy
    collection.id = Collection::generate_id(&collection.metadata.name);

    // Update modified_at to now
    let now = chrono::Utc::now();
    collection.metadata.modified_at = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

    // Save to managed collections dir (check_name_unique runs inside save)
    save_collection_in_dir(&collection, dir)?;

    Ok(collection)
}

/// Find a collection by its display name.
///
/// Returns `Ok(Some(...))` when a match is found, `Ok(None)` when no match
/// exists, or `Err(...)` if the collections directory cannot be resolved or read.
pub fn find_collection_by_name(name: &str) -> Result<Option<CollectionSummary>, String> {
    let dir = get_collections_dir()?;
    find_collection_by_name_in_dir(name, &dir)
}

/// Find a collection by name in the specified directory.
///
/// Returns `Ok(Some(...))` on match, `Ok(None)` when absent, or `Err` on I/O failure.
pub fn find_collection_by_name_in_dir(
    name: &str,
    dir: &Path,
) -> Result<Option<CollectionSummary>, String> {
    let summaries = list_collections_in_dir(dir)?;
    Ok(summaries.into_iter().find(|s| s.name == name))
}

/// Delete a collection file.
pub fn delete_collection(collection_id: &str) -> Result<(), String> {
    let dir = get_collections_dir()?;
    delete_collection_in_dir(collection_id, &dir)
}

/// Delete a collection file from the specified directory.
pub fn delete_collection_in_dir(collection_id: &str, dir: &Path) -> Result<(), String> {
    let path = dir.join(format!("{collection_id}.yaml"));

    if !path.exists() {
        return Err(format!("Collection not found: {collection_id}"));
    }

    fs::remove_file(&path).map_err(|e| format!("Failed to delete collection: {e}"))
}

/// Lightweight collection info for listing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollectionSummary {
    pub id: String,
    pub name: String,
    pub request_count: usize,
    pub source_type: String,
    pub modified_at: String,
    /// Spec version from the collection's source (e.g., "1.2.3").
    pub spec_version: Option<String>,
}

fn load_collection_summary(path: &PathBuf) -> Result<CollectionSummary, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let yaml_content = strip_yaml_comments(&content);

    let collection: Collection =
        serde_yaml_ng::from_str(&yaml_content).map_err(|e| e.to_string())?;
    let Collection {
        id,
        metadata,
        source,
        requests,
        ..
    } = collection;
    let CollectionMetadata {
        name, modified_at, ..
    } = metadata;

    Ok(CollectionSummary {
        id,
        name,
        request_count: requests.len(),
        source_type: format!("{:?}", source.source_type).to_lowercase(),
        modified_at,
        spec_version: source.spec_version,
    })
}

fn strip_yaml_comments(content: &str) -> String {
    content
        .lines()
        .filter(|line| !line.trim_start().starts_with('#'))
        .collect::<Vec<_>>()
        .join("\n")
}

fn is_yaml_file(path: &Path) -> bool {
    path.extension()
        .is_some_and(|ext| ext.eq_ignore_ascii_case("yaml"))
}

fn is_temp_file(path: &Path) -> bool {
    path.file_name()
        .is_some_and(|name| name.to_string_lossy().starts_with('.'))
}

fn temp_path_for(dir: &Path, collection_id: &str) -> PathBuf {
    dir.join(format!(".{collection_id}.tmp"))
}

#[cfg(test)]
fn collections_dir_from(base: &Path) -> PathBuf {
    if let Some(override_dir) = collections_dir_override() {
        return override_dir;
    }
    base.join(COLLECTIONS_DIR_NAME)
}

/// Reject if another collection (different ID) already uses this name.
fn check_name_unique(collection: &Collection, dir: &Path) -> Result<(), String> {
    if !dir.exists() {
        return Ok(());
    }
    if let Some(existing) = find_collection_by_name_in_dir(&collection.metadata.name, dir)? {
        if existing.id != collection.id {
            return Err(format!(
                "A collection named '{}' already exists ({})",
                existing.name, existing.id
            ));
        }
    }
    Ok(())
}

fn ensure_dir(dir: &Path) -> Result<(), String> {
    if !dir.exists() {
        fs::create_dir_all(dir)
            .map_err(|e| format!("Failed to create collections directory: {e}"))?;
    }
    Ok(())
}

#[cfg(test)]
static COLLECTIONS_DIR_OVERRIDE: OnceLock<Mutex<Option<PathBuf>>> = OnceLock::new();

#[cfg(test)]
fn collections_dir_override() -> Option<PathBuf> {
    let lock = COLLECTIONS_DIR_OVERRIDE.get_or_init(|| Mutex::new(None));
    lock.lock().ok().and_then(|guard| guard.clone())
}

#[cfg(test)]
pub async fn with_collections_dir_override_async<F, Fut, R>(dir: PathBuf, test: F) -> R
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = R>,
{
    let guard = CollectionsDirOverrideGuard::set(dir);
    let result = test().await;
    drop(guard);
    result
}

#[cfg(test)]
struct CollectionsDirOverrideGuard {
    previous: Option<PathBuf>,
}

#[cfg(test)]
impl CollectionsDirOverrideGuard {
    fn set(dir: PathBuf) -> Self {
        let lock = COLLECTIONS_DIR_OVERRIDE.get_or_init(|| Mutex::new(None));
        let previous = {
            let mut guard = lock.lock().unwrap();
            guard.replace(dir)
        };
        Self { previous }
    }
}

#[cfg(test)]
impl Drop for CollectionsDirOverrideGuard {
    fn drop(&mut self) {
        let lock = COLLECTIONS_DIR_OVERRIDE.get_or_init(|| Mutex::new(None));
        let mut guard = lock.lock().unwrap();
        *guard = self.previous.take();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::collection::SCHEMA_VERSION;
    use serial_test::serial;
    use tempfile::TempDir;

    #[test]
    #[serial]
    fn test_save_and_load_collection() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("Test API");
        let path = save_collection_in_dir(&collection, &collections_dir).unwrap();
        assert!(path.exists());

        let loaded = load_collection_in_dir(&collection.id, &collections_dir).unwrap();
        assert_eq!(loaded.metadata.name, "Test API");
        assert_eq!(loaded.version, SCHEMA_VERSION);
    }

    #[test]
    #[serial]
    fn test_deterministic_serialization() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("Determinism Test");
        save_collection_in_dir(&collection, &collections_dir).unwrap();

        let path = collections_dir.join(format!("{}.yaml", collection.id));
        let content1 = std::fs::read_to_string(&path).unwrap();

        save_collection_in_dir(&collection, &collections_dir).unwrap();
        let content2 = std::fs::read_to_string(&path).unwrap();

        assert_eq!(content1, content2);
    }

    #[test]
    #[serial]
    fn test_yaml_includes_schema_comment() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("Schema Test");
        let path = save_collection_in_dir(&collection, &collections_dir).unwrap();
        let content = std::fs::read_to_string(&path).unwrap();
        assert!(content.starts_with(SCHEMA_COMMENT));
    }

    #[test]
    #[serial]
    fn test_list_collections_sorted() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        save_collection_in_dir(&Collection::new("Zebra API"), &collections_dir).unwrap();
        save_collection_in_dir(&Collection::new("Alpha API"), &collections_dir).unwrap();

        let list = list_collections_in_dir(&collections_dir).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].name, "Alpha API");
        assert_eq!(list[1].name, "Zebra API");
    }

    #[test]
    #[serial]
    fn test_delete_collection() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("To Delete");
        save_collection_in_dir(&collection, &collections_dir).unwrap();

        delete_collection_in_dir(&collection.id, &collections_dir).unwrap();
        let result = load_collection_in_dir(&collection.id, &collections_dir);
        assert!(result.is_err());
    }

    #[test]
    #[serial]
    fn test_duplicate_name_rejected() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        save_collection_in_dir(&Collection::new("Stripe API"), &collections_dir).unwrap();

        let duplicate = Collection::new("Stripe API");
        let result = save_collection_in_dir(&duplicate, &collections_dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("already exists"));
    }

    #[test]
    #[serial]
    fn test_self_update_allowed() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("Stripe API");
        save_collection_in_dir(&collection, &collections_dir).unwrap();

        // Re-saving the same collection (same ID) must succeed
        save_collection_in_dir(&collection, &collections_dir).unwrap();
    }

    // ── open_collection_file tests ──────────────────────────────────

    #[test]
    #[serial]
    fn test_open_collection_file_success() {
        let external_dir = TempDir::new().unwrap();
        let collections_dir_tmp = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(collections_dir_tmp.path());

        // Write a valid collection YAML to an "external" location
        let collection = Collection::new("External API");
        let yaml = serde_yaml_ng::to_string(&collection).unwrap();
        let external_file = external_dir.path().join("external-api.yaml");
        std::fs::write(&external_file, format!("{SCHEMA_COMMENT}{yaml}")).unwrap();

        let opened = open_collection_file_in_dir(&external_file, &collections_dir).unwrap();

        // Must get a new ID (not the original)
        assert_ne!(opened.id, collection.id);
        // Name preserved
        assert_eq!(opened.metadata.name, "External API");
        // Must be saved into the collections dir
        let loaded = load_collection_in_dir(&opened.id, &collections_dir).unwrap();
        assert_eq!(loaded.metadata.name, "External API");
    }

    #[test]
    #[serial]
    fn test_open_collection_file_not_found() {
        let collections_dir_tmp = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(collections_dir_tmp.path());
        let bogus_path = PathBuf::from("/tmp/nonexistent_runi_collection_file.yaml");

        let result = open_collection_file_in_dir(&bogus_path, &collections_dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("not found"));
    }

    #[test]
    #[serial]
    fn test_open_collection_file_invalid_yaml() {
        let external_dir = TempDir::new().unwrap();
        let collections_dir_tmp = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(collections_dir_tmp.path());

        let bad_file = external_dir.path().join("garbage.yaml");
        std::fs::write(&bad_file, "this is not valid yaml: [[[").unwrap();

        let result = open_collection_file_in_dir(&bad_file, &collections_dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to parse"));
    }

    #[test]
    #[serial]
    fn test_open_collection_file_not_a_collection() {
        let external_dir = TempDir::new().unwrap();
        let collections_dir_tmp = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(collections_dir_tmp.path());

        // Valid YAML but not a Collection (missing required fields)
        let bad_file = external_dir.path().join("not-a-collection.yaml");
        std::fs::write(&bad_file, "foo: bar\nbaz: 123").unwrap();

        let result = open_collection_file_in_dir(&bad_file, &collections_dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to parse"));
    }

    #[test]
    #[serial]
    fn test_open_collection_file_duplicate_name_rejected() {
        let external_dir = TempDir::new().unwrap();
        let collections_dir_tmp = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(collections_dir_tmp.path());

        // Save a collection with name "My API" into the collections dir
        save_collection_in_dir(&Collection::new("My API"), &collections_dir).unwrap();

        // Write another collection file with the same name externally
        let duplicate = Collection::new("My API");
        let yaml = serde_yaml_ng::to_string(&duplicate).unwrap();
        let external_file = external_dir.path().join("my-api.yaml");
        std::fs::write(&external_file, format!("{SCHEMA_COMMENT}{yaml}")).unwrap();

        let result = open_collection_file_in_dir(&external_file, &collections_dir);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("already exists"));
    }

    // ── find_collection_by_name_in_dir tests ───────────────────────────

    #[test]
    #[serial]
    fn test_find_collection_by_name_in_dir_returns_matching_collection() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let collection = Collection::new("Stripe API");
        save_collection_in_dir(&collection, &collections_dir).unwrap();

        let result = find_collection_by_name_in_dir("Stripe API", &collections_dir).unwrap();
        assert!(result.is_some(), "Expected to find collection by name");
        let summary = result.unwrap();
        assert_eq!(summary.name, "Stripe API");
        assert_eq!(summary.id, collection.id);
    }

    #[test]
    #[serial]
    fn test_find_collection_by_name_in_dir_returns_none_for_nonexistent() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        save_collection_in_dir(&Collection::new("Existing API"), &collections_dir).unwrap();

        let result = find_collection_by_name_in_dir("Nonexistent", &collections_dir).unwrap();
        assert!(result.is_none(), "Expected None for non-matching name");
    }

    #[test]
    #[serial]
    fn test_find_collection_by_name_in_dir_empty_directory() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        // Ensure the directory exists but is empty
        std::fs::create_dir_all(&collections_dir).unwrap();

        let result = find_collection_by_name_in_dir("Any", &collections_dir).unwrap();
        assert!(result.is_none(), "Expected None for empty directory");
    }

    // ── find_collection_by_name wrapper tests ─────────────────────────

    #[test]
    #[serial]
    fn test_find_collection_by_name_uses_collections_dir() {
        let temp_dir = TempDir::new().unwrap();
        let collections_dir = collections_dir_from(temp_dir.path());
        let _guard = CollectionsDirOverrideGuard::set(collections_dir.clone());

        let collection = Collection::new("GitHub API");
        save_collection_in_dir(&collection, &collections_dir).unwrap();

        let result = find_collection_by_name("GitHub API").unwrap();
        assert!(result.is_some(), "Expected to find collection via wrapper");
        let summary = result.unwrap();
        assert_eq!(summary.name, "GitHub API");
        assert_eq!(summary.id, collection.id);

        let not_found = find_collection_by_name("Nonexistent API").unwrap();
        assert!(not_found.is_none(), "Expected None for non-matching name");
    }
}
