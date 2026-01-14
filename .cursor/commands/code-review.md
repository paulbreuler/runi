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
   - `just test` - Run tests (should pass)
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

   **Svelte/TypeScript Code (src/):**
   - ✅ Strict TypeScript compliance (no `any`, explicit return types)
   - ✅ Svelte 5 runes usage (`$state`, `$derived`, `$props`, `$effect`)
   - ✅ All functions have explicit return types
   - ✅ Component props typed with interfaces
   - ✅ Follows ESLint strict config (no implicit any, strict boolean expressions)
   - ✅ Follows Prettier formatting (100 char width, single quotes, etc.)
   - ✅ Test coverage ≥85% for new code
   - ✅ Component tests use vitest with happy-dom/jsdom
   - ✅ TDD workflow followed (tests written first)

   **General Standards:**
   - ✅ Test-Driven Development (TDD) - tests written before implementation
   - ✅ All tests passing (100% pass rate required)
   - ✅ Storybook stories for Svelte components (where applicable)
   - ✅ Conventional commit messages (feat, fix, test, refactor, docs, style, chore)
   - ✅ No warnings in CI
   - ✅ Security considerations (OWASP-inspired for API requests)
   - ✅ Privacy-first (no telemetry, local-first data storage)

4. **Provide structured feedback** organized by category:
   - **Critical Issues** (must fix before merge)
   - **Quality Issues** (should fix - style, documentation, test coverage)
   - **Suggestions** (nice to have - optimizations, improvements)
   - **Security Concerns** (auth patterns, data handling, API security)
   - **Performance** (potential bottlenecks, inefficiencies)

5. **Reference specific lines** using code references format:

   ```text
   startLine:endLine:filepath
   // code snippet
   ```

6. **Check project-specific patterns**:
   - Component organization (Layout/, Request/, Response/, ui/)
   - Naming conventions (PascalCase for components, camelCase for utils/stores)
   - Tauri command patterns (async, Result<T, String>)
   - Svelte 5 runes patterns (no stores for state, use runes)
   - paneforge usage for resizable panes
   - shadcn-svelte components for UI

## Review Checklist

### Pre-Review Setup

- [ ] Identify files to review (staged changes, specified files, or recent commits)
- [ ] Run `just fmt-check` - formatting must pass
- [ ] Run `just lint` - linting must pass (pedantic for Rust, strict for TS)
- [ ] Run `just check` - type checking must pass
- [ ] Run `just test` - all tests must pass
- [ ] Check test coverage (target: ≥85%)

### Code Quality

- [ ] **Rust**: No Clippy warnings (pedantic mode)
- [ ] **Rust**: All public items documented
- [ ] **Rust**: Proper error handling (Result types, no panics)
- [ ] **TypeScript**: Strict mode compliance (no `any`, explicit types)
- [ ] **TypeScript**: All functions have return types
- [ ] **Svelte**: Using runes (`$state`, `$derived`, `$props`) not stores
- [ ] **Svelte**: Component props typed with interfaces
- [ ] **Formatting**: Follows rustfmt.toml / Prettier config
- [ ] **Naming**: Follows conventions (PascalCase components, camelCase utils)

### Testing

- [ ] **TDD**: Tests written before implementation (RED → GREEN → REFACTOR)
- [ ] **Coverage**: New code has ≥85% test coverage
- [ ] **Tests Pass**: 100% pass rate (no exceptions)
- [ ] **Test Quality**: Tests are meaningful and cover edge cases
- [ ] **Storybook**: Component stories created (for UI components)

### Architecture & Patterns

- [ ] **Component Organization**: Files in correct directories (Layout/, Request/, Response/, ui/)
- [ ] **Tauri Commands**: Async, Result<T, String>, proper error handling
- [ ] **Svelte Patterns**: Runes usage, proper reactivity
- [ ] **UI Components**: shadcn-svelte for base components
- [ ] **Resizable Panes**: paneforge for split panes

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

## Review Output Format

Structure your review like this:

```markdown
## Code Review Summary

**Files Reviewed:** [list of files]
**Automated Checks:** ✅ Passing | ❌ Failing
**Test Coverage:** [percentage]% (target: ≥85%)
**Overall Status:** ✅ Approve | ⚠️ Needs Changes | ❌ Reject

### Critical Issues (Must Fix)

- [Issue description with code reference]
  \`\`\`startLine:endLine:filepath
  // problematic code
  \`\`\`
  **Fix:** [suggested fix]

### Quality Issues (Should Fix)

- [Issue description with code reference]
  **Fix:** [suggested fix]

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
/code-review src/lib/components/Request/
```

Review specific files:

```text
/code-review src/lib/api/http.ts src-tauri/src/commands/http.rs
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

# Coverage (target: ≥85%)
cd src-tauri && cargo tarpaulin --out Html
npm run test:coverage
```

## Examples

### Review Staged Changes

```text
/code-review
```

Reviews all staged changes before commit.

### Review Specific Feature

```text
/code-review src/lib/components/Request/
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
- **justfile** - CI pipeline commands
- **rustfmt.toml** - Rust formatting rules
- **clippy.toml** - Rust linting rules
- **eslint.config.js** - TypeScript/Svelte linting rules
- **tsconfig.json** - TypeScript strict mode config
- **.prettierrc** - Prettier formatting rules

## Important Notes

- **Zero Tolerance**: No warnings allowed in CI - all must be fixed
- **TDD Required**: Tests must be written before implementation
- **Coverage Minimum**: 85% test coverage for new code
- **Pedantic Standards**: Rust uses pedantic Clippy, TypeScript uses strict mode
- **Documentation**: All public items must be documented (Rust)
- **Type Safety**: No `any` types in TypeScript, explicit return types required
- **Runes Only**: Svelte 5 runes required - no legacy stores for state

## Related Commands

- `/pr` - Create pull request after review passes
- `just ci` - Run full CI pipeline locally
- `just fmt` - Fix formatting issues
- `just lint` - Check for linting issues
- `just test` - Run tests
