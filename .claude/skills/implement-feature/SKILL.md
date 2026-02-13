---
name: implement-feature
description: Feature implementation workflow. Orchestrates developer agents for TDD plan execution. Intelligently routes to single agents or composes teams based on task scope. Use when implementing features from limps planning docs.
argument-hint: '[plan-name | --agent <path> | --assess <plan-name> | --auto]'
---

# Implement Feature - Development Workflow

Feature implementation workflow that orchestrates developer agents for TDD plan execution. Automatically routes to single agents or composes teams based on task scope and dependencies.

## Purpose

This skill intelligently orchestrates developer agents (`frontend-developer`, `backend-developer`, `ui-designer`) for implementing features from limps planning documents. It:

- Selects the next best task from a plan (via limps MCP or CLI)
- Analyzes task scope to determine single-agent vs team composition
- Creates GitHub issues for tracking
- Spawns appropriate agent(s) with necessary context
- Monitors execution and handles cross-boundary coordination
- Verifies completion with `test-runner` agent

## Invocation

```bash
/run-agent [plan-name]           # Select next best task from plan
/run-agent --auto                # Auto-detect plan from last PR
/run-agent --agent [agent-path]  # Run specific agent file
/run-agent --assess [plan-name]  # Assess plan status
```

## Arguments

Parse `$ARGUMENTS` to determine mode:

- **Plan name** (e.g., `0004-datagrid-overhaul`) → Select next task from plan
- **`--auto`** → Auto-detect active plan from last merged PR, then select next task
- **`--agent <path>`** → Run specific agent file directly
- **`--assess <plan-name>`** → Show plan status and completion breakdown

## Workflow

### 1. Task Selection

**Use limps MCP when available, otherwise fall back to CLI:**

- **MCP**: Use `get_next_task` tool from runi-Planning server (`.mcp.json`)
- **CLI**: Use `npx limps next-task <plan-name>`

Both implement scoring based on:

- Dependencies (40%): Features with all dependencies PASS get highest score
- Workload balance (30%): Agents with fewer remaining tasks get higher score
- Priority (30%): Lower feature IDs (earlier in plan) get higher score

**For `--auto` mode:**

1. Get last merged PR via `gh pr list --state merged --limit 1 --json number,title,headRefName`
2. Extract plan name from PR title or branch name
3. Continue with task selection using detected plan name

**For `--assess` mode:**

- **MCP**: Use `get_plan_status` tool
- **CLI**: Use `npx limps status <plan-name>`
- Display status and exit (no agent spawning)

### 2. Scope Analysis

Read the selected agent file to extract:

- Agent name and features
- File list from agent spec
- Dependencies status

**Categorize files by scope:**

- **Frontend scope**: Files in `src/` (React/TypeScript)
- **Backend scope**: Files in `src-tauri/` (Rust)
- **Design scope**: Styling/layout-only changes (detect via feature descriptions or file patterns like `.css`, design tokens)

### 3. Composition Decision

**Decision tree for agent routing:**

```
Agent spec files analysis:
├── All files in src/ only?
│   ├── Has logic/state/events/data handling? → frontend-developer (single agent)
│   └── Styling/layout/visual polish only?     → ui-designer (single agent)
├── All files in src-tauri/ only? → backend-developer (single agent)
└── Files in both src/ and src-tauri/?
    └── Create team:
        ├── backend-developer (if new types/MCP tools needed for frontend)
        ├── frontend-developer (for React/TS changes)
        ├── ui-designer (if significant visual changes)
        └── test-runner (verification after all implementation complete)
```

**Single Agent Path:**

- Use `Task` tool to spawn single developer agent
- Pass agent file path and plan context
- Agent implements all features and runs tests
- Monitor completion and report results

**Team Composition Path:**

- Use `TeamCreate` to create team with descriptive name from plan
- Use `TaskCreate` to create tasks for each agent's scope
- Spawn developer agents via `Task` tool with `team_name` parameter
- Use `TaskUpdate` to assign tasks to agents
- Monitor progress via teammate messages
- Handle cross-boundary coordination (agents flag needs via `SendMessage`)
- After all implementation complete, spawn `test-runner` for verification
- Report consolidated results
- Shutdown team via `SendMessage` shutdown_request + `TeamDelete`

**Ordering for cross-layer work:**

- **Backend-first**: When frontend depends on new Rust types or MCP tools (type generation required)
- **Frontend-first**: Otherwise (backend changes are independent)

### 4. GitHub Issue Creation

Automatically create GitHub issues when opening an agent file (if issues don't exist):

**Agent Issue (parent):**

- Title: `[Plan Name] Agent N: [Agent Name] - Features #[N], #[N+1]`
- Description: Simplified agent summary with reference to local agent file
- Labels: `agent-work`, `plan-[plan-name]`

**Feature Subissues (children):**

- Create one subissue per feature using `gh sub-issue create --parent <agent-issue>`
- Title: `Feature #X: [Feature Name]`
- Description: Feature-specific details, files, TL;DR
- Linked to agent issue as parent

**Store issue numbers in agent file:**

- `**GitHub Issue**: #123` at top (agent issue)
- `**GitHub Subissue**: #124` in each feature section

**Note**: Feature subissues auto-close when PR with `Closes #124, #125, #126` merges. Agent issue remains open (parent, not closed by PR).

**Fallback**: If GitHub CLI or `gh sub-issue` extension unavailable, skip issue creation (non-blocking).

### 5. Monitoring and Coordination

**For single agents:**

- Wait for agent completion message
- Review implementation results
- Verify tests passed

**For teams:**

- Monitor teammate progress via automatic message delivery
- Watch for cross-boundary flags:
  - Backend agent flags when types/MCP tools are ready for frontend
  - Frontend agent flags when backend changes are needed
  - UI designer flags when logic/state changes are needed
- Relay coordination messages between agents as needed
- Track task completion via `TaskUpdate` status changes

### 6. Completion and Verification

**Final verification:**

1. Ensure all agents report completion
2. Verify all features marked PASS in agent file
3. Run `test-runner` agent for final verification (via `Task` tool)
4. Check coverage ≥85%
5. Verify `just ci` passes

**Shutdown (for teams):**

1. Send shutdown request to all teammates via `SendMessage` with `type: "shutdown_request"`
2. Wait for approval responses
3. Delete team via `TeamDelete`

**Report results:**

- Show implementation summary
- List completed features
- Show test results and coverage
- Display next steps (PR creation, next task selection)

## Integration with Other Skills/Commands

- **`/list-feature-plans`**: Discover available plans before selecting task
- **`/close-feature-agent`**: Verify completion after agent finishes work
- **`/pr-create`**: Create PR after completing agent work
- **`just heal`**: Auto-cleanup completed agents after PR merge

**Limps MCP tools:**

- `get_next_task(planId)`: Select next best task
- `get_plan_status(planId)`: Assess plan completion
- `list_agents(planId)`: List all agents in plan

**Limps CLI fallbacks:**

- `npx limps next-task <plan-name>`
- `npx limps status <plan-name>`
- `npx limps list-agents <plan-name>`

## Error Handling

- **No unblocked tasks**: Report "All tasks completed or blocked", suggest assessing plan status
- **Agent file missing**: Report error with path, suggest using `/list-feature-plans`
- **Plan not found**: Suggest using `/list-feature-plans` to find correct plan name
- **GitHub CLI not available**: Skip issue creation, continue with agent execution
- **Team coordination failure**: Report which agent failed, show last known state, suggest manual intervention

## Execution Rules

1. **Prefer MCP when available**: Use limps MCP tools (`get_next_task`, `get_plan_status`) over CLI when planning server is available in `.mcp.json`
2. **Only operate on planning docs**: All agent files must be under `../runi-planning-docs/plans/`
3. **Do not include secrets**: Never put secrets in GitHub issue bodies or logs
4. **Planning docs are mandatory**: All three developer agents require an agent spec from limps before proceeding (Rule #1 in each agent file)
5. **Verify scope before routing**: Always analyze file list before determining single vs team composition
6. **Backend-first for dependencies**: When frontend needs new types/MCP tools, backend agent runs first
7. **Test last**: `test-runner` agent runs only after all implementation agents complete

## Example Output

```text
Next Best Task: 004_agent_selection__expander_columns.agent.md

Agent: Selection & Expander Columns
Features: #4, #5, #6
Status: 2 GAP, 1 WIP
Score: 85/100
  - Dependencies: 40/40 (all unblocked)
  - Priority: 25/30 (avg feature #5)
  - Workload: 20/30 (3 remaining tasks)

Scope Analysis:
  - Frontend files: 8 (src/components/DataGrid/*)
  - Backend files: 0
  - Decision: Single agent (frontend-developer)

🚀 Starting Agent Work: 004_agent_selection__expander_columns.agent.md

GitHub Issues:
  - Agent Issue: #456 (parent)
  - Feature Subissues: #457, #458, #459

Spawning frontend-developer agent...

[Agent execution and results...]

✓ Agent completed successfully
✓ Tests passed (coverage: 87.3%)
✓ All features marked PASS

Next Steps:
1. Review changes: git diff main
2. Create PR: /pr-create
3. Select next task: /run-agent 0004-datagrid-overhaul
```

## Team Composition Example

For a cross-layer task (e.g., new MCP tool + UI):

```text
Scope Analysis:
  - Frontend files: 5 (src/components/CommandBar/*, src/hooks/useIntentDetection.ts)
  - Backend files: 3 (src-tauri/src/application/mcp_server_service.rs, ...)
  - Decision: Team composition (backend-first)

Creating team: "0010-intent-detection-team"
Tasks:
  1. Backend: Implement MCP tool for intent detection
  2. Frontend: Wire up intent detection in CommandBar
  3. Verification: Run full test suite

Spawning agents:
  - backend-developer (task #1)
  - frontend-developer (task #2)
  - test-runner (task #3, after #1 and #2 complete)

[Team coordination and execution...]

Backend agent completed:
  ✓ MCP tool implemented
  ✓ Types generated for frontend
  → Flagged: Types ready in src/types/generated/IntentDetection.ts

Frontend agent starting:
  ✓ Using generated types
  ✓ CommandBar wired to MCP tool

Frontend agent completed:
  ✓ UI integration complete
  ✓ Unit tests passing

Test runner agent starting:
  ✓ Full test suite: PASS
  ✓ Coverage: 88.1%
  ✓ E2E tests: PASS

Shutting down team...
✓ Team deleted

All features completed successfully!

Next Steps:
1. Review changes: git diff main
2. Create PR: /pr-create
```

## Notes

- Agent files are self-contained for execution. If details must live elsewhere, use scoped references (exact file + section/heading).
- Open-ended searching during execution indicates the agent file needs improvement.
- This skill replaces the old `/run-agent` command with intelligent orchestration.
- Task selection happens in this skill's context; implementation happens in spawned agent(s).
- The skill is responsible for coordination; agents are responsible for implementation.
