# TDD Planning Workflow

Foundation knowledge for understanding and using the TDD planning system.

## System Overview

### Core Concepts

**Plan**: A directory containing feature specifications, interfaces, and agent assignments for a project.

**Agent**: A single execution unit responsible for implementing 2-4 related features. Each agent has its own `.agent.md` file with distilled context.

**Feature**: A single requirement or capability, identified by number (e.g., #1, #2). Features have status: GAP (not started), WIP (in progress), PASS (complete), BLOCKED (waiting on dependencies).

**Status**: The completion state of a feature or agent. Status flows from GAP → WIP → PASS.

### Directory Structure

```
NNNN-descriptive-name/
├── README.md           # Index, dependency graph, status matrix
├── plan.md             # Full verbose feature specs (planning reference)
├── interfaces.md       # Contract source of truth
├── gotchas.md          # Discovered issues (append-only)
└── agents/
    ├── 000_agent_*.agent.md    # First agent (foundation)
    ├── 001_agent_*.agent.md    # Second agent
    ├── 010_agent_*.agent.md    # 10th agent
    └── completed/             # Completed agents (archived)
        └── NNN_agent_*.agent.md

**Numbering Format**:
- Plans: Zero-padded to 4 digits (0001, 0002, ..., 0007, 0008)
- Agents: Zero-padded to 3 digits (000, 001, 002, ..., 010, 011, ..., 017)
```

## Workflow States

The planning system has distinct states that determine what actions to take:

### 1. Starting State

**Trigger**: After PR merge, starting new work session
**Characteristics**:

- Plan detected from last PR
- Status unknown or needs refresh
- Next task unclear

**Action**: Run `/work` to assess current state

### 2. Cleanup Needed State

**Trigger**: Completed agents not moved to `completed/` directory
**Characteristics**:

- Agents with all features PASS but still in `agents/` directory
- File organization inconsistent

**Action**: Run `/heal` or `/heal-plan <plan-number>` to auto-cleanup

### 3. Ready to Work State

**Trigger**: Cleanup done (or not needed), tasks available
**Characteristics**:

- All completed agents properly archived
- Next best task identified
- Dependencies satisfied

**Action**: Run `/run-agent <plan-number>` or `/run-agent --auto` to start work

### 4. Working State

**Trigger**: Agent file opened, work in progress
**Characteristics**:

- Agent implementing features
- Status: WIP
- Files being created/modified

**Action**: Continue implementation, update status as features complete

### 5. Completing State

**Trigger**: Agent finishes work, all features PASS
**Characteristics**:

- All features marked PASS
- Tests passing
- Files created/modified

**Action**: Run `/close-feature-agent <agent-path>` to verify and sync status

### 6. All Complete State

**Trigger**: All agents completed, no work remaining
**Characteristics**:

- All features PASS
- All agents in `completed/` directory
- No unblocked tasks

**Action**: Plan complete! Move to next plan or create new one.

## Command Decision Tree

Use this decision tree to choose the right command:

```
After PR Merge or Starting Work
│
├─> /work
    │
    ├─> Cleanup needed?
    │   │
    │   └─> /heal or /heal-plan <plan>
    │       │
    │       └─> /work (reassess)
    │
    └─> Task available?
        │
        └─> /run-agent <plan> or /run-agent --auto
            │
            └─> [Implement work]
                │
                └─> /close-feature-agent <agent-path>
                    │
                    └─> /work (loop back)
```

## Entry Points

### Primary Entry Point: `/work`

**When to use**:

- After PR merge
- Starting new work session
- Need overall plan status
- Unsure what to do next

**What it does**:

- Auto-detects plan from last PR
- Assesses all agent status
- Identifies cleanup needs
- Determines next best task
- Provides recommendations

**Output**: Quick decision guide, status summary, recommended actions

### Focused Entry Points

**`/run-agent <plan>` or `/run-agent --auto`**

- **When**: Ready to start working, want to auto-select next best agent
- **What**: Selects next best agent task, opens agent file
- **Use instead of**: `/work` when you just want to start working

**`/plan-list-agents <plan>`**

- **When**: Want to see all agents and choose which specific one to run
- **What**: Lists all agents with status, features, and clickable links
- **Use instead of**: `/run-agent` when you want to control which agent to run

**`/plan-cleanup` or `/heal` or `/heal-plan <plan>`**

- **When**: Cleanup needed, want to auto-fix
- **What**: Moves completed agents to `completed/` directory
- **Use instead of**: `/work` when you know cleanup is needed

**`/plan-check-status` or `/assess-agents <plan>`**

- **When**: Need detailed status, troubleshooting
- **What**: Shows detailed agent-by-agent status (or status overview)
- **Use instead of**: `/work` when you need more detail or just want status

**`/list-feature-plans`**

- **When**: Need to find a plan, see all plans
- **What**: Lists all available plans with overviews
- **Use instead of**: `/work` when you don't know which plan

## Common Patterns

### Pattern 1: After PR Merge (Recommended)

```
1. /work                    # Assess status, get recommendations
2. /heal                    # Cleanup if needed (auto-detects plan)
3. /run-agent --auto       # Start next task (auto-detects plan)
4. [Implement work]
5. /close-feature-agent     # Verify completion
6. Loop to step 1
```

### Pattern 2: Quick Start (When You Know the Plan)

```
1. /run-agent <plan-number>  # Start next task directly
2. [Implement work]
3. /close-feature-agent     # Verify completion
4. /work --plan <plan-number> # Check status, get next task
```

### Pattern 3: Status Check Only

```
1. /work --plan <plan-number>  # Get status overview
2. /assess-agents <plan-number> # Get detailed status if needed
```

### Pattern 4: Cleanup First

```
1. /heal --auto            # Auto-cleanup (auto-detects plan)
2. /work                    # Reassess after cleanup
3. /run-agent --auto       # Start next task
```

## Anti-Patterns

**Don't**: Run `/work` multiple times without taking action

- **Instead**: Follow the recommendations, use focused entry points

**Don't**: Manually move agent files to `completed/`

- **Instead**: Use `/heal` to auto-cleanup

**Don't**: Skip `/close-feature-agent` after completing work

- **Instead**: Always verify completion to sync status and unblock dependencies

**Don't**: Use `/work` when you just want to start working

- **Instead**: Use `/run-agent` directly if you know the plan

## Troubleshooting

### "I don't know what to do"

→ Run `/work` - it will show you the quick decision and recommendations

### "I want to start working"

→ Run `/run-agent <plan-number>` or `/run-agent --auto` (auto-selects next best agent)

### "I want to choose which agent to run"

→ Run `/plan-list-agents <plan-number>` to see all agents, then `/run-agent --agent [path]` to run specific one

### "I need to clean up"

→ Run `/plan-cleanup` or `/heal` or `/heal-plan <plan-number>`

### "I want to see detailed status"

→ Run `/plan-check-status` or `/assess-agents <plan-name>`

### "I don't know which plan"

→ Run `/list-feature-plans` to see all plans

### "I want to choose which agent to run"

→ Run `/plan-list-agents <plan-number>` to see all agents, then `/run-agent --agent [path]` to run the specific one

### "No tasks available but work remains"

→ Check for blocked features, run `/assess-agents` to see dependencies

## Workflow State Detection

The system can detect workflow state:

- **Cleanup needed**: Completed agents not in `completed/` directory
- **Ready to work**: Cleanup done, unblocked tasks available
- **All complete**: All agents completed, no work remaining
- **Blocked**: Tasks available but dependencies not satisfied

Use `/work` to see current state and recommendations.
