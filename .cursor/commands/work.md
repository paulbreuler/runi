# Work

Smart orchestration command that detects the active plan from the last merged PR, assesses status, identifies cleanup needs, and suggests the next best task.

## Quick Start

**I just merged a PR, what do I do?**

1. Run `/work` - it will show you a **QUICK DECISION** at the top with the immediate next action
2. Follow the recommendation:
   - If cleanup needed → `/heal` or `just heal`
   - If ready to work → `/run-agent` or `just run <plan-name>`
   - If need details → `/assess-agents <plan-name>`

**That's it!** The command tells you exactly what to do next.

## Invocation

```
/work
/work --plan <plan-name>
```

## What This Command Does

1. **Detects Active Plan** - Analyzes last merged PR to determine which plan is being worked on
2. **Assesses Status** - Checks all agents for completion status and file organization
3. **Identifies Cleanup** - Finds completed agents that need to be moved to `agents/completed/` directory
4. **Determines Next Task** - Uses scoring algorithm to find the best next agent task (excludes completed agents)
5. **Provides Recommendations** - Suggests actionable next steps with clickable links

## Usage Examples

### Auto-Detect from Last PR

```
/work
```

This will:

- Get last merged PR using GitHub CLI
- Extract plan name from PR title, branch, description, or files
- Assess agent status
- Show cleanup needs
- Display next best task
- Provide recommended actions

### Specify Plan Explicitly

```
/work --plan datagrid_overhaul_4a5b9879
```

Bypasses auto-detection and uses the specified plan.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Run the work script:**
   - Execute: `just work` or `bash scripts/work.sh`
   - The script will auto-detect the plan from the last PR
   - Or use `just work --plan <plan-name>` to specify a plan

2. **Display the output:**
   - Show active plan and detection source
   - Display status summary (completed/active agents)
   - Show cleanup needs if any
   - Display next best task with score breakdown
   - Show recommended actions with clickable links

3. **Provide guidance:**
   - Explain what actions to take next
   - Reference related commands (`just heal`, `just run`, `just assess-agents`)
   - Show how to verify completion

## Output Format

The command outputs with clear visual hierarchy:

1. **QUICK DECISION** (top) - Immediate next action based on current state
2. **PLAN STATUS** (middle) - Active plan, status summary, cleanup needs, next task
3. **RECOMMENDED ACTIONS** (bottom) - Prioritized list of commands to run
4. **Quick Links** - Clickable links to plan.md, README.md, interfaces.md, gotchas.md

### Quick Decision Section

The top section shows the immediate next action:

- **Cleanup needed** → Run `/heal` or `just heal-plan <plan-name>`
- **Ready to work** → Run `/run-agent` or `just run <plan-name>`
- **All complete** → Plan is finished!
- **Check details** → Run `/assess-agents <plan-name>` for more info

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
Detected from: PR #24: feat(accessibility): implement keyboard navigation... (confidence: low)

Status Summary:
  - 0 agents completed
  - 18 agents with work remaining

Next Best Task:
Agent: status & timing columns
Features: #1, #5, #6, #7
Status: 1 GAP, 0 WIP
Score: 78/100
  - Dependencies: 40/40
  - Priority: 13/30
  - Workload: 26/30

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

## Integration with Other Commands

- **list-feature-plans**: Use to discover plans, then use `/work --plan <plan-name>`
- **heal**: After `/work` shows cleanup needed, use `/heal` or `just heal` to auto-fix
- **run**: After `/work` shows next task, use `just run <plan-name>` to start work
- **close-feature-agent**: After completing work, use to verify and sync status

## Decision Tree

When to use `/work` vs other commands:

```
After PR Merge or Starting Work
│
├─> /work (recommended first step)
    │
    ├─> Shows QUICK DECISION at top
    │   │
    │   ├─> Cleanup needed?
    │   │   └─> /heal or just heal-plan <plan>
    │   │
    │   ├─> Ready to work?
    │   │   └─> /run-agent or just run <plan>
    │   │
    │   └─> Need details?
    │       └─> /assess-agents <plan>
    │
    └─> Alternative: Use focused entry points
        │
        ├─> Just want to start working?
        │   └─> /run-agent <plan> or /run-agent --auto (skips /work)
        │
        ├─> Want to choose which agent to run?
        │   └─> /plan-list-agents <plan> then /run-agent --agent [path]
        │
        ├─> Just want to clean up?
        │   └─> /plan-cleanup or /heal (skips /work)
        │
        └─> Just want status?
            └─> /plan-check-status or /assess-agents <plan> (skips /work)
```

## Workflow

### Recommended Workflow (After PR Merge)

```
1. /work                    # Assess status, get QUICK DECISION
2. Follow QUICK DECISION:
   - If cleanup needed → /heal
   - If ready to work → /run-agent --auto
3. [Implement work]
4. /close-feature-agent     # Verify completion
5. Loop to step 1
```

### Alternative: Quick Start (When You Know the Plan)

```
1. /run-agent <plan-name>   # Start next task directly
2. [Implement work]
3. /close-feature-agent     # Verify completion
4. /work --plan <plan-name> # Check status, get next task
```

## Error Handling

- **No PRs found**: Suggests creating a branch and PR, or manually specify plan
- **Plan not found**: Lists available plans, asks user to select
- **GitHub CLI not available**: Falls back to recent file modifications
- **Multiple plans match**: Shows matches, asks user to disambiguate

## Workflow States

The command detects workflow state and provides appropriate recommendations:

- **Cleanup needed**: Completed agents not in `completed/` directory → recommends `/heal`
- **Ready to work**: Cleanup done, unblocked tasks available → recommends `/run-agent`
- **All complete**: All agents completed, no work remaining → shows completion message
- **Blocked**: Tasks available but dependencies not satisfied → recommends `/assess-agents` for details

## Entry Points

**When to use `/work`**:

- After PR merge (primary use case)
- Starting new work session
- Need overall plan status
- Unsure what to do next

**When to use focused entry points instead**:

- **`/run-agent <plan>`** or **`/run-agent --auto`**: Ready to start working, auto-selects next best agent
- **`/plan-list-agents <plan>`**: Want to see all agents and choose which one to run
- **`/plan-cleanup`** or **`/heal`**: Know cleanup is needed, want to auto-fix
- **`/plan-check-status`** or **`/assess-agents <plan>`**: Need detailed status, troubleshooting
- **`/list-feature-plans`**: Need to find a plan

See `.cursor/skills/comprehensive-tdd-planning/workflow.md` for complete workflow documentation.

## Notes

- The command uses the last merged PR to infer the active plan
- Detection confidence is shown (high/medium/low)
- QUICK DECISION section at top shows immediate next action
- Cleanup suggestions are prioritized (completed agents should be moved to `agents/completed/` directory)
- Next task selection uses scoring algorithm (dependencies, workload, priority) and excludes completed agents
- Completed agents are automatically excluded from task selection and listings
- All file links are clickable and open in Cursor
