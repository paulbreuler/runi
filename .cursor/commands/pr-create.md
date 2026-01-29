# Pull Request Creation

Create a pull request on GitHub with a comprehensive description from staged changes or recent commits.

## LLM Execution Rules

- Resolve the MCP server name from `.cursor/mcp.json` before calling tools.
- Do not create files for PR descriptions; generate in memory only.
- Never include secrets or credentials in PR bodies or comments.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Check prerequisites:**
   - Verify current branch is not main
   - Check if branch is pushed (`git push --dry-run`)
   - Verify GitHub CLI is available (`gh --version`)
   - Check if PR already exists (`gh pr view`)

2. **Optional code reviews (recommended before PR creation):**
   - General review: run `/code-review` or invoke `/branch-code-review` skill if changes are non-trivial
   - MCP/LLM review: run `/review-mcp` or invoke `/mcp-code-review` skill if MCP/LLM tools or security-critical areas changed

3. **Detect plan/agent context (if applicable):**
   - Use limps MCP tools when available:
     - `list_plans`, `list_agents`, `get_plan_status`, `process_doc`
   - If a plan is inferred (modified files under `plans/`, branch/commit context), locate the agent file
   - Extract agent title, feature list, and GitHub issue numbers from the agent file

4. **Analyze git changes:**
   - Detect base branch:
     - `git symbolic-ref refs/remotes/origin/HEAD` → extract branch name
     - Fallback: `origin/main`, then `origin/master`
   - Use `git log <base>..HEAD` and `git diff --stat <base>..HEAD`
   - If no commits exist, analyze `git diff --cached`

5. **Optional commit review (recommended):**
   - Review commits: `git log --format="%H%n%s%n%b%n---" <base>..HEAD`
   - Invoke `/git-commit-best-practices review-commits` to validate commit message quality
   - Check for conventional commit format, atomic commits, and clear messages
   - **If issues found**: Present findings and ask user if they want to:
     - Amend commits before creating PR (recommended), OR
     - Proceed with PR creation anyway (issues will be noted in PR description)
   - **Detect breaking changes**: Search commit messages for `BREAKING CHANGE:` footer:
     - `git log --format=%B main..HEAD | grep -i "BREAKING CHANGE"` or parse commit bodies
     - Extract breaking change descriptions for PR description

6. **Generate PR description (in memory only):**
   - Summary, Changes, Tests
   - Code review status (if run)
   - Breaking changes (extract `BREAKING CHANGE:` footers)
   - Plan/Agent context (if detected)
   - Related issues: `Closes #<feature-subissues>` only (do not close parent agent issue)

7. **Create PR on GitHub:**
   - Push branch if needed (`git push -u origin <branch>`)
   - Use `gh pr create` with title/body
   - PR title follows conventional commits, preferring the most significant change type

8. **Handle errors gracefully:**
   - If PR already exists: show URL and stop
   - If `gh` missing: show install/auth instructions
   - If no changes: report and stop

**CRITICAL: Do not create any files. Pass the PR body directly to `gh pr create`.**

## What This Does

This command creates a pull request on GitHub with:

- **Summary:** Clear description of what changed and why
- **Changes:** List of modified files with brief descriptions
- **Testing:** Test plan and coverage information
- **Breaking Changes:** Any breaking changes with migration guide
- **Related Issues:** Links to related issues (from commit messages)
- **Checklist:** Review checklist for maintainers
- **PR Creation:** Actually creates the PR on GitHub (doesn't just generate description)

## Usage

### In Cursor Chat

Type `/pr` to generate PR from staged changes:

```text
/pr
```

Generate PR from recent commits:

```text
/pr --commits HEAD~3..HEAD
```

Generate PR for specific branch:

```text
/pr --base main
```

**When invoked, this command will:**

1. Check prerequisites (branch, GitHub CLI, existing PR)
2. Analyze git changes
3. Generate PR description (in memory)
4. Push branch if needed
5. Create PR on GitHub using `gh pr create`
6. Display PR URL

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "PR: Generate Description"
3. Optionally specify commits or base branch

## PR Description Template

The generated PR follows this structure:

```markdown
## Summary
- ...

## Changes
- ...

## Tests
- ...

## Code Review
- General review: [✅ Passed | ⚠️ Issues found | Not run] (via `/code-review` or `/branch-code-review` skill)
- MCP/LLM review: [✅ Passed | ⚠️ Issues found | Not run] (via `/review-mcp` or `/mcp-code-review` skill)
- Commit review: [✅ Passed | ⚠️ Issues found | Not run] (via `/git-commit-best-practices review-commits` skill)

## Breaking Changes
- [If any commits contain `BREAKING CHANGE:` footer, list them]
- [Include migration notes if applicable]

## Notes / Risks
- ...

## Plan / Agent (if applicable)
- Plan: <plan-name>
- Agent: <agent-title> (<agent-file>)
- Related issues: Closes #<feature-subissue>, #<feature-subissue>
```

## PR Title Format

PR titles follow conventional commit format, with agent context when available:

**With Agent Detected:**

```
feat(<scope>): <agent-name> - <primary-feature-description>
```

**Without Agent (Fallback):**

```
<type>(<scope>): <description>
```

**Examples with Agent:**

```
feat(accessibility): implement keyboard navigation, ARIA attributes, and focus management for DataGrid
feat(datagrid): add status and timing columns with color coding
feat(datagrid): implement selection and expander columns
```

**Examples without Agent:**

```
feat(http): add request timeout configuration
fix(ui): resolve header tab overflow on small screens
test(auth): add bearer token validation tests
refactor(commands): extract HTTP client to separate module
```

## Commit Message Format

Generated commit messages follow conventional commits. For detailed guidance, use `/git-commit-best-practices` skill.

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding tests
- `refactor`: Code refactoring
- `docs`: Documentation
- `style`: Formatting (no code change)
- `chore`: Maintenance

**For detailed commit message guidance**, invoke `/git-commit-best-practices` skill with:
- No arguments: Guide for staged changes
- `review-commits`: Review existing commits in a range
- Commit range: Review specific commits (e.g., `HEAD~5..HEAD`)

## Analysis Process

The command analyzes:

1. **File Changes:**
   - Added files
   - Modified files
   - Deleted files
   - Renamed files

2. **Code Changes:**
   - New features
   - Bug fixes
   - Refactoring
   - Test additions

3. **Test Coverage:**
   - New tests added (unit, integration, E2E, migration if applicable, performance if applicable)
   - Coverage percentage
   - Test quality
   - Migration test results (for overhauls)
   - Performance test results with thresholds (for data-heavy features)

4. **Documentation:**
   - Doc comments added
   - README updates
   - Decision log updates

## Examples

### PR from Staged Changes (with Agent Detection)

```text
/pr
```

Uses `npx limps next-task` to detect agent from git context (branch name, commit messages, modified files), then generates PR description with agent context.

**Example Output:**

- If agent detected: Title includes agent name and features
- If no agent: Standard PR title based on code changes

### PR from Recent Commits

```text
/pr --commits HEAD~3..HEAD
```

Same as above - uses `npx limps next-task` to detect agent from commit context.

### PR Comparing Branches

```text
/pr --base main
```

Same as above - uses `npx limps next-task` to detect agent from branch context.

### Agent Detection Examples

Agent detection examples:

- Branch: `feat/datagrid/agent_0_accessibility` → Detects plan and agent from branch name
- Commit: `feat(datagrid): add status column` → Detects agent from commit context and modified files
- Modified files: Changes to agent files → Detects agent from file paths

### Agent Status Validation Example

**Scenario:** Agent 0 has all features complete but hasn't been closed

When `/pr` is run, it displays an informational message (see [Agent Status Validation Info](#agent-status-validation-info) in Error Handling section) and proceeds automatically with PR creation.

## Integration with Code Review

After code review, use `/pr` to create the PR:

1. Run `/code-review` to review changes
2. Fix any issues
3. Run `/pr` to create PR on GitHub (description auto-generated)

## Error Handling

### PR Already Exists

If a PR already exists for the current branch:

- Show existing PR URL
- Suggest using `/pr-comments` to manage PR comments (see `CLAUDE.md` PR Workflow section)
- Exit gracefully

### GitHub CLI Not Available

If GitHub CLI is not installed or not authenticated:

- Show error message
- Provide instructions to install GitHub CLI
- Suggest alternative: generate description manually (but this command creates PR, not just description)

### Branch Not Pushed

If branch is not pushed to remote:

- Push branch automatically with `git push -u origin <branch>`
- Then create PR

### No Changes

If no commits exist since base branch:

- Inform user
- Suggest committing changes first

### Agent Detection Fails

If agent detection fails (no agent found):

- Continue with standard PR generation
- Use conventional commit format for title
- Note in description that this is non-agent work (optional)
- This is expected for work not part of a feature plan

### Agent Status Validation Info

If agent is detected and has all features PASS but isn't closed:

**Informational Message:**

```
ℹ️  Agent Status Info

Agent "Accessibility Foundation (Early)" has all features complete (4 PASS, 0 GAP)
but hasn't been moved to completed/ directory.

Note: Consider running `/close-feature-agent <agent-file-path>` after PR creation to:
  - Verify completion
  - Sync status to README.md
  - Move agent to completed/

PR creation proceeds automatically...
```

**Behavior:**

- Informational message is displayed (non-blocking)
- PR creation proceeds automatically
- Message includes actionable next steps for post-PR cleanup

## Related Commands

- `/code-review` - Review code before creating PR (comprehensive runi standards)
- `/branch-code-review` - Architecture/maintainability review (skill)
- `/review-mcp` or `/mcp-code-review` - MCP/LLM security review (skill)
- `/git-commit-best-practices` - Commit message guidance and review (skill)
- `/pr-comments` - Get and address PR comments (see `CLAUDE.md` PR Workflow section)
- `just ci` - Run CI checks before PR
- `git commit` - Commit changes before creating PR

## RLM Query Optimizations

### Agent Status Validation (Alternative to Limps CLI)

When MCP tools are available, RLM queries can be used as an alternative to `npx limps status`:

```javascript
// Validate agent status before PR creation
mcp_runi_Planning_rlm_query({
  path: 'plans/datagrid_overhaul_4a5b9879/agents/0_agent_accessibility_foundation_early.agent.md',
  code: `
    const features = extractFeatures(doc.content);
    return {
      agentName: extractFrontmatter(d.content).meta.name,
      allPass: features.every(f => f.status === 'PASS'),
      passCount: features.filter(f => f.status === 'PASS').length,
      gapCount: features.filter(f => f.status === 'GAP').length,
      wipCount: features.filter(f => f.status === 'WIP').length,
      features: features.map(f => ({
        number: f.number,
        name: f.name,
        status: f.status,
        tldr: f.tldr
      }))
    };
  `,
});
```

**Use when:** MCP tools are available and you need programmatic access to feature status for PR description auto-population.

### Component Design Principles Compliance

For PRs that modify components, check design principles compliance:

```javascript
// Check design principles compliance for modified components
mcp_runi_Planning_rlm_query({
  path: 'plans/0018-component-design-principles-audit/plan.md',
  code: `
    const modifiedComponents = ['Component1', 'Component2']; // from git diff
    const auditResults = extractSections(doc.content)
      .filter(s => modifiedComponents.some(c => s.title.includes(c)))
      .map(s => ({
        component: s.title,
        compliance: extractFeatures(s.content).every(f => f.status === 'PASS'),
        issues: extractFeatures(s.content).filter(f => f.status === 'GAP')
      }));
    return auditResults;
  `,
});
```

Include compliance status in PR description under "Testing" section.

### Multi-Agent Status Check

For plans with multiple agents, use RLM multi-query to check all agent statuses:

```javascript
// Get all agents with their feature status
mcp_runi_Planning_rlm_multi_query({
  pattern: 'plans/datagrid_overhaul_4a5b9879/agents/*.agent.md',
  code: `
    docs.map(d => {
      const features = extractFeatures(d.content);
      return {
        agentName: extractFrontmatter(d.content).meta.name,
        totalFeatures: features.length,
        passCount: features.filter(f => f.status === 'PASS').length,
        gapCount: features.filter(f => f.status === 'GAP').length,
        allPass: features.every(f => f.status === 'PASS')
      };
    })
  `,
});
```

## Notes

- **No Files Created:** Description is generated in memory and passed directly to GitHub CLI
- **Agent Detection:** Uses `npx limps next-task` to automatically detect agent/feature context from git (branch, commits, files) when working on feature plans
- **PR Title:** Matches feature being worked on when agent detected, falls back to conventional commit format
- **Conventional Commits:** PR title follows conventional commit format (with agent context when available)
- **Test Coverage:** PR includes coverage information (unit, integration, E2E, migration if applicable, performance if applicable)
- **Breaking Changes:** Clearly marked with migration guide (required for overhauls)
- **Migration Testing:** Overhauls must include migration test results
- **Performance Testing:** Data-heavy features must include performance test results with thresholds
- **Review Checklist:** Helps maintainers review efficiently
- **GitHub CLI Required:** This command uses `gh pr create` to actually create the PR
- **Graceful Fallback:** Works correctly even when no agent is detected (for non-agent work)
- **RLM Queries:** Use RLM queries for targeted planning document access (faster than reading full documents)
