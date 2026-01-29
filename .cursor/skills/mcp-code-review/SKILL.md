---
name: mcp-code-review
description: Review code for correctness, security, and LLM/MCP safety in this repo. Use when a code review, security review, or MCP/LLM audit is requested.
---
# MCP + LLM Code Review (runi)

## Purpose

Perform a security-focused, test-minded code review with emphasis on MCP servers, LLM safety, and performance risks in this repository.

## Scope

Use `$ARGUMENTS` as the scope (paths, diff range, PR number, or component name). If no scope is provided, review the current git diff.

## Workflow

1. **Establish context**
   - Read `CLAUDE.md` and relevant package docs.
   - Identify the target area (Tauri backend, React frontend, MCP tools).
2. **Threat intel + dependency hygiene**
   - Search authoritative sources for new MCP/LLM or supply-chain issues:
     - OWASP LLM Top 10, OWASP API Top 10, npm advisories, GitHub Security Advisories.
   - Audit npm dependencies (use repo scripts when available):
     - `pnpm audit` (runi uses pnpm)
     - Check for outdated or abandoned packages:
     - `pnpm outdated`
   - Inspect dependency tree for suspicious packages or name lookalikes:
     - `pnpm ls --all`
   - Verify lockfile integrity expectations:
     - Prefer `pnpm install --frozen-lockfile` for clean installs.
3. **Enumerate change surface**
   - List changed files and inspect diffs before diving into code.
4. **Security-first review**
   - Validate input handling, path safety, and external command usage.
   - Check for secret exposure (logs, errors, telemetry).
   - Review Tauri command security (async, proper error handling).
5. **MCP/LLM safety review**
   - Review tool schemas, argument validation, and permission boundaries.
   - Identify prompt injection vectors and untrusted content handling.
   - Check MCP server configuration and tool registration.
6. **Correctness and reliability**
   - Look for logic errors, race conditions, and edge cases.
   - Validate Rust error handling (Result types, no panics).
   - Check React state management and side effects.
7. **Performance and cost**
   - Identify expensive operations, redundant work, or unbounded processing.
   - Check for memory leaks, unnecessary re-renders, or blocking operations.
8. **Tests**
   - Confirm coverage for new behavior and regression risk areas.
   - Verify TDD workflow followed (tests written first).

## Repo-Specific Risk Areas

Focus extra scrutiny on:

- `src-tauri/src/commands/*` (Tauri command handlers, HTTP client, file operations)
- `src-tauri/src/intelligence/*` (AI provider integration, drift detection)
- `src/utils/*` (URL parsing, request building, data transformation)
- `.cursor/mcp.json` and MCP server configuration
- `src/stores/*` (Zustand stores, state management)
- `src/components/*` (React components handling user input or external data)

## MCP/LLM Security Checklist

- Validate tool inputs and guard file paths against traversal.
- Avoid executing untrusted code or shell commands without sandboxing.
- Ensure user-controlled content never becomes tool arguments without sanitization.
- Check for prompt injection via markdown, frontmatter, or external content.
- Confirm tools/resources do not leak secrets or local paths.
- Verify allowed-tools / permissions are least-privilege.
- Verify dependency integrity to reduce supply-chain risk:
  - Prefer `pnpm install --frozen-lockfile` and check lockfile integrity hashes.
  - Flag suspicious name lookalikes or unexpected transitive packages.
- Review Tauri command security:
  - All I/O commands must be async.
  - Proper error handling (Result<T, String>).
  - No unsafe code blocks.

## Output Format

Follow the repo review style:

- Findings first, ordered by severity.
- Include file references and concrete evidence.
- If no issues, say so explicitly and list residual risks or testing gaps.

Use this structure:

```
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

- Prefer `ReadFile`, `Grep`, `Glob` over shell tools for code inspection.
- Avoid speculative claims; cite code or call out uncertainty.
- Focus on runi-specific patterns: Tauri commands, React 19, Zustand stores, Motion animations.
