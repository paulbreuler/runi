# runi

> An intelligent, local-first HTTP client for API developers. Your proactive partner, not just another request/response tool.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

runi is an open-source desktop application that combines **local-first architecture**, **AI-native intelligence**, and **Model Context Protocol (MCP)** support to provide a powerful, privacy-focused API development experience.

## ✨ Features (WIP)

### 🎯 Core Capabilities

- **REST API Client** — Full support for GET, POST, PUT, PATCH, DELETE with custom headers, bodies, and query parameters
- **Request Builder** — Intuitive interface for constructing and organizing API requests
- **Response Viewer** — Syntax-highlighted JSON response viewer with detailed timing information
- **Collections** — Organize requests in Git-friendly YAML files
- **Environment Variables** — Manage variables with `{{variable}}` substitution
- **Request History** — Track and replay previous requests

### 🧠 Intelligence Features

- **Proactive Suggestions** — Context-aware header and configuration suggestions
- **Security Warnings** — OWASP-inspired validation (auth over HTTP, JWT expiry, injection patterns)
- **Error Analysis** — Rule-based error analysis with AI-enhanced insights (coming soon)
- **Natural Language Requests** — Generate requests from plain English (coming soon)

### 🔌 MCP Support

- **MCP Server Generation** — Generate MCP servers from API collections (coming soon)
- **MCP Registry Integration** — Browse and test MCP tools (coming soon)
- **Agentic Workflows** — Run sequential workflows with assertions and variable extraction (coming soon)

### 🔒 Privacy & Local-First

- **No Cloud Dependency** — Works fully offline
- **No Telemetry** — Zero data collection or tracking
- **Git-Friendly** — All data stored in YAML/JSON files
- **Bruno-Compatible** — Import/export Bruno v3 collections

## 🛠️ Tech Stack

- **Backend:** Rust 1.80+ with Tauri v2.9.x
- **Frontend:** Svelte 5.46.x with TypeScript
- **UI Components:** shadcn-svelte with Tailwind CSS
- **HTTP Client:** reqwest (Rust)
- **Storage:** YAML/JSON files (no database)
- **Testing:** Vitest (unit), Playwright (E2E)

## 📋 Prerequisites

- **Rust** 1.80 or later ([install](https://www.rust-lang.org/tools/install))
- **Node.js** 18+ and npm ([install](https://nodejs.org/))
- **just** command runner ([install](https://github.com/casey/just#installation))

### Installing just

```bash
# macOS/Linux
cargo install just

# macOS (Homebrew)
brew install just

# Or see: https://github.com/casey/just#installation
```

## 🚀 Quick Start

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/runi.git
cd runi
```

2. Install dependencies:

```bash
just install
```

3. Start the development server:

```bash
just dev
```

The application will open in a new window with hot-reload enabled.

## 🏗️ Development

### Available Commands

All commands use `just` (see `justfile` for the complete list):

```bash
# Development
just dev              # Start Tauri development server
just build            # Build for production
just build-frontend   # Build frontend only (required before Rust compilation)

# Code Quality
just fmt              # Fix all formatting
just fmt-check        # Check formatting (CI)
just lint             # Run all linters
just check            # Run all type checks
just ci               # Run complete CI pipeline (before pushing)

# Testing
just test             # Run all tests
just test-rust        # Run Rust tests only
just test-frontend    # Run frontend tests only
just test-e2e         # Run E2E tests (Playwright)

# Type Generation (after changing Rust types)
just generate-types   # Generate TypeScript types from Rust (ts-rs)

# Storybook
just storybook        # Start Storybook development server

# Documentation
just docs             # Generate Rust documentation
```

### Project Structure

```
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
│   └── Cargo.toml
├── specs/                    # Technical specifications
├── prompts/                  # Ralph prompt files
└── justfile                  # Task runner
```

### Type Generation

When you change Rust types used in TypeScript:

1. Update the Rust struct/enum
2. Run `just generate-types`
3. Types are automatically copied to `src/lib/types/generated/`
4. Import from `$lib/types/generated/` in the frontend

**Never manually edit files in `src/lib/types/generated/`** — they are auto-generated.

## 🧪 Testing

We follow **Test-Driven Development (TDD)**

### Running Tests

```bash
# All tests
just test

# Specific suites
just test-rust        # Rust unit tests
just test-frontend    # Frontend component tests
just test-e2e         # End-to-end Playwright tests
```

### Test Organization

- **Rust:** Unit tests adjacent to source files (`http_test.rs` next to `http.rs`)
- **Frontend:** Component tests adjacent to components (`Component.test.ts`)
- **E2E:** Playwright tests in `tests/e2e/`

## 📦 Building

### Development Build

```bash
just dev
```

### Production Build

```bash
just build
```

This will create platform-specific binaries in `src-tauri/target/release/`.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Read the docs:**
   - [`CLAUDE.md`](./CLAUDE.md) — Development guidelines and coding standards
   - [`prd.md`](./prd.md) — Product requirements and roadmap
   - [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Historical architectural decisions

2. **Follow TDD:**
   - Write failing tests first
   - Implement minimum code to pass
   - Refactor while keeping tests green

3. **Code Quality:**
   - Run `just ci` before pushing (must pass)
   - Follow Rust and TypeScript linting rules
   - Maintain 85% test coverage minimum

4. **Commit Convention:**

   ```
   <type>(<scope>): <description>
   ```

   Types: `feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`

5. **Pull Request:**
   - Ensure all CI checks pass
   - Update documentation if needed
   - Follow the project's coding standards

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

**Made with ❤️ for API developers who value privacy, performance, and intelligence.**
