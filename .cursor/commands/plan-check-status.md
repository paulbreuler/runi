# Plan Check Status

Simple entry point: "I want to check plan status". Shows plan status without overwhelming detail.

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

1. **Run the work script:**
   - If `--plan` provided: `just work --plan <plan-name>` or `bash scripts/work.sh --plan <plan-name>`
   - Otherwise: `just work` or `bash scripts/work.sh`

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

**Use `/work` instead when:**

- You want the full orchestration experience
- You need detailed recommendations
- You want to see cleanup needs and next task together

**Use `/assess-agents <plan>` instead when:**

- You need detailed agent-by-agent status
- You're troubleshooting issues
- You need to see individual feature statuses

## Integration

This is essentially the same as `/work` but with a simpler name that makes the intent clear. It's useful when you just want to "check status" without the full orchestration.

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUICK DECISION: What should you do next?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  → Ready to work: Run /run-agent or just run datagrid_overhaul_4a5b9879
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

  1. Run: just run datagrid_overhaul_4a5b9879 (start next task)
  2. Run: just assess-agents datagrid_overhaul_4a5b9879 (detailed status)
  3. Run: just list-plans (view all plans)

Quick Links:
  plan.md
  README.md
  interfaces.md
  gotchas.md
```

## Notes

- This command provides a focused view of plan status
- Less overwhelming than full `/work` output
- Good for quick status checks
- For detailed status, use `/assess-agents <plan-name>`
