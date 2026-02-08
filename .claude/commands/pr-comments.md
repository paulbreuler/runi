# PR Comments

Fetch, review, address, and resolve PR review comments using the automated helper script.

## Instructions for Claude

When this command is invoked:

1. **Get current PR and List comments**: Use the helper script to list unresolved threads.

   ```bash
   npx tsx scripts/helpers/pr-comments.ts list [pr_number]
   ```

2. **Analyze**: Categorize unresolved threads by file path and check for deleted files.

   ```bash
   npx tsx scripts/helpers/pr-comments.ts analyze [pr_number]
   ```

3. **Address**: Reply to comments using the script.

   ```bash
   npx tsx scripts/helpers/pr-comments.ts reply [pr_number] <comment_id> "Your reply message"
   ```

4. **Resolve**: Mark threads as resolved via the script (only after addressing and committing fixes).

   ```bash
   npx tsx scripts/helpers/pr-comments.ts resolve <thread_id>
   ```

## Standardized Helper Script

The repository includes a TypeScript helper at `scripts/helpers/pr-comments.ts` that encapsulates
GraphQL queries and state analysis. Always prefer this script over raw `gh` CLI commands
to ensure consistency.

### Usage Reference

| Task             | Command                                                        |
| :--------------- | :------------------------------------------------------------- |
| List Unresolved  | `npx tsx scripts/helpers/pr-comments.ts list`                  |
| Analyze Files    | `npx tsx scripts/helpers/pr-comments.ts analyze`               |
| Reply to Comment | `npx tsx scripts/helpers/pr-comments.ts reply <pr> <id> <msg>` |
| Resolve Thread   | `npx tsx scripts/helpers/pr-comments.ts resolve <id>`          |

## Workflow

### 1. Review & Analyze

Always start by listing and analyzing. This identifies which files need attention and which
comments might be outdated (e.g., file deleted).

### 2. Address Implementation

- **Before fixing**: For architecture/maintainability concerns, run `/code-review`.
- **Before fixing**: For security/MCP concerns, run `/review-mcp`.
- **After fixing**: Commit using conventional commits (e.g., `fix(ui): address feedback on UrlBar height`).

### 3. Communicate & Resolve

- Reply to each addressed comment with the fix description.
- Resolve the thread immediately after replying.

## Reply Templates

**Deleted file:**

> This file has been removed.
> [Brief explanation of why/what replaced it.]

**Addressed in code:**

> Fixed in [commit hash or description].

**Won't fix (with explanation):**

> This is intentional because [reason]. [Additional context if needed.]

**Outdated comment:**

> This has been addressed in subsequent commits.
> [Brief explanation of current state.]
