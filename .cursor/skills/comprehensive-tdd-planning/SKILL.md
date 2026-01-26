---
name: comprehensive-tdd-planning
version: 2.0.0
description: TDD planning with agent-per-file execution. Planning is verbose. Agent files are minimal execution context.
---

# Comprehensive TDD Planning v2.0.0

## Architecture

| Phase                        | Verbosity | Purpose                                     |
| ---------------------------- | --------- | ------------------------------------------- |
| **Planning** (`plan.md`)     | Verbose   | Figure things out, iterate, full specs      |
| **Execution** (`*.agent.md`) | Minimal   | Distilled context for agent, ~200-400 lines |

## Directory Structure

```
NNNN-descriptive-name/
├── README.md           # Index, dependency graph, status matrix
├── plan.md             # Full verbose feature specs (planning reference)
├── interfaces.md       # Contract source of truth
├── gotchas.md          # Discovered issues (append-only)
└── agents/
    └── NNN_agent_[name].agent.md # Minimal execution context per agent (zero-padded)
```

## Agent Files: Design Principles

Agent files are **distilled execution context**, not documentation.

### IN Agent Files

- Feature IDs + one-line TL;DRs
- Interface contracts (your exports + what you receive)
- Files to create/modify
- Test IDs
- Concise TDD cycles (one line per cycle)
- Relevant gotchas (brief)
- Done checklist

### OUT of Agent Files

- Verbose Gherkin (TL;DR sufficient)
- Methodology explanations (agent knows TDD)
- Git workflow (in CLAUDE.md)
- Other agents' details
- Historical context

### Target Size

~200-400 lines for 2-4 features. Larger = split agent.

### Searching is Failure

If agent files are well-constructed, searching `plan.md` is rare—only for unexpected edge cases. Frequent searching means agent files need improvement.

## Workflow

### Create Plan

1. Gather context → verbose `plan.md`
2. Map interfaces → `interfaces.md`
3. Draw dependencies → `README.md`
4. **Distill** agent files → `agents/*.agent.md`

### Assign Work

```
Copy agents/columns.agent.md → paste to agent → done
```

### During Execution

- Agent works from their `.agent.md`
- Updates status when complete
- Appends to `gotchas.md` if issues found
- Searches only for unexpected edge cases

## Status Values

| Status    | Meaning        | Action         |
| --------- | -------------- | -------------- |
| `GAP`     | Not started    | Begin work     |
| `WIP`     | In progress    | Continue       |
| `PASS`    | Complete       | Done           |
| `BLOCKED` | Waiting on dep | Work elsewhere |

## Commands

| Command                | Purpose                                                 | When                                    |
| ---------------------- | ------------------------------------------------------- | --------------------------------------- |
| `create-feature-plan`  | Create new plan + agent files                           | Starting new work                       |
| `update-feature-plan`  | Modify plan, regenerate agents                          | Mid-flight changes, interface evolution |
| `close-feature-agent`  | Verify completion, sync status                          | Agent finishes work                     |
| `migrate-feature-plan` | Convert v1.x plan to v2.0.0                             | Existing plans need migration           |
| `list-feature-plans`   | List available plans                                    | Finding plans                           |
| `work`                 | Smart orchestration (auto-detect plan, assess, suggest) | After PR merged, starting new session   |
| `heal`                 | Auto-heal plan (cleanup, pattern detection)             | Cleanup completed agents, detect issues |
| `run <plan>`           | Select and run next best agent task                     | Ready to start work on plan             |
| `next-task <plan>`     | Select next task (no run)                               | Preview next task selection             |
| `assess-agents <plan>` | Assess agent completion status                          | Check status, find cleanup needs        |

## RLM Query Tools

RLM (Run Language Model) query tools enable JavaScript-based queries on planning documents:

- **`rlm_query`** - Query a single document (extract features, filter by status, analyze structure)
- **`rlm_multi_query`** - Query multiple documents (aggregate data, find patterns)

**Use cases:**

- Extract all GAP features from a plan
- Analyze feature distribution across plans
- Find features affected by interface changes
- Generate plan summaries programmatically

See `CLAUDE.md` for detailed examples and usage patterns.

### update-feature-plan

Handles mid-flight changes:

1. **Apply feedback** to verbose planning docs
2. **Identify cascade** - interface changes affect downstream agents
3. **Regenerate** affected agent files (distill, don't patch)
4. **Verify** consistency across all files

Key insight: Interface changes cascade. If #2's export changes, all agents that receive from #2 need regenerated files.

### migrate-feature-plan

Converts v1.x plans (with `parallelization.md`, `speed_prompts.md`, YAML front matter) to v2.0.0:

1. **Extract** interfaces from YAML → `interfaces.md`
2. **Extract** gotchas → `gotchas.md`
3. **Distill** agent files from plan + parallelization → `agents/*.agent.md`
4. **Archive** old files (`parallelization.md`, `speed_prompts.md`)

### Lifecycle

```
create-feature-plan
       ↓
   [plan.md + agents/*.agent.md created]
       ↓
   [copy agent file to Claude]
       ↓
   [agent implements]
       ↓
   [PR merged]
       ↓
   just work (auto-detect plan, assess status, suggest next task)
       ↓
   [if cleanup needed] → just heal (auto-fix completed agents)
       ↓
close-feature-agent ←─────────────────┐
       ↓                              │
   [status synced, unblocked identified]
       ↓                              │
   [if interfaces changed] → update-feature-plan
       ↓                              │
   [next agent file ready]            │
       ↓                              │
   [repeat] ──────────────────────────┘
```

### Smart Orchestration

After a PR is merged, use `just work` to:

1. **Auto-detect plan** from last merged PR (title, branch, description, files)
2. **Assess status** of all agents (completed, active, needs cleanup)
3. **Identify cleanup** (completed agents not moved to `completed/`)
4. **Determine next task** using scoring algorithm (dependencies, workload, priority)
5. **Provide recommendations** with clickable links to plan files

Use `just heal` to:

- Auto-move completed agents to `completed/` directory
- Detect stuck agents (WIP for 7+ days)
- Identify dependency bottlenecks
- Learn from patterns and suggest improvements

Use limps CLI directly for all planning operations:

- `npx limps next-task <plan-name>` - Get next best task
- `npx limps status <plan-name>` - Assess agent status
- `npx limps list-agents <plan-name>` - List all agents

### close-feature-agent

Lightweight checkpoint:

1. **Verify** - Files exist, exports match, tests pass
2. **Sync** - Update README.md status matrix
3. **Report** - Show newly-unblocked features
4. **Capture** - Sync gotchas to gotchas.md

Does NOT regenerate agent files (use `update-feature-plan` for that).

## Workflow Entry Points

See `workflow.md` for complete workflow documentation including:

- System overview (plan, agent, feature, status concepts)
- Workflow states and transitions
- Command decision tree
- When to use each command
- Common patterns and anti-patterns
- Troubleshooting guide

### Quick Reference: When to Use Which Command

**Primary Entry Point**:

- `npx limps status <plan>` and `npx limps next-task <plan>` - After PR merge, starting work session, need status overview (replaces removed `/work` command)

**Focused Entry Points**:

- `/run-agent <plan>` or `/run-agent --auto` - Ready to start working, auto-selects next best agent
- `/plan-list-agents <plan>` - Want to see all agents and choose which one to run
- `/plan-cleanup` or `/heal` - Cleanup needed, want to auto-fix
- `/plan-check-status` or `/assess-agents <plan>` - Need detailed status, troubleshooting
- `/list-feature-plans` - Need to find a plan

**After Work**:

- `/close-feature-agent <agent-path>` - Verify completion, sync status

**Plan Management**:

- `/create-feature-plan` - Create new plan
- `/update-feature-plan <plan>` - Modify existing plan
- `/list-feature-plans` - List all plans

## Key Principles

1. **Planning is cheap** - Be verbose, iterate
2. **Execution context is precious** - Minimal, dense
3. **Distill, don't copy** - Agent files are refined extracts
4. **Interfaces are boundaries** - Clear contracts enable parallelism
5. **One agent, one file** - Coherent context, no mental merging
6. **Close the loop** - Verify completion before moving on

## Storybook Story Planning

When planning features that include Storybook stories:

- **Follow controls-first approach** - Use Storybook 10 controls for state variations instead of creating separate stories for every prop combination
- **Limit to 1-3 stories per component** - One Playground story with controls covers most cases (we consolidated from 500+ stories to 50-75 by using controls)
- **Separate stories only for** - Complex interactions that need dedicated play functions, real-world examples, or documentation purposes
- **Reference `storybook-testing` skill** - Contains full controls-first guidance, anti-pattern examples, and when to create separate stories
- **Plan for controls, not multiple stories** - When specifying Storybook story requirements in plan.md, emphasize controls configuration rather than planning 6-8 separate stories per component
