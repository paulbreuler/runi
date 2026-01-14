# Pull Request Generation

Generate a comprehensive PR description from staged changes or recent commits.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Analyze git changes:**
   - Check `git status` for staged changes
   - If no staged changes, analyze recent commits (`git log`)
   - Use `git diff` to understand what changed
2. **Generate PR description:**
   - Summary of changes
   - Test plan
   - Breaking changes (if any)
   - Related issues
   - Conventional commit format
3. **Format for GitHub:**
   - Use markdown formatting
   - Include code references where helpful
   - Add checkboxes for review checklist
4. **Suggest commit message:**
   - Follow conventional commits format
   - Format: `<type>(<scope>): <description>`

## What This Does

This command generates a comprehensive PR description that includes:

- **Summary:** Clear description of what changed and why
- **Changes:** List of modified files with brief descriptions
- **Testing:** Test plan and coverage information
- **Breaking Changes:** Any breaking changes with migration guide
- **Related Issues:** Links to related issues or discussions
- **Checklist:** Review checklist for maintainers

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

1. Analyze git changes
2. Generate PR description
3. Suggest commit message
4. Display formatted output ready for GitHub

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

After code review, use `/pr` to generate PR description:

1. Run `/code-review` to review changes
2. Fix any issues
3. Run `/pr` to generate PR description
4. Copy to GitHub PR

## Related Commands

- `/code-review` - Review code before creating PR
- `just ci` - Run CI checks before PR
- `git commit` - Commit with generated message

## Notes

- **Conventional Commits:** All commit messages follow conventional format
- **Test Coverage:** PR includes coverage information
- **Breaking Changes:** Clearly marked with migration guide
- **Review Checklist:** Helps maintainers review efficiently
