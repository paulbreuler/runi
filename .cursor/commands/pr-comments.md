# PR Comments

Get all comments from a PR, address them as needed, and resolve comments to ensure loop closure.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Get PR comments:**
   - Identify the current PR (check git branch, GitHub CLI, or user input)
   - **If PR doesn't exist:** Inform user and suggest creating PR first with `/pr` command
   - Fetch all comments from the PR (review comments, thread comments, general comments)
   - Organize comments by file and line number where applicable
   - Categorize comments (suggestions, questions, approvals, requested changes)

2. **Address comments:**
   - Review each comment for actionable items
   - Make code changes to address suggestions and requested changes
   - Answer questions in comments (either by code changes or by adding explanatory comments)
   - Test changes to ensure they address the comment concerns

3. **Resolve comments:**
   - Mark comments as resolved on the PR
   - Add replies to comments explaining how they were addressed
   - Ensure all actionable comments are either addressed or acknowledged
   - Verify loop closure (no unresolved comments requiring action)

## What This Does

This command helps manage the PR review feedback loop:

- **Fetch Comments:** Retrieves all comments from the PR (code review, general, inline)
- **Address Feedback:** Makes code changes to respond to review comments
- **Resolve Comments:** Marks comments as resolved and replies to reviewers
- **Loop Closure:** Ensures all review feedback is properly addressed and closed

## Usage

### In Cursor Chat

Type `/pr-comments` to get and address PR comments:

```text
/pr-comments
```

Get comments for a specific PR:

```text
/pr-comments --pr 123
```

Get comments and auto-address:

```text
/pr-comments --address
```

**When invoked, this command will:**

1. Fetch all comments from the PR
2. Display organized list of comments
3. Address actionable comments (if `--address` flag is used)
4. Mark comments as resolved
5. Report on completion status

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "PR: Get Comments" or "PR: Address Comments"
3. Optionally specify PR number

## Comment Types

### Code Review Comments

- **Inline comments:** Comments on specific lines of code
- **File comments:** General comments on a file
- **Review comments:** Overall review feedback

### Comment Categories

- **Suggestions:** Code improvements recommended by reviewers
- **Questions:** Clarifications requested
- **Blocking issues:** Must-fix items before merge
- **Approvals:** Positive feedback, no action needed

## Workflow

1. **Fetch Comments:**

   ```
   /pr-comments
   ```

   - Lists all comments organized by file
   - Shows comment status (new, addressed, resolved)
   - Highlights blocking issues

2. **Address Comments:**

   ```
   /pr-comments --address
   ```

   - Reviews each actionable comment
   - Makes code changes to address suggestions
   - Tests changes locally
   - Commits fixes with descriptive messages

3. **Resolve Comments:**

   ```
   /pr-comments --resolve
   ```

   - Marks comments as resolved on GitHub
   - Adds replies explaining how comments were addressed
   - Ensures all feedback is acknowledged

## Integration with GitHub

This command works with:

- **GitHub CLI (`gh`):** For fetching and resolving comments
- **GitHub API:** Direct API access if CLI unavailable
- **Git remotes:** To identify PR from current branch

## Examples

### Get All Comments

```text
/pr-comments
```

Fetches and displays all comments from the current PR.

### Address Specific Comment

```text
/pr-comments --comment 456
```

Addresses a specific comment by ID.

### Auto-Address and Resolve

```text
/pr-comments --address --resolve
```

Fetches comments, addresses them with code changes, and marks them as resolved.

## Related Commands

- `/pr` - Generate PR description
- `/code-review` - Review code before creating PR
- `just ci` - Run CI checks before addressing comments

## Error Handling

### PR Not Found

If no PR exists for the current branch:

- Inform user that PR doesn't exist yet
- Suggest creating PR first: `/pr` command to generate PR description
- Exit gracefully with helpful message

### GitHub CLI Not Available

If GitHub CLI is not installed or not authenticated:

- Use GitHub API directly (if GitHub token is available)
- Provide fallback: manual instructions for viewing comments
- Guide user to install/authenticate GitHub CLI

## Notes

- **GitHub CLI:** Requires `gh` CLI tool installed and authenticated
- **Comment Resolution:** Only the PR author or reviewers can resolve comments
- **Loop Closure:** All blocking comments must be addressed before merge
- **Test Changes:** Always test changes locally before marking comments as resolved
- **PR Required:** PR must exist before fetching comments - use `/pr` to create PR first
