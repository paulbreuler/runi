# Work

Smart orchestration command that detects the active plan from the last merged PR, assesses status, identifies cleanup needs, and suggests the next best task.

## Invocation

```
/work
/work --plan <plan-name>
```

## What This Command Does

1. **Detects Active Plan** - Analyzes last merged PR to determine which plan is being worked on
2. **Assesses Status** - Checks all agents for completion status and file organization
3. **Identifies Cleanup** - Finds completed agents that need to be moved to `completed/`
4. **Determines Next Task** - Uses scoring algorithm to find the best next agent task
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

The command outputs:

- **Active Plan**: Plan name and how it was detected (PR #, confidence level)
- **Status Summary**: Count of completed vs active agents
- **Cleanup Needed**: List of completed agents that should be moved
- **Next Best Task**: Selected agent with features, status, and score breakdown
- **Recommended Actions**: Prioritized list of commands to run
- **Quick Links**: Clickable links to plan.md, README.md, interfaces.md, gotchas.md

## Example Output

```
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

Recommended Actions:
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

## Workflow

```
1. Complete work on agent
2. Run: /work (detects plan, shows status)
3. If cleanup needed: just heal (auto-fix)
4. Start next task: just run <plan-name>
5. Repeat from step 1
```

## Error Handling

- **No PRs found**: Suggests creating a branch and PR, or manually specify plan
- **Plan not found**: Lists available plans, asks user to select
- **GitHub CLI not available**: Falls back to recent file modifications
- **Multiple plans match**: Shows matches, asks user to disambiguate

## Notes

- The command uses the last merged PR to infer the active plan
- Detection confidence is shown (high/medium/low)
- Cleanup suggestions are prioritized (completed agents should be moved)
- Next task selection uses scoring algorithm (dependencies, workload, priority)
- All file links are clickable and open in Cursor
