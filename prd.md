# runi: Product Requirements Document

## Overview

runi is an open-source desktop application that serves as an **intelligent partner** for API developers—not just another request/response tool. It combines local-first architecture, AI-native intelligence, and Model Context Protocol (MCP) support.

**Stack:** Rust (backend) + Tauri v2 (runtime) + Svelte 5 (frontend)

**Core Identity:**

- **AI-Native:** Intelligence built in, not bolted on—proactive suggestions, error analysis, intent interpretation
- **MCP-Powered:** Agentic workflows, tool generation, registry integration
- **Local-First:** Privacy by design, Git-friendly storage, no cloud dependency

## Problem Statement

Developers struggle with inefficient API workflows. Existing tools are either:

- **Cloud-dependent:** Postman, Apidog — require accounts, telemetry, subscriptions
- **Local but lack intelligence:** Hoppscotch, Bruno, Yaak — no AI, no MCP, no proactive assistance
- **Reactive, not proactive:** All competitors wait for user actions instead of anticipating needs

runi bridges this gap: local-first + AI-native + privacy-focused + proactive partner UX.

## Target Users

1. **Solo API Developer** — Quick testing, AI-assisted error analysis, smart suggestions
2. **OSS Team Lead** — Git-based collaboration, Bruno-compatible collections, shareable workflows
3. **AI/Agent Developer** — MCP server generation, agentic testing workflows, registry browsing

## Competitive Positioning

| Competitor    | Strength We Learn From    | Gap We Fill                       |
| ------------- | ------------------------- | --------------------------------- |
| Postman       | Testing suites, workflows | Cloud lock-in, heavy, telemetry   |
| Bruno         | Git-friendly, local-first | No AI, limited ecosystem          |
| Hoppscotch    | Lightweight, fast, clean  | No desktop, no AI                 |
| Insomnia/Yaak | Clean UX, focused         | Limited AI, no MCP                |
| Apidog        | AI automation attempts    | Cloud-dependent, privacy concerns |

**runi's edge:** Local-first + AI-native + MCP-powered + Bruno-compatible.

## Technical Requirements

### Stack Decisions

| Component | Technology        | Rationale                                        |
| --------- | ----------------- | ------------------------------------------------ |
| Backend   | Rust 1.80+        | Performance, memory safety, `reqwest` for HTTP   |
| Runtime   | Tauri v2.9.x      | Cross-platform, small bundle, native performance |
| Frontend  | Svelte 5.46.x     | Reactive, minimal bundle, runes syntax mandatory |
| Storage   | YAML/JSON files   | Git-friendly, no database needed                 |
| AI        | Ollama (optional) | Local LLM inference, privacy-preserving          |

### Constraints

- Must run fully offline
- No telemetry or data collection
- App bundle <50MB
- Startup <5 seconds
- MIT license
- Request latency overhead <80ms vs curl
- WCAG 2.1 AA accessibility compliance

### Dependencies

- `reqwest` with `tokio` — async HTTP client
- `serde` + `serde_yaml` — serialization
- `tauri` v2 — desktop runtime
- Optional: Ollama for local AI inference

## Functional Requirements

### Core API Client + Intelligence (Must Have - Phase 1-2)

| ID      | Requirement                                                              |
| ------- | ------------------------------------------------------------------------ |
| FR-1.1  | REST requests (GET, POST, PUT, PATCH, DELETE)                            |
| FR-1.2  | Request builder: URL, method, headers, body, query params                |
| FR-1.3  | Auth helpers: API Key, Bearer Token, Basic Auth                          |
| FR-1.4  | Response viewer with JSON syntax highlighting                            |
| FR-1.5  | Request history with file-based persistence                              |
| FR-1.6  | Collections for organizing requests (YAML files)                         |
| FR-1.7  | Environment variables with `{{variable}}` substitution                   |
| FR-1.8  | **Proactive header suggestions** (Content-Type, Accept based on context) |
| FR-1.9  | **Security warnings** (auth over HTTP, expired JWT, injection patterns)  |
| FR-1.10 | **Inline error analysis** (rule-based initially, AI-enhanced later)      |

### Persistence + Interoperability (Must Have - Phase 3)

| ID     | Requirement                                            |
| ------ | ------------------------------------------------------ |
| FR-2.1 | Bruno v3 / OpenCollection YAML import (migration path) |
| FR-2.2 | Export to runi YAML and OpenCollection formats         |
| FR-2.3 | OpenAPI 3.x import                                     |
| FR-2.4 | Postman v2.1 collection import                         |

### AI Partner Features (High Priority - Phase 4)

| ID     | Requirement                                                    |
| ------ | -------------------------------------------------------------- |
| FR-3.1 | Natural language → request generation                          |
| FR-3.2 | AI-powered error analysis (explain 4xx/5xx, suggest fixes)     |
| FR-3.3 | Local model support via Ollama (provider-agnostic abstraction) |
| FR-3.4 | Smart suggestions based on collection context                  |
| FR-3.5 | Intent interpretation ("test login with bad credentials")      |

### MCP & Agentic Workflows (High Priority - Phase 5)

| ID     | Requirement                                               |
| ------ | --------------------------------------------------------- |
| FR-4.1 | Generate MCP server from collection (TypeScript/Python)   |
| FR-4.2 | MCP tool testing interface                                |
| FR-4.3 | MCP Registry browsing (registry.modelcontextprotocol.io)  |
| FR-4.4 | Agentic workflows with assertions and variable extraction |
| FR-4.5 | Request chaining as MCP tool sequences                    |
| FR-4.6 | Human-in-the-loop approval steps in workflows             |

### Security Validation - OWASP-Inspired (Integrated Throughout)

| ID     | Requirement                                      |
| ------ | ------------------------------------------------ |
| FR-5.1 | Auth header over HTTP warning (non-localhost)    |
| FR-5.2 | JWT expiry detection and warning                 |
| FR-5.3 | Injection pattern detection in request bodies    |
| FR-5.4 | Sensitive data masking in history                |
| FR-5.5 | TLS certificate validation with explicit opt-out |

## Non-Functional Requirements

- **Performance:** Request latency overhead <80ms vs curl
- **Startup:** App launches in <5 seconds
- **Stability:** <5% crash rate
- **Accessibility:** WCAG 2.1 AA compliance
- **Testing:** TDD with 85% minimum coverage
- **Suggestion Latency:** <100ms for rule-based suggestions
- **AI Analysis Latency:** <5 seconds for Ollama-enhanced analysis

## Out of Scope (MVP)

- Real-time collaboration
- Mobile/web versions
- Enterprise features (SSO, audit logs)
- Cloud sync or accounts
- GraphQL, gRPC, WebSocket (defer to v2)
- Visual drag-and-drop workflow builder (YAML-first approach preferred)

## Success Criteria

| Metric                              | Target                    |
| ----------------------------------- | ------------------------- |
| Time to first request               | <2 minutes from launch    |
| Test coverage                       | >=85%                     |
| All tests passing                   | 100%                      |
| Bundle size                         | <50MB                     |
| Proactive suggestions shown         | >=1 per complex request   |
| Security warnings on risky requests | 100% detection rate       |
| Error analysis available            | For all 4xx/5xx responses |

## Development Approach

**Test-Driven Development (TDD):**

1. Write failing test first
2. Implement minimum code to pass
3. Refactor while keeping tests green
4. Commit with conventional commits

**Quality Gates:**

- `just ci` passes (all checks in one command)
- 85% code coverage minimum
- No clippy warnings (pedantic mode)
- All ESLint rules pass

## Implementation Phases

### Phase 1: Foundation + Intelligence Hooks

1. Tauri + Svelte project scaffold
2. Three-panel layout (sidebar, request, response)
3. URL input with method selector
4. Rust HTTP command (`execute_request`)
5. Frontend-backend integration
6. JSON response formatting
7. **Intelligence infrastructure** (suggestion/warning types, display components)

### Phase 2: Request Building + Proactive Intelligence

1. Headers tab (key-value editor with auto-suggest)
2. Request body tab
3. Query params tab
4. Auth helpers (API Key, Bearer, Basic)
5. **Proactive header suggestions** (rule-based)
6. **Security validation** (OWASP-inspired)
7. **Error analysis panel** (rule-based)

### Phase 3: Persistence + Interoperability

1. Request history (file-based, sensitive data masked)
2. Collections (YAML files, runi native format)
3. Environment variables (with secret support)
4. Bruno v3 / OpenCollection import/export
5. OpenAPI and Postman import

### Phase 4: AI Partner Features

1. Ollama provider abstraction
2. Natural language request generation
3. AI-powered error analysis
4. Intent interpretation with collection context
5. Smart suggestions (AI-enhanced)

### Phase 5: MCP & Agentic Workflows

1. MCP server template generation (TypeScript, Python)
2. MCP testing interface
3. MCP Registry browsing and installation
4. Agentic workflow runner (YAML-based, sequential)
5. Human-in-the-loop approval steps
6. Workflow history with pass/fail status

## Guiding Principles

1. **Partner, not tool:** Anticipate developer needs, don't just respond to clicks
2. **Open-source first:** MIT license, Git-friendly formats
3. **Local/privacy-focused:** No telemetry, full offline capability
4. **AI-native:** Intelligence woven throughout, not bolted on
5. **TDD:** Tests before implementation, always
6. **Performance:** Rust for speed, minimal resources
7. **YAML-first:** Workflows defined in Git-friendly YAML, not visual graphs

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [reqwest crate](https://docs.rs/reqwest/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [Bruno API Client](https://docs.usebruno.com/)
- [OpenCollection Specification](https://schema.opencollection.com)
- [OWASP API Security](https://owasp.org/API-Security/)
- [mcp-agent Framework](https://github.com/lastmile-ai/mcp-agent)
