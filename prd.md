# runi: Product Requirements Document

## Overview

runi is an open-source desktop application for API design, exploration, and testing with AI-native features and Model Context Protocol (MCP) support.

**Stack:** Rust (backend) + Tauri v2 (runtime) + Svelte 5 (frontend)

## Problem Statement

Developers struggle with inefficient API workflows. Existing tools are either:

- **Cloud-dependent:** Postman, Apidog — require accounts, telemetry, subscriptions
- **Local but lack intelligence:** Hoppscotch, Bruno, Yaak — no AI, no MCP

runi bridges this gap: local-first, AI-native, privacy-focused.

## Target Users

1. **Solo API Developer** — Quick testing, AI-assisted docs
2. **OSS Team Lead** — Git-based collaboration, shareable collections
3. **AI/Agent Developer** — MCP server generation, agent simulation

## Technical Requirements

### Stack Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Backend | Rust | Performance, memory safety, `reqwest` for HTTP |
| Runtime | Tauri v2 | Cross-platform, small bundle, native performance |
| Frontend | Svelte 5 | Reactive, minimal bundle, runes syntax |
| Storage | YAML/JSON files | Git-friendly, no database needed |

### Constraints

- Must run fully offline
- No telemetry or data collection
- App bundle <50MB
- Startup <5 seconds
- MIT license

### Dependencies

- `reqwest` with `tokio` — async HTTP client
- `serde` + `serde_json` — serialization
- `tauri` v2 — desktop runtime
- Optional: Ollama for local AI inference

## Functional Requirements

### Core API Client (Must Have)

| ID | Requirement |
|----|-------------|
| FR-1.1 | REST requests (GET, POST, PUT, PATCH, DELETE) |
| FR-1.2 | Request builder: URL, method, headers, body, query params |
| FR-1.3 | Auth helpers: API Key, Bearer Token, Basic Auth |
| FR-1.4 | Response viewer with JSON syntax highlighting |
| FR-1.5 | Request history with file-based persistence |
| FR-1.6 | Collections for organizing requests |
| FR-1.7 | Environment variables with `{{variable}}` substitution |

### Import/Export (Should Have)

| ID | Requirement |
|----|-------------|
| FR-2.1 | OpenAPI 3.x import |
| FR-2.2 | Export to runi YAML format |
| FR-2.3 | Import from Postman collections |

### AI Features (Should Have)

| ID | Requirement |
|----|-------------|
| FR-3.1 | Natural language → request generation |
| FR-3.2 | AI error analysis for failed requests |
| FR-3.3 | Local model support via Ollama |

### MCP Development (Should Have)

| ID | Requirement |
|----|-------------|
| FR-4.1 | Generate MCP server from collection |
| FR-4.2 | MCP tool testing interface |

## Non-Functional Requirements

- **Performance:** Request latency overhead <100ms vs curl
- **Startup:** App launches in <5 seconds
- **Stability:** <5% crash rate
- **Accessibility:** WCAG 2.1 AA compliance
- **Testing:** TDD with 85% minimum coverage

## Out of Scope (MVP)

- Real-time collaboration
- Mobile/web versions
- Enterprise features (SSO, audit logs)
- Cloud sync or accounts
- GraphQL, gRPC, WebSocket (defer to v2)

## Success Criteria

| Metric | Target |
|--------|--------|
| Time to first request | <2 minutes from launch |
| Test coverage | ≥85% |
| All tests passing | 100% |
| Bundle size | <50MB |

## Development Approach

**Test-Driven Development (TDD):**

1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Commit with conventional commits

**Quality Gates:**

- `cargo check` passes
- `cargo test` passes
- `npm run check` passes
- 85% code coverage minimum

## Implementation Phases

### Phase 1: Foundation

1. Tauri + Svelte project scaffold
2. Three-panel layout (sidebar, request, response)
3. URL input with method selector
4. Rust HTTP command (`execute_request`)
5. Frontend-backend integration
6. JSON response formatting

### Phase 2: Request Building

1. Headers tab (key-value editor)
2. Request body tab
3. Query params tab
4. Auth helpers (API Key, Bearer, Basic)

### Phase 3: Persistence

1. Request history (file-based)
2. Collections (YAML files)
3. Environment variables
4. Load/save requests

### Phase 4: AI Integration

1. Ollama provider configuration
2. Natural language request generation
3. Error analysis suggestions

### Phase 5: MCP Support

1. MCP server code generation
2. MCP testing interface

## Guiding Principles

1. **Open-source first:** MIT license, Git-friendly formats
2. **Local/privacy-focused:** No telemetry, full offline capability
3. **AI-native:** Intelligence built-in, not bolted-on
4. **TDD:** Tests before implementation, always
5. **Performance:** Rust for speed, minimal resources

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [reqwest crate](https://docs.rs/reqwest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Ralph for Claude Code](https://github.com/frankbria/ralph-claude-code)
