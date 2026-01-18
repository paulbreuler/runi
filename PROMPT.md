# runi Master Prompt

**Version:** 8.0 (aligned with ../runi-planning-docs/runi-design-vision-v8.1.md)

---

## Project Vision

**runi** is an API development tool that bridges the gap between AI-generated code and human understanding. It begins as a familiar HTTP client and progressively reveals a comprehension layer that catches spec drift, verifies AI-generated requests, and visualizes cross-API relationships.

### Core Thesis

> **"The HTTP client is the Trojan horse. Comprehension is the payload."**

### The Tagline

> **"See the truth about your APIs"**

### Brand Philosophy

> **"Collapse uncertainty into truth"**

### Visual Tone

Zen, calm, and book-like. Muted surfaces, soft contrast, and selective emphasis. Use color as signal, not decoration.

---

## Architecture Overview

### Layout Structure (v8)

```
+-----------------------------------------------------------------------------+
|                         TITLE BAR (52px)                                    |
|  [Logo] [Spec Selector v] [Signal Count] [Cmd+K] [Menu]                     |
+-----------------------------------------------------------------------------+
|                         TAB BAR (40px)                                      |
|  [+ New] [GET /users *] [POST /pay] [x]                                     |
+---------+-------------------------------------------------------------------+
| SIDEBAR | URL BAR: [GET v] [https://api.example.com/users] [Send]           |
| (240px) +-----------------------------+-------------------------------------+
|         | REQUEST BUILDER             | PREVIEW PANEL                       |
| * Coll. | [Params][Headers][Auth][Body]| [Request][Response]                 |
| * Hist. |                             |                                     |
| * Specs | key: value                  | 1| GET /users HTTP/1.1               |
| * Envs  | key: value                  | 2| Host: api.example.com             |
|         |                             | ...                                 |
+---------+-----------------------------+-------------------------------------+
|                    TERMINAL (160px, collapsible)                            |
+-----------------------------------------------------------------------------+
```

### Technology Stack

| Component    | Technology                |
| ------------ | ------------------------- |
| Runtime      | Tauri v2.9.x              |
| Backend      | Rust 1.80+                |
| Frontend     | React 19 + TypeScript 5.9 |
| Build        | Vite 7.x                  |
| Styling      | Tailwind CSS 4.x          |
| Animation    | Motion 12.x               |
| Routing      | React Router 7.x          |
| State        | Zustand                   |
| HTTP Client  | reqwest with rustls       |
| Spec Parsing | openapiv3 crate           |
| Icons        | Lucide React              |

---

## Implementation Phases

| Phase                    | Weeks | Focus                                         |
| ------------------------ | ----- | --------------------------------------------- |
| **1. Foundation**        | 1-4   | HTTP client, layout, request builder, preview |
| **2. Organization**      | 5-8   | Collections, persistence, environments        |
| **3. Spec Intelligence** | 9-14  | OpenAPI parsing, binding, drift detection     |
| **4. AI Integration**    | 15-20 | Command palette, AI generation, verification  |
| **5. Comprehension**     | 21-28 | Multi-spec, semantic links, temporal, canvas  |
| **6. Polish**            | 29+   | Performance, testing, distribution            |

---

## Key Principles

### 1. Partner UX

- Ambient intelligence: signals, not interruptions
- Progressive disclosure: simple -> advanced
- Keyboard-first: Cmd+K for everything
- Muted primary actions by default; emphasize on hover or when critical
- JSON formatting uses 2-space indentation in the response viewer

### 2. Development Discipline

- **TDD Required:** RED -> GREEN -> REFACTOR
- **Tests First:** No code without failing test
- **85% Coverage:** Enforced in CI

### 3. Code Quality

- React 19 functional components only
- Zustand for global state, useState for local
- Tauri v2 API only (`@tauri-apps/api/core`)
- Async for all I/O operations
- Pedantic clippy enabled

---

## Adoption Ladder

Features reveal progressively based on user behavior:

| Rung | Trigger                  | Features Revealed               |
| ---- | ------------------------ | ------------------------------- |
| 1    | First request            | Response viewer, history        |
| 2    | Spec imported            | Canvas view, endpoint nodes     |
| 3    | Request bound to spec    | Drift detection                 |
| 4    | AI generates request     | Verification panel, ghost nodes |
| 5    | Second spec loaded       | Semantic link suggestions       |
| 6    | Spec has version history | Temporal awareness              |

---

## Signal System

Intelligence communicates through consistent visual signals:

| Signal | Color     | Meaning                               |
| ------ | --------- | ------------------------------------- |
| Green  | `#22c55e` | Verified, safe, all clear             |
| Amber  | `#f59e0b` | Drift detected, needs investigation   |
| Red    | `#ef4444` | Breaking change, critical issue       |
| Purple | `#a855f7` | AI-generated (suspect until verified) |
| Blue   | `#3b82f6` | Suggestion available                  |

---

## Current Objectives

### Phase 1 Focus

1. **HTTP Backend (P1A):** reqwest client with timing capture
2. **Layout (P1B):** Title bar, sidebar, panels with resizable panes
3. **Request Builder (P1C):** URL bar, params, headers, auth, body tabs
4. **Preview Panel (P1D):** Request/response toggle with code viewer

### Success Criteria

```yaml
time_to_first_request: '<2 minutes'
request_overhead_vs_curl: '<80ms'
import_success_rate: '>95%'
test_coverage: '>=85%'
```

---

## Testing Guidelines

### Unit Tests

- Rust: `cargo test`
- Frontend: `vitest`

### E2E Tests

- Playwright with `mockIPC` for Tauri commands
- Target macOS primarily
- Test file: `tests/e2e/*.spec.ts`

### Test Pattern

```typescript
// Frontend component test
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Component } from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

---

## File Structure

```
runi/
+-- src-tauri/              # Rust backend
|   +-- src/
|   |   +-- http/           # HTTP client
|   |   +-- spec/           # OpenAPI parsing
|   |   +-- storage/        # File persistence
|   |   +-- intelligence/   # AI/drift/semantic
|   |   +-- commands/       # Tauri commands
|   +-- Cargo.toml
|
+-- src/                    # React frontend
|   +-- components/         # UI components
|   |   +-- Layout/         # MainLayout, TitleBar, Sidebar
|   |   +-- Request/        # UrlBar, RequestBuilder, tabs
|   |   +-- Response/       # PreviewPanel, CodeViewer
|   |   +-- Intelligence/   # Signals, drift panels
|   |   +-- ui/             # Base UI components
|   +-- stores/             # Zustand stores
|   +-- hooks/              # Custom React hooks
|   +-- utils/              # Helpers
|   +-- routes/             # React Router routes
|
+-- ../runi-planning-docs/   # Vision and strategy documents (separate repository)
+-- prompts/                # Modular implementation prompts
+-- specs/                  # Technical specifications
+-- tests/                  # E2E tests
```

---

## Completion Checklist

Before marking any phase complete:

- [ ] All tests pass (`just ci`)
- [ ] No linter warnings
- [ ] Types generated (`just generate-types`)
- [ ] Documentation updated
- [ ] @fix_plan.md updated

---

## Reference Documents

- **Design Vision:** `../runi-planning-docs/runi-design-vision-v8.1.md`
- **North Star:** `../runi-planning-docs/VISION.md`
- **AI Architecture:** `../runi-planning-docs/addendums/001-ai-architecture.md`
- **Adoption Strategy:** `../runi-planning-docs/addendums/002-adoption-positioning.md`
- **Implementation Prompts:** `prompts/PROMPT-*.md`
- **Fix Plan:** `@fix_plan.md`
- **Technical Specs:** `specs/requirements.md`
- **Agent Guidelines:** `CLAUDE.md`
