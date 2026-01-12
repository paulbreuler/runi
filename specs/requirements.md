# Technical Specifications

## Overview

**runi** is an open-source desktop API client with AI-native features and Model Context Protocol (MCP) support. This document provides detailed technical requirements derived from the Product Requirements Document.

## System Architecture

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Backend | Rust | 1.75+ (2024 edition) | Core logic, HTTP execution, file I/O |
| Runtime | Tauri | v2 | Desktop app container, IPC bridge |
| Frontend | Svelte | 5 (runes) | Reactive UI components |
| Storage | YAML/JSON | - | Collections, history, environments |
| AI | Ollama | optional | Local LLM inference |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Svelte 5 Frontend                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Sidebar  │  │ Request Panel│  │   Response Panel     │  │
│  │ - History│  │ - URL input  │  │ - Status/timing      │  │
│  │ - Collect│  │ - Method     │  │ - Headers            │  │
│  │ - Envs   │  │ - Tabs       │  │ - Body (JSON view)   │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ invoke() / IPC
┌────────────────────────┴────────────────────────────────────┐
│                     Tauri v2 Runtime                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Rust Backend                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │ HTTP Client │  │ File Storage│  │ AI Provider  │  │  │
│  │  │ (reqwest)   │  │ (YAML/JSON) │  │ (Ollama)     │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Request

```yaml
# Request schema (stored in collections)
id: string (uuid)
name: string
method: GET | POST | PUT | PATCH | DELETE
url: string
headers:
  - key: string
    value: string
    enabled: boolean
queryParams:
  - key: string
    value: string
    enabled: boolean
body:
  type: none | json | form-data | form-urlencoded | raw
  content: string
auth:
  type: none | api-key | bearer | basic
  config: object  # type-specific configuration
created: ISO8601 timestamp
updated: ISO8601 timestamp
```

### Collection

```yaml
# Collection schema (stored as .runi.yaml files)
id: string (uuid)
name: string
description: string
variables:
  - key: string
    value: string
folders:
  - id: string
    name: string
    requests: Request[]
    folders: Folder[]  # nested folders
requests: Request[]  # root-level requests
created: ISO8601 timestamp
updated: ISO8601 timestamp
```

### Environment

```yaml
# Environment schema
id: string (uuid)
name: string  # e.g., "Development", "Production"
variables:
  - key: string
    value: string
    secret: boolean  # mask in UI if true
active: boolean
```

### History Entry

```yaml
# History entry schema
id: string (uuid)
request:
  method: string
  url: string
  headers: Header[]
  body: Body
response:
  status: number
  statusText: string
  headers: Header[]
  body: string
  timing:
    total: number (ms)
    dns: number (ms)
    connect: number (ms)
    tls: number (ms)
    firstByte: number (ms)
timestamp: ISO8601 timestamp
```

## API Specifications

### Tauri Commands (Rust -> Frontend)

#### execute_request

Executes an HTTP request and returns the response.

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestParams {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
    pub status: u16,
    pub status_text: String,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub timing: RequestTiming,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestTiming {
    pub total_ms: u64,
    pub dns_ms: Option<u64>,
    pub connect_ms: Option<u64>,
    pub tls_ms: Option<u64>,
    pub first_byte_ms: Option<u64>,
}

#[command]
pub async fn execute_request(params: RequestParams) -> Result<HttpResponse, String>;
```

#### Collection Management

```rust
#[command]
pub async fn list_collections() -> Result<Vec<CollectionMeta>, String>;

#[command]
pub async fn get_collection(id: String) -> Result<Collection, String>;

#[command]
pub async fn save_collection(collection: Collection) -> Result<(), String>;

#[command]
pub async fn delete_collection(id: String) -> Result<(), String>;
```

#### History Management

```rust
#[command]
pub async fn get_history(limit: Option<u32>) -> Result<Vec<HistoryEntry>, String>;

#[command]
pub async fn add_history_entry(entry: HistoryEntry) -> Result<(), String>;

#[command]
pub async fn clear_history() -> Result<(), String>;
```

#### Environment Management

```rust
#[command]
pub async fn list_environments() -> Result<Vec<Environment>, String>;

#[command]
pub async fn get_active_environment() -> Result<Option<Environment>, String>;

#[command]
pub async fn set_active_environment(id: String) -> Result<(), String>;

#[command]
pub async fn save_environment(env: Environment) -> Result<(), String>;

#[command]
pub async fn delete_environment(id: String) -> Result<(), String>;
```

## User Interface Requirements

### Three-Panel Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] runi                              [Env: Dev ▼] [⚙]     │
├────────────┬────────────────────────┬───────────────────────────┤
│            │  [GET ▼] [Enter URL...│.....................] [▶] │
│  COLLECTIONS│├─────┬───────┬────────┬──────┤                    │
│  ▶ My APIs  ││Params│Headers│ Body  │ Auth │                    │
│    GET /users││─────────────────────────────│                    │
│    POST /login│                             │                    │
│  ▶ External ││  Key    │  Value   │ [+]   │                    │
│            ││──────────┼──────────┼────────│                    │
│  HISTORY    ││  Accept  │ app/json │ [✓][x]│                    │
│  GET /users ││  Auth... │ Bearer...│ [✓][x]│                    │
│  POST /login││                             │                    │
│            ││                             │                    │
├────────────┼─────────────────────────────────┴───────────────────┤
│            │  Response                                           │
│            │  ┌──────────────────────────────────────────────┐  │
│            │  │ 200 OK  │ 156ms │ 2.3 KB │ [Pretty] [Raw]   │  │
│            │  ├──────────────────────────────────────────────┤  │
│            │  │ {                                            │  │
│            │  │   "users": [                                 │  │
│            │  │     { "id": 1, "name": "Alice" },            │  │
│            │  │     { "id": 2, "name": "Bob" }               │  │
│            │  │   ]                                          │  │
│            │  │ }                                            │  │
│            │  └──────────────────────────────────────────────┘  │
└────────────┴─────────────────────────────────────────────────────┘
```

### Component Specifications

#### Sidebar (250px default width, resizable)
- Collapsible sections: Collections, History
- Tree view for collections with folders
- Search/filter input
- Context menu (right-click) for rename, delete, duplicate
- Drag-and-drop for reordering

#### Request Panel (top 60% of main area)
- Method selector: dropdown with GET, POST, PUT, PATCH, DELETE
- URL input: full-width, with placeholder "Enter request URL"
- Send button: primary action, shows spinner when loading
- Tabs: Params, Headers, Body, Auth
- Key-value editor: table with key, value, enabled checkbox, delete button

#### Response Panel (bottom 40% of main area, resizable)
- Status badge: color-coded (2xx green, 3xx blue, 4xx yellow, 5xx red)
- Timing display: total time, size
- View toggle: Pretty (formatted JSON) / Raw
- Headers tab
- Copy response button

### Accessibility Requirements (WCAG 2.1 AA)

- **Keyboard Navigation:** All interactive elements must be focusable and operable via keyboard
- **Focus Indicators:** Visible focus ring on all focusable elements
- **Screen Reader:** Proper ARIA labels, roles, and live regions
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Motion:** Respect `prefers-reduced-motion` media query

## Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Startup time | <5 seconds | Time from app launch to interactive UI |
| Request overhead | <100ms | Difference between runi and curl for same request |
| Bundle size | <50MB | Total app package size |
| Memory usage | <200MB | Idle memory consumption |
| Crash rate | <5% | Percentage of sessions with crashes |

## Security Considerations

### No Telemetry
- No usage data collection
- No crash reporting to external services
- No analytics or tracking

### Local Storage
- All data stored locally in app data directory
- Environment variables with `secret: true` are masked in UI
- No cloud sync functionality

### HTTP Security
- TLS certificate validation (with option to disable for testing)
- No credential caching outside of request definitions
- Sensitive headers (Authorization, Cookie) treated specially in history

## File System Structure

```
~/.runi/                          # App data directory (platform-specific)
├── collections/                  # User collections
│   └── my-apis.runi.yaml
├── environments/
│   └── environments.yaml         # All environments in one file
├── history/
│   └── history.yaml              # Request history (max 1000 entries)
└── config.yaml                   # App configuration
```

### Platform-Specific Paths

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/com.runi.app/` |
| Windows | `%APPDATA%\runi\` |
| Linux | `~/.config/runi/` |

## Import/Export Specifications

### OpenAPI 3.x Import
- Parse OpenAPI 3.0+ YAML/JSON specifications
- Map paths to requests, preserving method, path, parameters
- Import schemas as example request bodies
- Preserve server URLs as environment variables

### Postman Collection Import
- Support Postman Collection v2.1 format
- Map requests, folders, environments
- Convert Postman variables to runi environments
- Handle Postman auth configurations

### runi YAML Export
- Export collections in documented YAML format
- Include all requests, folders, and collection variables
- Git-friendly formatting (consistent ordering, no random IDs in output)

## AI Integration Specifications

### Ollama Integration
- Connect to local Ollama instance (default: `http://localhost:11434`)
- Support model selection from available models
- Configurable context window and temperature

### Natural Language Request Generation
- Parse natural language descriptions to request parameters
- Example: "GET users from api.example.com with Authorization header"
- Present generated request for user confirmation before execution

### Error Analysis
- Detect HTTP errors (4xx, 5xx status codes)
- Send request/response context to AI for analysis
- Display actionable suggestions for fixing errors

## MCP Specifications

### MCP Server Generation
- Generate standalone MCP server from collection
- Each request becomes an MCP tool
- Include request parameters as tool inputs
- Output as TypeScript or Python server

### MCP Testing Interface
- Connect to running MCP servers
- Discover available tools
- Execute tools with parameter input
- Display tool results

## Testing Requirements

### Unit Test Coverage
- Minimum 85% line coverage for Rust backend
- Minimum 85% line coverage for TypeScript frontend

### Test Categories
1. **Unit Tests:** Individual functions and components
2. **Integration Tests:** Frontend-backend communication
3. **E2E Tests:** Critical user workflows

### Critical Test Scenarios
1. Execute GET request and display response
2. Add custom headers and verify they're sent
3. Save request to collection and reload
4. Switch environments and verify variable substitution
5. Import OpenAPI spec and create collection

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [reqwest crate](https://docs.rs/reqwest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Postman Collection Format](https://schema.postman.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
