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
    // Check environment variable override first
    if let Ok(env_dir) = std::env::var("RUNI_COLLECTIONS_DIR") {
        let dir = PathBuf::from(env_dir);
        ensure_dir(&dir)?;
        return Ok(dir);
    }

    // In dev mode (CARGO_MANIFEST_DIR is set), use project root to avoid Tauri rebuild triggers
    // In production, use current working directory (user's project)
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

pub fn save_collection_in_dir(collection: &Collection, dir: &Path) -> Result<PathBuf, String> {
    ensure_dir(dir)?;
    let filename = format!("{}.yaml", collection.id);
    let path = dir.join(&filename);

    let yaml = serde_yml::to_string(collection)
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

pub fn load_collection_in_dir(collection_id: &str, dir: &Path) -> Result<Collection, String> {
    let path = dir.join(format!("{collection_id}.yaml"));

    if !path.exists() {
        return Err(format!("Collection not found: {collection_id}"));
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read collection file: {e}"))?;
    let yaml_content = strip_yaml_comments(&content);

    serde_yml::from_str(&yaml_content).map_err(|e| format!("Failed to parse collection YAML: {e}"))
}

/// List all saved collections (metadata only for performance).
pub fn list_collections() -> Result<Vec<CollectionSummary>, String> {
    let dir = get_collections_dir()?;
    list_collections_in_dir(&dir)
}

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

/// Delete a collection file.
pub fn delete_collection(collection_id: &str) -> Result<(), String> {
    let dir = get_collections_dir()?;
    delete_collection_in_dir(collection_id, &dir)
}

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
}

fn load_collection_summary(path: &PathBuf) -> Result<CollectionSummary, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let yaml_content = strip_yaml_comments(&content);

    let collection: Collection = serde_yml::from_str(&yaml_content).map_err(|e| e.to_string())?;
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
}
