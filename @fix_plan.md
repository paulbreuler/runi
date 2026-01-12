# Ralph Fix Plan

## Phase 1: Foundation (High Priority)

### Layout & Structure
- [ ] Create three-panel layout component (sidebar, request panel, response panel)
- [ ] Implement responsive panel resizing with drag handles
- [ ] Add sidebar navigation for collections and history

### HTTP Execution
- [ ] Implement `execute_request` Tauri command in Rust
- [ ] Add RequestParams struct (url, method, headers, body)
- [ ] Add HttpResponse struct (status, headers, body, timing)
- [ ] Enable HTTP/2 by default in `execute_request` (reqwest supports it natively)
- [ ] Write unit tests for HTTP execution

### Frontend-Backend Integration
- [ ] Create TypeScript types matching Rust structs
- [ ] Implement invoke wrapper for `execute_request`
- [ ] Connect URL input to request execution
- [ ] Display response in response panel

### Request Builder UI
- [ ] URL input with method selector dropdown (GET, POST, PUT, PATCH, DELETE)
- [ ] Send button with loading state
- [ ] Response status badge with color coding

### Response Viewer
- [ ] JSON syntax highlighting (consider using Shiki or Prism)
- [ ] Response headers display
- [ ] Response timing metrics
- [ ] Raw/Pretty toggle for body view
- [ ] Implement basic error handling in UI for command failures (display Rust error strings)

## Phase 2: Request Building (Medium Priority)

### Tabs Interface
- [ ] Create tabbed interface for request configuration
- [ ] Implement Headers tab with key-value editor
- [ ] Implement Body tab with content-type selector
- [ ] Implement Query Params tab with key-value editor
- [ ] Implement Auth tab

### Key-Value Editor Component
- [ ] Reusable key-value pair editor with add/remove
- [ ] Checkbox to enable/disable individual pairs
- [ ] Auto-suggest for common header names

### Authentication Helpers
- [ ] API Key auth (header or query param)
- [ ] Support query param placement for API Key (common in legacy/public APIs)
- [ ] Bearer Token auth
- [ ] Basic Auth (username/password encoding)
- [ ] Auth persistence per request

### Body Editor
- [ ] Raw body input with content-type selector
- [ ] JSON editor with syntax highlighting
- [ ] Form data editor (key-value)
- [ ] Form URL-encoded editor

## Phase 3: Persistence (Medium Priority)

### Request History
- [ ] Define history entry schema (YAML)
- [ ] Implement history storage in app data directory
- [ ] Add history list in sidebar
- [ ] Implement history item click to restore request
- [ ] Add clear history functionality

### Collections
- [ ] Define collection schema (YAML)
- [ ] Create collection CRUD operations
- [ ] Implement folder structure for collections
- [ ] Add collection tree view in sidebar
- [ ] Implement drag-and-drop organization

### Environment Variables
- [ ] Define environment schema
- [ ] Implement `{{variable}}` substitution in requests
- [ ] Create environment selector dropdown
- [ ] Add environment editor modal
- [ ] Support multiple environments (dev, staging, prod)

### Save/Load
- [ ] Save request to collection
- [ ] Load request from collection
- [ ] Export single request to file
- [ ] Import request from file

### Bruno Compatibility
- [ ] Support Bruno collection format import/export (v3 YAML) — Bruno is the leading Git-friendly OSS alternative in 2026

## Phase 4: Import/Export (Low Priority)

### OpenAPI Import
- [ ] Parse OpenAPI 3.x specification
- [ ] Generate collection from OpenAPI
- [ ] Map OpenAPI operations to requests

### Postman Import
- [ ] Parse Postman collection v2.1 format
- [ ] Convert Postman requests to runi format
- [ ] Handle Postman environments

### Export
- [ ] Export collection to runi YAML format
- [ ] Export collection to OpenAPI format

## Phase 5: AI Features (Low Priority)

### Ollama Integration
- [ ] Configure Ollama endpoint
- [ ] Test Ollama connectivity
- [ ] Create AI service abstraction

### Natural Language Requests
- [ ] Implement prompt for request generation
- [ ] Parse AI response to request params
- [ ] UI for natural language input

### Error Analysis
- [ ] Detect failed requests
- [ ] Send error context to AI
- [ ] Display AI suggestions

## Phase 6: MCP Support (Low Priority)

### MCP Server Generation
- [ ] Design MCP server template
- [ ] Generate server code from collection
- [ ] Export as standalone MCP server

### MCP Testing
- [ ] Implement MCP tool invocation
- [ ] Display MCP tool results
- [ ] MCP server discovery

## Quality & Polish

### Testing
- [ ] Achieve 85% Rust code coverage
- [ ] Achieve 85% TypeScript code coverage
- [ ] Add integration tests for frontend-backend
- [ ] Add E2E tests for critical workflows

### Performance
- [ ] Verify bundle size <50MB
- [ ] Verify startup time <5 seconds
- [ ] Verify request overhead <80ms vs curl

## Competitive Parity & Differentiation (Post-MVP)

### Future Considerations

- [ ] Consider WebSocket support for v1.0.1 (many competitors now include it; users increasingly expect real-time testing)

### Accessibility

- [ ] Keyboard navigation for all controls
- [ ] Screen reader labels (ARIA)
- [ ] High contrast mode support
- [ ] Focus indicators

## Completed

- [x] Initial Tauri + Svelte project scaffold
- [x] Project initialization and CLAUDE.md setup

## Notes

- Use `just ci` before each commit to verify quality gates
- Follow TDD: write failing test, implement, refactor
- All Tauri commands must be async with `Result<T, String>`
- Use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Store collections as YAML for Git-friendliness
- No telemetry, no cloud dependencies
