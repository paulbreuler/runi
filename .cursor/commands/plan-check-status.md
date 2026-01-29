# Plan Check Status

Simple entry point: "I want to check plan status". Shows plan status without overwhelming detail.

## LLM Execution Rules

- Prefer `npx limps next-task` for auto-detect; fall back to `npx limps list-plans` on failure.
- If no plan can be determined, stop and ask the user to choose.
- Resolve the MCP server name from `.mcp.json` (repo root) before calling tools.

## Invocation

```
/plan-check-status
/plan-check-status --plan <plan-name>
```

## What This Command Does

1. **Auto-detects plan** (if not specified) - Uses last merged PR
2. **Shows status summary** - Displays completed vs active agents
3. **Shows next task** (if available) - Displays next best task
4. **Shows quick links** - Provides links to plan files

## Usage Examples

### Auto-Detect Plan

```
/plan-check-status
```

This will:

- Auto-detect plan from last PR
- Show status summary
- Show next task if available
- Display quick links

### Specify Plan

```
/plan-check-status --plan datagrid_overhaul_4a5b9879
```

Bypasses auto-detection and uses the specified plan.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Check plan status:**
   - If `--plan` provided: `npx limps status <plan-name>` and `npx limps next-task <plan-name>`
   - Otherwise: Use `npx limps next-task` to auto-detect plan and get next task
   - If auto-detect fails: run `npx limps list-plans` and ask user to pick a plan

2. **Display the output:**
   - Show QUICK DECISION section
   - Show PLAN STATUS section
   - Show RECOMMENDED ACTIONS section
   - Display quick links

3. **Provide guidance:**
   - Explain what the status means
   - Suggest next actions based on status
   - Reference related commands

## When to Use

**Use `/plan-check-status` when:**

- You want to see plan status quickly
- You need a status overview without full details
- You want to check progress

**Use `npx limps next-task` instead when:**

- You want to get the next best task with scoring breakdown
- You need detailed task recommendations

**Use `/assess-agents <plan>` instead when:**

- You need detailed agent-by-agent status
- You're troubleshooting issues
- You need to see individual feature statuses

## Integration

This command provides a simple way to check plan status. Use `npx limps next-task` to get the next best task with detailed scoring.

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUICK DECISION: What should you do next?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → Ready to work: Run /run-agent or use npx limps next-task datagrid_overhaul_4a5b9879
     (Next best task identified and ready)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PLAN STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Active Plan: datagrid_overhaul_4a5b9879
Detected from: PR #24: feat(accessibility): implement keyboard navigation...

Status Summary:
  - 2 agents completed
  - 16 agents with work remaining

Next Best Task:
Agent: status & timing columns
Features: #1, #5, #6, #7
Status: 1 GAP, 0 WIP
Score: 78/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 RECOMMENDED ACTIONS (in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Run: npx limps next-task datagrid_overhaul_4a5b9879 (get next task, then open with cursor)
  2. Run: npx limps status datagrid_overhaul_4a5b9879 (detailed status)
  3. Run: npx limps list-plans (view all plans)

Quick Links:
  plan.md
  README.md
  interfaces.md
  gotchas.md
```

## Notes

- This command provides a focused view of plan status
- Simple status overview
- Good for quick status checks
- For detailed status, use `/assess-agents <plan-name>`
