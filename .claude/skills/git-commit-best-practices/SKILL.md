---
name: git-commit-best-practices
description: Guide for creating well-structured, meaningful Git commits following conventional commits and repository best practices. Use when creating commits, amending commit messages, or reviewing commit history.
argument-hint: '[scope | review-commits | commit-range]'
allowed-tools: Bash(git *), Read, Grep
---

# Git Commit Best Practices (runi)

## Purpose

Guide the creation of clear, meaningful Git commits that follow conventional commit standards and repository-specific conventions. Ensures commits are atomic, well-documented, and integrate with automated tooling (release-please, changelog generation).

## Scope

- If `$ARGUMENTS` is "review-commits" or a commit range (e.g., `HEAD~5..HEAD`, `main..HEAD`), review existing commits and suggest improvements.
- If `$ARGUMENTS` is a scope (paths or component), provide commit guidance for those changes.
- If no arguments provided, guide commit message creation for staged changes.

## Detecting Breaking Changes

When reviewing commits, detect breaking changes by:

1. **Parse commit messages**: `git log --format="%H%n%s%n%b" <range>` (includes full body)
2. **Search for footer**: Look for `BREAKING CHANGE:` or `BREAKING CHANGE` in commit body (case-insensitive)
3. **Extract description**: Everything after `BREAKING CHANGE:` until:
   - Next footer (e.g., `Closes #123`, `Fixes #456`)
   - End of commit message
   - Empty line followed by non-footer text
4. **Example commands**:
   - Simple: `git log --format=%B main..HEAD | grep -A 10 -i "BREAKING CHANGE"`
   - More robust: `git log --format="%H%n%s%n%b%n---" <range>` then parse each commit separately
5. **Edge cases**:
   - Multi-line breaking changes: Extract until next footer or end
   - Breaking change in subject: Look for `!` after type/scope: `feat!: breaking change`
   - Merge commits: Check merge commit message for breaking changes

## Conventional Commit Format

### Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature (triggers minor version bump)
- `fix`: Bug fix (triggers patch version bump)
- `docs`: Documentation changes only
- `style`: Code style changes (formatting, whitespace, no logic change)
- `refactor`: Code refactoring (no feature change or bug fix)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (deps, config, build)
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert a previous commit

### Scope (Optional but Recommended)

- **Single scope** (most common): Component area (`http`, `ui`, `datagrid`, `sidebar`, `tauri`, `commands`)
- **Multiple scopes**: Use comma-separated for cross-area changes: `feat(http,tauri): ...`
- **When to use multiple**: Only when change affects multiple areas in same commit
- **Area scopes**: `commands`, `skills`, `mcp`, `stores`, `components` (use when change is area-specific)

### Subject Line Rules

- **Imperative mood**: "add feature" not "added feature" or "adds feature"
- **Lowercase** (except proper nouns, acronyms)
- **No period** at the end
- **50 characters or less** (ideally)
- **Clear and specific**: Describe what the commit does, not why (why goes in body)

### Body (Optional but Recommended for Complex Changes)

- **Separated by blank line** from subject
- **72 characters per line** (wrap if needed)
- Explain **what** and **why** (not how - code shows how)
- Reference related issues, plans, or agents
- Note breaking changes if applicable

### Footer (Optional)

- **Breaking changes**: `BREAKING CHANGE: <description>`
- **Issue references**: `Closes #123`, `Fixes #456`, `Related to #789`
- **Plan/Agent references**: `Plan: 0018-component-design-principles-audit`, `Agent: 000`

## Examples

### Simple Feature

```
feat(http): add request timeout configuration

Adds timeout configuration to HTTP client, allowing users to set
per-request timeouts. Defaults to 30 seconds if not specified.

Related to plan 0004-datagrid-overhaul
```

### Bug Fix with Issue Reference

```
fix(ui): resolve header tab overflow on small screens

Previously, header tabs would overflow on screens < 768px. Now
uses horizontal scroll with gradient cues for better UX.

Fixes #42
```

### Breaking Change

```
refactor(tauri): restructure HTTP command API

BREAKING CHANGE: HTTP command signatures changed. All commands now
use async/await pattern. Update call sites to use await.

Migration guide: docs/migration/http-commands.md
```

### Multi-Area Change

```
feat(http,tauri): add request cancellation support

Adds cancellation token support to both frontend HTTP client and
Tauri backend commands. Users can cancel in-flight requests.

Plan: 0004-datagrid-overhaul
Agent: 002
```

### Documentation Only

```
docs: update CLAUDE.md with Storybook testing guidelines

Adds documentation for Storybook story creation, play functions,
and accessibility testing requirements.
```

## Atomic Commits

### Principles

- **One logical change per commit**: Each commit should represent a complete, working change
- **Buildable and testable**: Each commit should leave the repo in a valid state
- **Reviewable**: Changes should be grouped logically for code review

### When to Split Commits

- Different types of changes (e.g., refactor + feature)
- Unrelated files or subsystems
- Formatting/style changes separate from logic changes
- Test changes separate from implementation

### When to Combine Commits

- Related changes that depend on each other
- Small, related fixes in the same file
- Documentation updates that accompany code changes

## Repository-Specific Guidelines

### Tauri + React Stack

- **Specify area scope** when changes are area-specific: `feat(http): ...`, `fix(ui): ...`
- **Use root-level scope** for cross-area changes: `feat: ...` or `feat(http,tauri): ...`
- **Consider impact** on both frontend and backend

### Plan/Agent Integration

- **Reference plans/agents** in commit body when applicable:
  - `Plan: 0018-component-design-principles-audit`
  - `Agent: 000-infrastructure`
- **Use agent titles** in subject when committing agent work:
  - `feat(datagrid): implement keyboard navigation`
  - Body: `Agent: 000-accessibility-foundation`

### Release-Please Integration

- **Type matters**: `feat` → minor bump, `fix` → patch bump
- **Breaking changes**: Use `BREAKING CHANGE:` footer for major bumps
- **Scope helps**: Area-scoped commits help categorize changes

### Changelog Generation

- Commits with conventional format automatically appear in CHANGELOG.md
- Body content may be included in changelog entries
- Reference issues/PRs for better changelog links

## Workflow

### Before Committing

1. **Review staged changes**: `git diff --cached`
2. **Check for unrelated changes**: Split if needed
3. **Verify tests pass**: `just test` (runi uses `just` for commands)
4. **Check formatting**: `just fmt-check` (runi-specific command)

### Creating the Commit

1. **Determine type**: What kind of change is this?
2. **Identify scope**: Which area/component?
3. **Write subject**: Clear, imperative, concise
4. **Add body** (if needed): Explain context, why, related items
5. **Add footer** (if needed): Issues, breaking changes, plans

### After Committing

1. **Review commit**: `git log -1` to verify format
2. **Amend if needed**: `git commit --amend` (before pushing)

## Reviewing Commits

When reviewing commits (e.g., `review-commits` argument or commit range):

1. **Parse commits**: `git log --format="%H%n%s%n%b%n---" <range>` to get full commit messages
2. **Check format**: Does it follow conventional commits? (`<type>(<scope>): <subject>`)
3. **Evaluate atomicity**: Should this be split or combined?
4. **Assess clarity**: Is the message clear and informative?
5. **Verify completeness**: Does it reference related issues/plans?
6. **Check breaking changes**: Look for `BREAKING CHANGE:` footer or `!` in type
7. **Suggest improvements**: Provide specific recommendations with examples

### Review Output Format

When reviewing commits, use this structure:

```
## Commit Review: <commit-range>

### Summary

- Total commits: X
- Format compliance: Y compliant, Z need improvement
- Breaking changes: Found in commits [list]

### Findings by Commit

#### Commit <hash>: <subject>

- ✅ Format: Conventional commit format
- ⚠️ Issues: [if any]
- 🔴 Critical: [if any]
- Suggestions: [specific improvements]

### Overall Recommendations

- [Action items]
```

## Common Mistakes to Avoid

❌ **Too vague**: `fix: update code`  
✅ **Specific**: `fix(tauri): handle undefined config paths`

❌ **Past tense**: `feat: added new feature`  
✅ **Imperative**: `feat: add new feature`

❌ **Too long subject**: `feat(http): implement comprehensive request timeout configuration system with validation and error handling`  
✅ **Concise**: `feat(http): add request timeout configuration`

❌ **Multiple unrelated changes**: One commit with formatting + feature + test  
✅ **Separate commits**: One for formatting, one for feature, one for test

❌ **Missing context**: `fix: bug fix`  
✅ **With context**: `fix(ui): prevent header tab overflow on small screens`

## Output Format

When providing commit guidance:

```
## Suggested Commit Message

<type>(<scope>): <subject>

<body>

## Rationale

- Why this type/scope
- What makes it atomic
- Related items (issues, plans, agents)

## Checklist

- [ ] Subject is imperative and clear
- [ ] Scope is appropriate
- [ ] Body explains context (if needed)
- [ ] Footer references issues/plans (if applicable)
- [ ] Commit is atomic
- [ ] Tests pass
```

## Notes

- Prefer `git commit` with message over `-m` for complex commits (opens editor)
- Use `git commit --amend` to fix commit messages before pushing
- Use `git rebase -i` to clean up commit history (before pushing)
- Conventional commits enable automated tooling (release-please, changelog)
- Clear commits make code review and debugging easier
- **Merge commits**: Review merge commit messages; they should describe what's being merged
- **Squash commits**: When squashing, combine commit messages meaningfully
- **Revert commits**: Use `revert: <original-subject>` format: `revert: feat(http): add feature`
