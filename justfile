# runi Workspace - Build and Test Automation
# Requires: just (https://github.com/casey/just)
# Install: cargo install just

# Show common commands
default:
    @just help

# Show all commands
list:
    @just --list

# ============================================================================
# 🚀 Quick Start
# ============================================================================

# Install all development dependencies
install:
    npm install
    cd src-tauri && cargo fetch

# Start development server
dev:
    npm run tauri dev

# ============================================================================
# 🛠️ Development
# ============================================================================

# Build for production
build:
    npm run tauri build

# Build frontend only (required for Rust compilation)
build-frontend:
    npm run build

# ============================================================================
# 📦 Dependencies
# ============================================================================

# Update all dependencies
update:
    npm update
    cd src-tauri && cargo update

# ============================================================================
# 🎨 Code Quality: Formatting
# ============================================================================

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

# ============================================================================
# 🔍 Code Quality: Linting
# ============================================================================

# Run all linters (same as CI)
lint: lint-rust lint-frontend

# Lint Rust with pedantic clippy (requires frontend build for Tauri context)
lint-rust: build-frontend
    cd src-tauri && cargo clippy --workspace --all-targets --all-features -- -D warnings

# Lint TypeScript/Svelte
lint-frontend:
    npm run lint

# ============================================================================
# ✅ Code Quality: Type Checking
# ============================================================================

# Run all type checks (same as CI)
check: check-rust check-frontend

# Type check Rust (requires frontend build for Tauri context)
check-rust: build-frontend
    cd src-tauri && cargo check --workspace --all-targets

# Type check TypeScript/Svelte
check-frontend:
    npm run check

# ============================================================================
# 🧪 Testing
# ============================================================================

# Run all tests (same as CI)
test: test-rust test-frontend

# Run Rust tests (requires frontend build for Tauri context)
test-rust: build-frontend
    cd src-tauri && cargo test --workspace

# Run frontend tests
test-frontend:
    npm run test -- --run

# ============================================================================
# 🔄 CI Pipeline
# ============================================================================

# Run complete CI pipeline locally (use before pushing)
ci: fmt-check lint check test
    @echo "✅ All CI checks passed!"

# Pre-commit hook: fast checks only
pre-commit: fmt-check-rust fmt-check-frontend check-frontend
    @echo "✅ Pre-commit checks passed!"

# ============================================================================
# 🧹 Cleanup
# ============================================================================

# Clean build artifacts
clean:
    cd src-tauri && cargo clean
    rm -rf node_modules/.vite
    rm -rf build
    rm -rf .svelte-kit

# Remove all ralph session files
clean-ralph:
    rm -f .call_count
    rm -f .circuit_breaker_history
    rm -f .circuit_breaker_state
    rm -f .claude_session_id
    rm -f .exit_signals
    rm -f .last_reset
    rm -f .ralph_session
    rm -f .ralph_session_history
    rm -f .response_analysis
    rm -f progress.json
    rm -f status.json
    @echo "✅ All ralph session files removed"

# ============================================================================
# 📚 Documentation
# ============================================================================

# Generate Rust documentation
docs:
    cd src-tauri && cargo doc --no-deps --open

# ============================================================================
# 📖 Help
# ============================================================================

# Show help and common commands
help:
    @echo "🔌 runi - Your API Development Partner"
    @echo "======================================"
    @echo ""
    @echo "Quick Start:"
    @echo "  just install       - Install all dependencies"
    @echo "  just dev           - Start the development server"
    @echo ""
    @echo "Development:"
    @echo "  just dev           - Start Tauri development server"
    @echo "  just build         - Build for production"
    @echo "  just build-frontend - Build frontend only"
    @echo ""
    @echo "Code Quality:"
    @echo "  just fmt           - Fix all formatting"
    @echo "  just fmt-check     - Check all formatting"
    @echo "  just lint          - Run all linters"
    @echo "  just check         - Run all type checks"
    @echo "  just ci            - Run complete CI pipeline"
    @echo ""
    @echo "Testing:"
    @echo "  just test          - Run all tests"
    @echo "  just test-rust     - Run Rust tests only"
    @echo "  just test-frontend - Run frontend tests only"
    @echo ""
    @echo "Cleanup:"
    @echo "  just clean         - Clean build artifacts"
    @echo "  just clean-ralph   - Remove all ralph session files"
    @echo ""
    @echo "Documentation:"
    @echo "  just docs          - Generate Rust documentation"
    @echo ""
    @echo "For a full list of commands: just list"
