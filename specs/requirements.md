# Technical Specifications

## Overview

**runi** is an open-source desktop API client that serves as an **intelligent partner** for API developers. Unlike traditional API clients that offer request/response interfaces, runi understands _intent_ and _context_, providing proactive intelligence throughout the development workflow.

**Core Identity:**

- **AI-Native:** Intelligence built in, not bolted on
- **MCP-Powered:** Agentic workflows, not just chat
- **Local-First:** Privacy by design, Git-friendly storage

## System Architecture

### Technology Stack

| Layer    | Technology | Version                  | Purpose                              |
| -------- | ---------- | ------------------------ | ------------------------------------ |
| Backend  | Rust       | 1.80+ (2024 edition)     | Core logic, HTTP execution, file I/O |
| Runtime  | Tauri      | v2.9.x                   | Desktop app container, IPC bridge    |
| Frontend | Svelte     | 5.46.x (runes mandatory) | Reactive UI components               |
| Storage  | YAML/JSON  | -                        | Collections, history, environments   |
| AI       | Ollama     | optional                 | Local LLM inference                  |

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Svelte 5 Frontend                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Intelligence UI Layer                          │ │
│  │  - Inline suggestions    - Security warnings                │ │
│  │  - Error analysis        - Intent interpretation            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Sidebar  │  │ Request Panel│  │   Response Panel         │  │
│  │ - History│  │ - URL input  │  │ - Status/timing          │  │
│  │ - Collect│  │ - Method     │  │ - Headers                │  │
│  │ - Envs   │  │ - Tabs       │  │ - Body + Error Analysis  │  │
│  └──────────┘  └──────────────┘  └──────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ invoke() / IPC
┌────────────────────────┴────────────────────────────────────────┐
│                     Tauri v2 Runtime                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Rust Backend                            │  │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │ HTTP Client │  │  Intelligence   │  │ AI Provider  │  │  │
│  │  │ (reqwest)   │←→│     Layer       │←→│ (Ollama)     │  │  │
│  │  └─────────────┘  └─────────────────┘  └──────────────┘  │  │
│  │                           ↓                               │  │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐  │  │
│  │  │ File Storage│  │ Security        │  │ MCP Client   │  │  │
│  │  │ (YAML/JSON) │  │ Validator       │  │ (2025-11-25) │  │  │
│  │  └─────────────┘  └─────────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Intelligence Layer

The Intelligence Layer is the core differentiator—it sits between user actions and execution, providing proactive assistance:

```
User Action → Intelligence Layer → Execution
                    ↓
    ┌───────────────┼───────────────┐
    ↓               ↓               ↓
Suggestions   Security Checks   Error Analysis
```

**Components:**

| Component          | Purpose                                   | AI Required         |
| ------------------ | ----------------------------------------- | ------------------- |
| Rule Engine        | Pattern-based suggestions (headers, auth) | No                  |
| Security Validator | OWASP-inspired checks                     | No                  |
| Error Analyzer     | Response analysis, fix suggestions        | Optional (enhanced) |
| Intent Interpreter | Natural language → requests               | Yes                 |
| Context Engine     | Collection-aware suggestions              | Optional (enhanced) |

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
  config: object # type-specific configuration
created: ISO8601 timestamp
updated: ISO8601 timestamp
# Intelligence metadata (transient, not persisted)
_suggestions: Suggestion[] # Populated at runtime
_securityWarnings: Warning[] # Populated at runtime
```

### Suggestion

```yaml
# Suggestion schema (runtime only)
id: string (uuid)
type: header | auth | body | general
severity: info | warning
message: string
action:
  type: add_header | set_auth | modify_body | custom
  payload: object # Action-specific data
dismissed: boolean
```

### Security Warning

```yaml
# Security warning schema (runtime only)
code: AUTH_OVER_HTTP | BASIC_AUTH_HTTP | EXPIRED_JWT | INJECTION_PATTERN | SENSITIVE_EXPOSURE
severity: info | warning | error
message: string
details: string
remediation: string # Suggested fix
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
    secret: boolean # Mask in UI if true
folders:
  - id: string
    name: string
    requests: Request[]
    folders: Folder[] # nested folders
requests: Request[] # root-level requests
created: ISO8601 timestamp
updated: ISO8601 timestamp
```

### Environment

```yaml
# Environment schema
id: string (uuid)
name: string # e.g., "Development", "Production"
variables:
  - key: string
    value: string
    secret: boolean # mask in UI if true
active: boolean
```

### History Entry

```yaml
# History entry schema
id: string (uuid)
request:
  method: string
  url: string
  headers: Header[] # Sensitive headers masked
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
analysis: # Intelligence layer output
  errorType: string | null
  suggestions: string[]
  aiAnalysis: string | null # If AI was used
timestamp: ISO8601 timestamp
```

### Workflow (Agentic)

```yaml
# Workflow schema for agentic testing
id: string (uuid)
name: string
description: string
steps:
  - id: string
    tool: string # Request name or MCP tool
    inputs: object
    assert:
      status: number | null
      body: object # JSONPath assertions
    extract:
      variableName: jsonPath
on_failure: stop | continue | retry
variables: object # Extracted values during run
created: ISO8601 timestamp
```

## API Specifications

### Tauri Commands (Rust -> Frontend)

#### Core HTTP Commands

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestParams {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
    pub timeout_ms: Option<u64>,
    pub http2: Option<bool>,  // default true
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

#### Intelligence Commands

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestContext {
    pub request: RequestParams,
    pub collection_id: Option<String>,
    pub environment_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Suggestion {
    pub id: String,
    pub suggestion_type: String,  // header, auth, body, general
    pub severity: String,         // info, warning
    pub message: String,
    pub action: SuggestionAction,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityWarning {
    pub code: String,
    pub severity: String,  // info, warning, error
    pub message: String,
    pub details: String,
    pub remediation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecurityReport {
    pub warnings: Vec<SecurityWarning>,
    pub passed: bool,  // true if no error-level warnings
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorAnalysis {
    pub error_type: String,
    pub explanation: String,
    pub suggestions: Vec<String>,
    pub ai_enhanced: bool,  // true if AI was used
}

/// Get proactive suggestions for the current request context
#[command]
pub async fn get_suggestions(context: RequestContext) -> Result<Vec<Suggestion>, String>;

/// Validate request for security issues (OWASP-inspired)
#[command]
pub async fn validate_security(request: RequestParams) -> Result<SecurityReport, String>;

/// Analyze an error response and provide fix suggestions
#[command]
pub async fn analyze_error(
    request: RequestParams,
    response: HttpResponse
) -> Result<ErrorAnalysis, String>;

/// Parse natural language into a request (requires AI)
#[command]
pub async fn parse_natural_language(
    input: String,
    collection_context: Option<String>
) -> Result<RequestParams, String>;
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

#[command]
pub async fn import_bruno(path: String) -> Result<Collection, String>;

#[command]
pub async fn export_bruno(collection_id: String, path: String) -> Result<(), String>;

#[command]
pub async fn import_openapi(path: String) -> Result<Collection, String>;

#[command]
pub async fn import_postman(path: String) -> Result<Collection, String>;
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

#### MCP Commands

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct McpServer {
    pub name: String,
    pub description: String,
    pub url: String,
    pub tools: Vec<McpTool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub input_schema: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowResult {
    pub success: bool,
    pub steps_completed: u32,
    pub steps_total: u32,
    pub extracted_variables: HashMap<String, String>,
    pub failures: Vec<WorkflowFailure>,
}

/// Generate MCP server from collection
#[command]
pub async fn generate_mcp_server(
    collection_id: String,
    language: String,  // typescript | python
    output_path: String
) -> Result<(), String>;

/// Browse MCP registry
#[command]
pub async fn browse_mcp_registry(query: String) -> Result<Vec<McpServer>, String>;

/// Connect to MCP server and discover tools
#[command]
pub async fn discover_mcp_tools(server_url: String) -> Result<Vec<McpTool>, String>;

/// Execute MCP tool
#[command]
pub async fn execute_mcp_tool(
    server_url: String,
    tool_name: String,
    inputs: serde_json::Value
) -> Result<serde_json::Value, String>;

/// Run agentic workflow
#[command]
pub async fn run_workflow(workflow: Workflow) -> Result<WorkflowResult, String>;
```

## User Interface Requirements

### Design Philosophy

runi uses a distraction-free, developer-focused layout optimized for API workflows. The design prioritizes:

- **Focus on the request:** Minimal chrome, maximum workspace
- **Visual feedback:** Color-coded methods, status badges, syntax highlighting
- **Intelligent assistance:** Proactive suggestions and security warnings integrated naturally

The main window features a VS Code/Cursor-style three-panel layout: a collapsible left sidebar for navigation, a central horizontal split-pane dividing the request builder (left) from the response viewer (right), and a bottom status bar. The design is inspired by HTTPie's clean, focused interface principles.

**Layout Structure (VS Code/Cursor Style):**

- **Left Sidebar:** Collections, History (collapsible with ⌘B)
- **Center Area:** Horizontal split pane (paneforge)
  - **Left Pane:** Request Builder (50% default, min 30%)
  - **Right Pane:** Response Viewer (50% default, min 30%)
- **Bottom Status Bar:** Environment indicator, AI prompt hint (⌘I)

**Design Principles (HTTPie-Inspired):**

- **Clean & Focused:** Minimal chrome, high contrast for readability
- **Subtle Interactions:** Hover effects use background color changes (`hover:bg-muted/50`), not cursor changes (only pointer for actual links/buttons)
- **Visual Hierarchy:** Clear distinction between primary actions and secondary information
- **Color-Coded Elements:** HTTP methods (GET=green, POST=blue, etc.) and status codes (2xx=green, 4xx=yellow, etc.)
- **Performance:** Smooth animations (200ms transitions, 60fps), optimized rendering
- **Contextual Guidance:** Tooltips and hints where helpful, but not intrusive
- **Typography:** Monospaced fonts for all code/data (HTTPie style), high contrast
- Native Tauri window controls handle titlebar functions (no custom bars)
- Dark mode default with system auto-switch for themes
- Minimal, intuitive flow: build requests left, view responses right, manage library left

### Component Library: shadcn-svelte

Use [shadcn-svelte](https://www.shadcn-svelte.com/) components as the foundation. These are accessible, theme-aware, and Tailwind-based.

| Component | Use Case                                          | Reference                                                                        |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Input     | URL bar with placeholders, validation, cURL paste | [shadcn-svelte/input](https://www.shadcn-svelte.com/docs/components/input)       |
| Select    | Method dropdown with colorful triggers            | [shadcn-svelte/select](https://www.shadcn-svelte.com/docs/components/select)     |
| Tabs      | Request/response sections                         | [shadcn-svelte/tabs](https://www.shadcn-svelte.com/docs/components/tabs)         |
| Textarea  | Body editor (extend with CodeMirror)              | [shadcn-svelte/textarea](https://www.shadcn-svelte.com/docs/components/textarea) |
| Card      | Request/response panels, preview                  | [shadcn-svelte/card](https://www.shadcn-svelte.com/docs/components/card)         |
| Table     | Response headers (collapsible)                    | [shadcn-svelte/table](https://www.shadcn-svelte.com/docs/components/table)       |
| Resizable | Horizontal split pane (Request | Response side-by-side) | [paneforge](https://paneforge.dev/)                                              |

### Three-Panel Layout Wireframe (VS Code/Cursor Style)

```
[Native Tauri Titlebar: Window controls, app menu]

+--------+--------------------------+------------------+
|        | [Request Builder]        | [Response Viewer]|
| [Left] | - Method Dropdown        | - Tabs: Body |   |
| Sidebar|   (colored) + URL Input  |   Headers | Stats|
|        |   + Send Button          | - Body: Syntax   |
| - Coll | - Tabs: Params | Headers |   highlighted    |
| - Hist |   | Body | Auth         | - Headers: Table |
|        | - Body Editor            | - Stats: Timing |
+--------+--------------------------+------------------+

[Status Bar: Environment switcher, AI prompt (⌘I), variables]
```

**Key Layout Features:**
- **Horizontal Split:** Request (left) and Response (right) side-by-side (like VS Code's editor split view)
- **Resizable:** Drag divider to adjust request/response pane widths (50/50 default, min 30% each)
- **Familiar Pattern:** Matches VS Code/Cursor mental model for developers

### Detailed Layout with Intelligence UI (VS Code/Cursor Style)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Native Tauri Titlebar: Window controls, app menu]            │
├────────────┬──────────────────────────┬──────────────────────────┤
│            │ [Request Builder]        │ [Response Viewer]        │
│  COLLECTIONS│ [GET ▼] [Enter URL...] │ [Body│Headers│Stats]     │
│  ▶ My APIs  │ [▶ Send]                │ ──────────────────────  │
│    GET /users│├─────┬───────┬────────┤ │ 200 OK │ 156ms │ 2.3KB │
│    POST /login││Params│Headers│ Body │ │ ──────────────────────  │
│  ▶ External ││─────────────────────│ │ {                      │
│            ││  Key    │  Value   │ │   "users": [            │
│  HISTORY    ││──────────┼──────────│ │     { "id": 1, ... }   │
│  GET /users ││  Accept  │ app/json│ │   ]                    │
│  POST /login││  Auth... │ Bearer..│ │ }                      │
│            ││                     │ │                        │
│            ││  ┌─────────────────┐ │ │                        │
│            ││  │ 💡 Suggestion:   │ │ │                        │
│            ││  │ Add Content-Type │ │ │                        │
│            ││  │ [Apply][Dismiss]│ │ │                        │
│            ││  └─────────────────┘ │ │                        │
│            ││  ┌─────────────────┐ │ │                        │
│            ││  │ ⚠️ Warning:    │ │ │                        │
│            ││  │ Auth over HTTP │ │ │                        │
│            ││  └─────────────────┘ │ │                        │
├────────────┴──────────────────────────┴──────────────────────────┤
│ [Status Bar: Environment: Dev | Press ⌘I for AI assistance]      │
└─────────────────────────────────────────────────────────────────┘
```

**Key Changes (VS Code/Cursor Style):**
- **Horizontal Split:** Request (left) and Response (right) side-by-side
- **Resizable Divider:** Vertical divider between request/response panes
- **Familiar Pattern:** Matches VS Code's editor split view mental model

### Method Dropdown Colors

| Method | Color  | Tailwind Class                      |
| ------ | ------ | ----------------------------------- |
| GET    | Green  | `bg-green-600 hover:bg-green-700`   |
| POST   | Blue   | `bg-blue-600 hover:bg-blue-700`     |
| PUT    | Yellow | `bg-yellow-600 hover:bg-yellow-700` |
| DELETE | Red    | `bg-red-600 hover:bg-red-700`       |
| PATCH  | Purple | `bg-purple-600 hover:bg-purple-700` |

### Component Specifications

#### Sidebar (250px default width, resizable)

- Collapsible sections: Collections, History
- Tree view for collections with folders
- Search/filter input
- Context menu (right-click) for rename, delete, duplicate
- Drag-and-drop for reordering
- History entries show masked sensitive headers

#### Request Panel (left 50% of main area, resizable)

- Method selector: dropdown with GET, POST, PUT, PATCH, DELETE (color-coded, HTTPie-inspired)
- URL input: full-width, with placeholder "Enter URL or paste cURL"
- Natural language input (toggle): "Describe what you want to test..." (future feature)
- Send button: primary action, shows spinner when loading
- High contrast for readability (HTTPie-inspired)
- Subtle hover effects (not pointer cursor on non-clickable areas)
- Tabs: Params, Headers, Body, Auth
- Key-value editor: table with key, value, enabled checkbox, delete button
- **Suggestion area**: Inline suggestions below tabs, dismissable
- **Warning area**: Security warnings above send button, color-coded

#### Response Panel (right 50% of main area, resizable)

- Status badge: color-coded (2xx green, 3xx blue, 4xx yellow, 5xx red)
- Timing display: total time, size
- View toggle: Pretty (formatted JSON) / Raw
- Headers tab
- Copy response button
- **Error Analysis panel**: Visible for 4xx/5xx, shows causes and suggestions
- **AI Analysis button**: "Get AI Analysis" for enhanced error explanation

### Accessibility Requirements (WCAG 2.1 AA)

- **Keyboard Navigation:** All interactive elements must be focusable and operable via keyboard
- **Focus Indicators:** Visible focus ring on all focusable elements
- **Screen Reader:** Proper ARIA labels, roles, and live regions
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text
- **Motion:** Respect `prefers-reduced-motion` media query
- **Suggestions/Warnings:** Announced to screen readers via `aria-live` regions

## Performance Requirements

| Metric              | Target     | Measurement Method                                |
| ------------------- | ---------- | ------------------------------------------------- |
| Startup time        | <5 seconds | Time from app launch to interactive UI            |
| Request overhead    | <80ms      | Difference between runi and curl for same request |
| Bundle size         | <50MB      | Total app package size                            |
| Memory usage        | <200MB     | Idle memory consumption                           |
| Suggestion latency  | <100ms     | Time to show rule-based suggestions               |
| AI analysis latency | <5 seconds | Time for Ollama-enhanced analysis                 |

## Security Validation (OWASP API Security Inspired)

### Proactive Checks

Based on [OWASP API Security Top 10 2023](https://owasp.org/API-Security/):

| Code               | Check                          | Trigger                                              | Severity | Remediation                            |
| ------------------ | ------------------------------ | ---------------------------------------------------- | -------- | -------------------------------------- |
| AUTH_OVER_HTTP     | Authorization header over HTTP | `http://` URL (non-localhost) + Authorization header | Warning  | Switch to HTTPS or confirm intent      |
| BASIC_AUTH_HTTP    | Basic Auth over HTTP           | `http://` URL + Basic Auth                           | Error    | Block or require explicit confirmation |
| EXPIRED_JWT        | JWT token expired              | Bearer token with past `exp` claim                   | Warning  | Refresh token                          |
| INJECTION_PATTERN  | SQL/NoSQL injection            | Body contains `'; DROP`, `$where`, etc.              | Info     | Review highlighted patterns            |
| SENSITIVE_EXPOSURE | Sensitive data in URL          | API keys, tokens in query params                     | Warning  | Move to headers                        |

### Privacy by Design

- No telemetry, no analytics, no crash reporting to external services
- All data stored locally in platform-specific app data directory
- Environment variables with `secret: true` masked in UI
- Sensitive headers (Authorization, Cookie) masked in history
- No cloud sync — collections are files you control

### HTTP Security

- TLS certificate validation (with option to disable for testing)
- No credential caching outside of request definitions
- Sensitive headers treated specially in history (masked)

## File System Structure

```
~/.runi/                          # App data directory (platform-specific)
├── collections/                  # User collections
│   └── my-apis.runi.yaml
├── environments/
│   └── environments.yaml         # All environments in one file
├── history/
│   └── history.yaml              # Request history (max 1000 entries)
├── workflows/                    # Agentic workflows
│   └── auth-flow-test.yaml
├── mcp/
│   └── installed-servers.yaml    # Tracked MCP servers
└── config.yaml                   # App configuration
```

### Platform-Specific Paths

| Platform | Path                                          |
| -------- | --------------------------------------------- |
| macOS    | `~/Library/Application Support/com.runi.app/` |
| Windows  | `%APPDATA%\runi\`                             |
| Linux    | `~/.config/runi/`                             |

## Import/Export Specifications

### Bruno v3 / OpenCollection Import (Primary)

Bruno v3 (released January 2026) uses OpenCollection YAML as the default format:

- Parse OpenCollection YAML format from [schema.opencollection.com](https://schema.opencollection.com)
- Also support legacy `.bru` files (Bruno's original DSL format)
- Map Bruno folders to runi folder structure
- Convert Bruno variables to runi environments
- Preserve request ordering

**Why prioritized:** Bruno is the leading Git-friendly OSS API client. OpenCollection compatibility provides a migration path for Bruno users and positions runi in the same ecosystem.

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
- Export to OpenCollection format for Bruno compatibility

## AI Integration Specifications

### Provider Abstraction

runi uses a provider-agnostic AI interface to support multiple backends:

```rust
pub trait AiProvider: Send + Sync {
    async fn complete(&self, prompt: String) -> Result<String, AiError>;
    async fn is_available(&self) -> bool;
    async fn list_models(&self) -> Result<Vec<String>, AiError>;
}
```

### Ollama Integration (Default)

- Connect to local Ollama instance (default: `http://localhost:11434`)
- Support model selection from available models
- Configurable context window and temperature
- Graceful degradation when unavailable (fall back to rule-based only)

### Natural Language Request Generation

- Parse natural language descriptions to request parameters
- Example: "GET users from api.example.com with Authorization header"
- Present generated request for user confirmation before execution
- Support collection context: "test the login endpoint with bad credentials"

### Error Analysis

- Detect HTTP errors (4xx, 5xx status codes)
- Rule-based analysis first (fast, always available)
- AI-enhanced analysis on demand (richer explanation)
- Display actionable suggestions for fixing errors

## MCP Specifications (2025-11-25)

Based on [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25):

### MCP Server Generation

- Generate standalone MCP server from collection
- Each request becomes an MCP tool
- Include request parameters as tool inputs (JSON Schema)
- Output as TypeScript or Python server
- Include README with usage instructions
- Auto-generate tool descriptions from collection metadata (name, method, path)
- Auto-inject environment variables into generated server configs
- Generate `.env.example` with placeholders for secrets
- Include example requests/responses in tool schemas (from collection history)

### MCP Testing Interface

- Connect to running MCP servers (stdio, HTTP transports)
- Discover available tools via MCP protocol
- Execute tools with parameter input
- Display tool results with formatting

### MCP Registry Integration

- Browse [registry.modelcontextprotocol.io](https://registry.modelcontextprotocol.io) (~2000 servers as of late 2025)
- Search by name, description, capabilities
- Display server metadata
- One-click install to local MCP config

### MCP 2025-11-25 Features

| Feature              | Description                   | Implementation                              |
| -------------------- | ----------------------------- | ------------------------------------------- |
| Elicitation          | Server-initiated user prompts | Display JSON Schema form, return user input |
| URL-mode Elicitation | OAuth flows in browser        | Open browser for auth, receive callback     |
| Progress Tracking    | Long-running tool feedback    | Show progress bar during execution          |
| Cancellation         | Cancel running tools          | Send cancellation request, handle cleanup   |

### Agentic Workflows

Inspired by [mcp-agent](https://github.com/lastmile-ai/mcp-agent) philosophy: "Simple patterns are more robust than complex architectures."

```yaml
workflow:
  name: 'Auth Flow Validation'
  steps:
    - tool: login
      inputs:
        email: '{{test_user}}'
        password: '{{test_pass}}'
      assert:
        status: 200
        body.token: exists
      extract:
        token: body.token

    - tool: protected_resource
      inputs:
        authorization: 'Bearer {{token}}'
      assert:
        status: 200

    - tool: delete_user
      inputs:
        user_id: '{{user_id}}'
      approval: true # Human-in-the-loop for destructive action
      assert:
        status: 204
  on_failure: retry(3) # Retry with exponential backoff
```

**Workflow Features:**

- Sequential step execution (YAML-first, Git-friendly)
- Variable extraction between steps
- JSONPath assertions on responses
- Human-in-the-loop approval steps for sensitive operations
- Failure handling with configurable retry and backoff
- Workflow history with pass/fail status and error context
- Notification hooks on failure (optional)

**Design Decision:** Visual drag-and-drop workflow builders are intentionally out of scope. The 2026 market is saturated with such tools (Flowise, n8n, Vellum, etc.). runi differentiates with YAML-first workflows that integrate with Git and version control.

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
6. Security warning on auth-over-HTTP
7. Suggestion for missing Content-Type header
8. Error analysis for 401 response
9. Bruno collection import/export roundtrip
10. Workflow execution with assertions

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [reqwest crate](https://docs.rs/reqwest/)
- [Model Context Protocol Spec 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Registry](https://registry.modelcontextprotocol.io)
- [Bruno API Client](https://docs.usebruno.com/)
- [OpenCollection Schema](https://schema.opencollection.com)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
- [Postman Collection Format](https://schema.postman.com/)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/)
- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
