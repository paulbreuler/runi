# Code Review

Perform a comprehensive code review following runi's quality standards and best practices.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Gather context** about what to review:
   - If the user specifies files/directories, review those
   - If no files specified, review staged changes (`git diff --cached`) or recent changes
   - Check `git status` to understand the current state

2. **Run automated quality checks** in parallel:
   - `just fmt-check` - Check formatting (should pass)
   - `just lint` - Check linting (should pass)
   - `just check` - Check type checking (should pass)
   - `just test` - Run tests (iteration)
   - `just ci` - Final gate (required)
   - Check test coverage if available

3. **Review code against runi's standards**:

   **Rust Code (src-tauri/):**
   - ✅ Pedantic Clippy compliance (no warnings allowed)
   - ✅ All public items have doc comments
   - ✅ Proper error handling (Result<T, String> for Tauri commands)
   - ✅ No unsafe code
   - ✅ Follows rustfmt.toml formatting (100 char width, 4 spaces, etc.)
   - ✅ Test coverage ≥85% for new code
   - ✅ Unit tests adjacent to source files
   - ✅ Idiomatic Rust patterns (use field init shorthand, try shorthand, etc.)

   **React/TypeScript Code (src/):**
   - ✅ Strict TypeScript compliance (no `any`, explicit return types)
   - ✅ React 19 functional components with hooks
   - ✅ All functions have explicit return types
   - ✅ Component props typed with interfaces
   - ✅ Follows ESLint strict config (no implicit any, strict boolean expressions)
   - ✅ Follows Prettier formatting (100 char width, single quotes, etc.)
   - ✅ Test coverage ≥85% for new code
   - ✅ Component tests use vitest with @testing-library/react
   - ✅ TDD workflow followed (tests written first)
   - ✅ **Test selectors**: Components include `data-test-id` attributes on interactive elements and test targets
   - ✅ **Test queries**: Tests use `getByTestId` for element selection (not `getByText`, `getByRole`, or `getByLabel` for component identification)
   - ✅ Zustand for global state (not Redux, not Context for shared state)
   - ✅ Motion 12 for animations (import from `motion/react`)

   **General Standards:**
   - ✅ Test-Driven Development (TDD) - tests written before implementation
   - ✅ All tests passing (100% pass rate required)
   - ✅ Storybook stories for React components (where applicable)
   - ✅ Conventional commit messages (feat, fix, test, refactor, docs, style, chore)
   - ✅ No warnings in CI
   - ✅ Security considerations (OWASP-inspired for API requests)
   - ✅ Privacy-first (no telemetry, local-first data storage)

4. **Provide structured feedback** organized by category:
   - **Critical Issues** (must fix before merge)
   - **Quality Issues** (should fix - style, documentation, test coverage)
   - **Architectural Violations** (must fix - hardcoded layouts, tight coupling, missing event bus usage)
   - **Architectural Improvements** (should fix - container/presentational separation, dependency injection, configuration-driven)
   - **Testing Gaps** (missing unit, integration, E2E, migration, or performance tests, or missing `data-test-id` attributes)
   - **Suggestions** (nice to have - optimizations, improvements)
   - **Security Concerns** (auth patterns, data handling, API security)
   - **Performance** (potential bottlenecks, inefficiencies, missing performance tests for data-heavy features)
   - **Breaking Changes** (missing migration guide for overhauls)

5. **Reference specific lines** using code references format:

   ```text
   startLine:endLine:filepath
   // code snippet
   ```

6. **Check project-specific patterns**:
   - Component organization (Layout/, Request/, Response/, Intelligence/, ui/)
   - Naming conventions (PascalCase for components, camelCase for utils/stores)
   - Tauri command patterns (async, Result<T, String>)
   - React 19 patterns (functional components, hooks, TypeScript)
   - Zustand store patterns (`use<Name>Store` naming)
   - Motion 12 animations (import from `motion/react`)

## Review Checklist

### Pre-Review Setup

- [ ] Identify files to review (staged changes, specified files, or recent commits)
- [ ] Run `just fmt-check` - formatting must pass
- [ ] Run `just lint` - linting must pass (pedantic for Rust, strict for TS)
- [ ] Run `just check` - type checking must pass
- [ ] Run `just test` - all tests must pass
- [ ] Run `just ci` - final gate before merge
- [ ] Check test coverage (target: ≥85%)

### Code Quality

- [ ] **Rust**: No Clippy warnings (pedantic mode)
- [ ] **Rust**: All public items documented
- [ ] **Rust**: Proper error handling (Result types, no panics)
- [ ] **TypeScript**: Strict mode compliance (no `any`, explicit types)
- [ ] **TypeScript**: All functions have return types
- [ ] **React**: Functional components with hooks
- [ ] **React**: Component props typed with interfaces
- [ ] **Formatting**: Follows rustfmt.toml / Prettier config
- [ ] **Naming**: Follows conventions (PascalCase components, camelCase utils)

### Testing

- [ ] **TDD**: Tests written before implementation (RED → GREEN → REFACTOR)
- [ ] **Coverage**: New code has ≥85% test coverage
- [ ] **Tests Pass**: 100% pass rate (no exceptions)
- [ ] **Test Quality**: Tests are meaningful and cover edge cases
- [ ] **Unit Tests**: All new code has unit test coverage
- [ ] **Integration Tests**: Multi-component interactions tested (if applicable)
- [ ] **E2E Tests**: User-facing features and complex interactions tested with Playwright
- [ ] **Migration Tests**: For overhauls that change data structures - backward compatibility and data integrity validated
- [ ] **Performance Tests**: For data-heavy features - thresholds validated (e.g., render 1000 rows in <500ms)
- [ ] **Test Selectors**: Components include `data-test-id` attributes on interactive elements and test targets
- [ ] **Test Queries**: Tests use `getByTestId` for element selection (not generic selectors for component identification)
- [ ] **Storybook**: Component stories created (for UI components)

### Architecture & Patterns

**Cross-Cutting Patterns** (see `.cursorrules` for details):

- [ ] **Event-Driven**: Cross-component communication uses event bus, not direct calls
- [ ] **Loose Coupling**: Components don't depend on specific layouts/positions
- [ ] **Configuration-Driven**: Layout positions are configurable, not hardcoded (e.g., sidebar position in store)
- [ ] **Unidirectional Flow**: State flows down, events flow up (no circular dependencies)
- [ ] **MCP-Ready**: AI-driven changes use event bus (events emitted, components subscribe)
- [ ] **Testable Contracts**: Components have clear, mockable interfaces (props, events)
- [ ] **Ports & Adapters**: Core logic isolated from UI/infrastructure

**Frontend Patterns** (React/TypeScript in `src/`):

- [ ] **Component Organization**: Files in correct directories (Layout/, Request/, Response/, ui/)
- [ ] **Container/Presentational**: Clear separation of logic (containers) from rendering (presentational)
- [ ] **Dependency Injection**: Dependencies injected, not imported directly
- [ ] **React Patterns**: Functional components, hooks, proper state management
- [ ] **Zustand**: Global state in stores, local state with useState
- [ ] **Motion 12**: Animations import from `motion/react`
- [ ] **Composition**: Components composed, not inherited or deeply nested

**Backend Patterns** (Rust/Tauri in `src-tauri/`):

- [ ] **Tauri Commands**: Async, Result<T, String>, proper error handling
- [ ] **Dependency Injection**: Dependencies via traits, not concrete types
- [ ] **Ports & Adapters**: Domain logic isolated from infrastructure

### Security & Privacy

- [ ] **No Telemetry**: No external analytics or tracking
- [ ] **Local-First**: Data stored locally, no cloud sync
- [ ] **API Security**: Auth headers over HTTPS, OWASP-inspired validation
- [ ] **Error Handling**: No sensitive data leaked in error messages
- [ ] **Input Validation**: Proper validation of user inputs

### Documentation

- [ ] **Rust Docs**: All public items have doc comments
- [ ] **Code Comments**: Complex logic explained
- [ ] **Commit Messages**: Follow conventional commits format
- [ ] **PR Description**: Clear summary and test plan (if applicable)
- [ ] **Breaking Changes**: For overhauls - migration guide documented with backward compatibility considerations

## Review Output Format

Structure your review like this:

```markdown
## Code Review Summary

**Files Reviewed:** [list of files]
**Automated Checks:** ✅ Passing | ❌ Failing
**Test Coverage:** [percentage]% (target: ≥85%)
**Overall Status:** CODE REVIEW COMPLED: ✅ Approve | ⚠️ Needs Changes | ❌ Reject

### Critical Issues (Must Fix)

- [Issue description with code reference]
  \`\`\`startLine:endLine:filepath
  // problematic code
  \`\`\`
  **Fix:** [suggested fix]

### Architectural Violations (Must Fix)

- [Hardcoded layout positions, tight coupling, missing event bus usage]
  \`\`\`startLine:endLine:filepath
  // problematic code
  \`\`\`
  **Fix:** [suggested fix - see .cursorrules for patterns]

### Quality Issues (Should Fix)

- [Issue description with code reference]
  **Fix:** [suggested fix]

### Architectural Improvements (Should Fix)

- [Container/presentational separation, dependency injection, configuration-driven]
  **Fix:** [suggested improvement - see .cursorrules for patterns]

### Suggestions (Nice to Have)

- [Suggestion description]

### Security Concerns

- [Security issue description]

### Performance

- [Performance concern description]

### Positive Highlights

- [What's done well]
```

## Usage

### In Cursor Chat

Type `/code-review` to review staged changes:

```text
/code-review
```

Or specify files/directories to review:

```text
/code-review src/components/Request/
```

Review specific files:

```text
/code-review src/utils/url.ts src-tauri/src/commands/http.rs
```

Review recent commits:

```text
/code-review --commits HEAD~3..HEAD
```

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Code Review"
3. Optionally specify files/directories

## Automated Checks

This command runs the same checks as CI:

```bash
# Formatting (must pass)
just fmt-check

# Linting (must pass - pedantic for Rust, strict for TS)
just lint

# Type checking (must pass)
just check

# Tests (must pass - 100% pass rate)
just test
just ci

# Coverage (target: ≥85%)
cd src-tauri && cargo tarpaulin --out Html
pnpm test:coverage
```

## Examples

### Review Staged Changes

```text
/code-review
```

Reviews all staged changes before commit.

### Review Specific Feature

```text
/code-review src/components/Request/
```

Reviews all files in the Request component directory.

### Review Rust Command

```text
/code-review src-tauri/src/commands/http.rs
```

Reviews a specific Rust command file.

### Review After Implementing Feature

```text
/code-review --diff main
```

Reviews all changes compared to main branch.

## Project Standards Reference

- **CLAUDE.md** - Project conventions and standards
- **.cursorrules** - Core architectural patterns (event-driven, loose coupling, MCP integration)
- **justfile** - CI pipeline commands
- **rustfmt.toml** - Rust formatting rules
- **clippy.toml** - Rust linting rules
- **eslint.config.js** - TypeScript/React linting rules
- **tsconfig.json** - TypeScript strict mode config
- **.prettierrc** - Prettier formatting rules

## Important Notes

- **Zero Tolerance**: No warnings allowed in CI - all must be fixed
- **TDD Required**: Tests must be written before implementation
- **Coverage Minimum**: 85% test coverage for new code
- **Pedantic Standards**: Rust uses pedantic Clippy, TypeScript uses strict mode
- **Documentation**: All public items must be documented (Rust)
- **Type Safety**: No `any` types in TypeScript, explicit return types required
- **React 19**: Functional components with hooks only (no class components)
- **Zustand**: Use for global state, useState for local state
- **Motion 12**: Import from `motion/react`, not `framer-motion`

## Related Commands

- `/pr` - Create pull request after review passes
- `just ci` - Run full CI pipeline locally
- `just fmt` - Fix formatting issues
- `just lint` - Check for linting issues
- `just test` - Run tests (iteration)
- `just ci` - Full CI gate (required final run)
