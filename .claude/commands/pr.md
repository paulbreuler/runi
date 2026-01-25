# Pull Request Creation

Create a pull request on GitHub with a comprehensive description from staged changes or recent commits.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Check prerequisites:**
   - Verify current branch is not main
   - Check if branch is pushed to remote (`git push --dry-run`)
   - Verify GitHub CLI is available (`gh --version`)
   - Check if PR already exists (`gh pr view`)

2. **Detect active agent (if working with feature plan):**
   - Detect plan from git context using `scripts/detect-active-plan.sh`:
     - Analyzes last merged PR (files, title, branch name)
     - Extracts plan name from PR context
     - Falls back to recent file modifications if PR detection fails
   - Use `npx limps next-task <plan-id>` to get current task/agent file path
   - Note: `limps next-task` outputs the agent file path as the last line of output
   - If agent detected:
     - Extract agent file path and info from limps output
     - **Validate/Create GitHub issues** (CRITICAL - must exist before PR creation):
       - Check if agent issue exists in agent file (`**GitHub Issue**: #XXX`)
       - If missing, create issues using GitHub CLI:
         - Agent issue (parent) - represents the agent
         - Feature subissues (children) - one per feature using `gh sub-issue create`
       - Verify all feature subissues exist in agent file (`**GitHub Subissue**: #XXX` in each feature section)
       - If any subissues missing, create missing subissues
     - **Extract GitHub issue numbers** (NOT local feature numbers):
       - Agent issue number: From `**GitHub Issue**: #36` in agent file header
       - Feature subissue numbers: From `**GitHub Subissue**: #37` in each feature section
     - **DO NOT include local feature numbers** (#13, #14, #15) in PR body - these are planning references only, not GitHub issues (see note below)
     - Use agent context for PR title and description
     - **Use GitHub issues in PR**: Include `Closes #37, #38, #39` in PR description "Related Issues" section (feature subissues only, not agent issue)
   - If no agent detected:
     - Proceed with standard PR generation (non-agent work)

2a. **Validate agent status (if agent detected):**

- Use `npx limps status <plan-id>` to check agent status
- Parse status output to check:
  - If all features have status PASS/Complete (e.g., "4 PASS, 0 WIP, 0 GAP")
  - If agent file is still in `agents/` directory (File Organization: "active (in agents/)")
- If validation conditions met (all PASS + not completed):
  - Display informational message with agent name, feature counts, and recommendation
  - Note: Consider running `/close-feature-agent <agent-file-path>` after PR creation to clean up agent status
  - Proceed automatically with PR creation (non-blocking)
- If validation conditions not met or status check fails:
  - Proceed normally with PR creation (no warning)

1. **Analyze git changes:**
   - Get current branch name
   - Determine base branch (default: main/master)
   - Use `git log` to get commits since base branch
   - Use `git diff` to understand what changed
   - Count files changed and lines changed

2. **Generate PR description (in memory, NO files):**
   - **Related Issues section** (at top, if agent detected with feature subissues):
     - Use `Closes #37, #38, #39` for feature subissues (GitHub official method - automatically closes subissues when PR merges to default branch)
     - **Critical**: Only works when PR targets default branch (main/master)
     - **Note**: Don't close agent issue - only close feature subissues (agent issue is parent, subissues are children)
   - Summary of changes
   - Detailed changes list
   - Test plan
   - Breaking changes (if any)
   - **Related Agent section** (if agent detected):
     - Agent name
     - Plan name
     - Agent GitHub Issue: #36 (parent issue - for context, not closed by PR)
     - Feature Subissues: #37, #38, #39 (closed by PR)
     - Brief description from agent file TL;DR
     - **DO NOT include local feature numbers** (#13, #14, #15) - these are planning references, not GitHub issues (see note below)
   - Review checklist
   - Use markdown formatting
   - Include code references where helpful

3. **Create PR on GitHub:**
   - Push branch if not already pushed (`git push -u origin <branch>`)
   - Use `gh pr create` with generated description
   - Set base branch correctly
   - **Generate PR title:**
     - **If agent detected:** `feat(<scope>): <agent-name> - <primary-feature-description>`
     - **If no agent:** Use conventional commit format based on code analysis
   - Display PR URL when created

4. **Handle errors gracefully:**
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
Plan: [plan-name]
Agent Issue: #36 (parent issue - provides context, not closed by PR)
Feature Subissues: #37, #38, #39 (closed by this PR)

[Brief description from agent file TL;DR]

**Note**: Local feature numbers (#13, #14, #15) are planning references and are **never** included in PR body. Only GitHub issues (agent issue and feature subissues) are referenced. This applies throughout the PR description.

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
- [ ] **Design Principles**: Components follow DESIGN-PRINCIPLES.md criteria (see `mcp_runi_Planning_read_doc({ path: 'plans/0018-component-design-principles-audit/plan.md' })` for audit methodology)
- [ ] **Design Principles (RLM)**: For component-specific compliance, use `mcp_runi_Planning_rlm_query({ path: 'plans/0018-component-design-principles-audit/plan.md', code: "extractSections(doc.content).filter(s => s.title.includes('ComponentName')).flatMap(s => extractFeatures(s.content)).filter(f => f.status === 'GAP')" })` to check audit status (replace `'ComponentName'` with the actual component name being reviewed)
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

Closes #37, #38, #39 <!-- Feature subissues - will auto-close when PR merges to default branch -->

<!-- Agent Issue #36 is parent and provides context, but is not closed by this PR -->

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

- `/code-review` - Review code before creating PR
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
