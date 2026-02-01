# Plan List Agents

List all agents in a plan with their status, features, and clickable links. Helps you find and select which specific agent to run.

## LLM Execution Rules

- Prefer MCP when the planning server is available: use `list_agents` (server from `.mcp.json`, e.g. `runi-Planning`). Otherwise use `npx limps list-agents`.
- Resolve the MCP server name from `.mcp.json` (repo root) before calling tools.
- If plan is unknown, use `list_plans` (MCP) or `npx limps list-plans` (CLI), then ask the user to choose.

## Invocation

```
/plan-list-agents
/plan-list-agents --plan <plan-number>
/plan-list-agents --auto
```

## What This Command Does

1. **Auto-detects plan** (if not specified) - Uses last merged PR
2. **Lists all agents** - Shows all active agents in the plan (excludes completed/)
3. **Shows agent information**:
   - Agent number and display name
   - Features handled (#1, #2, #3)
   - Status summary (X PASS, Y WIP, Z GAP)
   - Clickable link to agent file
4. **Shows how to run** - Instructions for running a specific agent

## Usage Examples

### Auto-Detect Plan

```
/plan-list-agents
```

This will:

- Auto-detect plan from last PR
- List all agents with status
- Show clickable links to agent files
- Display instructions for running specific agents

### Specify Plan

```
/plan-list-agents --plan 4
```

Bypasses auto-detection and uses the specified plan.

## Instructions for Claude

**When this command is invoked, you must:**

1. **List agents:**
   - If planning MCP is available: call `list_agents` via `call_mcp_tool` with `planId` (server from `.mcp.json`). Use `list_plans` first if plan is unknown.
   - Otherwise: run `npx limps list-agents <plan-number>` or `npx limps list-agents` (auto-detects plan when no `--plan`).

2. **Display the output:**
   - Show the formatted list of agents
   - Include agent numbers, names, features, and status
   - Show clickable file links
   - Display instructions for running specific agents

3. **Provide guidance:**
   - Explain how to use the agent file links
   - Reference `/run-agent --agent [path]` for running a specific agent
   - Show how to copy agent file path

## When to Use

**Use `/plan-list-agents` when:**

- You want to see all available agents in a plan
- You want to choose which specific agent to run (not auto-select)
- You need to find an agent by name or features
- You want to see agent status at a glance

**Use `/run-agent <plan-number>` instead when:**

- You want to auto-select the next best agent
- You're ready to start working and don't care which agent

**Use `/assess-agents <plan-number>` instead when:**

- You need detailed status assessment
- You're troubleshooting agent issues
- You need to see README.md status comparisons

## Integration

This command helps you find agents, then use `/run-agent --agent [agent-file-path]` to run a specific one.

**Workflow**:

1. `/plan-list-agents <plan-number>` - See all agents
2. Click agent file link or copy path
3. `/run-agent --agent [agent-file-path]` - Run the specific agent

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Agents in Plan: datagrid_overhaul_4a5b9879
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agent 0: Accessibility Foundation Early
  Features: #1, #2
  Status: 2 PASS, 0 WIP, 0 GAP
  File: 0_agent_accessibility_foundation_early.agent.md

Agent 1: Column Display Features
  Features: #3, #4, #5
  Status: 0 PASS, 1 WIP, 2 GAP
  File: 1_agent_column_display_features.agent.md

Agent 2: Status & Timing Columns
  Features: #6, #7
  Status: 0 PASS, 0 WIP, 2 GAP
  File: 2_agent_status__timing_columns.agent.md

  (3 agent(s) in completed/ directory)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 To run a specific agent:
   /run-agent --agent [agent-file-path]
   Or click the agent file link above
```

## Notes

- Only shows active agents (excludes `completed/` directory)
- Agent files are clickable and open directly in Cursor
- Agent numbers come from filename prefix (`<NNN>_agent_` or `agent_<N>_` for backward compatibility)
- Agent files should use zero-padded 3-digit format (000, 001, 002, ...) for proper lexicographical ordering
- Status is parsed from agent file `**Status:**` markers
- Use this to find agents, then run with `/run-agent --agent [path]`
- Agent files are self-contained execution context; scoped cross-file references are allowed (exact file + section/heading)
