# PR Check Fixes

See [`CLAUDE.md`](../../CLAUDE.md#fixing-pr-check-failures) for the authoritative version of this command.
This file mirrors the high-level flow for quick reference.

## Instructions for Claude

When this command is invoked, you must:

1. **Resolve PR context:**
   - `gh pr view --json number,title,url,headRefName,baseRefName,statusCheckRollup`
   - If no PR exists, report and stop

2. **Summarize check status:**
   - List failed checks with URLs
   - Group by category: format, lint, type-check, build, test, coverage

3. **Reproduce locally (minimal first):**
   - Run the failing command first (from CI logs)
   - Use runi commands:
     - `just fmt-check` or `just fmt`
     - `just lint`
     - `just check`
     - `just test`
     - `just ci` (final gate)

4. **Fix iteratively:**
   - Apply the smallest change to resolve the failure
   - Re-run the failing command
   - Finish with `just ci`

5. **Optional review (after fixes, before commit):**
   - Use `/code-review` if changes are non-trivial

6. **Commit and push only if requested:**
   - **Commit message format**: Use conventional commits, reference the failing check:
     - `fix(ci): resolve linting errors in server.ts`
     - `fix(test): update test assertions for new API`
     - `fix(format): apply prettier formatting`
   - Use `/git-commit-best-practices` for detailed commit message guidance
   - **Commit scope**: Reference the package/component that was fixed
   - Push branch: `git push` (force push only if rebased: `git push --force-with-lease`)
   - Re-check PR status: `gh pr checks` or view PR in browser

## Notes

- Do not use scripts from other repositories
- Keep fixes scoped to the failing checks
- If fixes introduce new failures, resolve them iteratively
- Never paste secrets or credentials into CI logs or comments
