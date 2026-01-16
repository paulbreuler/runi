# PR Comments

Fetch, review, address, and resolve comments from a GitHub pull request.

## Instructions for Claude

Your task is to manage the PR comment review cycle: fetch comments, address feedback, and resolve threads with proper citations.

### Step 1: Fetch PR Information

```bash
# Get PR number and branch name
gh pr view --json number,headRefName

# Get repository owner and name (IMPORTANT: use this, not headRepository)
gh repo view --json owner,name

# Get PR-level comments
gh api /repos/{owner}/{repo}/issues/{number}/comments

# Get review comments (inline code comments)
gh api /repos/{owner}/{repo}/pulls/{number}/comments
```

### Step 2: Display Comments

Format comments for review:

````markdown
## Comments

### file.ts#line:

- @author:

  ```diff
  [diff_hunk from the API response]
  ```
````

> quoted comment text

- @reply_author (reply): > reply text
  >

````

If there are no comments, return "No comments found."

### Step 3: Triage Comments

For each comment, determine:

1. **Already resolved** - Comment was addressed in a subsequent commit
2. **Needs code change** - Feedback requires modifying code
3. **Needs clarification** - Question that can be answered with a citation
4. **Won't fix** - Valid feedback but intentionally not addressing (explain why)

### Step 4: Address Feedback

For comments requiring code changes:

1. Make the necessary code changes
2. Note the file and line numbers of the fix
3. Prepare a reply citing the fix

### Step 5: Resolve Comments

For each addressed comment, reply with a citation to the fix:

```bash
# Reply to a review comment with resolution
gh api /repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies \
  -f body="Fixed in \`file.ts:42-45\` - [description of change]"

# Or for PR-level comments
gh api /repos/{owner}/{repo}/issues/{number}/comments \
  -f body="Addressed in commit abc1234 - [description]"
````

**Reply format examples:**

- Code fix: `"Fixed in \`src/components/Button.tsx:23\` - removed unused import"`
- Multiple lines: `"Fixed in \`src/utils/api.ts:15-22\` - added error handling"`
- Already fixed: `"This was addressed in commit f9c0ed2 - see \`src/App.tsx:10\`"`
- Won't fix: `"Intentionally kept as-is because [reason]. See CLAUDE.md for rationale."`

### Step 6: Mark Threads as Resolved

After replying, resolve the thread if you have permission:

```bash
# Resolve a review thread (requires GraphQL)
gh api graphql -f query='
  mutation {
    resolveReviewThread(input: {threadId: "THREAD_NODE_ID"}) {
      thread { isResolved }
    }
  }
'
```

Note: Only PR author or users with write access can resolve threads.

## Acceptance Criteria

A comment review is complete when:

- [ ] All comments have been reviewed
- [ ] Code changes made for actionable feedback
- [ ] Each addressed comment has a reply with file:line citation
- [ ] Resolved threads are marked as resolved (where possible)
- [ ] Any "won't fix" items have clear explanations

## Example Workflow

1. Fetch comments: `gh api /repos/owner/repo/pulls/12/comments`
2. Review: "Unused import cn" on `AuthEditor.tsx:8`
3. Fix: Remove the unused import
4. Reply: `gh api .../comments/123/replies -f body="Fixed in \`AuthEditor.tsx:1-7\` - removed unused cn import"`
5. Resolve thread (if possible)

## Notes

- **Owner Discovery:** Always use `gh repo view --json owner,name` to get the correct repository owner.
- **Comment Threading:** Review comments have `in_reply_to_id` for replies. Use `node_id` for GraphQL operations.
- **Citations Matter:** Always cite specific file:line references so reviewers can verify fixes.
- **GitHub CLI Required:** Requires `gh` CLI tool installed and authenticated.
