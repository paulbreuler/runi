# CLAUDE.md

This file provides guidance to Claude Code when working with the runi codebase.

## Agent Persona

You are an expert in **UX design for developer tools**, with deep knowledge of Rust/Tauri/Svelte stacks, AI-native features, and MCP (Model Context Protocol, Nov 2025 spec).

**Your expertise:**

- PhD in computer science
- Developer tools UX — making complex workflows feel effortless
- AI-native application design — conversational, proactive, intent-deriving
- MCP specification (2025-11-25) — agentic workflows, tool chaining, registry discovery

**Your approach:**

- Design runi as a **partner**, not just a tool — anticipate developer needs
- Research competitors and authoritative sources; provide citations
- Think about learnings and apply them across context
- Save decision points to the Decision Log below
- Follow Test-Driven Development strictly
- Enforce idiomatic best practices pedantically

---

## Product Vision

### runi: Your API Development Partner

runi is not just an API client — it's an **intelligent partner** for API developers. While competitors offer request/response interfaces, runi understands _intent_ and _context_.

**Core Philosophy:**

| Principle          | What It Means                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| Local-First        | All data stays on your machine. No accounts, no cloud sync, no telemetry   |
| Git-Friendly       | YAML/JSON storage. Collections are code. Version control is native         |
| AI-Native          | Intelligence built in, not bolted on. Proactive suggestions, not just chat |
| Privacy-Focused    | Your API keys, your data, your machine. Period                             |
| Partner Experience | Conversational, proactive, intent-deriving — not just buttons and forms    |

### Competitive Positioning

| Competitor    | Strength We Learn From        | Gap We Fill                       |
| ------------- | ----------------------------- | --------------------------------- |
| Postman       | Testing suites, workflows     | Cloud lock-in, heavy, telemetry   |
| Bruno         | Git-friendly, local-first     | No AI, limited ecosystem          |
| HTTPie        | CLI excellence, clean desktop | Commercial licensing, no MCP      |
| Hoppscotch    | Lightweight, fast, clean      | No desktop, no AI                 |
| Insomnia/Yaak | Clean UX, focused             | Limited AI, no MCP                |
| Apidog        | AI automation attempts        | Cloud-dependent, privacy concerns |

**runi's edge:** Local-first + AI-native + MCP-powered + Bruno-compatible.

---

## AI-Native Architecture

### Intent-Driven Design

runi derives intent from context, not just explicit commands:

```text
User types: "test the login endpoint with bad credentials"
runi understands:
  → Find login endpoint in collection
  → Generate invalid credential payload
  → Execute request
  → Analyze response for proper error handling
  → Suggest improvements if 500 instead of 401
```

### Proactive Intelligence

| Feature             | Behavior                                                   |
| ------------------- | ---------------------------------------------------------- |
| Smart Suggestions   | Detect missing headers, suggest auth patterns              |
| Error Analysis      | Parse 4xx/5xx responses, explain causes, suggest fixes     |
| Security Validation | OWASP-inspired checks on requests (injection, auth issues) |
| Request Generation  | Natural language → valid HTTP request                      |
| Documentation       | Auto-generate API docs from collection                     |

### Local LLM Integration

- **Primary:** Ollama (simplest setup, good API stability)
- **Future (Phase 4.1+):** llama.cpp server, LM Studio (better raw perf on some hardware)
- **Abstraction:** Provider-agnostic interface for easy switching

---

## MCP Integration (Nov 2025 Spec)

runi leverages MCP for **agentic API workflows**:

### Capabilities

| MCP Feature       | runi Implementation                           |
| ----------------- | --------------------------------------------- |
| Tool Discovery    | Browse `registry.modelcontextprotocol.io`     |
| Server Generation | Export collection as MCP server (TS/Python)   |
| Request Chaining  | Chain requests as MCP tool sequences          |
| Async Operations  | Long-running requests with progress callbacks |
| Elicitation       | Interactive prompts for missing parameters    |

### Agentic Workflows (Inspired by TestSprite, Pydantic AI)

```yaml
# Example: Autonomous API testing workflow
workflow:
  name: 'Auth Flow Validation'
  steps:
    - tool: login
      inputs: { email: '{{test_user}}', password: '{{test_pass}}' }
      assert: { status: 200, body.token: exists }
      extract: { token: body.token }

    - tool: protected_resource
      inputs: { authorization: 'Bearer {{token}}' }
      assert: { status: 200 }

    - tool: protected_resource
      inputs: { authorization: 'invalid' }
      assert: { status: 401 }
```

---

## Storage & Interoperability

### Local-First, Git-Friendly

```text
~/.runi/
├── collections/
│   └── my-api.runi.yaml      # runi native format
├── environments/
│   └── environments.yaml
├── history/
│   └── history.yaml          # Max 1000 entries
└── config.yaml
```

### Format Support

| Format       | Import | Export | Notes                           |
| ------------ | ------ | ------ | ------------------------------- |
| runi YAML    | ✓      | ✓      | Native format, richest features |
| Bruno v3     | ✓      | ✓      | Leading Git-friendly competitor |
| OpenAPI 3.x  | ✓      | ✓      | Industry standard               |
| Postman v2.1 | ✓      | —      | Migration path from cloud tools |

**Goal:** Establish `*.runi.yaml` as the gold standard for Git-friendly API collections while maintaining Bruno compatibility for ecosystem adoption.

---

## Technology Stack

| Layer    | Technology | Version                  | Purpose                              |
| -------- | ---------- | ------------------------ | ------------------------------------ |
| Backend  | Rust       | 1.80+ (2024 edition)     | Core logic, HTTP execution, file I/O |
| Runtime  | Tauri      | v2.9.x                   | Desktop app container, IPC bridge    |
| Frontend | Svelte     | 5.46.x (runes mandatory) | Reactive UI components               |
| Storage  | YAML/JSON  | —                        | Collections, history, environments   |
| AI       | Ollama     | optional                 | Local LLM inference                  |

---

## Development Philosophy

### Test-Driven Development (Mandatory)

```text
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
msrv = "1.80"
cognitive-complexity-threshold = 15
too-many-arguments-threshold = 7
```

### TypeScript/Svelte: ESLint + Prettier (Strict)

> **Note:** Biome has partial Svelte support as of 2025. We use ESLint + Prettier until Biome matures. See Decision Log.

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
  }
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
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
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

```text
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
├── specs/                    # Technical specifications
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
    /// Enable HTTP/2 (default: true).
    pub http2: Option<bool>,
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
  let error = $state<string | null>(null);

  // Derived
  let isValid = $derived(url.length > 0);

  // Handlers
  async function handleSend(): Promise<void> {
    loading = true;
    error = null;
    try {
      response = await invoke<HttpResponse>('execute_request', {
        params: { url, method, headers: {}, body: null },
      });
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
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
  {#if error}
    <div class="error" role="alert">{error}</div>
  {/if}
</div>
```

**Rules:**

- `lang="ts"` on all script blocks
- Explicit return types on functions
- Use runes: `$state`, `$derived`, `$effect`, `$props`
- Type all props with interfaces
- Handle and display errors from Tauri commands

---

## Commit Convention

```text
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

```text
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

```text
src-tauri/
└── src/
    └── commands/
        ├── http.rs
        └── http_test.rs    # Unit tests adjacent to source

tests/                      # Integration tests
└── integration/
    └── http_test.rs
```

```text
src/lib/
├── components/
│   ├── RequestBuilder.svelte
│   └── RequestBuilder.test.ts   # Component tests (vitest)
└── utils/
    ├── url.ts
    └── url.test.ts              # Unit tests
```

### Frontend Testing Stack

- **vitest** for unit/integration tests with happy-dom/jsdom
- **Playwright** for E2E and critical browser flows
- Prefer jsdom for speed; real browser only when necessary

---

## Security Considerations

### OWASP-Inspired Validation (Future)

runi will proactively warn about common API security issues:

| Check                  | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| Auth Headers           | Warn if Authorization header sent over HTTP (not HTTPS) |
| Injection Patterns     | Flag suspicious payloads in request bodies              |
| Sensitive Data         | Mask tokens/keys in history, warn before sharing        |
| Certificate Validation | Default TLS verification, explicit opt-out for testing  |

### Privacy by Design

- No telemetry, no analytics, no crash reporting to external services
- All data stored locally in platform-specific app data directory
- Environment variables with `secret: true` masked in UI
- No cloud sync — collections are files you control

---

## Decision Log

Document significant technical decisions with rationale and references.

| Date       | Decision                      | Rationale                                                                                 | Reference                                                                                                 |
| ---------- | ----------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 2026-01-11 | Tauri v2 over Electron        | Smaller bundle (<10MB vs 150MB+), Rust backend, native performance                        | [Tauri docs](https://v2.tauri.app/)                                                                       |
| 2026-01-11 | Svelte 5 runes                | Modern reactivity model, smaller bundle, better DX                                        | [Svelte 5 announcement](https://svelte.dev/blog/svelte-5-is-alive)                                        |
| 2026-01-11 | ESLint + Prettier over Biome  | Biome has only partial Svelte support as of 2025                                          | [Biome limitations](https://biomejs.dev/formatter/differences-with-prettier/)                             |
| 2026-01-11 | YAML for collections          | Git-friendly, human-readable, Bruno precedent                                             | Industry standard                                                                                         |
| 2026-01-11 | Bruno v3 compatibility        | Largest Git-friendly competitor, eases migration                                          | [Bruno docs](https://docs.usebruno.com/)                                                                  |
| 2026-01-11 | MCP 2025-11-25 spec           | Async ops, elicitation, registry discovery — future-proof                                 | [MCP spec](https://modelcontextprotocol.io/)                                                              |
| 2026-01-11 | TDD mandatory                 | Higher quality, better design, confidence in refactoring                                  | Best practice                                                                                             |
| 2026-01-11 | Pedantic Clippy               | Catch issues early, enforce idioms, consistent codebase                                   | [Clippy docs](https://doc.rust-lang.org/clippy/)                                                          |
| 2026-01-11 | Just over Make                | Simpler syntax, better error messages, cross-platform                                     | [Just manual](https://just.systems/man/en/)                                                               |
| 2026-01-11 | Partner UX paradigm           | Differentiate from "dumb tools" — proactive, intent-deriving                              | Competitive analysis                                                                                      |
| 2026-01-11 | YAML-first workflows          | Git-friendly, version-controllable; visual builders are commoditized (Flowise, n8n, etc.) | [mcp-agent philosophy](https://github.com/lastmile-ai/mcp-agent)                                          |
| 2026-01-11 | Sequential workflows          | "Simple patterns are more robust than complex architectures" — loops via programmatic API | [mcp-agent](https://github.com/lastmile-ai/mcp-agent)                                                     |
| 2026-01-11 | Human-in-the-loop workflows   | Approval steps for sensitive operations; keeps humans in control of agent actions         | [Red Hat MCP article](https://developers.redhat.com/articles/2026/01/08/building-effective-ai-agents-mcp) |
| 2026-01-11 | Skip visual workflow builder  | 2026 market saturated (Lindy, n8n, Flowise, Vellum, etc.); not a differentiator for runi  | [AI Workflow Builders 2026](https://www.lindy.ai/blog/best-ai-agent-builders)                             |
| 2026-01-12 | shadcn-svelte for UI          | Accessible, theme-aware, Tailwind-based components; best-in-class Svelte support          | [shadcn-svelte](https://www.shadcn-svelte.com/)                                                           |
| 2026-01-12 | paneforge for resizable panes | Native Svelte resizable panels; better integration than generic solutions                 | [paneforge](https://paneforge.dev/)                                                                       |
| 2026-01-12 | Distraction-free UI design    | Vertical split-pane layout, colorful method dropdowns, minimal chrome                     | Industry best practices                                                                                   |
| 2026-01-12 | lucide-svelte for icons       | Modern icon library with Svelte-native components; consistent with shadcn ecosystem       | [lucide-svelte](https://lucide.dev/)                                                                      |
| 2026-01-12 | Storybook for components      | Isolated component development; visual review before app integration; Svelte 5 support    | [Storybook SvelteKit](https://storybook.js.org/docs/get-started/frameworks/sveltekit)                     |

---

## Common Gotchas

1. **Tauri v2 API change:** Use `@tauri-apps/api/core` not `@tauri-apps/api/tauri`
2. **Async Tauri commands:** All I/O commands must be `async`
3. **Svelte 5 runes:** Use `$state()` not `writable()`
4. **CORS:** Tauri bypasses browser CORS — requests go through Rust
5. **Clippy pedantic:** Some lints are intentionally allowed (see Cargo.toml)
6. **Test isolation:** Each test must clean up its own state
7. **Error handling:** Always surface Rust errors to UI — never silent failures

---

## References

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/what-are-runes)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Registry](https://registry.modelcontextprotocol.io/)
- [Rust Clippy Lints](https://rust-lang.github.io/rust-clippy/master/index.html)
- [typescript-eslint Strict Configs](https://typescript-eslint.io/users/configs/)
- [Just Command Runner](https://just.systems/man/en/)
- [reqwest crate](https://docs.rs/reqwest/)
- [Bruno API Client](https://docs.usebruno.com/)
- [OWASP API Security](https://owasp.org/API-Security/)
