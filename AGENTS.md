# runi

API comprehension layer for the AI age. HTTP client UI that progressively reveals intelligence features
(drift detection, AI verification, semantic links).

## Build & Test Commands

```bash
just install      # First-time setup
just dev          # Development server
just ci           # Full CI pipeline (before pushing)
just pre-commit   # Fast checks (before committing)
just fmt          # Fix formatting
just test         # Run all tests (iteration)
just generate-types  # Generate TypeScript types from Rust (ts-rs)
```

## Tech Stack

| Component | Technology                |
| --------- | ------------------------- |
| Runtime   | Tauri v2.9.x              |
| Backend   | Rust 1.80+                |
| Frontend  | React 19 + TypeScript 5.9 |
| Build     | Vite 7.x                  |
| Styling   | Tailwind CSS 4.x          |
| Animation | Motion 12.x               |
| Routing   | React Router 7.x          |
| State     | Zustand                   |
| Icons     | Lucide                    |

## Project Structure

```text
runi/
├── src/                          # React frontend
│   ├── components/               # Component library
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   │   └── generated/            # Auto-generated from Rust (ts-rs)
│   ├── utils/                    # Utilities
│   └── routes/                   # React Router routes
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── domain/               # Core business logic
│   │   ├── application/          # Use cases, orchestration
│   │   └── infrastructure/       # Tauri commands, HTTP, storage, MCP
│   ├── bindings/                 # ts-rs generated TypeScript types
│   └── Cargo.toml
└── justfile                      # Task runner
```

**Naming Conventions:**

- Components: `PascalCase.tsx`
- Tests: `ComponentName.test.tsx`
- Hooks: `use<Name>.ts`
- Stores: `use<Name>Store.ts`
- Utilities: `camelCase.ts`

## Coding Standards

### Rust

- All public items require doc comments
- Use `Result<T, String>` for Tauri commands
- Group imports: std → external → internal
- Async commands for I/O operations
- Pedantic clippy: `-D warnings` (see `Cargo.toml` for allowed exceptions)
- 3-layer architecture: `domain/` → `application/` → `infrastructure/`

### React 19 + TypeScript

- Explicit return types on functions
- Type all props with interfaces
- Use Zustand for global state, `useState` for local state
- Always handle and display errors from Tauri commands
- Prefer `const` arrow functions for components
- Use Motion for animations (not CSS transitions for complex motion)
- Default to muted UI controls; only emphasize on hover or when critical
- Format JSON with 2-space indentation in response views

## Architecture Patterns

### Event-Driven Architecture (Pub/Sub)

- Use `src/events/bus.ts` EventBus for cross-component communication
- Components emit events instead of calling other components directly
- UI can be driven by AI/MCP by emitting events to the bus
- Components subscribe to events they care about
- No direct component-to-component dependencies for cross-cutting concerns

### Loose Coupling / High Cohesion

- Components should not depend on specific layout positions
- Layout positions should be configuration-driven, not hardcoded
- Components communicate via events or props, never direct references
- Each component should have a single, well-defined responsibility

### MCP-First Implementation

Every UI action must be achievable via MCP tool (AI is a native co-driver):

1. **Identify the action** — What can the user do via UI?
2. **Define the event** — Add event type to `src/events/bus.ts`
3. **Emit from UI** — Click handler emits event to EventBus (not direct state mutation)
4. **Create MCP tool** — In `src-tauri/src/application/mcp_server_service.rs`, add tool that emits same event with `Actor::Ai`
5. **Subscribe in UI** — Component subscribes to event, updates state regardless of actor
6. **Test both paths** — Verify UI click and MCP tool produce identical results

### MCP-First Live Validation

- For live repro/debug/verification in runi, drive the running application through MCP tools.
- Use Follow Agent / Watch Agent flows so MCP actions are visible in the UI.
- Do not use Playwright as a fallback for Tauri runtime validation.

**Decision table:**

| Feature type                           | MCP tool required? |
| -------------------------------------- | ------------------ |
| UI action (button, toggle, navigation) | **Mandatory**      |
| Data CRUD (create/update/delete)       | **Recommended**    |
| Read-only query                        | Optional           |
| System/lifecycle event                 | Skip               |

**Anti-patterns:**

- `onClick={() => store.setState()}` — bypasses event bus, invisible to MCP
- MCP tool that calls different logic than UI path — divergent behavior
- UI-only features with no event emission — locks out AI co-driver

### Ports and Adapters (Hexagonal Architecture)

- Core domain logic (Rust backend) should not depend on UI details
- Tauri commands act as adapters between React UI (port) and Rust logic (adapter)
- AI providers (Ollama, Claude) should be swappable via interfaces
- Storage, network, and UI are all adapters to the core domain

### Unidirectional Data Flow

- State flows down via props, events flow up via event bus or callbacks
- Use Zustand stores for global state, `useState` for local state
- Avoid bidirectional data binding or circular dependencies
- State changes should be traceable (events → actions → state → UI)

### Container/Presentational Component Separation

- **Presentational components**: Pure rendering, props in, JSX out, no side effects
- **Container components** (or hooks): Handle state, events, side effects, orchestration
- Containers handle event bus subscriptions, Tauri commands, state management

### Color / Elevation Layering

| Layer        | Class            | Usage                                                          |
| ------------ | ---------------- | -------------------------------------------------------------- |
| **app**      | `bg-bg-app`      | Page/canvas — layout root, grid, panes                         |
| **surface**  | `bg-bg-surface`  | Primary surfaces — sidebar, status bar, header bars            |
| **raised**   | `bg-bg-raised`   | Cards/contained content on a surface — inputs, tab content     |
| **elevated** | `bg-bg-elevated` | Floating overlays only — tooltips, dropdowns, popovers, modals |

**Rule**: Never use `elevated` for inline content (buttons, badges, expanded strips).

## Testing Requirements

### Coverage Minimum: 85%

- Rust: `cargo tarpaulin --out Html`
- Frontend: `pnpm test:coverage`

**TDD Workflow (Mandatory):**

1. Write failing test first (RED)
2. Write minimum code to pass (GREEN)
3. Refactor while tests stay green (REFACTOR)
4. Commit only when `just ci` passes

**Test Types:**

- **Unit tests**: Always required (≥85% coverage)
- **Integration tests**: For multi-component interactions
- **Runtime validation**: MCP-driven live UI interaction against the running app (mandatory for UI behavior verification)
- **E2E tests**: Optional/secondary automation only; not a fallback for Tauri live validation
- **Migration tests**: Required for overhauls that change data structures or APIs
- **Performance tests**: Required for data-heavy features (include thresholds, e.g., render 1000 rows in <500ms)

**Test Selectors (CRITICAL):**

- **Always use `data-test-id` attributes** for test selectors
- Never use generic selectors like `getByText`, `getByRole`, or `getByLabel` for component identification
- `data-test-id` makes tests resilient to UI changes (text, styling, structure)
- Components must include `data-test-id` attributes on all interactive elements and key test targets
- Test files must use `getByTestId` or `screen.getByTestId` for finding elements
- Example: `<button data-test-id="save-button">Save</button>` → `screen.getByTestId('save-button')`
- **Exception**: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility, not for component identification

## Accessibility

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Focus Management**: Visible focus indicators, logical tab order
- **Reduced Motion**: Respect `prefers-reduced-motion` setting

### Component Accessibility Checklist

- [ ] All interactive elements have keyboard support
- [ ] Form inputs have associated labels (`htmlFor`/`id` or `aria-label`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Custom components use appropriate ARIA roles
- [ ] Focus indicators are visible (minimum 2px outline, theme token `--color-ring`)
- [ ] Color is not the only means of conveying information
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error states use `aria-invalid` and `aria-describedby`
- [ ] Loading states use `aria-busy` and `aria-live`

### Focus Ring Standard

All interactive elements must use consistent focus ring styling. Use `focusRingClasses` from
`@/utils/accessibility` for all interactive focus indicators:

- **Color**: theme token `--color-ring`
- **Width**: `2px` (`ring-2`)
- **Offset**: `2px` (`ring-offset-2`)
- **Offset Color**: `bg-app` (`ring-offset-bg-app`)
- **Pseudo-class**: `:focus-visible` (only shows on keyboard focus, not mouse clicks)

**Common Patterns:**

```tsx
// Form Input with Label
<label htmlFor="email-input">Email</label>
<Input id="email-input" type="email" />

// Icon Button
<Button aria-label="Close dialog">
  <X />
</Button>

// Error State
<Input
  id="email-input"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Invalid email address</span>

// Loading State
<div aria-busy="true" aria-live="polite">
  Loading...
</div>
```

## Constraints (Never Do These)

1. **Never use `@tauri-apps/api/tauri`** — Use `@tauri-apps/api/core` (Tauri v2)
2. **Never make I/O commands synchronous** — All Tauri commands that do I/O must be `async`
3. **Never commit without tests** — TDD is mandatory (RED → GREEN → REFACTOR)
4. **Never ignore linter warnings** — All clippy/ESLint warnings must be resolved
5. **Never skip type generation** — Run `just generate-types` after changing Rust types
6. **Never surface errors silently** — Always display Rust errors in UI
7. **Never use `any` type** — TypeScript strict mode, explicit types required
8. **Never use class components** — Functional components only
9. **Never create files unless explicitly requested** — Prefer editing existing files; do not create
   documentation, analysis, or planning files without explicit user direction
10. **Never create ephemeral files in tracked directories** — For analysis, planning, or intermediary work
    that must be written to disk, use `.tmp/` (git-ignored); delete when no longer needed

## Signal System

Intelligence communicates through consistent visual signals:

| Signal | Color     | Meaning                               |
| ------ | --------- | ------------------------------------- |
| Green  | `#22c55e` | Verified, safe, all clear             |
| Amber  | `#f59e0b` | Drift detected, needs investigation   |
| Red    | `#ef4444` | Breaking change, critical issue       |
| Purple | `#a855f7` | AI-generated (suspect until verified) |
| Blue   | `#3b82f6` | Suggestion available                  |

**HTTP Method Colors (Industry Standard):**

| Method  | Color     | Meaning          |
| ------- | --------- | ---------------- |
| GET     | `#3b82f6` | Read, safe       |
| POST    | `#22c55e` | Create, positive |
| PUT     | `#f59e0b` | Update, caution  |
| PATCH   | `#f59e0b` | Update, caution  |
| DELETE  | `#ef4444` | Destructive      |
| HEAD    | `#6b7280` | Meta/secondary   |
| OPTIONS | `#6b7280` | Meta/secondary   |

## Type Generation (ts-rs)

**Critical:** When changing Rust types that are used in TypeScript:

1. Update Rust struct/enum
2. Run `just generate-types`
3. Types are copied to `src/types/generated/`
4. Import from `@/types/generated/` in frontend

**Never manually edit files in `src/types/generated/`** — they are auto-generated.

## Commit Convention

```text
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`

**Examples:**

```text
feat(http): add request timeout configuration
fix(ui): resolve header tab overflow on small screens
test(auth): add bearer token validation tests
```
