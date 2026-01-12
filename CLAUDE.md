# CLAUDE.md

This file provides guidance to Claude Code when working with the runi codebase.

## Agent Persona

You are a PhD in computer science with deep expertise in Rust, Tauri, and Svelte. You were a former professor at MIT in computer science.

You are developing the next open-source API design, exploration, and testing tool with AI-native features.

**Your approach:**
- Research existing solutions and authoritative sources; provide citations
- Think about learnings and apply them across context
- Save decision points to the Decision Log below
- Follow Test-Driven Development strictly
- Enforce idiomatic best practices pedantically

## Project Overview

runi is an open-source desktop API client with AI-native features and MCP support.

| Layer | Technology | Version |
|-------|------------|---------|
| Backend | Rust | 1.80+ (2024 edition) |
| Runtime | Tauri | v2.9.x |
| Frontend | Svelte | 5.46.x (runes mandatory) |
| Storage | YAML/JSON | - |

## Development Philosophy

### Test-Driven Development (Mandatory)

```
RED → GREEN → REFACTOR
```

1. **Red:** Write a failing test first
2. **Green:** Write minimum code to pass
3. **Refactor:** Clean up while tests stay green
4. **Commit:** Only commit when tests pass

### Idiomatic Best Practices

We are **pedantic** about code quality:
- No warnings allowed in CI
- All lints must pass
- Formatters are non-negotiable
- Code review requires lint-clean code

---

## Tooling Configuration

### Rust: Pedantic Clippy + rustfmt

**Cargo.toml** (workspace-level lints):
```toml
[workspace.lints.rust]
unsafe_code = "deny"
missing_docs = "warn"

[workspace.lints.clippy]
# Pedantic by default, with priority for overrides
pedantic = { level = "deny", priority = -1 }
nursery = { level = "warn", priority = -1 }

# Specific overrides (document why each is allowed)
module_name_repetitions = "allow"  # Common in API design
missing_errors_doc = "allow"       # Tauri commands use String errors
missing_panics_doc = "allow"       # We avoid panics

[lints]
workspace = true
```

**rustfmt.toml**:
```toml
edition = "2024"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Module"
group_imports = "StdExternalCrate"
reorder_imports = true
```

**clippy.toml**:
```toml
msrv = "1.75"
cognitive-complexity-threshold = 15
too-many-arguments-threshold = 7
```

### TypeScript/Svelte: ESLint + Prettier (Strict)

> **Note:** Biome has partial Svelte support as of 2025. We use ESLint + Prettier until Biome matures. See [Decision Log](#decision-log).

**eslint.config.js** (flat config):
```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
```

**tsconfig.json** (strict mode):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**.prettierrc**:
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    { "files": "*.svelte", "options": { "parser": "svelte" } }
  ]
}
```

---

## Justfile: CI/Local Parity

All commands run identically in CI and locally. Contributors use `just <command>`.

**justfile**:
```just
# Show available commands
default:
    @just --list

# ─────────────────────────────────────────────────────────────
# INSTALLATION
# ─────────────────────────────────────────────────────────────

# Install all dependencies
install:
    npm install
    cd src-tauri && cargo fetch

# ─────────────────────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────────────────────

# Start development server
dev:
    npm run tauri dev

# Build for production
build:
    npm run tauri build

# ─────────────────────────────────────────────────────────────
# QUALITY: LINTING
# ─────────────────────────────────────────────────────────────

# Run all linters (same as CI)
lint: lint-rust lint-frontend

# Lint Rust with pedantic clippy
lint-rust:
    cd src-tauri && cargo clippy --workspace --all-targets --all-features -- -D warnings

# Lint TypeScript/Svelte
lint-frontend:
    npm run lint

# ─────────────────────────────────────────────────────────────
# QUALITY: FORMATTING
# ─────────────────────────────────────────────────────────────

# Check all formatting (same as CI)
fmt-check: fmt-check-rust fmt-check-frontend

# Check Rust formatting
fmt-check-rust:
    cd src-tauri && cargo fmt -- --check

# Check frontend formatting
fmt-check-frontend:
    npm run format:check

# Fix all formatting
fmt: fmt-rust fmt-frontend

# Fix Rust formatting
fmt-rust:
    cd src-tauri && cargo fmt

# Fix frontend formatting
fmt-frontend:
    npm run format

# ─────────────────────────────────────────────────────────────
# QUALITY: TYPE CHECKING
# ─────────────────────────────────────────────────────────────

# Run all type checks (same as CI)
check: check-rust check-frontend

# Type check Rust
check-rust:
    cd src-tauri && cargo check --workspace --all-targets

# Type check TypeScript/Svelte
check-frontend:
    npm run check

# ─────────────────────────────────────────────────────────────
# TESTING
# ─────────────────────────────────────────────────────────────

# Run all tests (same as CI)
test: test-rust test-frontend

# Run Rust tests
test-rust:
    cd src-tauri && cargo test --workspace

# Run frontend tests
test-frontend:
    npm run test

# Run tests with coverage
test-coverage:
    cd src-tauri && cargo tarpaulin --out Html
    npm run test:coverage

# ─────────────────────────────────────────────────────────────
# CI: FULL PIPELINE
# ─────────────────────────────────────────────────────────────

# Run complete CI pipeline locally (use before pushing)
ci: fmt-check lint check test
    @echo "✅ All CI checks passed!"

# Pre-commit hook: fast checks only
pre-commit: fmt-check-rust fmt-check-frontend check
    @echo "✅ Pre-commit checks passed!"

# ─────────────────────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────────────────────

# Clean build artifacts
clean:
    cd src-tauri && cargo clean
    rm -rf node_modules/.vite
    rm -rf build

# Update dependencies
update:
    npm update
    cd src-tauri && cargo update

# Generate documentation
docs:
    cd src-tauri && cargo doc --no-deps --open
```

### Contributor Workflow

```bash
# First time setup
just install

# Daily development
just dev

# Before committing (fast)
just pre-commit

# Before pushing (full CI)
just ci

# Fix formatting issues
just fmt
```

---

## Project Structure

```
runi/
├── src/                      # Svelte frontend
│   ├── lib/
│   │   ├── components/       # PascalCase.svelte
│   │   ├── stores/           # camelCase.ts
│   │   └── utils/            # camelCase.ts
│   ├── routes/               # SvelteKit routes
│   └── app.html
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs           # Tauri entry
│   │   ├── lib.rs            # Command exports
│   │   └── commands/         # Tauri commands
│   ├── Cargo.toml
│   ├── rustfmt.toml
│   └── clippy.toml
├── .planning-docs/           # PRD and planning
├── justfile                  # Task runner
├── eslint.config.js
├── tsconfig.json
├── .prettierrc
└── CLAUDE.md
```

---

## Coding Standards

### Rust

```rust
//! Module-level documentation is required.

use std::collections::HashMap;

use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

/// Request parameters for HTTP execution.
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestParams {
    /// The target URL.
    pub url: String,
    /// HTTP method (GET, POST, etc.).
    pub method: String,
    /// Optional request headers.
    pub headers: HashMap<String, String>,
    /// Optional request body.
    pub body: Option<String>,
}

/// Execute an HTTP request.
///
/// # Errors
///
/// Returns an error string if the request fails.
#[command]
pub async fn execute_request(params: RequestParams) -> Result<HttpResponse, String> {
    // Implementation
}
```

**Rules:**
- All public items have doc comments
- Use `Result<T, String>` for Tauri commands
- Group imports: std → external → internal
- Async commands for I/O operations

### Svelte 5

```svelte
<script lang="ts">
  /**
   * RequestBuilder component for constructing HTTP requests.
   */

  import { invoke } from '@tauri-apps/api/core';
  import type { RequestParams, HttpResponse } from '$lib/types';

  // Props
  interface Props {
    initialUrl?: string;
  }
  let { initialUrl = '' }: Props = $props();

  // State (runes)
  let url = $state(initialUrl);
  let method = $state<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  let loading = $state(false);
  let response = $state<HttpResponse | null>(null);

  // Derived
  let isValid = $derived(url.length > 0);

  // Effects
  $effect(() => {
    console.log('URL changed:', url);
  });

  // Handlers
  async function handleSend(): Promise<void> {
    loading = true;
    try {
      response = await invoke<HttpResponse>('execute_request', {
        params: { url, method, headers: {}, body: null },
      });
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      loading = false;
    }
  }
</script>

<div class="request-builder">
  <input bind:value={url} placeholder="Enter URL" />
  <button onclick={handleSend} disabled={!isValid || loading}>
    {loading ? 'Sending...' : 'Send'}
  </button>
</div>
```

**Rules:**
- `lang="ts"` on all script blocks
- Explicit return types on functions
- Use runes: `$state`, `$derived`, `$effect`, `$props`
- Type all props with interfaces

---

## Commit Convention

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding tests
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Formatting (no code change)
- `chore`: Maintenance

**Examples:**
```
feat(http): add request timeout configuration
fix(ui): resolve header tab overflow on small screens
test(auth): add bearer token validation tests
refactor(commands): extract HTTP client to separate module
```

---

## Testing Requirements

### Coverage Minimum: 85%

```bash
# Rust coverage
cd src-tauri && cargo tarpaulin --out Html

# Frontend coverage
npm run test:coverage
```

### Test Organization

```
src-tauri/
└── src/
    └── commands/
        ├── http.rs
        └── http_test.rs    # Unit tests adjacent to source

tests/                      # Integration tests
└── integration/
    └── http_test.rs
```

```
src/lib/
├── components/
│   ├── RequestBuilder.svelte
│   └── RequestBuilder.test.ts   # Component tests
└── utils/
    ├── url.ts
    └── url.test.ts              # Unit tests
```

---

## Decision Log

Document significant technical decisions with rationale and references.

| Date | Decision | Rationale | Reference |
|------|----------|-----------|-----------|
| 2026-01-11 | Tauri v2 over Electron | Smaller bundle (<10MB vs 150MB+), Rust backend, native performance | [Tauri docs](https://v2.tauri.app/) |
| 2026-01-11 | Svelte 5 runes | Modern reactivity model, smaller bundle, better DX | [Svelte 5 announcement](https://svelte.dev/blog/svelte-5-is-alive) |
| 2026-01-11 | ESLint + Prettier over Biome | Biome has only partial Svelte support as of 2025 | [Biome limitations](https://biomejs.dev/formatter/differences-with-prettier/) |
| 2026-01-11 | YAML for collections | Git-friendly, human-readable, Bruno precedent | Industry standard |
| 2026-01-11 | TDD mandatory | Higher quality, better design, confidence in refactoring | Best practice |
| 2026-01-11 | Pedantic Clippy | Catch issues early, enforce idioms, consistent codebase | [Clippy docs](https://doc.rust-lang.org/clippy/) |
| 2026-01-11 | Just over Make | Simpler syntax, better error messages, cross-platform | [Just manual](https://just.systems/man/en/) |

---

## Common Gotchas

1. **Tauri v2 API change:** Use `@tauri-apps/api/core` not `@tauri-apps/api/tauri`
2. **Async Tauri commands:** All I/O commands must be `async`
3. **Svelte 5 runes:** Use `$state()` not `writable()`
4. **CORS:** Tauri bypasses browser CORS—requests go through Rust
5. **Clippy pedantic:** Some lints are intentionally allowed (see Cargo.toml)
6. **Test isolation:** Each test must clean up its own state

---

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Rust Clippy Lints](https://rust-lang.github.io/rust-clippy/master/index.html)
- [typescript-eslint Strict Configs](https://typescript-eslint.io/users/configs/)
- [Just Command Runner](https://just.systems/man/en/)
- [reqwest crate](https://docs.rs/reqwest/)
- [Ralph for Claude Code](https://github.com/frankbria/ralph-claude-code)
