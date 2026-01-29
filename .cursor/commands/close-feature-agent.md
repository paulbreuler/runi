# Close Feature Agent v2.0.0

Verify agent completion, sync status, and identify unblocked work.

## LLM Execution Rules

- Only operate on planning docs under `../runi-planning-docs/`.
- Do not modify source code in the main repo.
- If tests were not run, say so explicitly in the report.
- If the agent file path does not exist, stop and report the error.
- Resolve the MCP server name from `.mcp.json` (repo root) before calling tools.

## Invocation

```text
/close-feature-agent [path-to-agent-file]
```

Example:

```text
/close-feature-agent ../runi-planning-docs/plans/datagrid_overhaul_abc123/agents/columns.agent.md
```

## What This Command Does

1. **Verify completion** - Check agent delivered what was promised
2. **Sync status** - Update README.md status matrix
3. **Report unblocked** - Show what can now proceed
4. **Capture gotchas** - Ensure discoveries are in gotchas.md

## What This Command Does NOT Do

- Regenerate other agent files (use `update-feature-plan`)
- Modify source code
- Merge PRs
- Assign next work

## Workflow

### Step 1: Parse Agent File

Read the agent's `.agent.md` and extract:

- Feature IDs and their status
- Exported interfaces claimed
- Files that should exist
- Gotchas section

Use MCP planning tools (`read_doc` / `rlm_query`) when available to avoid manual file parsing.

### Step 2: Verify Completion

For each feature marked `PASS`:

**Check files exist**:

```text
- [ ] src/components/Column/ColumnHeader.tsx exists
- [ ] src/components/Column/ColumnHeader.test.tsx exists
- [ ] src/components/Column/ColumnHeader.stories.tsx exists
```

**Check exports match interface** (spot check):

```text
- [ ] useColumnHeader exports match declared signature
- [ ] ColumnHeader component exports match declared signature
```

**Check tests pass**:

```text
- [ ] `just test src/components/Column` passes
```

### Step 3: Sync Status

Update `README.md` status matrix:

Before:

```text
| 2 | Headers | Columns | 🔄 WIP | - |
| 3 | Resize | Columns | ❌ GAP | #2 |
```

After:

```text
| 2 | Headers | Columns | ✅ PASS | - |
| 3 | Resize | Columns | ✅ PASS | - |
```

Update dependency graph colors if present.

**Planning docs must be updated via MCP tools** using the server resolved from
`.mcp.json` (repo root).

### Step 4: Identify Unblocked

Check all features that were `BLOCKED` by completed features:

```markdown
## Newly Unblocked

| Feature             | Agent       | Was Blocked By | Status                   |
| ------------------- | ----------- | -------------- | ------------------------ |
| #5 Row Expand       | Rows        | #2 Headers     | Now GAP - ready to start |
| #7 Sort Integration | Integration | #4 Sorting     | Now GAP - ready to start |

**Next Steps**:

- Agent `rows.agent.md` can now proceed with #5
- Consider regenerating `rows.agent.md` if interfaces changed (use `update-plan`)
```

### Step 5: Gotchas Check

Verify any gotchas discovered during implementation are in `gotchas.md`:

```markdown
## Gotchas Sync

Found in agent file but NOT in gotchas.md:

- "ResizeObserver no-op in Storybook" - adding to gotchas.md

All gotchas synced ✓
```

## Output Format

The output should be clean, readable text with minimal markdown formatting. Use
plain text sections, not markdown headers. Structure:

```text
Agent Close Report: columns.agent.md

Verification

Feature    Status  Files   Exports  Tests
#2 Headers  PASS    4/4     match    pass
#3 Resize   PASS    4/4     match    pass
#4 Sorting  PASS    4/4     match    pass

Status Synced

interfaces.md updated:
- #2: WIP → PASS
- #3: GAP → PASS
- #4: GAP → PASS

Unblocked

Feature             Agent       Action
#5 Row Expand       rows        Ready to start
#7 Sort Integration integration Ready to start

Gotchas

- No gotchas found

Next Steps

- Agent columns work complete
- Agent rows can continue (was blocked on #2)
- Run `npx limps status <plan-name>` to assess overall plan status
- Run /heal if cleanup is needed
```

**Critical Formatting Rules:**

- DO NOT use markdown headers (#, ##, ###) - they render as all caps/giant headers
- Use plain text section titles (no # symbols)
- Use simple spacing between sections (blank lines)
- Keep tables simple (spaced columns, not markdown table syntax if it causes issues)
- Use bullet points (-) not numbered lists unless sequence is critical
- Avoid emoji in section titles
- Keep content concise and scannable

## Failure Cases

### Feature Not Complete

```markdown
## Verification FAILED

| Feature    | Status | Issue                                                    |
| ---------- | ------ | -------------------------------------------------------- |
| #3 Resize  | ❌     | Missing: ResizeHandle.stories.tsx                        |
| #4 Sorting | ❌     | Export mismatch: toggle() returns void, declared boolean |

**Action**: Agent must fix issues before close
````

### Tests Failing

```markdown
## Verification FAILED

| Feature    | Tests | Issue                                    |
| ---------- | ----- | ---------------------------------------- |
| #2 Headers | ❌    | 2 tests failing in ColumnHeader.test.tsx |

**Action**: Agent must fix tests before close
```

## Integration with Plan Lifecycle

```text
create-feature-plan
    ↓
[agent implements]
    ↓
close-feature-agent  ←── YOU ARE HERE
    ↓
[PR merged]
    ↓
work (auto-detect plan, assess status, suggest next task)
    ↓
[if cleanup needed] → heal (auto-fix completed agents)
    ↓
[if interfaces changed] → update-feature-plan → regenerate affected agents
    ↓
run-agent (start next task)
    ↓
[next agent implements]
    ↓
close-feature-agent
    ↓
[repeat until done]
```

## After Closing

After closing an agent, use these commands to continue work:

1. **Assess overall plan status**: Run `npx limps status <plan-name>` to assess
   all agent statuses and identify cleanup needs
2. **Auto-cleanup if needed**: If status shows completed agents that need
   cleanup, run `/heal` or `just heal` to move agents to `completed/`
3. **Start next task**: Use `npx limps next-task <plan-name>` to get the next
   task, then open the agent file with `cursor`

### Recommended Post-Close Workflow

```text
1. Close agent: /close-feature-agent [agent-path]
2. Assess status: `npx limps status <plan-name>` (check overall plan status)
3. Cleanup if needed: /heal (auto-fixes completed agents)
4. Start next task: `npx limps next-task <plan-name>` then open agent file with `cursor`
```

## Command Flags

```text
/close-feature-agent [path] --skip-tests    # Skip test verification (use with caution)
/close-feature-agent [path] --dry-run       # Report only, don't update files
/close-feature-agent [path] --force         # Close even with warnings
```

## Checklist Mode

If you prefer manual verification, use checklist mode:

```text
/close-feature-agent [path] --checklist
```

Outputs a checklist you can work through:

```markdown
## Agent Close Checklist: columns.agent.md

### Feature #2: Headers

- [ ] Files exist: ColumnHeader.tsx, .test.tsx, .stories.tsx, useColumnHeader.ts
- [ ] Exports match: `useColumnHeader(id: string): {...}`
- [ ] Exports match: `ColumnHeader: FC<{columnId: string}>`
- [ ] Tests pass: `just test src/components/Column/ColumnHeader`
- [ ] Stories build: Check Storybook
- [ ] Status in agent file: PASS

### Feature #3: Resize

[same structure...]

### Sync

- [ ] Update README.md status matrix
- [ ] Update dependency graph colors
- [ ] Check gotchas.md is current

### Unblocked

- [ ] Notify/assign agent for #5 Row Expand
- [ ] Consider update-feature-plan if interfaces evolved
```
