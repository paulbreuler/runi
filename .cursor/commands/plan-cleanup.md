# Plan Cleanup

Simple entry point: "I want to clean up completed agents". Auto-detects plan and moves completed agents to `completed/` directory.

## Invocation

```
/plan-cleanup
/plan-cleanup --plan <plan-number>
```

## What This Command Does

1. **Auto-detects plan** (if not specified) - Uses last merged PR
2. **Finds completed agents** - Identifies agents with all features PASS
3. **Shows what will be cleaned up** - Lists agents to be moved
4. **Moves to completed/** - Moves completed agents to `agents/completed/` directory

## Usage Examples

### Auto-Detect Plan

```
/plan-cleanup
```

This will:

- Auto-detect plan from last PR
- Find completed agents
- Show what will be moved
- Ask for confirmation (unless `--yes` flag used)
- Move agents to `completed/` directory

### Specify Plan

```
/plan-cleanup --plan 4
```

Bypasses auto-detection and uses the specified plan.

### Auto-Confirm

```
/plan-cleanup --yes
```

Skips confirmation prompt and automatically moves completed agents.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Run the heal-plan script:**
   - If `--plan` provided: `just heal-plan <plan-number>` or `bash scripts/heal-plan.sh --plan <plan-number>`
   - Otherwise: `just heal` or `bash scripts/heal-plan.sh --auto`

2. **Display the output:**
   - Show what will be cleaned up
   - Show confirmation prompt (unless `--yes` used)
   - Show results after cleanup

3. **Provide guidance:**
   - Explain what was moved
   - Suggest running `npx limps status <plan-name>` to reassess status
   - Reference `/run-agent` to start next task

## When to Use

**Use `/plan-cleanup` when:**

- You know cleanup is needed
- You want to clean up before starting work
- You want a simple, focused command

**Use `npx limps next-task` instead when:**

- You want to see overall plan status first
- You're unsure if cleanup is needed
- You want to see next task recommendations

## Integration

This is a wrapper around `/heal` that provides a simpler entry point. It's equivalent to:

```
`npx limps next-task` → `/heal`
```

But skips the status overview and goes straight to cleanup.

## Example Output

```
Healing Plan: datagrid_overhaul_4a5b9879

Auto-Fix Actions:
  1. Move 0_agent_accessibility_foundation_early.agent.md to completed/
  2. Move 1_agent_column_display_features.agent.md to completed/

Apply fixes? (y/n)
y

✓ Moved 0_agent_accessibility_foundation_early.agent.md to completed/
✓ Moved 1_agent_column_display_features.agent.md to completed/
✓ Moved 2 agent(s) to completed/
```

## Notes

- Completed agents are identified by having all features marked PASS
- Agents are moved to `agents/completed/` directory
- This helps keep the active agents directory clean
- After cleanup, run `npx limps next-task <plan-name>` to get next task recommendations
