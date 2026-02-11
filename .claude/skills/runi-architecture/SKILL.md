---
name: runi-architecture
description: Core architectural patterns for the runi codebase. Reference for event-driven architecture, loose coupling, MCP integration, component separation, and visual layering. Use when reviewing, planning, or implementing features.
---

# runi Architecture Patterns

These patterns apply across all layers and enable MCP-driven UI, loose coupling, and testability.

---

## Cross-Cutting Patterns

### Event-Driven Architecture (Pub/Sub)

**Purpose**: Enable MCP/AI-driven UI, loose component coupling.

**Rules**:

- Use `src/events/bus.ts` EventBus for all cross-component communication
- Components emit events instead of calling other components directly
- UI can be driven by AI/MCP by emitting events to the bus
- Components subscribe to events they care about
- No direct component-to-component dependencies for cross-cutting concerns

**Example**: Sidebar position changes emit `sidebar.position-changed`, layout subscribes.

### Loose Coupling / High Cohesion

**Rules**:

- Components should not depend on specific layout positions
- Sidebar position should be configuration-driven, not hardcoded
- Components communicate via events or props, never direct references
- Each component should have a single, well-defined responsibility

**Anti-patterns**: Hardcoding sidebar position (e.g., `left-0` in layout), direct component imports in unrelated modules.

### Configuration-Driven Layout

**Rules**:

- Layout positions, dimensions, and visibility should be in state/store, not hardcoded
- Use settings store or configuration objects for layout decisions
- Layout components should be position-agnostic (can render left or right based on config)

### MCP Integration Patterns

**Rules**:

- AI/MCP layer emits events to event bus (e.g., `ai.suggestion-available`, `ai.ui-command`)
- UI components subscribe to AI events and react accordingly
- AI commands should be declarative (e.g., `{ type: 'move-sidebar', position: 'right' }`)
- Keep AI logic isolated in adapters, core UI remains framework-agnostic

### MCP-First Implementation (Core Principle)

**Principle**: AI/MCP is a native co-driver alongside the human. Every UI action must be achievable via MCP tool.

**Implementation checklist:**

1. **Identify the action** — What can the user do via UI? (button click, toggle, navigation)
2. **Define the event** — Add event type to `src/events/bus.ts`
3. **Emit from UI** — Click handler emits event to EventBus (not direct state mutation)
4. **Create MCP tool** — In `src-tauri/src/application/mcp_server_service.rs`, add tool that emits same event with `Actor::Ai`
5. **Subscribe in UI** — Component subscribes to event, updates state regardless of actor
6. **Test both paths** — Verify UI click and MCP tool produce identical results

**Decision table:**

| Feature type                           | MCP tool required? |
| -------------------------------------- | ------------------ |
| UI action (button, toggle, navigation) | **Mandatory**      |
| Data CRUD (create/update/delete)       | **Recommended**    |
| Read-only query                        | Optional           |
| System/lifecycle event                 | Skip               |

**Anti-patterns:**

- `onClick={() => store.setState()}` — bypasses event bus, invisible to MCP
- MCP tool that calls different logic than the UI path — divergent behavior
- UI-only features with no event emission — locks out AI co-driver

### Ports and Adapters (Hexagonal Architecture)

**Rules**:

- Core domain logic (Rust backend) should not depend on UI details
- Tauri commands act as adapters between React UI (port) and Rust logic (adapter)
- AI providers (Ollama, Claude) should be swappable via interfaces
- Storage, network, and UI are all adapters to the core domain

### Unidirectional Data Flow

**Rules**:

- State flows down via props, events flow up via event bus or callbacks
- Use Zustand stores for global state, `useState` for local state
- Avoid bidirectional data binding or circular dependencies
- State changes should be traceable (events → actions → state → UI)

### Testability

**Rules**:

- Components should have clear, testable contracts (props, events)
- Use dependency injection to enable mocking (event bus, stores, Tauri commands)
- Tests should verify behavior (what component does) not implementation (how it does it)
- TDD is mandatory: write tests first to define behavior, then implement

---

## Frontend Patterns (React/TypeScript)

### Container/Presentational Component Separation

- **Presentational components**: Pure rendering, props in, JSX out, no side effects
- **Container components** (or hooks): Handle state, events, side effects, orchestration
- Presentational components are easily testable in isolation
- Containers handle event bus subscriptions, Tauri commands, state management

### Inversion of Control / Dependency Injection

- Dependencies should be injected (via props, hooks, or context) rather than imported directly
- Core logic should depend on abstractions (interfaces) not concrete implementations
- UI components should receive renderers, strategies, or configuration as props

### Component Composition Over Inheritance

- Compose components via `props.children` or render props
- Avoid deep component hierarchies or inheritance
- Layout components should accept children, not hardcode structure

### Focus Ring Standard

Use `focusRingClasses` from `@/utils/accessibility` for all interactive focus indicators:

- 2px ring using theme token `--color-ring`
- 2px offset, `ring-offset-bg-app`
- `:focus-visible` pseudo-class (keyboard focus only)
- Use `focusWithVisibility()` for programmatic focus

### Color / Elevation Layering

| Layer        | Class            | Usage                                                          |
| ------------ | ---------------- | -------------------------------------------------------------- |
| **app**      | `bg-bg-app`      | Page/canvas — layout root, grid, panes                         |
| **surface**  | `bg-bg-surface`  | Primary surfaces — sidebar, status bar, header bars            |
| **raised**   | `bg-bg-raised`   | Cards/contained content on a surface — inputs, tab content     |
| **elevated** | `bg-bg-elevated` | Floating overlays only — tooltips, dropdowns, popovers, modals |

**Rule**: Never use `elevated` for inline content (buttons, badges, expanded strips).

---

## Backend Patterns (Rust/Tauri)

### Dependency Injection / Inversion of Control

- Dependencies should be injected via traits (interfaces), not concrete types
- Core domain logic should depend on trait abstractions
- Use dependency injection for services (HTTP client, storage, AI providers)

### Ports and Adapters

- Domain logic should not depend on Tauri, file system, or network directly
- Tauri commands are adapters that translate between UI (port) and domain (adapter)
- Storage, network, and AI providers are all adapters implementing domain traits
- Core domain remains framework-agnostic

---

## Architectural Violations (Must Fix)

- Hardcoded layout positions (sidebar left/right)
- Direct component dependencies for cross-cutting concerns
- Missing event bus usage for component communication
- Tight coupling between unrelated components
- Configuration values hardcoded instead of in store/config

## Architectural Improvements (Should Fix)

- Components not following Container/Presentational pattern
- State management not following unidirectional flow
- Dependencies not injected (direct imports)
- Layout components not position-agnostic
