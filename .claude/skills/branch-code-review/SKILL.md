---
name: branch-code-review
description: Review changes on the current branch versus main for architecture, maintainability, and correctness. Use when you want a focused architecture/maintainability review separate from the comprehensive `/code-review` command.
argument-hint: '[scope | base..head]'
allowed-tools: Bash(git *), Read, Grep, Glob
---

# Branch Code Review (Architecture/Maintainability Focus)

## Purpose

Perform a focused code review on the current branch compared to the base branch (`main` by default),
emphasizing architecture, maintainability, and correctness patterns.

**When to use this vs. `/code-review`**:

- Use `/code-review` for comprehensive runi-specific standards review (TDD, coverage, test selectors, etc.)
- Use `/branch-code-review` for focused architecture/maintainability review (coupling, cohesion, patterns)

## Scope

- If `$ARGUMENTS` is provided, treat it as a scope (paths, diff range, or PR number).
- If no arguments are provided, review `base...HEAD` where `base` is detected (`origin/main` → `origin/master` fallback).

## Workflow

1. **Determine diff target**
   - Detect base branch:
     - `git symbolic-ref refs/remotes/origin/HEAD` → extract `main` or `master`.
     - If not available, try `origin/main`, then `origin/master`.
2. **Enumerate change surface**
   - `git diff --name-status base...HEAD`
   - `git log --oneline base...HEAD`
   - Read the diff before diving into code.
3. **Architecture pass**
   - Evaluate loose coupling, high cohesion, extensibility, and DRY.
   - Check module boundaries and whether responsibilities are clearly separated.
   - Verify event-driven architecture patterns (event bus usage).
   - Check configuration-driven layout (no hardcoded positions).
4. **Maintainability pass**
   - Keep files under ~500 lines unless necessary.
   - Names are descriptive; public names are concise; internal names can be verbose.
   - Comments explain _why_ for non-obvious logic; remove redundant comments.
   - Documentation is updated for behavior, usage, or interface changes.
5. **Correctness and safety**
   - Validate logic, edge cases, and error handling.
   - Look for regressions, config mismatches, or hidden coupling.
   - Check Rust error handling (Result types, no panics).
   - Verify React state management and side effects.
6. **Tests**
   - Ensure tests exist and are meaningful for the change surface.
   - Prefer tests that would fail on broken behavior.
   - Verify TDD workflow (tests written first).

## Best-Practice Signals (from authoritative guidance)

- Review design and interactions first; validate overall intent. (Google Eng Practices)
- Read every changed line in logical sequence; expand context if needed. (Google + Microsoft)
- Focus on correctness, readability/maintainability, and test quality. (Microsoft)
- Use structured checklists to avoid missing issues. (Atlassian)

## Repo-Specific Context

This repo follows architectural patterns from `.cursorrules`:

- **Event-Driven Architecture**: Cross-component communication via event bus
- **Loose Coupling**: Components don't depend on specific layout positions
- **Configuration-Driven**: Layout positions in state/store, not hardcoded
- **MCP Integration**: AI-driven UI via event bus events
- **Ports and Adapters**: Core logic isolated from UI/infrastructure
- **Unidirectional Data Flow**: State flows down, events flow up
- **Container/Presentational**: Clear separation of logic from rendering

**Tech Stack**:

- Frontend: React 19 + TypeScript 5.9 + Zustand + Motion 12
- Backend: Rust 1.80+ + Tauri v2.9.x
- Testing: Vitest + Playwright + Storybook

## Output Format

Follow the repo review style:

- Findings first, ordered by severity.
- Include file references and concrete evidence.
- If no issues, say so explicitly and list residual risks or testing gaps.

Use this structure:

```markdown
## Findings

- 🔴 Critical: ...
- 🟠 High: ...
- 🟡 Medium: ...
- 🟢 Low: ...

## Questions / Assumptions

- ...

## Tests

- Suggested: ...
```

## Notes

- Focus on runi-specific patterns: Tauri commands, React 19, Zustand stores, Motion animations
- Check for architectural violations (hardcoded layouts, tight coupling, missing event bus)
- Verify test coverage ≥85% for new code
- Ensure all public Rust items have doc comments
- Check TypeScript strict mode compliance (no `any`, explicit return types)
