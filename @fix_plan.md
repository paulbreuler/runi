# Ralph Fix Plan

> **Philosophy:** runi is an intelligent partner, not just a tool. AI and proactive intelligence are woven throughout—not bolted on at the end.

## Phase 1: Foundation + Intelligence Hooks (High Priority)

### Component Library Setup

- [ ] Initialize shadcn-svelte with dark theme default
- [ ] Add core components: input, select, tabs, textarea, card, table, button
- [ ] Install paneforge for resizable panels
- [ ] Install lucide-svelte for icons

### Storybook Setup (Component Development)

- [x] Run `npm install` to install Storybook dependencies
- [x] Verify Storybook starts with `npm run storybook`
- [x] Create Button.stories.svelte with all variants
- [ ] Create stories for Input, Select, Tabs, Card, Table components
- [ ] Create stories for layout components (MainLayout, Sidebar, StatusBar)
- [ ] Create stories for request components (RequestHeader, TabPanel, KeyValueEditor)
- [ ] Create stories for response components (ResponsePanel, StatusBadge, BodyViewer)

### E2E Testing Infrastructure (Playwright)

- [ ] Install Playwright (`npm init playwright@latest`)
- [ ] Configure `playwright.config.ts` for SvelteKit
- [ ] Create Tauri invoke mock fixture (`tests/fixtures/tauri-mock.ts`)
- [ ] Add npm scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:headed`

### Core HTTP Flow E2E Tests

- [ ] Test: Page loads with URL input, method selector, send button
- [ ] Test: URL input accepts and displays text
- [ ] Test: Method selector changes HTTP method
- [ ] Test: Send button triggers request and shows response
- [ ] Test: Status badge shows correct color (2xx=green, 4xx=yellow, 5xx=red)
- [ ] Test: Response body displays correctly
- [ ] Test: Timing information displays

### Interaction E2E Tests

- [ ] Test: Enter key in URL input triggers send
- [ ] Test: Loading state shows during request (button disabled)
- [ ] Test: Error state displays error message on failure
- [ ] Test: Send button disabled when URL is empty
- [ ] Test: Method selector keyboard navigation works

### Accessibility E2E Tests

- [ ] Test: All interactive elements are keyboard accessible
- [ ] Test: Tab order is logical (URL → Method → Send)
- [ ] Test: Focus indicators are visible
- [ ] Test: ARIA labels present on form controls
- [ ] Test: Error messages have role="alert"

### Layout & Structure

- [ ] Create MainLayout.svelte with paneforge vertical split pane (40/60 default)
- [ ] Implement Sidebar.svelte (collapsible with ⌘B shortcut)
- [ ] Add sidebar sections: Collections, History (placeholder content)
- [ ] Create StatusBar.svelte (environment switcher, AI prompt hint ⌘I)
- [ ] Create suggestion/warning display area in request panel

### HTTP Execution

- [x] Implement `execute_request` Tauri command in Rust
- [x] Add RequestParams struct (url, method, headers, body)
- [x] Add HttpResponse struct (status, headers, body, timing)
- [x] Enable HTTP/2 by default in `execute_request` (reqwest supports it natively)
- [x] Write unit tests for HTTP execution

### Frontend-Backend Integration

- [x] Create TypeScript types matching Rust structs
- [x] Implement invoke wrapper for `execute_request`
- [x] Connect URL input to request execution
- [x] Display response in response panel

### Request Builder UI (shadcn-svelte Components)

- [x] URL input with method selector dropdown (GET, POST, PUT, PATCH, DELETE)
- [x] Send button with loading state
- [x] Response status badge with color coding
- [ ] Create RequestHeader.svelte with shadcn Input, Select, Button
- [ ] Method dropdown with color-coded triggers (GET=green, POST=blue, DELETE=red)
- [ ] lucide-svelte Send icon on submit button

### Response Viewer (shadcn-svelte Components)

- [ ] JSON syntax highlighting with CodeMirror or Shiki
- [ ] Response headers display in collapsible shadcn Table
- [ ] Response timing metrics (total time, size)
- [ ] Raw/Pretty toggle using shadcn Tabs
- [ ] Implement basic error handling in UI for command failures
- [ ] StatusBadge.svelte with color coding (2xx=green, 4xx=yellow, 5xx=red)

### Intelligence Infrastructure (AI-Ready Architecture)

- [ ] Create `Suggestion` type (id, type, message, action, dismissed)
- [ ] Create `SecurityWarning` type (code, severity, message, details)
- [ ] Implement suggestion display component (inline, dismissable)
- [ ] Implement warning display component (color-coded by severity)
- [ ] Add `get_suggestions` Tauri command (returns empty for now, hooks ready)
- [ ] Add `validate_security` Tauri command (returns empty for now, hooks ready)

## Phase 2: Request Building + Proactive Intelligence (High Priority)

### Tabs Interface (shadcn-svelte)

- [ ] Create TabPanel.svelte using shadcn Tabs
- [ ] Tabs: Params | Headers | Body | Auth
- [ ] Active tab indicator with theme-aware styling
- [ ] Keyboard navigation between tabs (Arrow keys)

### Key-Value Editor Component (Reusable)

- [ ] KeyValueEditor.svelte with shadcn Input, Checkbox, Button
- [ ] Add/remove rows with lucide-svelte Plus/Trash2 icons
- [ ] Checkbox to enable/disable individual pairs
- [ ] Auto-focus on new row when added
- [ ] Auto-suggest for common header names (Content-Type, Accept, Authorization)

### Authentication Helpers

- [ ] API Key auth (header or query param placement)
- [ ] Bearer Token auth
- [ ] Basic Auth (username/password encoding)
- [ ] Auth persistence per request

### Body Editor (CodeMirror Integration)

- [ ] Content-type selector using shadcn Select (none, JSON, form-data, form-urlencoded, raw)
- [ ] JSON editor with CodeMirror + svelte-codemirror-editor
- [ ] JSON validation with error indicator
- [ ] Prettify button for JSON formatting
- [ ] Form data editor using KeyValueEditor
- [ ] Form URL-encoded editor using KeyValueEditor

### Proactive Header Suggestions (Rule-Based)

- [ ] Suggest Content-Type based on body content detection
- [ ] Suggest Accept header based on common patterns
- [ ] Suggest Authorization header format based on auth type
- [ ] Show suggestions inline, one-click to apply

### Security Validation (OWASP-Inspired, Rule-Based)

- [ ] Detect Authorization/Cookie headers over HTTP (non-localhost) → warning
- [ ] Detect Basic Auth over HTTP → error level warning
- [ ] JWT expiry detection (decode, check exp claim) → warning if expired
- [ ] Implement validation on request change (debounced)
- [ ] Display warnings prominently before send

### Error Analysis Panel (Rule-Based Initially)

- [ ] Detect 4xx responses → show common causes (401=auth, 403=permissions, 404=path)
- [ ] Detect 5xx responses → show generic server error guidance
- [ ] Detect timeout → suggest timeout increase or connectivity check
- [ ] Detect connection refused → suggest URL/port check
- [ ] Placeholder for AI-powered analysis (Phase 4)

## Phase 3: Persistence + Interoperability (Medium-High Priority)

### Request History

- [ ] Define history entry schema (YAML)
- [ ] Implement history storage in app data directory
- [ ] Add history list in sidebar
- [ ] Implement history item click to restore request
- [ ] Add clear history functionality
- [ ] Mask sensitive headers (Authorization, Cookie) in history display

### Collections

- [ ] Define collection schema (YAML, runi native format)
- [ ] Create collection CRUD operations
- [ ] Implement folder structure for collections
- [ ] Add collection tree view in sidebar
- [ ] Implement drag-and-drop organization

### Environment Variables

- [ ] Define environment schema
- [ ] Implement `{{variable}}` substitution in requests
- [ ] Create environment selector dropdown
- [ ] Add environment editor modal
- [ ] Support secret variables (masked in UI)

### Save/Load

- [ ] Save request to collection
- [ ] Load request from collection
- [ ] Export single request to file
- [ ] Import request from file

### Bruno v3 / OpenCollection Compatibility (Key Differentiator)

- [ ] Parse OpenCollection YAML format (Bruno v3 default as of Jan 2026)
- [ ] Import Bruno .bru files (legacy format, still supported)
- [ ] Export to OpenCollection YAML format
- [ ] Preserve folder structure on import/export
- [ ] Map Bruno variables to runi environments

### OpenAPI Import

- [ ] Parse OpenAPI 3.x specification (YAML/JSON)
- [ ] Generate collection from OpenAPI paths
- [ ] Map OpenAPI operations to requests
- [ ] Import schemas as example request bodies

### Postman Import

- [ ] Parse Postman collection v2.1 format
- [ ] Convert Postman requests to runi format
- [ ] Handle Postman environments

## Phase 4: AI Partner Features (High Priority)

> AI features are core to runi's identity as a "partner"—not a nice-to-have.

### Ollama Integration

- [ ] Create AI provider abstraction (interface for multiple backends)
- [ ] Implement Ollama provider (default: `http://localhost:11434`)
- [ ] Test Ollama connectivity with health check
- [ ] Model selection from available models
- [ ] Graceful fallback when Ollama unavailable (rule-based only)

### AI-Powered Error Analysis

- [ ] Send request + response context to AI on 4xx/5xx
- [ ] Generate specific fix suggestions based on error
- [ ] Display AI suggestions inline with response
- [ ] "Explain this error" button for detailed breakdown
- [ ] Rate-limit AI calls to prevent overuse

### Natural Language Request Generation

- [ ] Natural language input bar (secondary to URL bar)
- [ ] Prompt engineering for request extraction
- [ ] Parse AI response to RequestParams
- [ ] Show generated request for confirmation before sending
- [ ] Support context: "test the login endpoint with bad creds"

### Intent Interpretation

- [ ] Understand collection context ("the login endpoint" → find it)
- [ ] Generate test cases from intent ("test with bad credentials")
- [ ] Support chained intents ("then try with expired token")

### Smart Suggestions (AI-Enhanced)

- [ ] Use collection context to suggest similar requests
- [ ] Suggest headers based on API patterns in collection
- [ ] Suggest auth based on other requests to same host

## Phase 5: MCP & Agentic Workflows (High Priority)

> MCP is a core differentiator—runi as an agentic API development partner.

### MCP Server Generation

- [ ] Design MCP server template (TypeScript)
- [ ] Design MCP server template (Python)
- [ ] Map collection requests to MCP tools
- [ ] Include request params as tool input schema
- [ ] Generate standalone server with all dependencies
- [ ] Export with README and usage instructions
- [ ] Auto-generate tool descriptions from collection metadata (name, method, path)
- [ ] Auto-inject environment variables into generated server configs
- [ ] Generate `.env.example` with placeholders for secrets
- [ ] Include example requests/responses in tool schemas (from history)

### MCP Testing Interface

- [ ] Connect to running MCP servers (stdio, HTTP)
- [ ] Discover available tools via MCP protocol
- [ ] Display tool schemas and descriptions
- [ ] Execute tools with parameter input
- [ ] Display tool results with formatting

### MCP Registry Integration

- [ ] Browse registry.modelcontextprotocol.io
- [ ] Search servers by name/description
- [ ] Display server metadata and capabilities
- [ ] One-click install to local MCP config
- [ ] Track installed servers

### Agentic Workflows

- [ ] Define workflow YAML schema:

  ```yaml
  workflow:
    name: string
    steps:
      - tool: string
        inputs: object
        assert: object # JSONPath assertions
        extract: object # Variable extraction
        approval: boolean # Human-in-the-loop (optional)
    on_failure: stop | continue | retry(n)
  ```

- [ ] Implement workflow parser
- [ ] Implement workflow runner (execute steps sequentially)
- [ ] Support variable extraction between steps (`extract: { token: body.token }`)
- [ ] Support assertions (`assert: { status: 200, body.token: exists }`)
- [ ] Human-in-the-loop approval steps (pause, show state, await confirmation)
- [ ] Retry with configurable backoff (`retry(3)` with exponential backoff)
- [ ] Workflow history with pass/fail status and error context
- [ ] Notification hooks on workflow failure (optional)

### MCP 2025-11-25 Spec Features

- [ ] Implement elicitation support (server-initiated user prompts)
- [ ] Implement URL-mode elicitation (OAuth flows in browser)
- [ ] Progress tracking for long-running tools
- [ ] Cancellation support for running tools

## Quality & Polish

### Testing

- [ ] Achieve 85% Rust code coverage
- [ ] Achieve 85% TypeScript code coverage
- [ ] Add integration tests for frontend-backend
- [ ] Add E2E tests for critical workflows
- [ ] Test security validation rules thoroughly

### Performance

- [ ] Verify bundle size <50MB
- [ ] Verify startup time <5 seconds
- [ ] Verify request overhead <80ms vs curl

### Accessibility

- [ ] Keyboard navigation for all controls
- [ ] Screen reader labels (ARIA) for suggestions and warnings
- [ ] High contrast mode support
- [ ] Focus indicators
- [ ] Announce suggestions/warnings to screen readers

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
- **Partner UX:** Every feature should anticipate needs, not just respond to clicks

## Future Considerations

> These items are intentionally deferred. They may add value but are not current priorities.

- [ ] Visual drag-and-drop workflow builder (market saturated; YAML-first preferred)
- [ ] Agent profile templates (API Tester, Security Auditor personas)
- [ ] Workflow template library (auth flows, CRUD sequences)
- [ ] MCP server marketplace (share generated servers via Git)
- [ ] Agent simulation mode (test workflows before deploying to external agents)
- [ ] Tool usage analytics (track which tools are most effective)
- [ ] Declarative loop syntax (`loop_until`) — use programmatic API for complex logic instead

## Research References

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Registry](https://registry.modelcontextprotocol.io)
- [Bruno OpenCollection RFC](https://github.com/usebruno/bruno/discussions/6634)
- [OpenCollection Schema](https://schema.opencollection.com)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/)
- [OWASP Top 10 2025](https://owasp.org/Top10/2025/)
- [mcp-agent Framework](https://github.com/lastmile-ai/mcp-agent)
- [Building Effective AI Agents with MCP](https://developers.redhat.com/articles/2026/01/08/building-effective-ai-agents-mcp)
