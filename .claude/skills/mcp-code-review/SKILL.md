---
name: mcp-code-review
description: Review code for correctness, security, and LLM/MCP safety in this repo. Use when a code review, security review, or MCP/LLM audit is requested.
---

# MCP + LLM Code Review (runi)

## Purpose

Perform a security-focused, test-minded code review with emphasis on MCP tool usage, LLM safety, and performance risks in this repository.

**Note**: runi currently uses MCP tools (as a client) to access planning documents, but does not yet have its own MCP server implementation. This skill focuses on reviewing MCP tool usage in commands and preparing for future MCP server development.

## Scope

Use `$ARGUMENTS` as the scope (paths, diff range, PR number, or component name). If no scope is provided, review the current git diff.

## Workflow

1. **Establish context**
   - Read `CLAUDE.md` and relevant package docs.
   - Identify the target area (Tauri backend, React frontend, MCP tool usage in commands).
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
5. **MCP tool usage review** (Current focus - runi uses MCP tools, doesn't implement servers yet)
   - Review MCP tool calls in `.cursor/commands/*` for proper server name resolution
   - Validate tool arguments and path handling in command files
   - Check for proper error handling when MCP tools are unavailable
   - Verify RLM query code safety (only execute code you authored or reviewed)

- Review MCP server configuration in `.mcp.json` (repo root) for security

6. **Future MCP server review** (When runi implements its own MCP server)
   - Review tool schemas, argument validation, and permission boundaries
   - Identify prompt injection vectors and untrusted content handling
   - Check MCP server configuration and tool registration
7. **Correctness and reliability**
   - Look for logic errors, race conditions, and edge cases.
   - Validate Rust error handling (Result types, no panics).
   - Check React state management and side effects.
8. **Performance and cost**
   - Identify expensive operations, redundant work, or unbounded processing.
   - Check for memory leaks, unnecessary re-renders, or blocking operations.
9. **Tests**
   - Confirm coverage for new behavior and regression risk areas.
   - Verify TDD workflow followed (tests written first).

## Repo-Specific Risk Areas

Focus extra scrutiny on:

- `.cursor/commands/*` (MCP tool usage, RLM query safety, server name resolution)
- `src-tauri/src/commands/*` (Tauri command handlers, HTTP client, file operations)
- `src-tauri/src/intelligence/*` (AI provider integration, drift detection)
- `src/utils/*` (URL parsing, request building, data transformation)
- `.mcp.json` (repo root, MCP registry) and `.cursor/mcp.json` (Cursor overrides, if present)
- `src/stores/*` (Zustand stores, state management)
- `src/components/*` (React components handling user input or external data)

## MCP/LLM Security Checklist

**Current (MCP Tool Usage)**:

- Validate MCP tool arguments and path handling in command files
- Ensure RLM query code is only executed when authored or reviewed
- Check for proper error handling when MCP tools are unavailable
- Verify server name resolution from `.mcp.json` is correct
- Guard against path traversal in MCP tool path arguments
- Ensure user-controlled content doesn't become tool arguments without sanitization

**Future (MCP Server Implementation)**:

- Validate tool inputs and guard file paths against traversal
- Avoid executing untrusted code or shell commands without sandboxing
- Check for prompt injection via markdown, frontmatter, or external content
- Confirm tools/resources do not leak secrets or local paths
- Verify allowed-tools / permissions are least-privilege

**General**:

- Verify dependency integrity to reduce supply-chain risk:
  - Prefer `pnpm install --frozen-lockfile` and check lockfile integrity hashes
  - Flag suspicious name lookalikes or unexpected transitive packages
- Review Tauri command security:
  - All I/O commands must be async
  - Proper error handling (Result<T, String>)
  - No unsafe code blocks

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
