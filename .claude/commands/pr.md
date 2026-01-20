# Pull Request Creation

Create a pull request on GitHub with a comprehensive description from staged changes or recent commits.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Check prerequisites:**
   - Verify current branch is not main/master
   - Check if branch is pushed to remote (`git push --dry-run`)
   - Verify GitHub CLI is available (`gh --version`)
   - Check if PR already exists (`gh pr view`)

2. **Detect active agent (if working with feature plan):**
   - Run `bash scripts/detect-active-agent.sh --json` to detect agent from:
     - Branch name (e.g., `feat/datagrid/agent_0_accessibility`)
     - Recent commit messages (e.g., mentions "agent_2" or "Agent 2")
     - Modified files (e.g., changes to `agents/agent_4_*.agent.md`)
     - Recently modified agent files (fallback)
   - If agent detected:
     - Extract agent name, feature numbers, and TL;DR descriptions from agent file
     - Use agent context for PR title and description
   - If no agent detected:
     - Proceed with standard PR generation (non-agent work)

3. **Analyze git changes:**
   - Get current branch name
   - Determine base branch (default: main/master)
   - Use `git log` to get commits since base branch
   - Use `git diff` to understand what changed
   - Count files changed and lines changed

4. **Generate PR description (in memory, NO files):**
   - Summary of changes
   - Detailed changes list
   - Test plan
   - Breaking changes (if any)
   - Related issues (if mentioned in commits)
   - **Related Agent section** (if agent detected):
     - Agent name
     - Feature numbers
     - Plan name
     - Brief description from agent file TL;DR
   - Review checklist
   - Use markdown formatting
   - Include code references where helpful

5. **Create PR on GitHub:**
   - Push branch if not already pushed (`git push -u origin <branch>`)
   - Use `gh pr create` with generated description
   - Set base branch correctly
   - **Generate PR title:**
     - **If agent detected:** `feat(<scope>): <agent-name> - <primary-feature-description>`
     - **If no agent:** Use conventional commit format based on code analysis
   - Display PR URL when created

6. **Handle errors gracefully:**
   - If PR already exists: show existing PR URL
   - If GitHub CLI not available: show instructions
   - If branch not pushed: push first, then create PR
   - If no changes: inform user

**CRITICAL: DO NOT create any files (NO PR_DESCRIPTION.md or similar). Generate description in memory and pass directly to `gh pr create`.**

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

Brief description of what this PR does and why.

## Related Agent

_(Only included if agent detected)_

Working on: [Agent Name]
Features: #48, #49, #50
Plan: [plan-name]

[Brief description from agent file TL;DR]

## Changes

- [File/Component] - Description of change
- [File/Component] - Description of change

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass (if user-facing feature or complex interactions)
- [ ] Migration tests pass (if overhaul with data structure changes)
- [ ] Performance tests pass (if data-heavy feature, include thresholds)
- [ ] **Test selectors**: Components include `data-test-id` attributes on interactive elements
- [ ] **Test queries**: Tests use `getByTestId` for element selection (resilient to UI changes)
- [ ] Manual testing completed
- [ ] Coverage: [percentage]% (target: ≥85%)

## Breaking Changes

None (or description of breaking changes with migration guide)

**For Overhauls:** Must include:

- Explicit migration guide
- Backward compatibility considerations
- Migration test results
- Data integrity validation

## Related Issues

Closes #123
Related to #456

## Checklist

- [ ] Code follows runi's style guidelines
- [ ] Tests added/updated (TDD workflow)
- [ ] Documentation updated (if needed)
- [ ] `just ci` passes locally
- [ ] No warnings in CI
- [ ] CLAUDE.md decision log updated (if applicable)
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

Generated commit messages follow conventional commits:

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

Analyzes staged changes, detects agent if working on feature plan, and generates PR description with agent context.

**Example Output:**

- If agent detected: Title includes agent name and features
- If no agent: Standard PR title based on code changes

### PR from Recent Commits

```text
/pr --commits HEAD~3..HEAD
```

Analyzes last 3 commits, checks commit messages for agent references, and generates PR description.

### PR Comparing Branches

```text
/pr --base main
```

Compares current branch with main, detects agent from branch name or modified files, and generates PR description.

### Agent Detection Examples

**Branch Name Pattern:**

- Branch: `feat/datagrid/agent_0_accessibility` → Detects Agent 0 from datagrid plan
- Branch: `agent-2-status-timing` → Detects Agent 2

**Commit Message Pattern:**

- Commit: `feat(agent_2): add status column` → Detects Agent 2
- Commit: `Working on Agent 0 accessibility features` → Detects Agent 0

**Modified Files Pattern:**

- Modified: `../runi-planning-docs/plans/datagrid_overhaul_4a5b9879/agents/agent_4_selection__expander_columns.agent.md` → Detects Agent 4

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

## Related Commands

- `/code-review` - Review code before creating PR
- `/pr-comments` - Get and address PR comments (see `CLAUDE.md` PR Workflow section)
- `just ci` - Run CI checks before PR
- `git commit` - Commit changes before creating PR

## Notes

- **No Files Created:** Description is generated in memory and passed directly to GitHub CLI
- **Agent Detection:** Automatically detects agent/feature context when working on feature plans
- **PR Title:** Matches feature being worked on when agent detected, falls back to conventional commit format
- **Conventional Commits:** PR title follows conventional commit format (with agent context when available)
- **Test Coverage:** PR includes coverage information (unit, integration, E2E, migration if applicable, performance if applicable)
- **Breaking Changes:** Clearly marked with migration guide (required for overhauls)
- **Migration Testing:** Overhauls must include migration test results
- **Performance Testing:** Data-heavy features must include performance test results with thresholds
- **Review Checklist:** Helps maintainers review efficiently
- **GitHub CLI Required:** This command uses `gh pr create` to actually create the PR
- **Graceful Fallback:** Works correctly even when no agent is detected (for non-agent work)
