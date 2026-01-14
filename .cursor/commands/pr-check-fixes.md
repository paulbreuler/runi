# PR Check Fixes

Fetch PR checks for the current repository/branch, wait for the latest run if needed, and systematically fix failures using TDD with strict quality gates.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Identify current PR and repo context:**
   - Get current branch name (`git branch --show-current`)
   - Resolve PR for current branch via `gh pr view --json number,title,state,headRefName,baseRefName,url`
   - If no PR exists: inform user and suggest `/pr` first
   - Confirm repo/remote (`git remote -v`) for URLs/logs

2. **Pull latest check state (prefer most recent run):**
   - Fetch PR checks via `gh pr view <PR> --json statusCheckRollup,mergeStateStatus,reviewDecision`
   - If a commit was just pushed, fetch the **latest run** and verify it's for the newest head SHA
   - If the latest run is still in progress:
     - Wait with a short backoff (e.g., 10–20s) and re-check
     - Continue polling until completed or timeout (max 5–7 min)
   - If there are multiple runs, prioritize the run associated with the current head SHA

3. **Summarize status clearly:**
   - List each check with **name, status, conclusion, and URL**
   - Call out failures and skipped checks
   - Provide merge status (mergeable, mergeStateStatus)

4. **Triage failures methodically:**
   - For each failed check, open logs via `detailsUrl` and extract failing step + error output
   - Group by category: **format**, **lint**, **typecheck**, **tests**, **coverage**, **build**
   - If checks are missing or skipped, identify why and whether it's expected

5. **Fix with strict TDD + quality gates:**
   - Follow **RED → GREEN → REFACTOR** for each failure
   - Ensure coverage remains at or above project thresholds (≥85%)
   - Run the minimal local command to reproduce the failure before changes
   - Apply formatting and lint fixes (`just fmt`, `just pre-commit`) when relevant
   - Avoid unrelated refactors; fix only what's needed to make the check pass

6. **Validate fixes locally:**
   - **ALWAYS run `just ci` as the final validation** (not just `just test`)
   - Re-run the exact failing check command (or equivalent `just` command)
   - Confirm the specific failure is gone
   - Verify all checks pass locally before proceeding

7. **Report and update:**
   - Summarize what was fixed and what remains
   - If new commits are made, push and re-check CI status
   - If checks remain unstable, continue the loop until clean or blocked
   - Open browser/Chrome tools to validate website functionality, correct page source, and absence of console errors

## Best Practices (runi)

- **Never commit without tests passing**
- **Always run `just ci` as final gate** (includes formatting, linting, type checking, Rust tests, frontend tests, and E2E tests)
- **Always handle errors explicitly** (Rust + frontend)
- **No `any` in TypeScript**
- **Use Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$props`)
- **Use `@tauri-apps/api/core` (Tauri v2)**
- **Keep coverage ≥ 85%**
- **Prefer `just` commands** (CI and local parity)
- **Run Playwright/E2E tests** and validate in browser

## Commands Cheat Sheet

- Check PR + CI:
  - `gh pr view --json number,title,state,headRefName,baseRefName,url`
  - `gh pr view <PR> --json statusCheckRollup,mergeStateStatus,reviewDecision`
- Logs:
  - Use `detailsUrl` from `statusCheckRollup` or `gh run view <run-id> --log`
- Local verification:
  - `just pre-commit` - Fast checks before committing
  - `just test` - Run all tests (iteration)
  - `just ci` - **Full CI gate (required final run)** - includes formatting, linting, type checking, unit tests, and E2E tests
  - `just fmt` - Fix formatting

## Output Format

When you respond, include:

- **PR summary** (number, title, URL, head/base)
- **Check summary** (pass/fail/in progress with URLs)
- **Failure analysis** (root cause, file/function scope)
- **Fix plan** (commands + expected outcome)
- **Progress** (what you fixed, what's next)

## Error Handling

- **No PR found:** instruct user to create PR via `/pr`
- **No checks available:** verify PR exists and has a workflow run; otherwise wait for CI to start
- **Checks in progress:** poll until complete or ask user for permission to continue waiting
- **Network/TLS issues:** retry with full permissions or ask user to run `gh auth status`
- **Local test failures:** run `just ci` locally and fix all issues before pushing

## Quality Gates

The following must pass before considering fixes complete:

1. ✅ Formatting: `just fmt-check` or `just fmt`
2. ✅ Linting: `just lint` (Rust clippy + ESLint)
3. ✅ Type checking: `just check` (cargo check + TypeScript)
4. ✅ Unit tests: Rust tests + frontend tests
5. ✅ E2E tests: Playwright tests
6. ✅ Coverage: ≥85% (verify with coverage reports)
7. ✅ Browser validation: Open Chrome tools, validate functionality, page source, console errors

**Critical:** Always run `just ci` as the final validation step, which runs all of the above.

## TDD Workflow

For each failing check:

1. **RED:** Identify the failure (read logs, reproduce locally)
2. **GREEN:** Write minimal fix to make check pass
3. **REFACTOR:** Improve code while keeping tests green
4. **VALIDATE:** Run `just ci` to ensure nothing broke

Never skip tests or lower coverage thresholds. Fix root causes, not symptoms.
