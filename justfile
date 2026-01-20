
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

# Lint TypeScript/React
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

# Type check TypeScript/React
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
ci: fmt-check lint check test
    @echo "✅ All CI checks passed!"

# Run CI pipeline without tests (for documentation-only changes)
ci-no-test: fmt-check lint check
    @echo "✅ CI checks passed (tests skipped for documentation-only changes)!"

# Pre-commit hook: fast checks only
pre-commit: fmt-check-rust fmt-check-frontend check-frontend
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

# Heal and improve Ralph files using a Claude-guided prompt
heal-ralph *args:
    @bash scripts/heal-ralph.sh {{ args }}

# ============================================================================
# 🧹 Cleanup
# ============================================================================

# Clean build artifacts
clean:
    cd src-tauri && cargo clean
    rm -rf node_modules/.vite
    rm -rf build
    rm -rf dist

# Remove all ralph session files and reset circuit breaker
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
    @ralph --reset-circuit || true
    @echo "✅ All ralph session files removed and circuit breaker reset"

# ============================================================================
# 📚 Documentation
# ============================================================================

# Generate Rust documentation
docs:
    cd src-tauri && cargo doc --no-deps --open

# List all TDD plans in runi-planning-docs repository
list-plans:
    @bash scripts/list-plans.sh

# Smart orchestration - detects plan from last PR and suggests actions
work:
    @bash scripts/work.sh

# Auto-heal plan with auto-detection
heal:
    @bash scripts/heal-plan.sh --auto

# Auto-heal specific plan
heal-plan plan-name:
    @bash scripts/heal-plan.sh --plan "{{plan-name}}"

# Select and run next best agent task from a plan
run plan-name:
    @bash scripts/run-agent.sh --plan "{{plan-name}}"

# Select next task without running (shows selection only)
next-task plan-name:
    @bash scripts/next-task.sh --plan "{{plan-name}}"

# Assess agent completion status for a plan
assess-agents plan-name:
    @bash scripts/assess-agent-status.sh --plan "{{plan-name}}" --all

# Run specific agent file
run-agent agent-path:
    @bash scripts/run-agent.sh --agent "{{agent-path}}"

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
    @echo "  just heal-ralph      - Heal/improve Ralph files with prompt"
    @echo "  just clean-ralph     - Remove all ralph session files"
    @echo ""
    @echo "Cleanup:"
    @echo "  just clean         - Clean build artifacts"
    @echo ""
    @echo "Documentation:"
    @echo "  just docs          - Generate Rust documentation"
    @echo ""
    @echo "Planning:"
    @echo "  just list-plans    - List all TDD plans in runi-planning-docs"
    @echo "  just work          - Smart orchestration (detects plan, suggests actions)"
    @echo "  just run <plan>    - Select and run next best agent task"
    @echo "  just next-task <plan> - Select next task (no run)"
    @echo "  just assess-agents <plan> - Assess agent completion status"
    @echo "  just run-agent <path> - Run specific agent file"
    @echo "  just heal          - Auto-heal plan (auto-detects from PR)"
    @echo "  just heal-plan <plan> - Auto-heal specific plan"
    @echo ""
    @echo "For a full list of commands: just list"
