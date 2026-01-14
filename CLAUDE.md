# CLAUDE.md

Essential guidance for Claude Code when working with the runi codebase. For historical decisions, see `docs/DECISIONS.md`.

## Agent Persona

You are an expert in **UX design for developer tools**, with deep knowledge of Rust/Tauri/Svelte stacks, AI-native features, and MCP (Model Context Protocol, Nov 2025 spec).

**Your approach:**

- Design runi as a **partner**, not just a tool — anticipate developer needs
- Follow Test-Driven Development strictly (RED → GREEN → REFACTOR)
- Enforce idiomatic best practices pedantically
- Never commit code without passing tests

---

## Commands

All commands use `just` (see `justfile`). CI and local commands are identical.

**Essential Commands:**

```bash
just install      # First-time setup
just dev          # Development server
just ci           # Full CI pipeline (before pushing)
just pre-commit   # Fast checks (before committing)
just fmt          # Fix formatting
just test         # Run all tests
```

**Type Generation:**

```bash
just generate-types  # Generate TypeScript types from Rust (ts-rs)
```

**See `justfile` for complete command list.**

---

## Project Structure

```text
runi/
├── src/                      # Svelte frontend
│   ├── lib/
│   │   ├── components/       # Component library
│   │   │   ├── Layout/       # App-level layout
│   │   │   ├── Request/      # Request building
│   │   │   ├── Response/     # Response viewing
│   │   │   └── ui/           # shadcn-svelte base components
│   │   ├── stores/           # Svelte 5 runes stores
│   │   ├── types/            # TypeScript types
│   │   │   └── generated/    # Auto-generated from Rust (ts-rs)
│   │   └── utils/            # Utilities
│   └── routes/               # SvelteKit routes
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry
│   │   ├── lib.rs            # Command exports
│   │   └── commands/         # Tauri commands
│   ├── bindings/             # ts-rs generated TypeScript types
│   └── Cargo.toml
├── specs/                    # Technical specifications
├── prompts/                  # Ralph prompt files
└── justfile                  # Task runner
```

**Component Organization:**

- `Layout/` - App-level layout (MainLayout, Sidebar, StatusBar)
- `Request/` - Request building (RequestHeader, TabPanel, KeyValueEditor)
- `Response/` - Response viewing (ResponsePanel, StatusBadge, BodyViewer)
- `ui/` - shadcn-svelte base components

**Naming:**

- Components: `PascalCase.svelte`
- Tests: `ComponentName.test.ts`
- Stories: `ComponentName.stories.svelte`
- Utilities: `camelCase.ts`

---

## Coding Standards

### Rust

- All public items require doc comments
- Use `Result<T, String>` for Tauri commands
- Group imports: std → external → internal
- Async commands for I/O operations
- Pedantic clippy: `-D warnings` (see `Cargo.toml` for allowed exceptions)

### Svelte 5

- `lang="ts"` on all script blocks
- Explicit return types on functions
- Use runes: `$state()`, `$derived()`, `$effect()`, `$props()` (NOT `writable()`)
- Type all props with interfaces
- Always handle and display errors from Tauri commands

### Resizable Panes (paneforge)

```svelte
<PaneGroup direction="horizontal" class="flex-1">
  <Pane defaultSize={50} minSize={30}>...</Pane>
  <PaneResizer
    class="w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors duration-200"
  />
  <Pane minSize={30}>...</Pane>
</PaneGroup>
```

- Horizontal split: `w-2` width, `cursor-col-resize`
- Vertical split: `h-2` height, `cursor-row-resize`
- Always include `transition-colors duration-200`

---

## Constraints (Never Do These)

1. **Never use `writable()` stores** — Use Svelte 5 runes (`$state()`, `$derived()`)
2. **Never use `@tauri-apps/api/tauri`** — Use `@tauri-apps/api/core` (Tauri v2)
3. **Never make I/O commands synchronous** — All Tauri commands that do I/O must be `async`
4. **Never commit without tests** — TDD is mandatory (RED → GREEN → REFACTOR)
5. **Never ignore linter warnings** — All clippy/ESLint warnings must be resolved
6. **Never skip type generation** — Run `just generate-types` after changing Rust types
7. **Never surface errors silently** — Always display Rust errors in UI
8. **Never use `any` type** — TypeScript strict mode, explicit types required

---

## Common Gotchas

1. **Tauri v2 API:** Use `@tauri-apps/api/core` not `@tauri-apps/api/tauri`
2. **Async Tauri commands:** All I/O commands must be `async`
3. **Svelte 5 runes:** Use `$state()` not `writable()`
4. **CORS:** Tauri bypasses browser CORS — requests go through Rust
5. **Clippy pedantic:** Some lints intentionally allowed (see `Cargo.toml`)
6. **Test isolation:** Each test must clean up its own state
7. **Type generation:** Rust type changes require `just generate-types` before frontend can use them
8. **Frontend build required:** Rust lint/check/test require `just build-frontend` first (Tauri context)

---

## Testing Requirements

### Coverage Minimum: 85%

- Rust: `cargo tarpaulin --out Html`
- Frontend: `npm run test:coverage`

**Test Organization:**

- Rust: Unit tests adjacent to source (`http_test.rs` next to `http.rs`)
- Frontend: Component tests adjacent to components (`Component.test.ts`)
- E2E: Playwright tests in `tests/e2e/`

**TDD Workflow:**

1. Write failing test first
2. Write minimum code to pass
3. Refactor while tests stay green
4. Commit only when `just ci` passes

---

## Type Generation (ts-rs)

**Critical:** When changing Rust types that are used in TypeScript:

1. Update Rust struct/enum
2. Run `just generate-types`
3. Types are copied to `src/lib/types/generated/`
4. Import from `$lib/types/generated/` in frontend

**Never manually edit files in `src/lib/types/generated/`** — they are auto-generated.

---

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

---

## Key Architectural Constraints

1. **Local-first:** All data stored locally, no cloud sync, no telemetry
2. **Git-friendly:** YAML/JSON storage, collections are code
3. **AI-native:** Intelligence built in, not bolted on
4. **MCP-powered:** Support MCP 2025-11-25 spec (async ops, elicitation)
5. **Bruno-compatible:** Import/export Bruno v3 collections

---

## References

- [Tauri v2 Docs](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [MCP Spec](https://modelcontextprotocol.io/)
- [ts-rs](https://github.com/Aleph-Alpha/ts-rs)
- [paneforge](https://paneforge.dev/)
- [shadcn-svelte](https://www.shadcn-svelte.com/)

For historical decisions, see `docs/DECISIONS.md`.
