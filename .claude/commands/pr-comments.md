# PR Comments

Fetch, review, address, and resolve PR review comments.

## Instructions for Claude

When this command is invoked:

1. **Get current PR**: Use `gh pr view --json number,url,headRepositoryOwner,headRepository` to get PR context
2. **List comments**: Fetch unresolved review threads only (and the comments inside those threads)
3. **Categorize**: Group unresolved threads by file path, identify deleted files, and check outdated state
4. **Address**: Reply to comments with explanations
   - **Before fixing**: For architecture/maintainability concerns, run `/code-review` to understand impact
   - **Before fixing**: For security/MCP concerns, run `/review-mcp` to identify risks
   - **After fixing**: If fixes were made, commit using conventional commits (see CLAUDE.md commit conventions)
   - **Commit message**: Reference the comment/concern: `fix(component): address review feedback on error handling`
5. **Resolve**: Mark threads as resolved via GraphQL API (only after addressing and committing fixes)

## API Commands Reference

### List Unresolved Review Threads (GraphQL)

```bash
# Get unresolved threads with comment details
gh api graphql -f query='
query {
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr_number}) {
      reviewThreads(first: 100) {
        nodes {
          id
          path
          isResolved
          isOutdated
          comments(first: 20) {
            nodes {
              databaseId
              body
              createdAt
              url
              author { login }
            }
          }
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

### Reply to a Comment (REST)

```bash
# Reply to a specific comment
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -X POST \
  -f body="Your reply message here"

# Batch reply to multiple comments
comment_ids=(123 456 789)
for id in "${comment_ids[@]}"; do
  gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/$id/replies \
    -X POST \
    -f body="Reply message" \
    --silent
done
```

### Get Unresolved Review Threads (GraphQL)

```bash
# List all unresolved threads with their IDs and file paths
gh api graphql -f query='
query {
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr_number}) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          path
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | "\(.id)|\(.path)"'
```

### Resolve a Review Thread (GraphQL)

```bash
# Resolve a single thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "PRRT_xxx"}) {
    thread {
      isResolved
    }
  }
}'

# Batch resolve multiple threads
thread_ids=("PRRT_xxx" "PRRT_yyy" "PRRT_zzz")
for thread_id in "${thread_ids[@]}"; do
  gh api graphql -f query="
    mutation {
      resolveReviewThread(input: {threadId: \"$thread_id\"}) {
        thread {
          isResolved
        }
      }
    }
  " --silent
done
```

### Verify All Threads Resolved (GraphQL)

```bash
gh api graphql -f query='
query {
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr_number}) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
        }
      }
    }
  }
}' --jq '[.data.repository.pullRequest.reviewThreads.nodes[] | .isResolved] | {total: length, resolved: (map(select(. == true)) | length), unresolved: (map(select(. == false)) | length)}'
```

## Workflow

### 1. Analyze Comments

```bash
# Get PR number and repo info
pr_number=$(gh pr view --json number --jq '.number')
owner=$(gh pr view --json headRepositoryOwner --jq '.headRepositoryOwner.login')
repo=$(gh pr view --json headRepository --jq '.headRepository.name')

# Fetch unresolved review threads only
gh api graphql -f query='
query {
  repository(owner: "'$owner'", name: "'$repo'") {
    pullRequest(number: '$pr_number') {
      reviewThreads(first: 100) {
        nodes {
          id
          path
          isResolved
          isOutdated
          comments(first: 20) {
            nodes {
              databaseId
              body
              author { login }
              createdAt
              url
            }
          }
        }
      }
    }
  }
}' > /tmp/pr-unresolved-threads.json

# List unresolved thread counts by file
jq -r '.data.repository.pullRequest.reviewThreads.nodes[]
  | select(.isResolved == false)
  | .path' /tmp/pr-unresolved-threads.json | sort | uniq -c | sort -rn

# Check which unresolved thread files still exist
for file in $(jq -r '.data.repository.pullRequest.reviewThreads.nodes[]
  | select(.isResolved == false)
  | .path' /tmp/pr-unresolved-threads.json | sort -u); do
  if [ -f "$file" ]; then
    echo "EXISTS: $file"
  else
    echo "DELETED: $file"
  fi
done
```

### 2. Reply to Comments

For deleted files:

```bash
owner=$(gh pr view --json headRepositoryOwner --jq '.headRepositoryOwner.login')
repo=$(gh pr view --json headRepository --jq '.headRepository.name')
gh api repos/$owner/$repo/pulls/$pr_number/comments/{id}/replies \
  -X POST \
  -f body="This file has been removed in subsequent commits."
```

For addressed issues:

```bash
owner=$(gh pr view --json headRepositoryOwner --jq '.headRepositoryOwner.login')
repo=$(gh pr view --json headRepository --jq '.headRepository.name')
gh api repos/$owner/$repo/pulls/$pr_number/comments/{id}/replies \
  -X POST \
  -f body="Fixed in commit abc123." # or explanation of why it's not an issue
```

### 3. Resolve All Threads

```bash
# Get PR repo info
owner=$(gh pr view --json headRepositoryOwner --jq '.headRepositoryOwner.login')
repo=$(gh pr view --json headRepository --jq '.headRepository.name')

# Get all unresolved thread IDs
thread_ids=$(gh api graphql -f query='
query {
  repository(owner: "'$owner'", name: "'$repo'") {
    pullRequest(number: '$pr_number') {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
        }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id')

# Resolve each thread
for thread_id in $thread_ids; do
  gh api graphql -f query="
    mutation {
      resolveReviewThread(input: {threadId: \"$thread_id\"}) {
        thread { isResolved }
      }
    }
  " --silent
  echo "Resolved: $thread_id"
done
```

## Reply Templates

**Deleted file:**

> This file has been removed. [Brief explanation of why/what replaced it.]

**Addressed in code:**

> Fixed in [commit/change description].

**Won't fix (with explanation):**

> This is intentional because [reason]. [Additional context if needed.]

**Test/infrastructure code:**

> This is test infrastructure. Tests are passing - if issues arise, we can enhance then.

**Outdated comment:**

> This has been addressed in subsequent commits. [Brief explanation of current state.]

## Notes

- Always reply before resolving so reviewers understand why
- Group similar comments and batch process them
- Default to unresolved threads only; do not bulk-fetch all PR comments unless needed as fallback
- Check if files still exist before addressing implementation concerns
- Use `--silent` flag when batch processing to reduce noise
- **Commit fixes**: When addressing comments with code changes, use conventional commits (see `/git-commit-best-practices`)
- **Breaking changes**: If comment addresses breaking change concerns, ensure `BREAKING CHANGE:` footer is in commit message
