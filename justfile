
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
# Note: Requires MOTION_PLUS_TOKEN environment variable
# Usage: source .env && just install
# Or: MOTION_PLUS_TOKEN=your_token just install
install:
    node scripts/setup-motion-plus.js
    npm ci --legacy-peer-deps
    cd src-tauri && cargo fetch

# Start development server
dev:
    TAURI_CLI_WATCHER_IGNORE_FILENAME=.gitignore npm run tauri dev

# ============================================================================
# 🛠️ Development
# ============================================================================

# Build for production
# Unset CI if it's set to a numeric value (Tauri expects boolean true/false)
build:
    @bash -c 'if [ "$CI" = "1" ] || [ "$CI" = "0" ]; then env -u CI npm run tauri build; else npm run tauri build; fi'

# Build frontend only (required for Rust compilation)
# Uses npx as fallback if vite isn't available (doesn't require motion-plus)
build-frontend:
    @bash -c 'if [ -f "node_modules/.bin/vite" ]; then npm run build; else echo "📦 Using npx vite (motion-plus not required)..."; npx vite build; fi'

# Measure startup time of release bundle
measure-startup:
    @bash scripts/measure-startup.sh

# Generate TypeScript types from Rust structs (ts-rs)
generate-types:
    @echo "🔄 Generating TypeScript types from Rust..."
    cd src-tauri && TS_RS_EXPORT_DIR="./bindings" cargo test --quiet
    mkdir -p src/types/generated
    cp src-tauri/bindings/*.ts src/types/generated/
    @echo "✅ Types generated in src/types/generated/"

# ============================================================================
# 📦 Dependencies
# ============================================================================

# Ensure dependencies are installed (check and install if needed)
# Checks if node_modules exists and key dependencies are present
# If missing or incomplete, attempts full install via 'just install' using token injection
# Uses the existing token injection system (setup-motion-plus.js) which:
# - Reads MOTION_PLUS_TOKEN from .env or environment
# - Injects token into package.json (never committed)
# - Runs npm ci to install dependencies
# Note: If token not available, individual commands use npx fallback for tools that don't need motion-plus
ensure-deps:
    @bash -c 'if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then echo "📦 Installing dependencies (requires MOTION_PLUS_TOKEN)..."; if [ -f ".env" ]; then export $(grep -v "^#" .env | xargs) && just install; elif [ -n "$MOTION_PLUS_TOKEN" ]; then just install; else echo "⚠️  MOTION_PLUS_TOKEN not set - some commands will use npx fallback"; fi; fi'

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
# Note: Release-please managed files (src-tauri/tauri.conf.json, package.json) are excluded via .prettierignore
# Uses npx as fallback if prettier isn't available (doesn't require motion-plus)
fmt-check-frontend:
    @bash -c 'if [ -f "node_modules/.bin/prettier" ]; then npm run format:check; else echo "📦 Using npx prettier (motion-plus not required)..."; npx prettier --check .; fi'

# Fix all formatting
fmt: fmt-rust fmt-frontend

# Fix Rust formatting
fmt-rust:
    cd src-tauri && cargo fmt

# Fix frontend formatting
# Uses npx as fallback if prettier isn't available (doesn't require motion-plus)
fmt-frontend:
    @bash -c 'if [ -f "node_modules/.bin/prettier" ]; then npm run format; else echo "📦 Using npx prettier (motion-plus not required)..."; npx prettier --write .; fi'

# ============================================================================
# 🔍 Code Quality: Linting
# ============================================================================

# Run all linters (same as CI)
lint: lint-rust lint-frontend lint-markdown

# Lint Rust with pedantic clippy (requires frontend build for Tauri context)
lint-rust: build-frontend
    cd src-tauri && cargo clippy --workspace --all-targets --all-features -- -D warnings

# Lint TypeScript/React
lint-frontend: ensure-deps
    npm run lint

# Lint Markdown files (exclude files/directories in .gitignore)
# TODO: Remove || true once existing markdown files are fixed in a separate PR
# Currently non-blocking due to pre-existing lint errors in documentation files
lint-markdown:
    npx markdownlint "**/*.md" --ignore "node_modules" --ignore "test-results" --ignore "playwright-report" --ignore "coverage" --ignore "html" --ignore "build" --ignore "dist" --ignore "storybook-static" --ignore ".cursor/code-review-report.md" --ignore ".cursor/plans" --ignore ".tmp" --ignore "target" --ignore ".planning-docs" --ignore "CHANGELOG.md" --ignore "scripts/audit" || true

# ============================================================================
# ✅ Code Quality: Type Checking
# ============================================================================

# Run all type checks (same as CI)
check: check-rust check-frontend

# Type check Rust (requires frontend build for Tauri context)
check-rust: build-frontend
    cd src-tauri && cargo check --workspace --all-targets

# Type check TypeScript/React
check-frontend: ensure-deps
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
test-frontend: ensure-deps
    npm run test -- --run

# Run E2E tests (Playwright)
test-e2e:
    npx playwright test

# Install Playwright browsers (needed for CI)
test-e2e-install:
    npx playwright install --with-deps chromium

# ============================================================================
# 📚 Storybook
# ============================================================================

# Start Storybook development server (with hot reload for development)
storybook:
    npm run storybook

# Build static Storybook site (production build, no server)
storybook-build:
    npm run build-storybook

# Build and serve the final production Storybook site
# Use this to preview the production build locally (no hot reload, static files only)
# Differs from 'storybook' which is a dev server with hot reload
# Differs from 'storybook-build' which only builds without serving
storybook-serve: storybook-build
    npx serve storybook-static -p 6006

# ============================================================================
# 🔄 CI Pipeline
# ============================================================================

# Run complete CI pipeline locally (use before pushing)
# Runs tests in parallel: unit tests and E2E tests can run concurrently
ci: fmt-check lint check test test-e2e docs-check
    @echo "✅ All CI checks passed!"

# Run CI pipeline without tests (for documentation-only changes)
ci-no-test: fmt-check lint check docs-check
    @echo "✅ CI checks passed (tests skipped for documentation-only changes)!"

# Pre-commit hook: fast checks including type checking and linting
# Note: Rust checks require frontend build for Tauri context
pre-commit: build-frontend fmt-check-rust fmt-check-frontend lint-rust lint-frontend lint-markdown check-rust check-frontend
    @echo "✅ Pre-commit checks passed!"

# ============================================================================
# 📋 Ralph/Claude Normalization
# ============================================================================

# Normalize Ralph-related files (prompts, specs, fix plan)
# This ensures consistency across all documentation files
normalize-ralph:
    @bash scripts/normalize-ralph.sh

# Validate Ralph file consistency
validate-ralph:
    @echo "🔍 Validating Ralph file consistency..."
    @echo "Checking @fix_plan.md references..."
    @grep -q "VS Code\|horizontal split\|Request.*left.*Response.*right" @fix_plan.md || (echo "❌ @fix_plan.md missing layout updates" && exit 1)
    @echo "Checking specs/requirements.md references..."
    @grep -q "VS Code\|horizontal split\|Request.*left.*Response.*right" specs/requirements.md || (echo "❌ specs/requirements.md missing layout updates" && exit 1)
    @echo "Checking design principles..."
    @grep -q "hover:bg-muted\|subtle.*interactions\|high contrast" @fix_plan.md || (echo "⚠️  @fix_plan.md missing design principles" && exit 1)
    @echo "✅ Basic validation passed"


# ============================================================================
# 🧹 Cleanup
# ============================================================================

# Clean build artifacts
clean:
    cd src-tauri && cargo clean
    rm -rf node_modules/.vite
    rm -rf build
    rm -rf dist


# ============================================================================
# 📚 Documentation
# ============================================================================

# Check documentation formatting (same as CI docs-review)
# Prettier handles: formatting, trailing whitespace, line endings
docs-check:
    @echo "📚 Checking markdown formatting..."
    npx prettier --check "**/*.md" "docs/**/*.md" ".claude/**/*.md" ".storybook/**/*.md"

# Fix documentation formatting
docs-fix:
    @echo "📚 Fixing markdown formatting..."
    npx prettier --write "**/*.md" "docs/**/*.md" ".claude/**/*.md" ".storybook/**/*.md"
    @echo "✅ Documentation formatting fixed"

# Generate Rust documentation
docs:
    cd src-tauri && cargo doc --no-deps --open

# Auto-heal plan with auto-detection
heal:
    @bash scripts/heal-plan.sh --auto

# Auto-heal specific plan
heal-plan plan-name:
    @bash scripts/heal-plan.sh --plan "{{plan-name}}"

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
    @echo "  just test-e2e      - Run E2E tests (Playwright)"
    @echo ""
    @echo "Storybook:"
    @echo "  just storybook      - Start Storybook development server"
    @echo "  just storybook-build - Build static Storybook site"
    @echo "  just storybook-serve - Build and serve static Storybook"
    @echo ""
    @echo "Ralph/Claude:"
    @echo "  just normalize-ralph - Normalize Ralph documentation files"
    @echo "  just validate-ralph  - Validate Ralph file consistency"
    @echo ""
    @echo "Cleanup:"
    @echo "  just clean         - Clean build artifacts"
    @echo ""
    @echo "Documentation:"
    @echo "  just docs          - Generate Rust documentation"
    @echo "  just docs-check    - Check documentation formatting (same as CI)"
    @echo "  just docs-fix      - Fix documentation formatting issues"
    @echo ""
    @echo "Planning:"
    @echo "  just heal          - Auto-heal plan (auto-detects from PR)"
    @echo "  just heal-plan <plan> - Auto-heal specific plan"
    @echo ""
    @echo "For a full list of commands: just list"
