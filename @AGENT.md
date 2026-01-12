# Agent Build Instructions

## Project: runi

Open-source desktop API client that serves as an **intelligent partner** for API developers—not just another request/response tool.

**Stack:** Rust (backend) + Tauri v2 (runtime) + Svelte 5 (frontend)

**Core Identity:**

- **AI-Native:** Intelligence built in, not bolted on
- **MCP-Powered:** Agentic workflows, registry integration
- **Local-First:** Privacy by design, Git-friendly storage

## Project Setup

```bash
# Install all dependencies
just install

# Or manually:
npm install
cd src-tauri && cargo fetch
```

## Development Commands

```bash
# Start development server (hot-reload enabled)
just dev

# Build for production
just build
```

## Quality Gates (Run Before Committing)

```bash
# Run complete CI pipeline locally
just ci

# Individual checks:
just check        # Type checking (cargo check + npm run check)
just lint         # Linting (clippy pedantic + ESLint)
just fmt-check    # Format verification (rustfmt + prettier)
just test         # Run all tests (cargo test + npm test)
```

## Running Tests

```bash
# All tests
just test

# Rust tests only
just test-rust

# Frontend tests only
just test-frontend

# With coverage
just test-coverage
```

## Formatting

```bash
# Fix all formatting issues
just fmt

# Check formatting without fixing
just fmt-check
```

## Key Learnings

### Tauri v2 Specifics
- Use `@tauri-apps/api/core` NOT `@tauri-apps/api/tauri` (v2 change)
- All Tauri commands must be async
- Commands return `Result<T, String>` for error handling
- CORS is bypassed in Tauri - requests go through Rust

### Svelte 5 Specifics
- Use runes: `$state()`, `$derived()`, `$effect()`, `$props()`
- NOT writable/readable stores from Svelte 4
- All script blocks must have `lang="ts"`

### Rust Specifics
- Clippy is set to pedantic - warnings are errors
- Some lints are intentionally allowed (see Cargo.toml)
- Group imports: std -> external -> internal
- All public items need doc comments

## File Structure

```
runi/
├── src/                      # Svelte frontend
│   ├── lib/
│   │   ├── components/       # PascalCase.svelte
│   │   ├── stores/           # camelCase.ts (Svelte 5 runes)
│   │   └── utils/            # camelCase.ts
│   └── routes/               # SvelteKit routes
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry
│   │   ├── lib.rs            # Command exports
│   │   └── commands/         # Tauri commands
│   └── Cargo.toml
├── specs/                    # Technical specifications
│   └── requirements.md
├── @fix_plan.md              # Task tracking
├── PROMPT.md                 # Ralph instructions
└── CLAUDE.md                 # Project conventions
```

## Feature Development Quality Standards

**CRITICAL**: All new features MUST meet the following mandatory requirements before being considered complete.

### Testing Requirements

- **Minimum Coverage**: 85% code coverage ratio required for all new code
- **Test Pass Rate**: 100% - all tests must pass, no exceptions
- **Test Types Required**:
  - Unit tests for all business logic and services
  - Integration tests for Tauri commands
  - Component tests for Svelte components
- **Coverage Validation**:
  ```bash
  # Rust coverage
  cd src-tauri && cargo tarpaulin --out Html

  # Frontend coverage
  npm run test:coverage
  ```

### Git Workflow Requirements

Before moving to the next feature, ALL changes must be:

1. **Committed with Clear Messages**:
   ```bash
   git commit -m "feat(http): add request timeout configuration"
   ```
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`
   - Include scope: `feat(api):`, `fix(ui):`, `test(auth):`

2. **Verified with CI**:
   ```bash
   just ci
   ```

3. **Pushed to Remote**:
   ```bash
   git push origin <branch-name>
   ```

### Documentation Requirements

- Update specs/requirements.md if behavior changes
- Add doc comments for Rust public items
- Add JSDoc comments for TypeScript exports
- Update this file if new build patterns are introduced

### Feature Completion Checklist

- [ ] All tests pass (`just test`)
- [ ] Code coverage meets 85% minimum
- [ ] Formatting passes (`just fmt-check`)
- [ ] Linting passes (`just lint`)
- [ ] Type checking passes (`just check`)
- [ ] Committed with conventional commit message
- [ ] Pushed to remote repository
- [ ] @fix_plan.md task marked complete
- [ ] CI pipeline passes (`just ci`)
- [ ] **Partner UX check:** Does this feature anticipate user needs or just respond to clicks?

## Common Issues & Solutions

### "Cannot find module @tauri-apps/api/tauri"
Use `@tauri-apps/api/core` instead - this changed in Tauri v2.

### Clippy pedantic warnings
Some are intentionally allowed in Cargo.toml. Check the lints section before trying to fix.

### Svelte 5 store errors
Don't use `writable()` or `readable()`. Use `$state()` rune instead.

### Test isolation failures
Each test must clean up its own state. Don't rely on test ordering.
