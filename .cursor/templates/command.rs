//! {{Module description}}.

use serde::{Deserialize, Serialize};
use tauri::command;

/// {{Struct description}}.
#[derive(Debug, Serialize, Deserialize)]
pub struct {{StructName}} {
    // Fields
}

/// {{Command description}}.
///
/// # Errors
///
/// Returns an error string if the operation fails.
#[command]
pub async fn {{command_name}}(params: {{StructName}}) -> Result<{{ReturnType}}, String> {
    // Implementation
}
