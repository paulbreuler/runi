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
    npm run test -- --run

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
    rm -rf .svelte-kit

# Update dependencies
update:
    npm update
    cd src-tauri && cargo update

# Generate Rust documentation
docs:
    cd src-tauri && cargo doc --no-deps --open
