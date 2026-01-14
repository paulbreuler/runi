# Pull Request Creation

Create a pull request on GitHub with a comprehensive description from staged changes or recent commits.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Check prerequisites:**
   - Verify current branch is not main/master
   - Check if branch is pushed to remote (`git push --dry-run`)
   - Verify GitHub CLI is available (`gh --version`)
   - Check if PR already exists (`gh pr view`)

2. **Analyze git changes:**
   - Get current branch name
   - Determine base branch (default: main/master)
   - Use `git log` to get commits since base branch
   - Use `git diff` to understand what changed
   - Count files changed and lines changed

3. **Generate PR description (in memory, NO files):**
   - Summary of changes
   - Detailed changes list
   - Test plan
   - Breaking changes (if any)
   - Related issues (if mentioned in commits)
   - Review checklist
   - Use markdown formatting
   - Include code references where helpful

4. **Create PR on GitHub:**
   - Push branch if not already pushed (`git push -u origin <branch>`)
   - Use `gh pr create` with generated description
   - Set base branch correctly
   - Use conventional commit format for title
   - Display PR URL when created

5. **Handle errors gracefully:**
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

## Changes

- [File/Component] - Description of change
- [File/Component] - Description of change

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Coverage: [percentage]% (target: ≥85%)

## Breaking Changes

None (or description of breaking changes with migration guide)

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

**Examples:**

```
feat(http): add request timeout configuration
fix(ui): resolve header tab overflow on small screens
test(auth): add bearer token validation tests
refactor(commands): extract HTTP client to separate module
```

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
   - New tests added
   - Coverage percentage
   - Test quality

4. **Documentation:**
   - Doc comments added
   - README updates
   - Decision log updates

## Examples

### PR from Staged Changes

```text
/pr
```

Analyzes staged changes and generates PR description.

### PR from Recent Commits

```text
/pr --commits HEAD~3..HEAD
```

Analyzes last 3 commits and generates PR description.

### PR Comparing Branches

```text
/pr --base main
```

Compares current branch with main and generates PR description.

## Integration with Code Review

After code review, use `/pr` to create the PR:

1. Run `/code-review` to review changes
2. Fix any issues
3. Run `/pr` to create PR on GitHub (description auto-generated)

## Error Handling

### PR Already Exists

If a PR already exists for the current branch:

- Show existing PR URL
- Suggest using `/pr-comments` to manage PR comments
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

## Related Commands

- `/code-review` - Review code before creating PR
- `/pr-comments` - Get and address PR comments
- `just ci` - Run CI checks before PR
- `git commit` - Commit changes before creating PR

## Notes

- **No Files Created:** Description is generated in memory and passed directly to GitHub CLI
- **Conventional Commits:** PR title follows conventional commit format
- **Test Coverage:** PR includes coverage information
- **Breaking Changes:** Clearly marked with migration guide
- **Review Checklist:** Helps maintainers review efficiently
- **GitHub CLI Required:** This command uses `gh pr create` to actually create the PR
